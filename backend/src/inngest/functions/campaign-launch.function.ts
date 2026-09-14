import { inngest } from "../client.js";
import type { CampaignLaunchedEvent } from "../events.js";
import { CampaignModel } from "../../db/models/campaign.model.js";
import { ColdEmailSettingsModel } from "../../db/models/settings.model.js";

export const campaignLaunch = inngest.createFunction(
  {
    id: "campaign-launch",
    name: "Queue a per-lead email job for each lead in a launched campaign",
    triggers: [{ event: "campaign/launched" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { campaignId, userId, leadIds } = (
      event.data as CampaignLaunchedEvent["data"]
    );

    const campaign = await step.run("load-campaign", async () =>
      CampaignModel.findOne({ _id: campaignId, userId }).lean(),
    );

    if (!campaign) {
      return { status: "skipped", reason: "campaign_not_found" };
    }

    if (campaign.status === "paused" || campaign.status === "completed") {
      return { status: "skipped", reason: `campaign_is_${campaign.status}` };
    }

    // Check if user has GAS webhook configured
    const userSettings = await step.run("load-user-settings", async () =>
      ColdEmailSettingsModel.findOne({ userId }).select("gasWebhookUrl dailyLimit").lean()
    );

    const hasGas = !!userSettings?.gasWebhookUrl;

    // GAS: 5-min interval, max 100 emails/day
    // SMTP: 3-min interval
    const INTERVAL_MINUTES = hasGas ? 5 : 3;
    const MAX_LEADS = hasGas ? 100 : (userSettings?.dailyLimit ?? 500);

    // Cap the lead list to daily limit
    const cappedLeadIds = leadIds.slice(0, MAX_LEADS);

    await step.run("set-campaign-running", async () => {
      await CampaignModel.updateOne(
        { _id: campaignId, userId, status: "queued" },
        { $set: { status: "running" } }
      );
    });

    await step.sendEvent(
      "queue-lead-emails",
      cappedLeadIds.map((leadId, index) => ({
        name: "email/campaign.requested",
        data: { campaignId, leadId, userId },
        // Each lead fires after an increasing delay
        ts: Date.now() + index * INTERVAL_MINUTES * 60 * 1000,
      })),
    );

    return {
      status: "queued",
      leads: cappedLeadIds.length,
      provider: hasGas ? "google-apps-script" : "smtp",
      intervalMinutes: INTERVAL_MINUTES,
    };
  },
);

