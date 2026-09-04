import { Schema, model } from "mongoose";
import type { Types } from "mongoose";
import { LEAD_STATUSES, type LeadStatus } from "../../schemas/lead.schema.js";

export interface ILead {
  userId: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email: string;
  businessName?: string;
  website?: string;
  problem?: string;
  notes?: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    businessName: { type: String, trim: true, maxlength: 200 },
    website: { type: String, trim: true, maxlength: 2000 },
    problem: { type: String, trim: true, maxlength: 2000 },
    notes: { type: String, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "pending",
    },
  },
  { timestamps: true },
);

leadSchema.index({ userId: 1 });
leadSchema.index({ userId: 1, email: 1 }, { unique: true });
leadSchema.index({ userId: 1, status: 1 });

export const LeadModel = model<ILead>("Lead", leadSchema);