import { API } from "@/lib/constants";
import type { ApiEnvelope, ApiError, PaginatedData } from "@/types/api";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.error;
    this.details = body.details;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Typed client for the standalone backend.
 * Attaches the Clerk session JWT when `token` is provided.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, headers } = options;

  const res = await fetch(`${API.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let errorBody: ApiError = {
      success: false,
      message: `Request failed with ${res.status}`,
      error: "UNKNOWN",
    };
    try {
      errorBody = (await res.json()) as ApiError;
    } catch {
      // non-JSON error body
    }
    throw new ApiClientError(res.status, errorBody);
  }

  if (res.status === 204) return undefined as T;
  const envelope = (await res.json()) as ApiEnvelope<T>;
  return envelope.data;
}

export async function list<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  options: RequestOptions = {},
): Promise<ListResult<T>> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  const envelope = await apiRequest<PaginatedData<T>>(
    `${path}${qs ? `?${qs}` : ""}`,
    options,
  );
  return {
    data: envelope.items,
    total: envelope.total,
    page: envelope.page,
    pageSize: envelope.pageSize,
  };
}