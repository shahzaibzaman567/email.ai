import { Schema, model } from "mongoose";
import type { Types } from "mongoose";
import { CAMPAIGN_STATUSES, type CampaignStatus } from "../../schemas/campaign.schema.js";

export interface ICampaign {
  userId: Types.ObjectId;
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
  settings?: Record<string, any>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES as unknown as string[],
      default: "draft",
    },
    totalLeads: { type: Number, default: 0 },
    queued: { type: Number, default: 0 },
    processing: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    settings: { type: Schema.Types.Mixed },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

campaignSchema.index({ userId: 1 });
campaignSchema.index({ userId: 1, status: 1 });

export const CampaignModel = model<ICampaign>("Campaign", campaignSchema);