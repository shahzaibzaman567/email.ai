import crypto from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-cbc";

export function encrypt(text: string): string {
  if (!text) return text;
  
  // The key must be exactly 32 bytes for aes-256-cbc
  const key = Buffer.from(env.encryptionKey, "hex");
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `iv:${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.startsWith("iv:")) return encryptedText;
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;
    
    const iv = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];
    const key = Buffer.from(env.encryptionKey, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    // If decryption fails (e.g. wrong key, or it wasn't encrypted), just return original
    // This allows fallback during transition phase
    return encryptedText;
  }
}
