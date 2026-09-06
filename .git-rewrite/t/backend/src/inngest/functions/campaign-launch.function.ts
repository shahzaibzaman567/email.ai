import { inngest } from "../client.js";
import type { CampaignLaunchedEvent } from "../events.js";
import { CampaignModel } from "../../db/models/campaign.model.js";

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

    await step.run("set-campaign-running", async () => {
      await CampaignModel.updateOne(
        { _id: campaignId, userId, status: "queued" },
        { $set: { status: "running" } }
      );
    });

    await step.sendEvent(
      "queue-lead-emails",
      leadIds.map((leadId) => ({
        name: "email/campaign.requested",
        data: { campaignId, leadId, userId },
      })),
    );

    return { status: "queued", leads: leadIds.length };
  },
);