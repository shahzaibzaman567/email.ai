import { Schema, model } from "mongoose";
import type { Types } from "mongoose";

export interface IColdEmailSettings {
  userId: Types.ObjectId;
  service?: string;
  customService?: string;
  targetBusiness?: string;
  customTargetBusiness?: string;
  targetCountries?: string[];
  emailGoal?: string;
  customEmailGoal?: string;
  emailLength?: string;
  tone?: string;
  customTone?: string;
  cta?: string;
  customCta?: string;
  personalizationLevel?: string;
  emailSignature?: string;
  subjectMode?: "same" | "ai_personalized" | "custom";
  sameSubject?: string;
  customSubjectInstruction?: string;
  groqApiKey?: string;
  
  // Daily Schedule
  dailyLimit?: number;
  scheduleStartHour?: number;
  scheduleEndHour?: number;
  scheduleTimezone?: string;

  createdAt: Date;
  updatedAt: Date;
}

const coldEmailSettingsSchema = new Schema<IColdEmailSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: String, trim: true },
    customService: { type: String, trim: true },
    targetBusiness: { type: String, trim: true },
    customTargetBusiness: { type: String, trim: true },
    targetCountries: [{ type: String, trim: true }],
    emailGoal: { type: String, trim: true },
    customEmailGoal: { type: String, trim: true },
    emailLength: { type: String, default: "Short" },
    tone: { type: String, trim: true },
    customTone: { type: String, trim: true },
    cta: { type: String, trim: true },
    customCta: { type: String, trim: true },
    personalizationLevel: { type: String, default: "High" },
    emailSignature: { type: String, default: "Best regards,\nShahzaib" },
    subjectMode: { type: String, enum: ["same", "ai_personalized", "custom"], default: "ai_personalized" },
    sameSubject: { type: String, trim: true },
    customSubjectInstruction: { type: String, trim: true },
    groqApiKey: { type: String, trim: true },

    dailyLimit: { type: Number, default: 100 },
    scheduleStartHour: { type: Number, default: 9 },
    scheduleEndHour: { type: Number, default: 17 },
    scheduleTimezone: { type: String, default: "UTC" },
  },
  { timestamps: true }
);

coldEmailSettingsSchema.index({ userId: 1 }, { unique: true });

export const ColdEmailSettingsModel = model<IColdEmailSettings>("ColdEmailSettings", coldEmailSettingsSchema);
