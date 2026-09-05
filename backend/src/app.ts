import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { serve } from "inngest/express";
import { assertRuntimeEnv, env } from "./config/env.js";
import { connectDB } from "./db/index.js";
import v1Router from "./routes/v1/index.js";
import { inngest } from "./inngest/client.js";
import { inngestFunctions } from "./inngest/functions/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    error: "RATE_LIMITED",
  },
});

export function createApp(): express.Express {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());

  app.use(async (_req, _res, next) => {
    try {
      assertRuntimeEnv();
      await connectDB(env.mongodbUri);
      next();
    } catch (err) {
      next(err);
    }
  });

  app.use(
    cors({
      origin: env.clientUrl,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 86_400,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/inngest", serve({ client: inngest, functions: inngestFunctions }));

  app.use("/api/v1", apiLimiter, v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();