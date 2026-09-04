import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import { HttpError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { fail } from "../lib/response.js";

interface MongooseValidationErrorLike {
  errors?: Record<string, { message?: string }>;
}

interface MongoDuplicateKeyError {
  code?: number;
  keyValue?: Record<string, unknown>;
}

function handleMongooseValidation(
  err: MongooseValidationErrorLike,
): { message: string; details: unknown } {
  const details = Object.entries(err.errors ?? {}).map(([field, e]) => ({
    field,
    message: e?.message ?? "Invalid value",
  }));
  return {
    message: "Data failed validation",
    details,
  };
}

function handleDuplicateKey(err: MongoDuplicateKeyError): {
  message: string;
  details: unknown;
} {
  return {
    message: "A record with the same unique value already exists",
    details: err.keyValue ? { keyValue: err.keyValue } : undefined,
  };
}

function isMongooseError(err: unknown): err is MongooseError {
  return err instanceof MongooseError;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail(`Route not found: ${req.method} ${req.path}`, "NOT_FOUND"));
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof HttpError) {
    logger.warn("Request failed", {
      status: err.status,
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
    });
    res.status(err.status).json(fail(err.message, err.code, err.details));
    return;
  }

  if (isMongooseError(err) && err.name === "ValidationError") {
    const { message, details } = handleMongooseValidation(
      err as unknown as MongooseValidationErrorLike,
    );
    res.status(400).json(fail(message, "VALIDATION_ERROR", details));
    return;
  }

  if (isMongooseError(err) && err.name === "CastError") {
    res.status(400).json(fail("Invalid identifier format", "INVALID_ID"));
    return;
  }

  if (
    err instanceof Error &&
    (err as MongoDuplicateKeyError).code === 11000
  ) {
    const { message, details } = handleDuplicateKey(err as MongoDuplicateKeyError);
    res.status(409).json(fail(message, "CONFLICT", details));
    return;
  }

  if (
    err instanceof SyntaxError &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    res.status(400).json(fail("Malformed JSON in request body", "BAD_JSON"));
    return;
  }

  logger.error("Unhandled server error", {
    error: err instanceof Error ? err.message : "unknown error",
    path: req.path,
    method: req.method,
  });
  res.status(500).json(fail("Internal server error", "INTERNAL_ERROR"));
};