import { describe, expect, it } from "vitest";
import {
  EmailNotConfiguredError,
  isRateLimitError,
  sendEmail,
} from "../../src/services/email.service.js";

describe("isRateLimitError", () => {
  it("detects numeric SMTP 4xx codes", () => {
    const err = new Error("quota exceeded") as Error & { code?: number };
    err.code = 450;
    expect(isRateLimitError(err)).toBe(true);
  });

  it("detects providerRateLimitError instances", () => {
    const err = new Error("rate limited") as Error & { code?: number };
    err.code = 452;
    expect(isRateLimitError(err)).toBe(true);
  });

  it("detects message-based rate limits", () => {
    expect(isRateLimitError(new Error("Too many messages sent"))).toBe(true);
    expect(isRateLimitError(new Error("Rate limit exceeded"))).toBe(true);
    expect(isRateLimitError(new Error("Throttling applied"))).toBe(true);
  });

  it("returns false for non-rate-limit errors", () => {
    expect(isRateLimitError(new Error("Invalid login"))).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
  });
});

describe("sendEmail", () => {
  it("throws EmailNotConfiguredError when SMTP is not configured and test mode is off", async () => {
    await expect(
      sendEmail({ to: "a@b.com", subject: "Hi", text: "Hello" }),
    ).rejects.toBeInstanceOf(EmailNotConfiguredError);
  });
});