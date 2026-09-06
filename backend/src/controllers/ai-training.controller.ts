import type { Request, Response } from "express";
import { AiInstructionModel } from "../db/models/ai-instruction.model.js";
import { AiChatMessageModel } from "../db/models/ai-chat.model.js";
import { ok } from "../lib/response.js";
import { NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export async function getInstructions(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const items = await AiInstructionModel.find({ userId }).sort({ createdAt: -1 }).lean();
  res.json(ok("Instructions fetched", items));
}

export async function addInstruction(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { instruction } = req.body;
  
  if (!instruction) {
    throw new Error("Instruction text is required");
  }
  
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
  
  try {
    const items = await AiChatMessageModel.find({ userId }).sort({ createdAt: 1 }).lean();
    res.json(ok("Chat fetched", items));
  } catch (err) {
    logger.error("Failed to fetch chat history", {
      userId,
      error: err instanceof Error ? err.message : "unknown",
    });
    throw err;
  }
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  const userId = req.auth!.userId;
  const { message } = req.body;

  logger.info("Received chat message", {
    userId,
    messageLength: message?.length,
  });

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    logger.warn("Invalid message", { userId, message });
    throw new Error("Message is required and must be non-empty");
  }

  try {
    // Save user message
    const userMsg = await AiChatMessageModel.create({
      userId,
      role: "user",
      content: message.trim(),
    });

    logger.info("User message saved", { userId, msgId: userMsg._id });

    // Mock AI response for now (TODO: integrate with Groq)
    const aiResponse =
      "I have noted your preference. I will apply this to future emails.";

    const aiMsg = await AiChatMessageModel.create({
      userId,
      role: "assistant",
      content: aiResponse,
    });

    logger.info("AI message saved", { userId, msgId: aiMsg._id });

    res.json(
      ok("Message sent", {
        reply: aiResponse,
        extractedRules: [],
      })
    );
  } catch (err) {
    logger.error("Failed to send message", {
      userId,
      error: err instanceof Error ? err.message : "unknown",
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}
