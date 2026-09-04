import { logger } from "./logger.js";

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  shouldRetry?: (err: unknown) => boolean;
  label?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` with bounded exponential backoff + jitter.
 * Never loops infinitely: after `attempts` tries the last error is thrown.
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 10_000;
  const factor = options.factor ?? 2;
  const shouldRetry = options.shouldRetry ?? (() => true);
  const label = options.label ?? "operation";

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isFinalAttempt = attempt >= attempts;
      if (isFinalAttempt || !shouldRetry(err)) {
        throw err;
      }

      const jitter = Math.floor(Math.random() * baseDelayMs);
      const delay = Math.min(
        baseDelayMs * factor ** (attempt - 1) + jitter,
        maxDelayMs,
      );

      logger.warn(`${label} failed, retrying`, {
        attempt,
        attempts,
        delayMs: delay,
        error: err instanceof Error ? err.message : "unknown error",
      });

      await sleep(delay);
    }
  }

  throw lastError;
}