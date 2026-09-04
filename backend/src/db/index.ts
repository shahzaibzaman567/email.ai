import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

export async function connectDB(uri: string): Promise<void> {
  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error", { error: err.message });
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: process.env.NODE_ENV !== "production",
  });

  logger.info("MongoDB connection established");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };