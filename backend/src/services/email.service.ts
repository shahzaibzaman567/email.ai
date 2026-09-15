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
  from?: string;
  // Option 1 (highest priority): Google Apps Script webhook
  gasWebhook?: {
    url: string;
    fromName?: string;
  };
  // Option 2: Per-user SMTP override (Brevo, etc.)
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
  if (userSmtp) {
    return nodemailer.createTransport({
      host: userSmtp.host,
      port: userSmtp.port,
      secure: userSmtp.port === 465,
      auth: { user: userSmtp.user, pass: userSmtp.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
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
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return sharedTransporter;
}

/**
 * Send email via Google Apps Script doPost webhook.
 * The GAS script runs under the user's Google account so Gmail delivers it
 * from Google's own servers — guaranteed inbox delivery.
 */
async function sendViaGas(input: SendEmailInput): Promise<SendEmailResult> {
  const { url, fromName } = input.gasWebhook!;

  const payload = {
    to: input.to,
    subject: input.subject,
    body: input.text ?? "",
    // If no HTML is provided, convert plain text to HTML with proper line breaks
    // Otherwise it gets sent as a single unformatted block, which triggers spam filters
    htmlBody: input.html ?? (input.text ? input.text.replace(/\n/g, "<br>") : ""),
    fromName: fromName ?? "",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`GAS webhook returned HTTP ${response.status}`);
  }

  const json = (await response.json()) as { success?: boolean; error?: string; messageId?: string };

  if (!json.success) {
    throw new Error(`GAS email failed: ${json.error ?? "unknown error"}`);
  }

  logger.info("Email sent via Google Apps Script", { to: input.to });

  return {
    providerMessageId: json.messageId ?? `gas-${randomUUID()}`,
    provider: "google-apps-script",
    testMode: false,
  };
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
 * Sends one email. Priority order:
 * 1. Google Apps Script webhook (best deliverability, uses user's own Gmail)
 * 2. Custom SMTP (Brevo, etc.)
 * 3. Global platform SMTP (fallback)
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  // Priority 1: GAS webhook
  if (input.gasWebhook?.url) {
    return sendViaGas(input);
  }

  if (env.emailTestMode && !input.userSmtp) {
    logger.info("EMAIL_TEST_MODE: email would be sent", {
      to: input.to,
      subject: input.subject,
    });
    return {
      providerMessageId: `test-${randomUUID()}`,
      provider: "test",
      testMode: true,
    };
  }

  // Priority 2: Custom SMTP or fallback
  const transport = getTransporter(input.userSmtp);
  const fromAddress = input.from ?? input.userSmtp?.from ?? env.email.from;

  try {
    const replyTo = input.userSmtp?.from ?? fromAddress;
    const info = await transport.sendMail({
      ...(fromAddress ? { from: fromAddress } : {}),
      ...(replyTo ? { replyTo } : {}),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      xMailer: false,
    });

    logger.info("Email sent via SMTP", {
      to: input.to,
      messageId: info.messageId,
    });

    return {
      providerMessageId: info.messageId ?? `unknown-${randomUUID()}`,
      provider: input.userSmtp?.host ?? env.email.host ?? "smtp",
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
