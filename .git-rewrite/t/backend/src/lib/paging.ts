import { HttpError } from "./errors.js";

export function parsePageParams(query: Record<string, unknown>) {
  const page = clampInt(query.page, 1, 1, 100_000);
  const pageSize = clampInt(query.pageSize, 20, 1, 100);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  return { page, pageSize, search };
}

export function buildPageMeta(total: number, page: number, pageSize: number) {
  return { page, pageSize, total };
}

function clampInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number.parseInt(value, 10);
    return Math.min(max, Math.max(min, n));
  }
  return fallback;
}

export function assertOwnerMatch<T extends { ownerId: string }>(
  record: T | undefined,
  ownerId: string,
  resource: string,
): T {
  if (!record) throw new HttpError(404, "NOT_FOUND", `${resource} not found`);
  if (record.ownerId !== ownerId) {
    throw new HttpError(404, "NOT_FOUND", `${resource} not found`);
  }
  return record;
}