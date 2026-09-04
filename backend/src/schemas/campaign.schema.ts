import { z } from "zod";

export const CAMPAIGN_STATUSES = [
  "draft",
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

const emptyToUndefined = (value: unknown) =>
  value === undefined || value === "" ? undefined : value;

export const campaignCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    description: z
      .preprocess(emptyToUndefined, z.string().trim().max(500))
      .optional(),
    settings: z.record(z.any()).optional(),
    leadIds: z
      .array(z.string().trim().min(1))
      .optional(),
  })
  .strict();

export const campaignListQuerySchema = z.object({
  page: z
    .preprocess(emptyToUndefined, z.coerce.number().int().positive().optional())
    .default(1),
  pageSize: z
    .preprocess(emptyToUndefined, z.coerce.number().int().positive().optional())
    .default(20)
    .transform((n) => Math.min(n, 100)),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(200)).optional(),
  status: z.preprocess(emptyToUndefined, z.enum(CAMPAIGN_STATUSES).optional()),
});

export const campaignLaunchSchema = z
  .object({
    leadIds: z
      .array(z.string().trim().min(1))
      .min(1, "At least one lead is required")
      .max(500, "Cannot launch more than 500 leads at once"),
  })
  .strict();

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignListQuery = z.infer<typeof campaignListQuerySchema>;
export type CampaignLaunchInput = z.infer<typeof campaignLaunchSchema>;