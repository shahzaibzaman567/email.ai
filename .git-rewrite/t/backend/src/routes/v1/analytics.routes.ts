import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { getAnalytics } from "../../controllers/analytics.controller.js";

const router = Router();

router.get("/", asyncHandler(getAnalytics));

export default router;
