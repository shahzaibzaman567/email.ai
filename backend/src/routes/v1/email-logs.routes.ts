import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  getEmailLogs,
  getEmailLogDetail,
  deleteEmailLog,
  bulkDeleteEmailLogs,
} from "../../controllers/email-logs.controller.js";

const router = Router();

router.get("/", asyncHandler(getEmailLogs));
router.delete("/", asyncHandler(bulkDeleteEmailLogs));
router.post("/bulk-delete", asyncHandler(bulkDeleteEmailLogs));
router.get("/:id", asyncHandler(getEmailLogDetail));
router.delete("/:id", asyncHandler(deleteEmailLog));

export default router;

