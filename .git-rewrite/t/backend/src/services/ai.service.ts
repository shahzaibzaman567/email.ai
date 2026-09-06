import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { withRetries } from "../lib/with-retries.js";

export interface LeadContext {
  firstName?: string | null;
  businessName?: string | null;
  website?: string | null;
  problem?: string | null;
  notes?: string | null;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("Groq API Key is not configured. Please set a valid Groq API Key in your Cold Email Settings.");
    this.name = "AiNotConfiguredError";
  }
}

export class AiGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiGenerationError";
  }
}

export class AiRateLimitError extends Error {
  constructor() {
    super("AI provider is rate limiting requests");
    this.name = "AiRateLimitError";
  }
}

export const aiEmailSchema = z
  .object({
    subject: z.string().trim().min(1).max(150),
    body: z.string().trim().min(1).max(4000),
  })
  .strict();

export type AiEmailOutput = z.infer<typeof aiEmailSchema>;

const SYSTEM_PROMPT = `You write concise, natural, personalized cold emails for a B2B sales platform.

Rules:
- Keep the email short (under 120 words) and conversational, unless settings dictate otherwise.
- Open with a genuine, specific reason for reaching out to this person.
- Reference the prospect's business or stated problem only when it was provided.
- Do NOT invent facts, claims, metrics, or details that were not given.
- No hype, no excessive adjectives, no spammy or salesy language.
- Include exactly one clear, low-pressure next step (CTA).
- Never use placeholders like [Name] or [Company].
- Respond with JSON only, in this exact shape:
{"subject": "...", "body": "..."}`;

export function buildEnhancedPrompt(lead: LeadContext, settings: any, instructionsText: string): string {
  const parts: string[] = ["Write a cold email for this lead."];
  
  if (lead.firstName) parts.push(`Prospect first name: ${lead.firstName}`);
  if (lead.businessName) parts.push(`Their business: ${lead.businessName}`);
  if (lead.website) parts.push(`Their website: ${lead.website}`);
  if (lead.problem) parts.push(`Known problem/context: ${lead.problem}`);
  if (lead.notes) parts.push(`Additional notes: ${lead.notes}`);
  if (!lead.firstName && !lead.businessName && !lead.problem && !lead.notes) {
    parts.push("You have minimal information about this prospect.");
  }

  parts.push("\n### Campaign Settings:");
  if (settings.service || settings.customService) parts.push(`Service to pitch: ${settings.customService || settings.service}`);
  if (settings.targetBusiness || settings.customTargetBusiness) parts.push(`Target business type: ${settings.customTargetBusiness || settings.targetBusiness}`);
  if (settings.emailGoal || settings.customEmailGoal) parts.push(`Email goal: ${settings.customEmailGoal || settings.emailGoal}`);
  if (settings.tone || settings.customTone) parts.push(`Tone: ${settings.customTone || settings.tone}`);
  if (settings.emailLength) parts.push(`Length: ${settings.emailLength}`);
  if (settings.cta || settings.customCta) parts.push(`Call to Action: ${settings.customCta || settings.cta}`);
  if (settings.personalizationLevel) parts.push(`Personalization level: ${settings.personalizationLevel}`);
  
  if (instructionsText) {
    parts.push("\n### Custom AI Training Instructions from Owner:");
    parts.push(instructionsText);
  }

  if (settings.emailSignature) {
    parts.push(`\n### Enforced Signature (APPEND EXACTLY AS IS TO THE END OF THE BODY):`);
    parts.push(settings.emailSignature);
  }

  if (settings.subjectMode === "same" && settings.sameSubject) {
    parts.push(`\n### Subject Line Enforcement:`);
    parts.push(`You MUST use exactly this subject line: "${settings.sameSubject}"`);
  } else if (settings.subjectMode === "custom" && settings.customSubjectInstruction) {
    parts.push(`\n### Subject Line Instruction:`);
    parts.push(settings.customSubjectInstruction);
  }

  return parts.join("\n");
}

export function parseAiEmailJson(content: string): AiEmailOutput {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new AiGenerationError("AI returned invalid JSON");
  }
  const parsed = aiEmailSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiGenerationError(
      `AI returned invalid email payload: ${parsed.error.issues
        .map((i) => i.message)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

export async function generateColdEmail(
  lead: LeadContext,
  settings: any = {},
  instructionsText: string = "",
  userApiKey?: string
): Promise<GeneratedEmail> {
  const apiKey = userApiKey || settings.groqApiKey || env.groqApiKey;
  if (!apiKey) throw new AiNotConfiguredError();

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: env.groqBaseUrl,
  });

  return withRetries<GeneratedEmail>(
    async () => {
      const response = await openai.chat.completions.create({
        model: env.groqModel,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildEnhancedPrompt(lead, settings, instructionsText) },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AiGenerationError("AI returned an empty response");
      }

      const generated = parseAiEmailJson(content);
      
      if (settings.subjectMode === "same" && settings.sameSubject) {
        generated.subject = settings.sameSubject;
      }
      
      return generated;
    },
    {
      attempts: 3,
      baseDelayMs: 750,
      maxDelayMs: 8000,
      label: "AI email generation",
      shouldRetry: (err) => !(err instanceof AiGenerationError),
    },
  ).catch((err) => {
    if (err instanceof AiRateLimitError) throw err;
    if (err instanceof AiGenerationError) {
      logger.warn("AI generation failed", { error: err.message });
      throw err;
    }
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 429
    ) {
      throw new AiRateLimitError();
    }
    throw new AiGenerationError(
      err instanceof Error ? err.message : "AI request failed",
    );
  });
}