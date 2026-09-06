import { describe, expect, it } from "vitest";
import {
  campaignCreateSchema,
  campaignLaunchSchema,
  campaignListQuerySchema,
} from "../../src/schemas/campaign.schema.js";

describe("campaignCreateSchema", () => {
  it("accepts a valid payload", () => {
    const result = campaignCreateSchema.safeParse({ name: "Q3 Outreach" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(campaignCreateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an oversized name", () => {
    expect(
      campaignCreateSchema.safeParse({ name: "x".repeat(121) }).success,
    ).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(
      campaignCreateSchema.safeParse({ name: "x", hack: 1 }).success,
    ).toBe(false);
  });
});

describe("campaignLaunchSchema", () => {
  it("accepts a lead list", () => {
    const result = campaignLaunchSchema.safeParse({
      leadIds: ["abc123", "def456"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty lead list", () => {
    expect(campaignLaunchSchema.safeParse({ leadIds: [] }).success).toBe(false);
  });

  it("rejects more than 500 leads", () => {
    const leadIds = Array.from({ length: 501 }, (_, i) => `id${i}`);
    expect(campaignLaunchSchema.safeParse({ leadIds }).success).toBe(false);
  });
});

describe("campaignListQuerySchema", () => {
  it("applies defaults", () => {
    expect(campaignListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("clamps pageSize to 100", () => {
    expect(campaignListQuerySchema.parse({ pageSize: "500" }).pageSize).toBe(100);
  });

  it("parses a status filter", () => {
    expect(campaignListQuerySchema.parse({ status: "draft" }).status).toBe("draft");
  });

  it("rejects an invalid status", () => {
    expect(campaignListQuerySchema.safeParse({ status: "bogus" }).success).toBe(false);
  });
});