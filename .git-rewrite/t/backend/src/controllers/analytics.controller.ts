import type { Request, Response } from "express";
import { CampaignModel } from "../db/models/campaign.model.js";
import { LeadModel } from "../db/models/lead.model.js";
import { EmailLogModel } from "../db/models/email-log.model.js";
import { ok } from "../lib/response.js";

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;

  const [totalLeads, emailsSent, pending, failed, bounced, replies, unsubscribed] = await Promise.all([
    LeadModel.countDocuments({ userId }),
    EmailLogModel.countDocuments({ userId, status: "sent" }),
    EmailLogModel.countDocuments({ userId, status: { $in: ["queued", "sending"] } }),
    EmailLogModel.countDocuments({ userId, status: "failed" }),
    EmailLogModel.countDocuments({ userId, status: "bounced" }),
    LeadModel.countDocuments({ userId, status: "replied" }),
    LeadModel.countDocuments({ userId, status: "unsubscribed" })
  ]);

  const activeCampaigns = await CampaignModel.find({
    userId,
    status: { $in: ["running", "queued", "paused"] }
  }).sort({ createdAt: -1 }).lean();

  const recentLeads = await LeadModel.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  const campaigns = activeCampaigns.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    status: c.status,
    totalLeads: c.totalLeads ?? 0,
    processedLeads: (c.sent ?? 0) + (c.failed ?? 0) + (c.bounced ?? 0) + (c.replied ?? 0),
    sent: c.sent ?? 0,
    failed: c.failed ?? 0,
    replied: c.replied ?? 0
  }));

  const leads = recentLeads.map((l) => ({
    id: l._id.toString(),
    name: [l.firstName, l.lastName].filter(Boolean).join(" ") || l.email,
    business: l.businessName,
    email: l.email,
    status: l.status,
    lastAttempt: l.updatedAt
  }));

  res.json(ok("Analytics fetched successfully", {
    metrics: {
      totalLeads,
      emailsSent,
      pending,
      failed,
      bounced,
      replies,
      unsubscribed
    },
    campaigns,
    leads
  }));
}
