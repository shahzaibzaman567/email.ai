import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../lib/errors.js";

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth?.isOwner) {
    throw new ForbiddenError("Only the platform owner can perform this action");
  }
  next();
}
