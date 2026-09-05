import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../lib/errors.js";
import { logger, safeErrorMessage } from "../lib/logger.js";
import { verifyClerkToken } from "../lib/clerk.js";
import { asyncHandler } from "../lib/async-handler.js";
import { ensureUser } from "../services/user.service.js";
import { UserModel } from "../db/models/user.model.js";
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
  try {
    await ensureUser(auth);
  } catch (err) {
    logger.error("Failed to persist Clerk user profile", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  let isOwner = false;
  let ownerCheckReason = "";

  // Primary check: Compare with OWNER_EMAIL environment variable
  if (env.ownerEmail && auth.email) {
    const emailsMatch = auth.email.toLowerCase() === env.ownerEmail.toLowerCase();
    if (emailsMatch) {
      isOwner = true;
      ownerCheckReason = "Email matched OWNER_EMAIL env variable";
    } else {
      ownerCheckReason = `Email mismatch: ${auth.email} !== ${env.ownerEmail}`;
    }
  } else {
    ownerCheckReason = `OWNER_EMAIL not configured or user email missing. ownerEmail=${env.ownerEmail}, userEmail=${auth.email}`;
  }

  // Fallback: allow owner by DB role if OWNER_EMAIL isn't configured or doesn't match
  if (!isOwner) {
    try {
      const user = await UserModel.findOne({ clerkId: auth.userId }).select("role").lean().exec();
      if (user?.role === "owner") {
        isOwner = true;
        ownerCheckReason = "User role in database is 'owner'";
      } else {
        ownerCheckReason += ` | DB role is '${user?.role || "not_found"}'`;
      }
    } catch (err) {
      logger.warn("Failed to check user role for owner fallback", { reason: safeErrorMessage(err) });
      ownerCheckReason += " | DB check failed";
    }
  }

  req.auth = { ...auth, isOwner };

  // Log authentication details for debugging
  logger.info("User authenticated", {
    userId: auth.userId,
    email: auth.email,
    isOwner,
    reason: ownerCheckReason,
    path: req.path,
  });

  next();
}

export const requireAuth = asyncHandler(authenticate);