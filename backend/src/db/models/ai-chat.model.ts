import { Schema, model } from "mongoose";
import type { Types } from "mongoose";

export interface IAiChatMessage {
  userId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiChatMessageSchema = new Schema<IAiChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

aiChatMessageSchema.index({ userId: 1, createdAt: 1 });

export const AiChatMessageModel = model<IAiChatMessage>("AiChatMessage", aiChatMessageSchema);
