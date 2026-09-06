import { inngest } from "../client.js";
import type { EmailCampaignRequestedEvent } from "../events.js";
import { LeadModel } from "../../db/models/lead.model.js";
import { CampaignModel } from "../../db/models/campaign.model.js";
import { EmailLogModel } from "../../db/models/email-log.model.js";
import { SuppressionModel } from "../../db/models/suppression.model.js";
import { ColdEmailSettingsModel } from "../../db/models/settings.model.js";
import { AiInstructionModel } from "../../db/models/ai-instruction.model.js";
import { generateColdEmail, AiRateLimitError } from "../../services/ai.service.js";
import {
  isRateLimitError,
  sendEmailThrottled,
} from "../../services/email.service.js";
import {
  ensureEmailLog,
  markEmailLogFailed,
  markEmailLogSent,
  markEmailLogStatus,
  updateLeadPipelineStatus,
  updateCampaignStats,
} from "../../services/email-log.service.js";
import { decrypt } from "../../lib/encryption.js";
import { logger, safeErrorMessage } from "../../lib/logger.js";

function getNextScheduleWindow(startTime: string, endTime: string, timezone: string): Date {
  // A naive implementation to sleep until the next start time.
  const now = new Date();
  
  // Format is "HH:mm"
  const [startHour, startMinute] = startTime.split(":").map(Number);
  
  const next = new Date(now);
  next.setUTCHours(startHour, startMinute, 0, 0);
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

export const sendCampaignEmail = inngest.createFunction(
  {
    id: "send-campaign-email",
    name: "Generate and send a personalized cold email for a single lead",
    triggers: [{ event: "email/campaign.requested" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { campaignId, leadId, userId } = (
      event.data as EmailCampaignRequestedEvent["data"]
    );

    const context = await step.run("load-lead-and-campaign", async () => {
      const lead = await LeadModel.findOne({ _id: leadId, userId }).lean();
      const campaign = await CampaignModel.findOne({ _id: campaignId, userId }).lean();
      
      let userSettings = await ColdEmailSettingsModel.findOne({ userId }).lean();
      if (!userSettings) {
        userSettings = {
          userId: userId as any,
          dailyLimit: 100,
          scheduleStartTime: "09:00",
          scheduleEndTime: "17:00",
          scheduleTimezone: "UTC",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }

      const instructions = await AiInstructionModel.find({ userId, isActive: true }).lean();
      const instructionsText = instructions.map(i => i.instruction).join("\n");

      if (!lead || !campaign) return null;
      
      const settings = userSettings as any;
      
      return {
        leadId: lead._id.toString(),
        userId,
        recipient: lead.email,
        firstName: lead.firstName ?? undefined,
        businessName: lead.businessName ?? undefined,
        website: lead.website ?? undefined,
        problem: lead.problem ?? undefined,
        notes: lead.notes ?? undefined,
        campaignStatus: campaign.status,
        campaignSettingsOverrides: campaign.settings || {},
        userSettings: settings,
        instructionsText,
        // Per-user SMTP (if configured)
        // Decrypt sensitive keys
        userSmtp: (settings.smtpHost && settings.smtpUser && settings.smtpPassword)
          ? {
              host: settings.smtpHost as string,
              port: (settings.smtpPort ?? 587) as number,
              user: settings.smtpUser as string,
              password: decrypt(settings.smtpPassword as string),
              from: (settings.smtpFrom ?? settings.smtpUser) as string,
            }
          : undefined,
        groqApiKey: settings.groqApiKey ? decrypt(settings.groqApiKey) : undefined,
      };
    });

    if (!context) {
      return { status: "skipped", reason: "lead_or_campaign_missing" };
    }

    if (context.campaignStatus === "paused" || context.campaignStatus === "completed" || context.campaignStatus === "failed") {
      return { status: "skipped", reason: `campaign_is_${context.campaignStatus}` };
    }

    const { scheduleStartTime = "09:00", scheduleEndTime = "17:00", scheduleTimezone = "UTC", dailyLimit = 100 } = context.userSettings;

    // To properly sleep, we do it at the step level:
    const now = new Date();
    
    // Quick helper to check if current time is within bounds
    const isWithinWindow = () => {
      try {
        const fmt = new Intl.DateTimeFormat("en-US", {
          hour: "numeric", minute: "numeric", hour12: false, timeZone: scheduleTimezone
        });
        const parts = fmt.formatToParts(now);
        const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || "0", 10);
        
        const currentMins = get("hour") * 60 + get("minute");
        
        const [startH, startM] = scheduleStartTime.split(":").map(Number);
        const [endH, endM] = scheduleEndTime.split(":").map(Number);
        
        const startMins = (startH || 0) * 60 + (startM || 0);
        const endMins = (endH || 0) * 60 + (endM || 0);
        
        return currentMins >= startMins && currentMins < endMins;
      } catch {
        return true; // Fallback: allow sending if timezone parsing fails
      }
    };

    if (!isWithinWindow()) {
      const nextWindow = getNextScheduleWindow(scheduleStartTime, scheduleEndTime, scheduleTimezone);
      await step.sleepUntil("sleep-until-schedule", nextWindow);
    }

    let logId: string | undefined;

    try {
      const ensured = await step.run("ensure-email-log", () =>
        ensureEmailLog({
          userId,
          leadId,
          campaignId,
          recipient: context.recipient,
        }),
      );
      logId = ensured.logId;

      if (ensured.alreadySent) {
        return { status: "skipped", reason: "already_sent" };
      }

      const isSuppressed = await step.run("check-suppression", async () => {
        return SuppressionModel.exists({ userId, email: context.recipient.toLowerCase() });
      });

      if (isSuppressed) {
        await step.run("mark-suppressed-failed", () =>
          markEmailLogFailed(logId!, "Email address is suppressed")
        );
        await step.run("update-stats-suppressed", () =>
          updateCampaignStats(campaignId)
        );
        return { status: "skipped", reason: "email_suppressed" };
      }

      const email = await step.run("generate-email", async () => {
        const mergedSettings = { ...context.userSettings, ...context.campaignSettingsOverrides };
        return generateColdEmail({
          firstName: context.firstName,
          businessName: context.businessName,
          website: context.website,
          problem: context.problem,
          notes: context.notes,
        }, mergedSettings, context.instructionsText, context.groqApiKey);
      });

      const sendOutcome = await step.run("claim-and-send", async () => {
        const claimed = await EmailLogModel.findOneAndUpdate(
          { _id: logId, status: { $in: ["queued", "failed"] } },
          { $set: { status: "sending", subject: email.subject, body: email.body } },
          { new: true },
        ).lean();

        if (!claimed) {
          return { outcome: "already_processed" as const };
        }

        try {
          const result = await sendEmailThrottled({
            to: context.recipient,
            subject: email.subject,
            text: email.body,
            userSmtp: (context as any).userSmtp,
          });
          return { outcome: "sent" as const, result };
        } catch (sendErr) {
          await markEmailLogStatus(logId!, "queued");
          throw sendErr;
        }
      });

      if (sendOutcome.outcome === "sent") {
        await step.run("mark-sent", () =>
          markEmailLogSent(logId!, {
            provider: sendOutcome.result.provider,
            providerMessageId: sendOutcome.result.providerMessageId,
          }),
        );
        await step.run("update-lead-sent", () =>
          updateLeadPipelineStatus(context.leadId, context.userId, "sent"),
        );
        await step.run("update-stats-sent", () =>
          updateCampaignStats(campaignId)
        );
        return {
          status: "sent",
          providerMessageId: sendOutcome.result.providerMessageId,
        };
      }

      return { status: "skipped", reason: "already_processed" };
    } catch (err) {
      const rateLimited = err instanceof AiRateLimitError || isRateLimitError(err);
      if (rateLimited) {
        await step.sleep("rate-limit-backoff", "30s");
        if (logId) {
          await step.run("requeue-on-rate-limit", () =>
            markEmailLogStatus(logId!, "queued"),
          );
        }
      } else if (logId) {
        await step.run("record-failure", () =>
          markEmailLogFailed(logId!, safeErrorMessage(err)),
        );
        await step.run("update-lead-failed", () =>
          updateLeadPipelineStatus(context.leadId, context.userId, "failed"),
        );
        await step.run("update-stats-failed", () =>
          updateCampaignStats(campaignId)
        );
      }

      logger.error("Send campaign email function failed", {
        campaignId,
        leadId,
        error: safeErrorMessage(err),
      });
      throw err;
    }
  },
);