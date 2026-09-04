import { describe, expect, it } from "vitest";
import {
  AiNotConfiguredError,
  buildUserPrompt,
  generateColdEmail,
  parseAiEmailJson,
} from "../../src/services/ai.service.js";

describe("parseAiEmailJson", () => {
  it("parses a valid email payload", () => {
    const result = parseAiEmailJson(
      JSON.stringify({ subject: "Quick question", body: "Hi there!" }),
    );
    expect(result).toEqual({ subject: "Quick question", body: "Hi there!" });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseAiEmailJson("not json")).toThrow();
  });

  it("throws on missing body", () => {
    expect(() => parseAiEmailJson(JSON.stringify({ subject: "Hi" }))).toThrow();
  });

  it("throws on empty subject", () => {
    expect(() => parseAiEmailJson(JSON.stringify({ subject: "", body: "x" }))).toThrow();
  });

  it("rejects extra fields (strict)", () => {
    expect(() =>
      parseAiEmailJson(
        JSON.stringify({ subject: "Hi", body: "x", hack: "y" }),
      ),
    ).toThrow();
  });

  it("rejects an oversized subject", () => {
    expect(() =>
      parseAiEmailJson(
        JSON.stringify({ subject: "x".repeat(151), body: "x" }),
      ),
    ).toThrow();
  });
});

describe("buildUserPrompt", () => {
  it("includes provided lead details", () => {
    const prompt = buildUserPrompt({
      firstName: "John",
      businessName: "Acme",
      website: "https://acme.com",
      problem: "Cold outreach is slow",
      notes: "Met at a conference",
    });
    expect(prompt).toContain("John");
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("https://acme.com");
    expect(prompt).toContain("Cold outreach is slow");
  });

  it("does not fabricate details that were not provided", () => {
    const prompt = buildUserPrompt({ firstName: "John" });
    expect(prompt).not.toContain("Acme");
    expect(prompt).not.toContain("problem");
  });
});

describe("generateColdEmail", () => {
  it("throws when XAI_API_KEY is not configured", async () => {
    await expect(generateColdEmail({ firstName: "John" })).rejects.toBeInstanceOf(
      AiNotConfiguredError,
    );
  });
});