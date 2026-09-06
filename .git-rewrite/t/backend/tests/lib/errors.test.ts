import { describe, expect, it } from "vitest";
import {
  ConflictError,
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../src/lib/errors.js";
import { fail, ok } from "../../src/lib/response.js";

describe("HttpError hierarchy", () => {
  it("creates a base HttpError", () => {
    const err = new HttpError(500, "BOOM", "something failed", { detail: 1 });
    expect(err.status).toBe(500);
    expect(err.code).toBe("BOOM");
    expect(err.message).toBe("something failed");
    expect(err.details).toEqual({ detail: 1 });
    expect(err).toBeInstanceOf(Error);
  });

  it("NotFoundError carries 404", () => {
    const err = new NotFoundError("Lead");
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Lead not found");
  });

  it("UnauthorizedError carries 401", () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("ValidationError carries 400 and details", () => {
    const err = new ValidationError("bad", [{ field: "email" }]);
    expect(err.status).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual([{ field: "email" }]);
  });

  it("ConflictError carries 409", () => {
    const err = new ConflictError("duplicate");
    expect(err.status).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});

describe("response envelope", () => {
  it("builds a success envelope", () => {
    expect(ok("Done", { id: "1" })).toEqual({
      success: true,
      message: "Done",
      data: { id: "1" },
    });
  });

  it("builds a success envelope with pagination meta", () => {
    expect(ok("List", [], { page: 1, pageSize: 20, total: 0 })).toEqual({
      success: true,
      message: "List",
      data: [],
      meta: { page: 1, pageSize: 20, total: 0 },
    });
  });

  it("builds a failure envelope", () => {
    expect(fail("nope", "NOT_FOUND")).toEqual({
      success: false,
      message: "nope",
      error: "NOT_FOUND",
    });
  });

  it("builds a failure envelope with details", () => {
    expect(fail("nope", "VALIDATION_ERROR", [{ field: "x" }])).toEqual({
      success: false,
      message: "nope",
      error: "VALIDATION_ERROR",
      details: [{ field: "x" }],
    });
  });
});