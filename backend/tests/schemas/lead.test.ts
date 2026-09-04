import { describe, expect, it } from "vitest";
import {
  LEAD_STATUSES,
  leadBulkSchema,
  leadCreateSchema,
  leadListQuerySchema,
  leadUpdateSchema,
} from "../../src/schemas/lead.schema.js";

describe("leadCreateSchema", () => {
  it("accepts a minimal valid lead", () => {
    const result = leadCreateSchema.safeParse({ email: "john@acme.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@acme.com");
      expect(result.data.status).toBeUndefined();
    }
  });

  it("normalizes and lowercases the email", () => {
    const result = leadCreateSchema.safeParse({ email: "  John@Acme.COM " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("john@acme.com");
  });

  it("accepts all optional fields", () => {
    const result = leadCreateSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@acme.com",
      businessName: "Acme",
      website: "https://acme.com",
      problem: "Needs help",
      notes: "Met at conference",
      status: "queued",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = leadCreateSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid website", () => {
    const result = leadCreateSchema.safeParse({
      email: "john@acme.com",
      website: "acme",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    const result = leadCreateSchema.safeParse({
      email: "john@acme.com",
      hack: "attempt",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing email", () => {
    const result = leadCreateSchema.safeParse({ firstName: "John" });
    expect(result.success).toBe(false);
  });

  it("rejects fields exceeding max length", () => {
    const result = leadCreateSchema.safeParse({
      email: "john@acme.com",
      firstName: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty string for optional text fields", () => {
    const result = leadCreateSchema.safeParse({
      email: "john@acme.com",
      firstName: "",
      notes: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });
});

describe("leadUpdateSchema", () => {
  it("accepts a partial update", () => {
    const result = leadUpdateSchema.safeParse({ status: "sent" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty update", () => {
    const result = leadUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    const result = leadUpdateSchema.safeParse({ status: "spam" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = leadUpdateSchema.safeParse({ status: "sent", evil: true });
    expect(result.success).toBe(false);
  });
});

describe("leadBulkSchema", () => {
  it("accepts an array of leads", () => {
    const result = leadBulkSchema.safeParse({
      leads: [{ email: "a@b.com" }, { email: "c@d.com" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty array", () => {
    const result = leadBulkSchema.safeParse({ leads: [] });
    expect(result.success).toBe(false);
  });
});

describe("leadListQuerySchema", () => {
  it("applies defaults", () => {
    const result = leadListQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 20 });
  });

  it("parses and clamps pageSize to 100", () => {
    const result = leadListQuerySchema.parse({ page: 2, pageSize: "500" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(100);
  });

  it("accepts a status filter", () => {
    const result = leadListQuerySchema.parse({ status: "pending" });
    expect(result.status).toBe("pending");
  });

  it("rejects an unknown status filter", () => {
    const result = leadListQuerySchema.safeParse({ status: "open" });
    expect(result.success).toBe(false);
  });

  it("ignores an empty status filter", () => {
    const result = leadListQuerySchema.parse({ status: "" });
    expect(result.status).toBeUndefined();
  });
});

describe("LEAD_STATUSES", () => {
  it("matches the Phase 1 spec exactly", () => {
    expect(LEAD_STATUSES).toEqual([
      "pending",
      "processing",
      "queued",
      "sent",
      "failed",
      "bounced",
      "replied",
      "unsubscribed",
    ]);
  });
});