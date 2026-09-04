import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireOwner } from "../../middleware/owner.js";
import { getAdminDashboard } from "../../controllers/admin.controller.js";

const router = Router();

router.get("/dashboard", requireOwner, asyncHandler(getAdminDashboard));

export default router;
