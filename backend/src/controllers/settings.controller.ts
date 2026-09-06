import type { Request, Response } from "express";
import { ColdEmailSettingsModel } from "../db/models/settings.model.js";
import { ok } from "../lib/response.js";
import { encrypt } from "../lib/encryption.js";

function maskApiKey(key?: string): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return "gsk_****";
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

export async function getColdEmailSettings(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  
  let settings = await ColdEmailSettingsModel.findOne({ userId }).lean();
  
  if (!settings) {
    settings = {
      userId: userId as any,
      emailLength: "Short",
      personalizationLevel: "High",
      emailSignature: "Best regards,\nShahzaib",
      subjectMode: "ai_personalized",
      dailyLimit: 100,
      scheduleStartTime: "09:00",
      scheduleEndTime: "17:00",
      scheduleTimezone: "UTC",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  if (settings && settings.groqApiKey) {
    (settings as any).groqApiKey = maskApiKey(settings.groqApiKey);
  }
  if (settings && (settings as any).smtpPassword) {
    (settings as any).smtpPassword = "••••••••";
  }

  res.json(ok("Settings fetched successfully", settings));
}

export async function updateColdEmailSettings(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const updates: any = {};

  // Whitelist allowed fields
  const allowedFields = [
    "service", "customService", "targetBusiness", "customTargetBusiness",
    "targetCountries", "emailGoal", "customEmailGoal", "emailLength",
    "tone", "customTone", "cta", "customCta", "personalizationLevel",
    "emailSignature", "subjectMode", "sameSubject", "customSubjectInstruction",
    "groqApiKey", "smtpHost", "smtpPort", "smtpUser", "smtpPassword",
    "smtpFrom", "dailyLimit", "scheduleStartTime", "scheduleEndTime",
    "scheduleTimezone"
  ];

  for (const field of allowedFields) {
    if (field in req.body && req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== "") {
      const value = req.body[field];
      
      // Skip masked values
      if ((field === "groqApiKey" && typeof value === "string" && value.includes("...")) ||
          (field === "smtpPassword" && value === "••••••••")) {
        continue;
      }

      updates[field] = value;
    }
  }

  // Encrypt sensitive fields
  if (updates.smtpPassword) {
    updates.smtpPassword = encrypt(updates.smtpPassword);
  }
  if (updates.groqApiKey) {
    updates.groqApiKey = encrypt(updates.groqApiKey);
  }

  const settings = await ColdEmailSettingsModel.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  if (settings?.groqApiKey) {
    (settings as any).groqApiKey = maskApiKey(settings.groqApiKey);
  }
  if (settings?.smtpPassword) {
    (settings as any).smtpPassword = "••••••••";
  }

  res.json(ok("Settings updated successfully", settings));
}
