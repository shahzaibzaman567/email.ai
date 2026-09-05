import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

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