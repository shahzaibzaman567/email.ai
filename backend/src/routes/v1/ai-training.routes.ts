import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  getInstructions,
  addInstruction,
  updateInstruction,
  deleteInstruction,
  getChatHistory,
  sendChatMessage
} from "../../controllers/ai-training.controller.js";

const router = Router();

// AI Training routes - available to all authenticated users
router.get("/instructions", asyncHandler(getInstructions));
router.post("/instructions", asyncHandler(addInstruction));
router.put("/instructions/:id", asyncHandler(updateInstruction));
router.delete("/instructions/:id", asyncHandler(deleteInstruction));

router.get("/chat", asyncHandler(getChatHistory));
router.post("/chat", asyncHandler(sendChatMessage));

export default router;
