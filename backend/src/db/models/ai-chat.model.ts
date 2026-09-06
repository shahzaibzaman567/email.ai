import { Schema, model } from "mongoose";

export interface IAiChatMessage {
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiChatMessageSchema = new Schema<IAiChatMessage>(
  {
    userId: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

aiChatMessageSchema.index({ userId: 1, createdAt: 1 });

export const AiChatMessageModel = model<IAiChatMessage>("AiChatMessage", aiChatMessageSchema);
