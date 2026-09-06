export const EMAIL_LOG_STATUSES = [
  "queued",
  "sending",
  "sent",
  "failed",
  "bounced",
] as const;

export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number];