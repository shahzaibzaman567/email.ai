import { assertRuntimeEnv, env } from "./config/env.js";
import { connectDB } from "./db/index.js";
import app from "./app.js";
import { logger, safeErrorMessage } from "./lib/logger.js";

async function main(): Promise<void> {
  logger.info("Starting email-ai backend", {
    env: env.nodeEnv,
    port: env.port,
  });

  assertRuntimeEnv();
  await connectDB(env.mongodbUri);

  const server = app.listen(env.port, () => {
    logger.info(`Server listening on http://localhost:${env.port}`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err: unknown) => {
  logger.error("Failed to start server", { error: safeErrorMessage(err) });
  process.exit(1);
});