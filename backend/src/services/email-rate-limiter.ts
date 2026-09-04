import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Application-level throttling for email sends.
 * Serializes sends and enforces a minimum interval between them so we never
 * burst past provider limits. Configurable via EMAIL_MIN_INTERVAL_MS.
 */
class EmailThrottle {
  private queue: Promise<unknown> = Promise.resolve();
  private lastSendAt = 0;

  throttled<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const elapsed = Date.now() - this.lastSendAt;
      const waitMs = Math.max(0, env.emailMinIntervalMs - elapsed);
      if (waitMs > 0) {
        logger.debug("Throttling email send", { waitMs });
        await sleep(waitMs);
      }
      try {
        return await fn();
      } finally {
        this.lastSendAt = Date.now();
      }
    });

    this.queue = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  }
}

export const emailThrottle = new EmailThrottle();