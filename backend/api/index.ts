import type { Request, Response } from "express";
import app from "../src/app.js";

export default async function handler(req: Request, res: Response): Promise<void> {
  app(req, res);
}
