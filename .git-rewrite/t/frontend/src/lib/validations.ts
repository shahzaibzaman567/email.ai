import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
});

export const leadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  businessName: z.string().trim().optional(),
  website: z.string().url().optional().or(z.literal("")),
  problem: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const sequenceStepSchema = z.object({
  type: z.enum(["email", "delay", "task"]),
  subject: z.string().trim().optional(),
  templateId: z.string().optional(),
  delayDays: z.coerce.number().int().min(0).max(365).optional(),
  order: z.coerce.number().int().min(0),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional(),
  steps: z.array(sequenceStepSchema).min(1, "At least one step is required"),
});

export const templateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(10_000),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;