import type { Request, Response } from "express";
import { EmailLogModel } from "../db/models/email-log.model.js";
import { ok } from "../lib/response.js";
import { NotFoundError } from "../lib/errors.js";
import { Types } from "mongoose";

export async function getEmailLogs(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const total = await EmailLogModel.countDocuments({ userId, status: "sent" });
  
  const logs = await EmailLogModel.find({ userId, status: "sent" })
    .populate("leadId", "firstName lastName businessName email")
    .populate("campaignId", "name")
    .sort({ sentAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  res.json(ok("Logs fetched", { items: logs, page, pageSize, total }));
}

export async function getEmailLogDetail(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { id } = req.params;

  let objectId: Types.ObjectId;
  try {
    objectId = new Types.ObjectId(id);
  } catch {
    throw new NotFoundError("EmailLog");
  }

  const log = await EmailLogModel.findOne({ _id: objectId, userId })
    .populate("leadId", "firstName lastName businessName email")
    .populate("campaignId", "name")
    .lean();

  if (!log) throw new NotFoundError("EmailLog");

  res.json(ok("Log fetched", log));
}
