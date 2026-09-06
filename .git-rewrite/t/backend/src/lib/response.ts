import type { PaginationMeta } from "../types/index.js";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFailure {
  success: false;
  message: string;
  error: string;
  details?: unknown;
}

export function ok<T>(message: string, data: T, meta?: PaginationMeta): ApiSuccess<T> {
  return meta === undefined
    ? { success: true, message, data }
    : { success: true, message, data, meta };
}

export function fail(message: string, error: string, details?: unknown): ApiFailure {
  return details === undefined
    ? { success: false, message, error }
    : { success: false, message, error, details };
}