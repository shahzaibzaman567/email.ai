import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import leadRoutes from "./lead.routes.js";
import campaignRoutes from "./campaign.routes.js";
import healthRoutes from "./health.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import settingsRoutes from "./settings.routes.js";
import aiTrainingRoutes from "./ai-training.routes.js";
import emailLogsRoutes from "./email-logs.routes.js";
import adminRoutes from "./admin.routes.js";
import { previewEmail } from "../../controllers/email-preview.controller.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { env } from "../../config/env.js";

const router = Router();

router.use("/health", healthRoutes);

// Debug endpoint to check owner email configuration
router.get("/debug/owner", (_req, res) => {
  res.json({
    success: true,
    message: "Owner email configuration",
    ownerEmail: env.ownerEmail || "NOT_SET",
    nodeEnv: env.nodeEnv,
  });
});

router.use(requireAuth);

// Debug: Check user's saved settings from DB
router.get("/debug/my-smtp", asyncHandler(async (req, res) => {
  const { ColdEmailSettingsModel } = await import("../../db/models/settings.model.js");
  const userId = req.auth!.userId;
  const settings = await ColdEmailSettingsModel.findOne({ userId }).lean();
  if (!settings) {
    res.json({ configured: false, message: "No settings saved yet." });
    return;
  }
  const s = settings as any;
  res.json({
    configured: !!s.smtpFrom,
    smtpFrom: s.smtpFrom || "NOT_SET",
    groqApiKey: s.groqApiKey ? "ENCRYPTED (exists)" : "NOT_SET",
  });
}));

router.use("/leads", leadRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/ai-training", aiTrainingRoutes);
router.use("/email-logs", emailLogsRoutes);
router.use("/admin", adminRoutes);
router.post("/email-preview", asyncHandler(previewEmail));

export default router;