import { Schema, model } from "mongoose";

export interface IAiInstruction {
  userId: string;
  instruction: string;
  isActive: boolean;
  source: "chat" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

const aiInstructionSchema = new Schema<IAiInstruction>(
  {
    userId: { type: String, required: true, trim: true },
    instruction: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    source: { type: String, enum: ["chat", "manual"], default: "manual" },
  },
  { timestamps: true }
);

aiInstructionSchema.index({ userId: 1 });

export const AiInstructionModel = model<IAiInstruction>("AiInstruction", aiInstructionSchema);
