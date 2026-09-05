import type { Request, Response } from "express";
import { EmailLogModel } from "../db/models/email-log.model.js";
import { ok } from "../lib/response.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
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

export async function deleteEmailLog(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { id } = req.params;

  let objectId: Types.ObjectId;
  try {
    objectId = new Types.ObjectId(id);
  } catch {
    throw new NotFoundError("EmailLog");
  }

  const doc = await EmailLogModel.findOneAndDelete({ _id: objectId, userId }).lean();
  if (!doc) throw new NotFoundError("EmailLog");

  res.json(ok("Email log deleted successfully", { id: doc._id.toString() }));
}

export async function bulkDeleteEmailLogs(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const ids: unknown = req.body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("An array of log IDs is required");
  }

  const objectIds = ids
    .filter((id): id is string => typeof id === "string" && Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (objectIds.length === 0) {
    throw new ValidationError("No valid log IDs provided");
  }

  const result = await EmailLogModel.deleteMany({
    _id: { $in: objectIds },
    userId,
  });

  res.json(
    ok("Email logs deleted successfully", {
      deletedCount: result.deletedCount,
    }),
  );
}

