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
      dailyLimit: 500,
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

  res.json(ok("Settings fetched successfully", settings));
}

export async function updateColdEmailSettings(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const updates: any = {};

  const allowedFields = [
    "service", "customService", "targetBusiness", "customTargetBusiness",
    "targetCountries", "emailGoal", "customEmailGoal", "emailLength",
    "tone", "customTone", "cta", "customCta", "personalizationLevel",
    "emailSignature", "subjectMode", "sameSubject", "customSubjectInstruction",
    "groqApiKey", "smtpFrom", "imapPassword",
    "smtpHost", "smtpUser", "smtpPass", "smtpPort",
    "dailyLimit", "scheduleStartTime", "scheduleEndTime",
    "scheduleTimezone"
  ];

  for (const field of allowedFields) {
    if (field in req.body && req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== "") {
      const value = req.body[field];
      
      if (field === "groqApiKey" && typeof value === "string" && value.includes("...")) {
        continue;
      }
      if (field === "imapPassword" && value === "••••••••") {
        continue;
      }
      if (field === "smtpPass" && value === "••••••••") {
        continue;
      }

      updates[field] = value;
    }
  }

  if (updates.dailyLimit && updates.dailyLimit > 500) {
    updates.dailyLimit = 500;
  }

  if (updates.groqApiKey) {
    updates.groqApiKey = encrypt(updates.groqApiKey);
  }
  if (updates.imapPassword) {
    updates.imapPassword = encrypt(updates.imapPassword);
  }
  if (updates.smtpPass) {
    updates.smtpPass = encrypt(updates.smtpPass);
  }

  const settings = await ColdEmailSettingsModel.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  if (settings?.groqApiKey) {
    (settings as any).groqApiKey = maskApiKey(settings.groqApiKey);
  }
  if (settings?.imapPassword) {
    (settings as any).imapPassword = "••••••••";
  }
  if (settings?.smtpPass) {
    (settings as any).smtpPass = "••••••••";
  }

  res.json(ok("Settings updated successfully", settings));
}
