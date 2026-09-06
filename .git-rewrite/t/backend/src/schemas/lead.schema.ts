import { z } from "zod";

export const LEAD_STATUSES = [
  "pending",
  "processing",
  "queued",
  "sent",
  "failed",
  "bounced",
  "replied",
  "unsubscribed",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

const emptyToUndefined = (value: unknown) =>
  value === undefined || value === "" ? undefined : value;

const optionalTrimmedString = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalWebsite = z
  .preprocess((val) => {
    const v = emptyToUndefined(val);
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed && !/^https?:\/\//i.test(trimmed) && trimmed.includes(".")) {
        return `https://${trimmed}`;
      }
      return trimmed;
    }
    return v;
  }, z.string().trim().max(2000).optional())
  .refine(
    (value) =>
      value === undefined ||
      /^https?:\/\/.+\..+/i.test(value),
    "Website must be a valid http(s) URL",
  );

const leadFields = {
  firstName: optionalTrimmedString(100),
  lastName: optionalTrimmedString(100),
  email: z.string().trim().toLowerCase().email().max(254),
  businessName: optionalTrimmedString(200),
  website: optionalWebsite,
  problem: optionalTrimmedString(2000),
  notes: optionalTrimmedString(5000),
  status: z.enum(LEAD_STATUSES).optional(),
};

export const leadCreateSchema = z.object(leadFields).strict();

export const leadUpdateSchema = z
  .object({
    firstName: optionalTrimmedString(100),
    lastName: optionalTrimmedString(100),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    businessName: optionalTrimmedString(200),
    website: optionalWebsite,
    problem: optionalTrimmedString(2000),
    notes: optionalTrimmedString(5000),
    status: z.enum(LEAD_STATUSES).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["body"],
  });

export const leadBulkSchema = z
  .object({
    leads: z.array(leadCreateSchema).min(1).max(1000),
  });

export const leadListQuerySchema = z.object({
  page: z
    .preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().optional(),
    )
    .default(1),
  pageSize: z
    .preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().optional(),
    )
    .default(20)
    .transform((n) => Math.min(n, 100)),
  search: optionalTrimmedString(200),
  status: z.preprocess(emptyToUndefined, z.enum(LEAD_STATUSES).optional()),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type LeadBulkInput = z.infer<typeof leadBulkSchema>;
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;