import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { verifyClerkToken } from "../lib/clerk.js";
import { asyncHandler } from "../lib/async-handler.js";
import { ensureUser } from "../services/user.service.js";
import { env } from "../config/env.js";

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);

  if (!token) {
    logger.warn("Authentication failed: missing or malformed bearer token", {
      path: req.path,
    });
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const auth = await verifyClerkToken(token);
  const isOwner = env.ownerEmail ? auth.email === env.ownerEmail : false;

  req.auth = { ...auth, isOwner };
  try {
    await ensureUser(auth);
  } catch (err) {
    logger.error("Failed to persist Clerk user profile", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  next();
}

export const requireAuth = asyncHandler(authenticate);