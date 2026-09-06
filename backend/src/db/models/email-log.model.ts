import { Schema, model, Types } from "mongoose";
import {
  EMAIL_LOG_STATUSES,
  type EmailLogStatus,
} from "../../schemas/email-log.schema.js";

export interface IEmailLog {
  userId: string;
  leadId: Types.ObjectId;
  campaignId: Types.ObjectId;
  recipient: string;
  subject?: string;
  body?: string;
  status: EmailLogStatus;
  idempotencyKey: string;
  provider?: string;
  providerMessageId?: string;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    userId: { type: String, required: true, trim: true },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    recipient: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, trim: true, maxlength: 300 },
    body: { type: String, trim: true, maxlength: 100_000 },
    status: {
      type: String,
      enum: EMAIL_LOG_STATUSES as unknown as string[],
      default: "queued",
    },
    idempotencyKey: { type: String, required: true, trim: true },
    provider: { type: String, trim: true, maxlength: 50 },
    providerMessageId: { type: String, trim: true, maxlength: 200 },
    error: { type: String, trim: true, maxlength: 1000 },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

emailLogSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
emailLogSchema.index({ userId: 1, createdAt: -1 });
emailLogSchema.index({ userId: 1, status: 1 });
emailLogSchema.index({ leadId: 1, campaignId: 1 });

export const EmailLogModel = model<IEmailLog>("EmailLog", emailLogSchema);