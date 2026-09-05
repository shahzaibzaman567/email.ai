import type { Request, Response } from "express";
import { ColdEmailSettingsModel } from "../db/models/settings.model.js";
import { ok } from "../lib/response.js";
import { encrypt } from "../lib/encryption.js";

function maskApiKey(key?: string): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return "gsk_****";
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

export async function getColdEmailSettings(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  
  let settings = await ColdEmailSettingsModel.findOne({ userId }).lean();
  
  // If settings don't exist yet, we return a default object.
  if (!settings) {
    settings = {
      userId: userId as any,
      emailLength: "Short",
      personalizationLevel: "High",
      emailSignature: "Best regards,\nShahzaib",
      subjectMode: "ai_personalized",
      dailyLimit: 100,
      scheduleStartTime: "09:00",
      scheduleEndTime: "17:00",
      scheduleTimezone: "UTC",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  if (settings && settings.groqApiKey) {
    (settings as any).groqApiKey = maskApiKey(settings.groqApiKey);
  }
  if (settings && (settings as any).smtpPassword) {
    (settings as any).smtpPassword = "••••••••";
  }

  res.json(ok("Settings fetched successfully", settings));
}

export async function updateColdEmailSettings(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const updates = { ...req.body };
  
  if (updates.groqApiKey && updates.groqApiKey.includes("...")) {
    delete updates.groqApiKey;
  }
  // Don't overwrite smtpPassword if user sent back the masked placeholder
  if (updates.smtpPassword === "••••••••") {
    delete updates.smtpPassword;
  }

  // Encrypt sensitive fields before saving
  if (updates.smtpPassword) {
    updates.smtpPassword = encrypt(updates.smtpPassword);
  }
  if (updates.groqApiKey) {
    updates.groqApiKey = encrypt(updates.groqApiKey);
  }

  const settings = await ColdEmailSettingsModel.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  if (settings.groqApiKey) {
    (settings as any).groqApiKey = maskApiKey(settings.groqApiKey);
  }

  res.json(ok("Settings updated successfully", settings));
}
