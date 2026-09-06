import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { logger, safeErrorMessage } from "../lib/logger.js";
import { emailThrottle } from "./email-rate-limiter.js";

export interface SendEmailInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  // Optional per-user SMTP override; if omitted, falls back to global env SMTP
  userSmtp?: {
    host: string;
    port: number;
    user: string;
    password: string;
    from?: string;
  };
}

export interface SendEmailResult {
  providerMessageId: string;
  provider: string;
  testMode: boolean;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "SMTP is not configured (EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD) and EMAIL_TEST_MODE is off",
    );
    this.name = "EmailNotConfiguredError";
  }
}

export class ProviderRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderRateLimitError";
  }
}

let sharedTransporter: Transporter | null = null;

function getTransporter(userSmtp?: SendEmailInput["userSmtp"]): Transporter {
  // If the caller provides per-user SMTP creds, create a one-off transporter
  if (userSmtp) {
    return nodemailer.createTransport({
      host: userSmtp.host,
      port: userSmtp.port,
      secure: userSmtp.port === 465,
      auth: { user: userSmtp.user, pass: userSmtp.password },
    });
  }
  // Fall back to global env SMTP
  if (!env.email.host || !env.email.user || !env.email.password) {
    throw new EmailNotConfiguredError();
  }
  if (!sharedTransporter) {
    sharedTransporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: { user: env.email.user, pass: env.email.password },
      pool: true,
      maxConnections: 1,
    });
  }
  return sharedTransporter;
}

export function isRateLimitError(err: unknown): boolean {
  if (err instanceof ProviderRateLimitError) return true;
  if (!(err instanceof Error)) return false;

  const message = err.message.toLowerCase();
  const code = (err as { code?: string | number }).code;
  const responseCode = (err as { responseCode?: number }).responseCode;

  if (typeof code === "number" && code >= 450 && code <= 452) return true;
  if (typeof responseCode === "number" && responseCode >= 450 && responseCode <= 452) return true;
  if (message.includes("too many") || message.includes("rate limit") || message.includes("throttl")) {
    return true;
  }
  return false;
}

/**
 * Sends one email. Honors EMAIL_TEST_MODE: when enabled, the email is logged
 * but never actually transmitted. In test mode no SMTP credentials are needed.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (env.emailTestMode) {
    logger.info("EMAIL_TEST_MODE: email would be sent", {
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return {
      providerMessageId: `test-${randomUUID()}`,
      provider: "test",
      testMode: true,
    };
  }

  const transport = getTransporter(input.userSmtp);
  const fromAddress = input.userSmtp?.from ?? env.email.from;

  try {
    const info = await transport.sendMail({
      ...(fromAddress ? { from: fromAddress } : {}),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    logger.info("Email sent via SMTP", {
      to: input.to,
      messageId: info.messageId,
    });

    return {
      providerMessageId: info.messageId ?? `unknown-${randomUUID()}`,
      provider: env.email.host ?? "smtp",
      testMode: false,
    };
  } catch (err) {
    logger.error("SMTP send failed", {
      to: input.to,
      error: safeErrorMessage(err),
    });
    if (isRateLimitError(err)) {
      throw new ProviderRateLimitError("SMTP provider is rate limiting");
    }
    throw err;
  }
}

export async function sendEmailThrottled(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  return emailThrottle.throttled(() => sendEmail(input));
}