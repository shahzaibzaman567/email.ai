import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("app bootstrap", () => {
  it("creates the express app with Inngest serve mounted", () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(app).toHaveProperty("use");
  });
});