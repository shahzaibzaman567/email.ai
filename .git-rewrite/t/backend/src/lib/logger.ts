import { env } from "../config/env.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel: number = env.isProd ? LEVEL_ORDER.info : LEVEL_ORDER.debug;

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < minLevel) return;

  if (env.isProd) {
    const line: Record<string, unknown> = {
      time: timestamp(),
      level,
      msg: message,
      ...meta,
    };
    const output = JSON.stringify(line);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
    return;
  }

  const metaText = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  const prefix = `[${timestamp()}] ${level.toUpperCase().padEnd(5)}`;
  if (level === "error") console.error(`${prefix} ${message}${metaText}`);
  else if (level === "warn") console.warn(`${prefix} ${message}${metaText}`);
  else console.log(`${prefix} ${message}${metaText}`);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    write("error", message, meta),
};

export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}