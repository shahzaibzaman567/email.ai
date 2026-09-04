import { env } from "../src/config/env.js";
import { connectDB } from "../src/db/index.js";
import { createApp } from "../src/app.js";

// Vercel Serverless Function entry point

// Initiate connection. In serverless environments, this promise may float
// but mongoose internally buffers commands until the connection is established.
connectDB(env.mongodbUri).catch(console.error);

const app = createApp();

export default app;
