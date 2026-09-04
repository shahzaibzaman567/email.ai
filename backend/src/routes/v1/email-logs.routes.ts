import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { getEmailLogs, getEmailLogDetail } from "../../controllers/email-logs.controller.js";

const router = Router();

router.get("/", asyncHandler(getEmailLogs));
router.get("/:id", asyncHandler(getEmailLogDetail));

export default router;
