import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../lib/errors.js";
import { formatZodIssues } from "../lib/zod-errors.js";

function parseWithSchema(
  schema: ZodType,
  input: unknown,
  message: string,
): unknown {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(message, formatZodIssues(result.error));
  }
  return result.data;
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = parseWithSchema(schema, req.body, "Request body is invalid");
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.query = parseWithSchema(
      schema,
      req.query,
      "Query parameters are invalid",
    ) as Request["query"];
    next();
  };
}

export function validateParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.params = parseWithSchema(
      schema,
      req.params,
      "Path parameters are invalid",
    ) as Request["params"];
    next();
  };
}