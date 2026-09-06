import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { getColdEmailSettings, updateColdEmailSettings } from "../../controllers/settings.controller.js";

const router = Router();

router.get("/cold-email", asyncHandler(getColdEmailSettings));
// Temporarily remove validation to debug the issue
router.put("/cold-email", asyncHandler(updateColdEmailSettings));

export default router;
