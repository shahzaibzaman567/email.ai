import dns from "node:dns";
import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

// Bypass local ISP SRV DNS query timeouts (queryTxt ETIMEOUT) by using Google DNS
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS cannot be set
}

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (cachedPromise) {
    await cachedPromise;
    return;
  }

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error", { error: err.message });
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  cachedPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: process.env.NODE_ENV !== "production",
  });

  await cachedPromise;
  logger.info("MongoDB connection established");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };