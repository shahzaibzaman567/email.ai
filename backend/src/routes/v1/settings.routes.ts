import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { coldEmailSettingsSchema } from "../../schemas/settings.schema.js";
import { getColdEmailSettings, updateColdEmailSettings } from "../../controllers/settings.controller.js";

const router = Router();

router.get("/cold-email", asyncHandler(getColdEmailSettings));
router.put("/cold-email", validateBody(coldEmailSettingsSchema), asyncHandler(updateColdEmailSettings));

export default router;
