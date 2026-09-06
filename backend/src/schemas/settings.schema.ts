import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const optionalString = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

// SMTP validation
const smtpPortSchema = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(65535).optional()
);

export const coldEmailSettingsSchema = z
  .object({
    // Content settings
    service: optionalString(200),
    customService: optionalString(200),
    targetBusiness: optionalString(200),
    customTargetBusiness: optionalString(200),
    targetCountries: z
      .preprocess(
        (val) => {
          if (typeof val === "string") return val.split(",").map((c) => c.trim());
          if (Array.isArray(val)) return val;
          return undefined;
        },
        z.array(z.string().trim()).optional()
      ),
    emailGoal: optionalString(200),
    customEmailGoal: optionalString(500),
    emailLength: z
      .enum(["Short", "Medium", "Long"])
      .optional()
      .default("Short"),
    tone: optionalString(200),
    customTone: optionalString(200),
    cta: optionalString(200),
    customCta: optionalString(200),
    personalizationLevel: z
      .enum(["Low", "Medium", "High"])
      .optional()
      .default("High"),
    emailSignature: optionalString(500),
    subjectMode: z
      .enum(["same", "ai_personalized", "custom"])
      .optional()
      .default("ai_personalized"),
    sameSubject: optionalString(200),
    customSubjectInstruction: optionalString(500),

    // Groq API
    groqApiKey: optionalString(500),

    // SMTP Configuration
    smtpHost: optionalString(200),
    smtpPort: smtpPortSchema,
    smtpUser: optionalString(200),
    smtpPassword: optionalString(500),
    smtpFrom: optionalString(200),

    // Schedule
    dailyLimit: z
      .preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(1).max(1000).optional()
      )
      .default(100),
    scheduleStartTime: optionalString(10), // "09:00" format
    scheduleEndTime: optionalString(10), // "17:00" format
    scheduleTimezone: optionalString(50).default("UTC"),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .superRefine((data, ctx) => {
    // If SMTP host is provided, validate other SMTP fields
    if (data.smtpHost) {
      if (!data.smtpUser) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          expected: "string",
          received: "undefined",
          path: ["smtpUser"],
          message: "SMTP user is required when SMTP host is configured",
        });
      }
      if (!data.smtpPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          expected: "string",
          received: "undefined",
          path: ["smtpPassword"],
          message: "SMTP password is required when SMTP host is configured",
        });
      }
      if (!data.smtpPort) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          expected: "number",
          received: "undefined",
          path: ["smtpPort"],
          message: "SMTP port is required when SMTP host is configured",
        });
      }
    }

    // Validate time format if provided
    if (data.scheduleStartTime) {
      if (!/^\d{2}:\d{2}$/.test(data.scheduleStartTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          validation: "regex",
          path: ["scheduleStartTime"],
          message: "Start time must be in HH:MM format (e.g., 09:00)",
        });
      }
    }

    if (data.scheduleEndTime) {
      if (!/^\d{2}:\d{2}$/.test(data.scheduleEndTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          validation: "regex",
          path: ["scheduleEndTime"],
          message: "End time must be in HH:MM format (e.g., 17:00)",
        });
      }
    }
  });

export type ColdEmailSettingsInput = z.infer<typeof coldEmailSettingsSchema>;
