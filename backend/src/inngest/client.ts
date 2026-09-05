import { Inngest } from "inngest";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const inngest = new Inngest({
  id: "email-ai",
  eventKey: env.inngest.eventKey || undefined,
  signingKey: env.inngest.signingKey || undefined,
  baseUrl: env.inngest.baseUrl || undefined,
  isDev: env.nodeEnv !== "production" && !env.inngest.eventKey,
  logger,
});

// Log safe info to help debug Inngest sync/signing issues in production
logger.info("Inngest client initialized", {
  hasEventKey: Boolean(env.inngest.eventKey),
  hasSigningKey: Boolean(env.inngest.signingKey),
  nodeEnv: env.nodeEnv,
  isDev: env.nodeEnv !== "production" && !env.inngest.eventKey,
});