import type { Request, Response } from "express";
import { Types } from "mongoose";
import { CampaignModel } from "../db/models/campaign.model.js";
import { LeadModel } from "../db/models/lead.model.js";
import { EmailLogModel } from "../db/models/email-log.model.js";
import {
  campaignCreateSchema,
  campaignListQuerySchema,
  campaignLaunchSchema,
  type CampaignStatus,
} from "../schemas/campaign.schema.js";
import { inngest } from "../inngest/client.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { formatZodIssues } from "../lib/zod-errors.js";
import { ok } from "../lib/response.js";
import { logger } from "../lib/logger.js";
import { ensureEmailLog, updateCampaignStats } from "../services/email-log.service.js";

function parseObjectId(id: string): Types.ObjectId {
  try {
    return new Types.ObjectId(id);
  } catch {
    throw new ValidationError(`Invalid ID format: ${id}`);
  }
}

type CampaignLike = {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  totalLeads?: number;
  queued?: number;
  processing?: number;
  sent?: number;
  failed?: number;
  bounced?: number;
  replied?: number;
  settings?: Record<string, any>;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toIso(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function serializeCampaign(doc: CampaignLike) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    description: doc.description ?? undefined,
    status: doc.status,
    totalLeads: doc.totalLeads ?? 0,
    queued: doc.queued ?? 0,
    processing: doc.processing ?? 0,
    sent: doc.sent ?? 0,
    failed: doc.failed ?? 0,
    bounced: doc.bounced ?? 0,
    replied: doc.replied ?? 0,
    settings: doc.settings ?? undefined,
    startedAt: toIso(doc.startedAt),
    completedAt: toIso(doc.completedAt),
    createdAt: toIso(doc.createdAt) ?? "",
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

import { SuppressionModel } from "../db/models/suppression.model.js";

async function startCampaignHelper(
  campaignId: Types.ObjectId,
  userId: string,
  leadIds: Types.ObjectId[],
): Promise<number> {
  const suppressions = await SuppressionModel.find({ userId }).select("email").lean();
  const suppressedEmails = new Set(suppressions.map((s) => s.email.toLowerCase()));

  const leads = await LeadModel.find({
    _id: { $in: leadIds },
    userId,
    status: { $nin: ["unsubscribed"] },
  })
    .select("_id email")
    .lean();

  const validLeads = leads.filter((lead) => !suppressedEmails.has(lead.email.toLowerCase()));

  if (validLeads.length === 0) {
    throw new ValidationError("No valid, non-suppressed leads found to start campaign");
  }

  // Set initial status of the campaign
  await CampaignModel.updateOne(
    { _id: campaignId, userId },
    {
      $set: {
        status: "queued",
        startedAt: new Date(),
        totalLeads: validLeads.length,
        queued: validLeads.length,
        processing: 0,
        sent: 0,
        failed: 0,
        bounced: 0,
        replied: 0,
      },
    },
  ).exec();

  // Create EmailLog entries for each lead in "queued" status
  for (const lead of validLeads) {
    await ensureEmailLog({
      userId,
      leadId: lead._id,
      campaignId,
      recipient: lead.email,
    });
  }

  // Send the inngest event
  await inngest.send({
    name: "campaign/launched",
    data: {
      campaignId: campaignId.toString(),
      userId,
      leadIds: validLeads.map((l) => l._id.toString()),
    },
  });

  return validLeads.length;
}

export async function createCampaign(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const parsed = campaignCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Campaign is invalid", formatZodIssues(parsed.error));
  }

  // Load current global cold email settings
  const { ColdEmailSettingsModel } = await import("../db/models/settings.model.js");
  let userSettings = await ColdEmailSettingsModel.findOne({ userId }).lean();
  if (!userSettings) {
    userSettings = {
      userId: userId as any,
      emailLength: "Short",
      personalizationLevel: "High",
      emailSignature: "Best regards,\nShahzaib",
      subjectMode: "ai_personalized",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  // Merge overrides
  const mergedSettings = { ...userSettings, ...(parsed.data.settings || {}) };

  const doc = await CampaignModel.create({
    userId,
    name: parsed.data.name,
    description: parsed.data.description,
    settings: mergedSettings,
    status: "draft",
  });

  if (parsed.data.leadIds && parsed.data.leadIds.length > 0) {
    const leadIds = parsed.data.leadIds.map((lid) => {
      try {
        return new Types.ObjectId(lid);
      } catch {
        throw new ValidationError(`Invalid lead id: ${lid}`);
      }
    });
    try {
      await startCampaignHelper(doc._id, userId, leadIds);
    } catch (err) {
      // If launch fails, clean up campaign or leave it as draft
      logger.error("Failed to start campaign during creation", { error: err });
    }
    // Reload the updated document
    const updated = await CampaignModel.findById(doc._id).lean();
    res.status(201).json(ok("Campaign started successfully", serializeCampaign(updated!)));
    return;
  }

  res.status(201).json(ok("Campaign created successfully", serializeCampaign(doc)));
}

export async function listCampaigns(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { page, pageSize, search, status } = campaignListQuerySchema.parse(req.query);

  const filter: Record<string, unknown> = { userId };
  if (status) filter.status = status;
  if (search) {
    filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const total = await CampaignModel.countDocuments(filter);
  const docs = await CampaignModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  res.json(
    ok("Campaigns fetched successfully", {
      items: docs.map(serializeCampaign),
      page,
      pageSize,
      total,
    }),
  );
}

export async function getCampaign(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);

  const doc = await CampaignModel.findOne({ _id: id, userId }).lean();
  if (!doc) throw new NotFoundError("Campaign");

  res.json(ok("Campaign fetched successfully", serializeCampaign(doc)));
}

/**
 * Queues background jobs (via Inngest) for every selected lead and returns
 * immediately. Email generation and sending happen asynchronously.
 */
export async function launchCampaign(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);

  const campaign = await CampaignModel.findOne({ _id: id, userId })
    .select("status")
    .lean();
  if (!campaign) throw new NotFoundError("Campaign");

  if (campaign.status !== "draft") {
    throw new ValidationError(`Cannot launch a campaign in status ${campaign.status}`);
  }

  const parsed = campaignLaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "Campaign launch payload is invalid",
      formatZodIssues(parsed.error),
    );
  }

  const leadIds = parsed.data.leadIds.map((leadId) => {
    try {
      return new Types.ObjectId(leadId);
    } catch {
      throw new ValidationError(`Invalid lead id: ${leadId}`);
    }
  });

  await startCampaignHelper(id, userId, leadIds);

  const updated = await CampaignModel.findById(id).lean();

  res.json(ok("Campaign launch queued", serializeCampaign(updated!)));
}

export async function pauseCampaign(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);

  const campaign = await CampaignModel.findOne({ _id: id, userId });
  if (!campaign) throw new NotFoundError("Campaign");

  if (campaign.status !== "running" && campaign.status !== "queued") {
    throw new ValidationError(`Cannot pause a campaign that is in ${campaign.status} status`);
  }

  campaign.status = "paused";
  await campaign.save();

  res.json(ok("Campaign paused successfully", serializeCampaign(campaign)));
}

export async function resumeCampaign(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);

  const campaign = await CampaignModel.findOne({ _id: id, userId });
  if (!campaign) throw new NotFoundError("Campaign");

  if (campaign.status !== "paused") {
    throw new ValidationError("Campaign is not paused");
  }

  campaign.status = "running";
  await campaign.save();

  // Find all queued EmailLogs and re-trigger their Inngest jobs
  const queuedLogs = await EmailLogModel.find({
    campaignId: id,
    status: "queued",
  })
    .select("leadId")
    .lean();

  if (queuedLogs.length > 0) {
    await inngest.send(
      queuedLogs.map((log) => ({
        name: "email/campaign.requested",
        data: {
          campaignId: id.toString(),
          leadId: log.leadId.toString(),
          userId,
        },
      })),
    );
  }

  res.json(ok("Campaign resumed successfully", serializeCampaign(campaign)));
}

export async function cancelCampaign(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);

  const campaign = await CampaignModel.findOne({ _id: id, userId });
  if (!campaign) throw new NotFoundError("Campaign");

  if (campaign.status === "completed" || campaign.status === "failed") {
    throw new ValidationError("Campaign is already finished");
  }

  campaign.status = "completed";
  campaign.completedAt = new Date();
  await campaign.save();

  res.json(ok("Campaign cancelled successfully", serializeCampaign(campaign)));
}