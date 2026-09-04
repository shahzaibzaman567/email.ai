import { Types } from "mongoose";
import { EmailLogModel, type IEmailLog } from "../db/models/email-log.model.js";
import { LeadModel } from "../db/models/lead.model.js";
import { CampaignModel } from "../db/models/campaign.model.js";

export function buildIdempotencyKey(
  leadId: Types.ObjectId | string,
  campaignId: Types.ObjectId | string,
): string {
  return `${String(leadId)}:${String(campaignId)}`;
}

export interface EnsureEmailLogInput {
  userId: Types.ObjectId | string;
  leadId: Types.ObjectId | string;
  campaignId: Types.ObjectId | string;
  recipient: string;
}

export interface EnsureEmailLogResult {
  logId: string;
  alreadySent: boolean;
}

/**
 * Idempotent: returns the existing EmailLog for (leadId, campaignId) or creates
 * a new "queued" row. Enforced by a unique index on idempotencyKey.
 */
export async function ensureEmailLog(
  input: EnsureEmailLogInput,
): Promise<EnsureEmailLogResult> {
  const idempotencyKey = buildIdempotencyKey(input.leadId, input.campaignId);

  const existing = await EmailLogModel.findOne({ idempotencyKey }).exec();
  if (existing) {
    return { logId: existing._id.toString(), alreadySent: existing.status === "sent" };
  }

  try {
    const created = await EmailLogModel.create({
      userId: input.userId,
      leadId: input.leadId,
      campaignId: input.campaignId,
      recipient: input.recipient,
      idempotencyKey,
      status: "queued",
    });
    return { logId: created._id.toString(), alreadySent: false };
  } catch (err) {
    const raced = await EmailLogModel.findOne({ idempotencyKey }).exec();
    if (raced) return { logId: raced._id.toString(), alreadySent: raced.status === "sent" };
    throw err;
  }
}

export async function hasSuccessfulSend(
  leadId: Types.ObjectId | string,
  campaignId: Types.ObjectId | string,
): Promise<boolean> {
  const log = await EmailLogModel.findOne({
    leadId,
    campaignId,
    status: "sent",
  })
    .select("_id")
    .lean();
  return Boolean(log);
}

export interface EmailLogUpdateFields {
  subject?: string;
  body?: string;
  provider?: string;
  providerMessageId?: string;
  error?: string;
}

export async function markEmailLogStatus(
  logId: Types.ObjectId | string,
  status: IEmailLog["status"],
  fields: EmailLogUpdateFields = {},
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (fields.subject !== undefined) update.subject = fields.subject;
  if (fields.body !== undefined) update.body = fields.body;
  if (fields.provider !== undefined) update.provider = fields.provider;
  if (fields.providerMessageId !== undefined) update.providerMessageId = fields.providerMessageId;
  if (fields.error !== undefined) update.error = fields.error;
  if (status === "sent") update.sentAt = new Date();

  await EmailLogModel.updateOne({ _id: logId }, { $set: update }).exec();
}

export async function markEmailLogSent(
  logId: Types.ObjectId | string,
  fields: { provider: string; providerMessageId: string },
): Promise<void> {
  await markEmailLogStatus(logId, "sent", fields);
}

export async function markEmailLogFailed(
  logId: Types.ObjectId | string,
  errorMessage: string,
): Promise<void> {
  await markEmailLogStatus(logId, "failed", { error: errorMessage.slice(0, 1000) });
}

/**
 * Moves a lead through the pipeline. "sent" is applied unconditionally;
 * "failed" never downgrades a lead that already reached sent/replied/bounced.
 */
export async function updateLeadPipelineStatus(
  leadId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  status: "sent" | "failed",
): Promise<void> {
  if (status === "sent") {
    await LeadModel.updateOne(
      { _id: leadId, userId },
      { $set: { status: "sent" } },
    ).exec();
    return;
  }

  const doc = await LeadModel.findOne({ _id: leadId, userId })
    .select("status")
    .lean();
  if (!doc) return;
  if (["sent", "replied", "bounced", "unsubscribed"].includes(doc.status)) return;

  await LeadModel.updateOne({ _id: leadId, userId }, { $set: { status: "failed" } }).exec();
}

export async function updateCampaignStats(
  campaignId: Types.ObjectId | string,
): Promise<void> {
  const stats = await EmailLogModel.aggregate([
    { $match: { campaignId: new Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = {
    queued: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    bounced: 0,
    replied: 0,
  };

  let totalLeads = 0;
  stats.forEach((item) => {
    totalLeads += item.count;
    if (item._id === "queued") counts.queued = item.count;
    else if (item._id === "sending") counts.processing = item.count;
    else if (item._id === "sent") counts.sent = item.count;
    else if (item._id === "failed") counts.failed = item.count;
    else if (item._id === "bounced") counts.bounced = item.count;
    else if (item._id === "replied") counts.replied = item.count;
  });

  const updateFields: Record<string, any> = {
    totalLeads,
    queued: counts.queued,
    processing: counts.processing,
    sent: counts.sent,
    failed: counts.failed,
    bounced: counts.bounced,
    replied: counts.replied,
  };

  const campaign = await CampaignModel.findById(campaignId).select("status").lean();
  if (campaign) {
    if (campaign.status === "running" || campaign.status === "queued") {
      const processedCount = counts.sent + counts.failed + counts.bounced + counts.replied;
      if (processedCount === totalLeads && totalLeads > 0) {
        updateFields.status = "completed";
        updateFields.completedAt = new Date();
      } else if (campaign.status === "queued" && counts.processing > 0) {
        updateFields.status = "running";
      }
    }
  }

  await CampaignModel.updateOne({ _id: campaignId }, { $set: updateFields });
}