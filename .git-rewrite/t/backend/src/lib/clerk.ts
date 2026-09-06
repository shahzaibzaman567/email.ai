import { verifyToken } from "@clerk/backend";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";
import { logger, safeErrorMessage } from "./logger.js";

export interface ClerkAuth {
  userId: string;
  sessionId?: string;
  email?: string;
  isOwner?: boolean;
}

export async function verifyClerkToken(token: string): Promise<ClerkAuth> {
  try {
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey || undefined,
    });

    if (!payload?.sub) {
      throw new Error("Verified token is missing the subject claim");
    }

    const email =
      typeof payload.email === "string" ? payload.email : undefined;

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      email,
    };
  } catch (err) {
    logger.warn("Clerk token verification failed", {
      reason: safeErrorMessage(err),
    });
    throw new UnauthorizedError("Invalid or expired session token");
  }
}