import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { leadUpdateSchema, leadListQuerySchema } from "../../schemas/lead.schema.js";
import {
  createLead,
  deleteLead,
  getLead,
  listLeads,
  updateLead,
  validateLeads,
} from "../../controllers/lead.controller.js";

const router = Router();

router.get("/", validateQuery(leadListQuerySchema), asyncHandler(listLeads));
router.post("/", asyncHandler(createLead));
router.post("/validate", asyncHandler(validateLeads));
router.get("/:id", asyncHandler(getLead));
router.put("/:id", validateBody(leadUpdateSchema), asyncHandler(updateLead));
router.patch("/:id", validateBody(leadUpdateSchema), asyncHandler(updateLead));
router.delete("/:id", asyncHandler(deleteLead));

export default router;