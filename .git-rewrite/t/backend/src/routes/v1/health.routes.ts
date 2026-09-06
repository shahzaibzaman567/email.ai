import { Router } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../lib/async-handler.js";
import { ok } from "../../lib/response.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const db =
      dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

    res.json(
      ok("Service is healthy", {
        status: "ok",
        uptime: process.uptime(),
        database: db,
      }),
    );
  }),
);

export default router;