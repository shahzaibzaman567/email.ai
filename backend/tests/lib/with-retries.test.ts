import { describe, expect, it, vi } from "vitest";
import { withRetries } from "../../src/lib/with-retries.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("withRetries", () => {
  it("returns the result on first success", async () => {
    const fn = vi.fn(async () => "ok");
    const result = await withRetries(fn, { attempts: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries and eventually succeeds", async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls < 3) throw new Error("transient");
      return "ok";
    };
    const result = await withRetries(fn, {
      attempts: 3,
      baseDelayMs: 5,
      factor: 1,
    });
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("does not loop forever and throws the last error", async () => {
    const fn = vi.fn(async () => {
      throw new Error("always fails");
    });
    await expect(
      withRetries(fn, { attempts: 3, baseDelayMs: 5, factor: 1 }),
    ).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("respects shouldRetry to stop early", async () => {
    const fn = vi.fn(async () => {
      throw new Error("permanent");
    });
    await expect(
      withRetries(fn, {
        attempts: 5,
        baseDelayMs: 5,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow("permanent");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("backs off between attempts", async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls < 2) throw new Error("transient");
      return "ok";
    };
    const started = Date.now();
    await withRetries(fn, { attempts: 2, baseDelayMs: 50, factor: 1 });
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });

  it("caps the backoff at maxDelayMs", async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls < 2) throw new Error("transient");
      return "ok";
    };
    const started = Date.now();
    await withRetries(fn, {
      attempts: 2,
      baseDelayMs: 100_000,
      maxDelayMs: 30,
    });
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(500);
    void sleep;
  });
});