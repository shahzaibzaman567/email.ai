import { Schema, model } from "mongoose";
import type { Types } from "mongoose";

export interface ISuppression {
  userId: Types.ObjectId;
  email: string;
  reason: "bounce" | "unsubscribe" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

const suppressionSchema = new Schema<ISuppression>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    reason: {
      type: String,
      enum: ["bounce", "unsubscribe", "manual"],
      default: "manual",
    },
  },
  { timestamps: true },
);

suppressionSchema.index({ userId: 1, email: 1 }, { unique: true });

export const SuppressionModel = model<ISuppression>("Suppression", suppressionSchema);
