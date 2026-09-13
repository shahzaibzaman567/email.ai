import { inngest } from "../client.js";
import { ColdEmailSettingsModel } from "../../db/models/settings.model.js";
import { detectRepliesForUser } from "../../services/reply-detector.js";
import { logger } from "../../lib/logger.js";

export const checkReplies = inngest.createFunction(
  {
    id: "check-replies",
    name: "Check for email replies via IMAP",
    triggers: [{ event: "reply/check.requested" }],
    retries: 1,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    const context = await step.run("load-user-settings", async () => {
      const settings = await ColdEmailSettingsModel.findOne({ userId }).lean();
      if (!settings?.smtpFrom || !settings?.imapPassword) {
        return null;
      }
      return {
        email: settings.smtpFrom,
        imapPassword: settings.imapPassword,
      };
    });

    if (!context) {
      return { status: "skipped", reason: "no_imap_config" };
    }

    const result = await step.run("detect-replies", async () => {
      return detectRepliesForUser(userId, context.email, context.imapPassword);
    });

    logger.info("Reply check completed", {
      userId,
      repliesFound: result.repliesFound,
      leadsUpdated: result.leadsUpdated.length,
    });

    return { status: "completed", repliesFound: result.repliesFound };
  },
);

export const scheduledReplyCheck = inngest.createFunction(
  {
    id: "scheduled-reply-check",
    name: "Scheduled: Check all users for replies every 15 minutes",
    triggers: [{ cron: "*/15 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const users = await step.run("find-users-with-imap", async () => {
      const settings = await ColdEmailSettingsModel.find({
        smtpFrom: { $exists: true, $ne: null },
        imapPassword: { $exists: true, $ne: null },
      })
        .select("userId")
        .lean();
      return settings.map((s) => s.userId);
    });

    if (users.length === 0) {
      return { status: "no_users", count: 0 };
    }

    const results = await step.run("check-all-users", async () => {
      const promises = users.map(async (userId) => {
        try {
          const settings = await ColdEmailSettingsModel.findOne({ userId }).lean();
          if (!settings?.smtpFrom || !settings?.imapPassword) return { userId, status: "skipped" };
          const result = await detectRepliesForUser(userId, settings.smtpFrom, settings.imapPassword);
          return { userId, status: "completed", repliesFound: result.repliesFound };
        } catch (err) {
          logger.error("Reply check failed for user", { userId, error: String(err) });
          return { userId, status: "failed" };
        }
      });
      return Promise.all(promises);
    });

    const totalReplies = results.reduce((sum, r) => sum + ((r as any).repliesFound || 0), 0);

    return { status: "completed", usersChecked: users.length, totalReplies };
  },
);
