import type { Request, Response } from "express";
import { AiInstructionModel } from "../db/models/ai-instruction.model.js";
import { AiChatMessageModel } from "../db/models/ai-chat.model.js";
import { ok } from "../lib/response.js";
import { NotFoundError } from "../lib/errors.js";
// We'll import Groq extraction here later

export async function getInstructions(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const items = await AiInstructionModel.find({ userId }).sort({ createdAt: -1 }).lean();
  res.json(ok("Instructions fetched", items));
}

export async function addInstruction(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { instruction } = req.body;
  
  const doc = await AiInstructionModel.create({
    userId,
    instruction,
    source: "manual",
  });
  
  res.json(ok("Instruction added", doc));
}

export async function updateInstruction(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { id } = req.params;
  const { instruction, isActive } = req.body;
  
  const doc = await AiInstructionModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: { instruction, isActive } },
    { new: true }
  ).lean();
  
  if (!doc) throw new NotFoundError("Instruction");
  
  res.json(ok("Instruction updated", doc));
}

export async function deleteInstruction(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { id } = req.params;
  
  const doc = await AiInstructionModel.findOneAndDelete({ _id: id, userId }).lean();
  if (!doc) throw new NotFoundError("Instruction");
  
  res.json(ok("Instruction deleted", null));
}

export async function getChatHistory(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const items = await AiChatMessageModel.find({ userId }).sort({ createdAt: 1 }).lean();
  res.json(ok("Chat fetched", items));
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { message } = req.body;
  
  // Save user message
  await AiChatMessageModel.create({ userId, role: "user", content: message });
  
  // TODO: Call Groq to reply and potentially extract rules
  // For now, mock a response
  const aiResponse = "I have noted your preference. I will apply this to future emails.";
  
  await AiChatMessageModel.create({ userId, role: "assistant", content: aiResponse });
  
  res.json(ok("Message sent", { reply: aiResponse, extractedRules: [] }));
}
