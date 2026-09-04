import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { campaignCreateSchema, campaignListQuerySchema, campaignLaunchSchema } from "../../schemas/campaign.schema.js";
import {
  createCampaign,
  getCampaign,
  launchCampaign,
  listCampaigns,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
} from "../../controllers/campaign.controller.js";

const router = Router();

router.get("/", validateQuery(campaignListQuerySchema), asyncHandler(listCampaigns));
router.post("/", validateBody(campaignCreateSchema), asyncHandler(createCampaign));
router.get("/:id", asyncHandler(getCampaign));
router.post("/:id/launch", validateBody(campaignLaunchSchema), asyncHandler(launchCampaign));
router.post("/:id/pause", asyncHandler(pauseCampaign));
router.post("/:id/resume", asyncHandler(resumeCampaign));
router.post("/:id/cancel", asyncHandler(cancelCampaign));

export default router;