import type { Request, Response } from "express";
import { LeadModel } from "../db/models/lead.model.js";
import { ColdEmailSettingsModel } from "../db/models/settings.model.js";
import { AiInstructionModel } from "../db/models/ai-instruction.model.js";
import { generateColdEmail } from "../services/ai.service.js";
import { decrypt } from "../lib/encryption.js";
import { ok } from "../lib/response.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";

export async function previewEmail(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { leadId, campaignSettingsOverrides } = req.body;

  if (!leadId) throw new ValidationError("leadId is required");

  const lead = await LeadModel.findOne({ _id: leadId, userId }).lean();
  if (!lead) throw new NotFoundError("Lead");

  // Load settings
  let userSettings = await ColdEmailSettingsModel.findOne({ userId }).lean();
  if (!userSettings) {
    userSettings = {
      userId: userId as any,
      emailLength: "Short",
      personalizationLevel: "High",
      emailSignature: "Best regards,\nShahzaib",
      subjectMode: "ai_personalized",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  // Merge with overrides
  const settings = { ...userSettings, ...(campaignSettingsOverrides || {}) };

  // Decrypt sensitive fields before use
  const groqApiKey = settings.groqApiKey ? decrypt(settings.groqApiKey as string) : undefined;

  // Load instructions
  const instructions = await AiInstructionModel.find({ userId, isActive: true }).lean();
  const instructionsText = instructions.map(i => i.instruction).join("\n");

  const email = await generateColdEmail(
    {
      firstName: lead.firstName ?? undefined,
      businessName: lead.businessName ?? undefined,
      website: lead.website ?? undefined,
      problem: lead.problem ?? undefined,
      notes: lead.notes ?? undefined,
    },
    settings,
    instructionsText,
    groqApiKey
  );

  res.json(ok("Email preview generated", email));
}
