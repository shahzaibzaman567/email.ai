export interface CampaignLaunchedEvent {
  name: "campaign/launched";
  data: {
    campaignId: string;
    userId: string;
    leadIds: string[];
  };
}

export interface EmailCampaignRequestedEvent {
  name: "email/campaign.requested";
  data: {
    campaignId: string;
    leadId: string;
    userId: string;
  };
}

export type InngestPhase2Events = CampaignLaunchedEvent | EmailCampaignRequestedEvent;