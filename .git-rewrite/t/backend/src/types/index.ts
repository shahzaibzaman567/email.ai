export type CampaignStatus =
  | "draft"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export type LeadStatus =
  | "pending"
  | "processing"
  | "queued"
  | "sent"
  | "failed"
  | "bounced"
  | "replied"
  | "unsubscribed";

export type EmailLogStatus =
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "bounced";

export type SequenceStepType = "email" | "delay" | "task";

export interface SequenceStep {
  id: string;
  type: SequenceStepType;
  subject?: string;
  templateId?: string;
  delayDays?: number;
  order: number;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  totalLeads: number;
  queued: number;
  processing: number;
  sent: number;
  failed: number;
  bounced: number;
  replied: number;
  subjectStrategy?: string;
  senderIdentity?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  businessName?: string;
  website?: string;
  problem?: string;
  notes?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface InngestEvents {
  "campaign/launched": {
    data: {
      campaignId: string;
      userId: string;
      leadIds: string[];
    };
  };
  "email/campaign.requested": {
    data: {
      campaignId: string;
      leadId: string;
      userId: string;
    };
  };
  "lead/imported": {
    data: {
      leadId: string;
      userId: string;
    };
  };
  "email/send.requested": {
    data: {
      campaignId: string;
      leadId: string;
      stepId: string;
      userId: string;
    };
  };
  "campaign/followup.due": {
    data: {
      campaignId: string;
      leadId: string;
      stepIndex: number;
      userId: string;
    };
  };
  "lead/enrichment.requested": {
    data: {
      leadId: string;
      userId: string;
    };
  };
}