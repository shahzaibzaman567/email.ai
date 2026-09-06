import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { buildIdempotencyKey } from "../../src/services/email-log.service.js";

describe("buildIdempotencyKey", () => {
  it("combines lead and campaign ids deterministically", () => {
    const lead = new Types.ObjectId();
    const campaign = new Types.ObjectId();
    const key = buildIdempotencyKey(lead, campaign);
    expect(key).toBe(`${lead.toString()}:${campaign.toString()}`);
    expect(buildIdempotencyKey(lead, campaign)).toBe(key);
  });

  it("accepts string ids", () => {
    expect(buildIdempotencyKey("lead1", "camp1")).toBe("lead1:camp1");
  });
});