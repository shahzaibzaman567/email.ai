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

export interface ApiEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}