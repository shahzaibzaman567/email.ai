import { describe, expect, it } from "vitest";
import { buildPageMeta, parsePageParams } from "../../src/lib/paging.js";

describe("parsePageParams", () => {
  it("returns defaults when no params are provided", () => {
    expect(parsePageParams({})).toEqual({ page: 1, pageSize: 20, search: "" });
  });

  it("parses valid numeric values", () => {
    expect(parsePageParams({ page: "3", pageSize: "50", search: "acme" })).toEqual({
      page: 3,
      pageSize: 50,
      search: "acme",
    });
  });

  it("clamps page to a minimum of 1", () => {
    expect(parsePageParams({ page: "0" }).page).toBe(1);
  });

  it("clamps pageSize to a maximum of 100", () => {
    expect(parsePageParams({ pageSize: "999" }).pageSize).toBe(100);
  });

  it("falls back to defaults for invalid input", () => {
    expect(parsePageParams({ page: "abc", pageSize: "-5" })).toEqual({
      page: 1,
      pageSize: 20,
      search: "",
    });
  });

  it("trims the search term", () => {
    expect(parsePageParams({ search: "  hello  " }).search).toBe("hello");
  });
});

describe("buildPageMeta", () => {
  it("builds pagination metadata", () => {
    expect(buildPageMeta(42, 2, 20)).toEqual({ page: 2, pageSize: 20, total: 42 });
  });
});