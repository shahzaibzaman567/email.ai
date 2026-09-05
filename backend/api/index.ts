import type { Request, Response } from "express";
import { createApp } from "../src/app.js";
import { connectDB } from "../src/db/index.js";
import { env } from "../src/config/env.js";

const app = createApp();

export default async function handler(req: Request, res: Response): Promise<void> {
  await connectDB(env.mongodbUri);
  app(req, res);
}
