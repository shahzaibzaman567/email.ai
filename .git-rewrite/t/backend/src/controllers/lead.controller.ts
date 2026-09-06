import type { Request, Response } from "express";
import { Types } from "mongoose";
import { LeadModel, type ILead } from "../db/models/lead.model.js";
import {
  leadCreateSchema,
  leadListQuerySchema,
  type LeadStatus,
} from "../schemas/lead.schema.js";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors.js";
import { formatZodIssues } from "../lib/zod-errors.js";
import { ok } from "../lib/response.js";
import type { Lead } from "../types/index.js";

type LeadLike = {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  businessName?: string | null;
  website?: string | null;
  problem?: string | null;
  notes?: string | null;
  status: LeadStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const UPDATABLE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "businessName",
  "website",
  "problem",
  "notes",
  "status",
] as const;

function toIso(value?: Date | string): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function serializeLead(doc: LeadLike): Lead {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    firstName: doc.firstName ?? undefined,
    lastName: doc.lastName ?? undefined,
    email: doc.email,
    businessName: doc.businessName ?? undefined,
    website: doc.website ?? undefined,
    problem: doc.problem ?? undefined,
    notes: doc.notes ?? undefined,
    status: doc.status,
    createdAt: toIso(doc.createdAt) ?? "",
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

function parseObjectId(id: string): Types.ObjectId {
  try {
    return new Types.ObjectId(id);
  } catch {
    throw new NotFoundError("Lead");
  }
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createLead(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const body: unknown = req.body;

  if (
    typeof body === "object" &&
    body !== null &&
    Array.isArray((body as Record<string, unknown>).leads)
  ) {
    await bulkImportLeads(req, res);
    return;
  }

  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError("Lead is invalid", formatZodIssues(parsed.error));
  }

  const existing = await LeadModel.findOne({
    userId,
    email: parsed.data.email,
  })
    .select("_id")
    .lean();
  if (existing) {
    throw new ConflictError("A lead with this email already exists");
  }

  const doc = await LeadModel.create({ ...parsed.data, userId });
  res.status(201).json(ok("Lead created successfully", serializeLead(doc)));
}

async function bulkImportLeads(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const raw = (req.body as { leads: unknown }).leads;

  if (!Array.isArray(raw)) {
    throw new ValidationError("The 'leads' field must be an array");
  }
  if (raw.length === 0) {
    throw new ValidationError("At least one lead is required");
  }
  if (raw.length > 1000) {
    throw new ValidationError("Cannot import more than 1000 leads at once");
  }

  const errors: Array<{ row: number; email: string | null; reasons: unknown }> = [];
  const validRows: Array<{
    email: string;
    [key: string]: unknown;
  }> = [];

  raw.forEach((row, index) => {
    if (typeof row !== "object" || row === null) {
      errors.push({ row: index, email: null, reasons: [{ field: "row", message: "Row must be an object" }] });
      return;
    }
    const parsed = leadCreateSchema.safeParse(row);
    if (!parsed.success) {
      errors.push({
        row: index,
        email: (row as { email?: string }).email ?? null,
        reasons: formatZodIssues(parsed.error),
      });
      return;
    }
    validRows.push(parsed.data as { email: string; [key: string]: unknown });
  });

  const seen = new Set<string>();
  const uniqueRows: Array<{ email: string; [key: string]: unknown }> = [];
  for (const row of validRows) {
    const key = normalizeEmail(row.email);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueRows.push(row);
  }

  const existingEmails = new Set<string>();
  if (uniqueRows.length > 0) {
    const existing = await LeadModel.find({
      userId,
      email: { $in: uniqueRows.map((r) => r.email) },
    })
      .select("email")
      .lean();
    for (const doc of existing) existingEmails.add(normalizeEmail(doc.email));
  }

  const toInsert = uniqueRows.filter(
    (row) => !existingEmails.has(normalizeEmail(row.email)),
  );

  let imported = 0;
  if (toInsert.length > 0) {
    const inserted = await LeadModel.insertMany(
      toInsert.map((row) => ({ ...row, userId }) as unknown as ILead),
    );
    imported = inserted.length;
  }

  const skipped = validRows.length - imported;

  res.status(200).json(
    ok("Lead import completed", {
      imported,
      skipped,
      errors,
    }),
  );
}

export async function validateLeads(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const raw = (req.body as { leads: unknown }).leads;

  if (!Array.isArray(raw)) {
    throw new ValidationError("The 'leads' field must be an array");
  }

  const valid: any[] = [];
  const invalid: any[] = [];
  const duplicates: any[] = [];

  const seen = new Set<string>();
  const emailsToCheck = new Set<string>();

  raw.forEach((row, index) => {
    if (typeof row !== "object" || row === null) {
      invalid.push({ row: index + 1, data: row, reason: "Row must be an object" });
      return;
    }
    const parsed = leadCreateSchema.safeParse(row);
    if (!parsed.success) {
      invalid.push({
        row: index + 1,
        data: row,
        reason: parsed.error.issues.map((i) => i.message).join(", ")
      });
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    if (seen.has(email)) {
      duplicates.push({ row: index + 1, data: parsed.data, reason: "Duplicate email in CSV" });
      return;
    }
    seen.add(email);
    emailsToCheck.add(email);
    valid.push({ row: index + 1, data: parsed.data });
  });

  if (emailsToCheck.size > 0) {
    const existing = await LeadModel.find({
      userId,
      email: { $in: Array.from(emailsToCheck) }
    }).select("email").lean();

    const existingEmails = new Set(existing.map((e) => e.email.trim().toLowerCase()));

    for (let i = valid.length - 1; i >= 0; i--) {
      const email = valid[i].data.email.trim().toLowerCase();
      if (existingEmails.has(email)) {
        duplicates.push({ ...valid[i], reason: "Lead already exists in database" });
        valid.splice(i, 1);
      }
    }
  }

  res.json(ok("Validation complete", {
    valid,
    invalid,
    duplicates,
    total: raw.length
  }));
}

export async function listLeads(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const query = leadListQuerySchema.parse(req.query);
  const { page, pageSize, search, status } = query;

  const filter: Record<string, unknown> = { userId };
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { firstName: rx },
      { lastName: rx },
      { email: rx },
      { businessName: rx },
    ];
  }

  const total = await LeadModel.countDocuments(filter);
  const docs = await LeadModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  res.json(
    ok("Leads fetched successfully", {
      items: docs.map(serializeLead),
      page,
      pageSize,
      total,
    }),
  );
}

export async function getLead(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);

  const doc = await LeadModel.findOne({ _id: id, userId }).lean();
  if (!doc) throw new NotFoundError("Lead");

  res.json(ok("Lead fetched successfully", serializeLead(doc)));
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);
  const body = req.body as Record<string, unknown>;

  const doc = await LeadModel.findOne({ _id: id, userId });
  if (!doc) throw new NotFoundError("Lead");

  if (typeof body.email === "string" && body.email !== doc.email) {
    const duplicate = await LeadModel.findOne({
      _id: { $ne: id },
      userId,
      email: normalizeEmail(body.email),
    })
      .select("_id")
      .lean();
    if (duplicate) {
      throw new ConflictError("A lead with this email already exists");
    }
  }

  const updates: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  Object.assign(doc, updates);

  const updated = await doc.save();
  res.json(ok("Lead updated successfully", serializeLead(updated)));
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const id = parseObjectId(req.params.id);

  const doc = await LeadModel.findOneAndDelete({ _id: id, userId }).lean();
  if (!doc) throw new NotFoundError("Lead");

  res.json(ok("Lead deleted successfully", { id: doc._id.toString() }));
}