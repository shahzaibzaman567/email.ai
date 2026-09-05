import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth?.isOwner) {
    logger.warn("Unauthorized admin access attempt", {
      userId: req.auth?.userId,
      email: req.auth?.email,
      path: req.path,
    });
    throw new ForbiddenError("Only the platform owner can perform this action");
  }
  next();
}
