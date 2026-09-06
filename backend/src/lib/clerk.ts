import { verifyToken, clerkClient } from "@clerk/backend";
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

    const userId = payload.sub;
    let email: string | undefined = undefined;

    // Try to get email from token first
    if (typeof payload.email === "string") {
      email = payload.email;
    }

    // If email not in token, fetch from Clerk API
    if (!email) {
      try {
        const user = await clerkClient.users.getUser(userId);
        email = user.primaryEmailAddress?.emailAddress;
        
        logger.debug("Fetched email from Clerk API", {
          userId,
          email,
        });
      } catch (err) {
        logger.warn("Failed to fetch user email from Clerk API", {
          userId,
          reason: safeErrorMessage(err),
        });
      }
    }

    return {
      userId,
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