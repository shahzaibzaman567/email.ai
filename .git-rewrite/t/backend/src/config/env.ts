import "dotenv/config";
import { z } from "zod";

/**
 * Centralized, validated access to environment variables.
 * Fail fast with a clear message when required values are missing.
 * Never expose these values in logs or API responses.
 */

const emptyToUndefined = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === undefined || v === "" ? undefined : v), schema);

const optionalString = emptyToUndefined(z.string().trim().optional());
const optionalUrl = emptyToUndefined(z.string().trim().url().optional());
const optionalNumber = emptyToUndefined(
  z.coerce.number().int().positive().optional(),
);

const booleanish = z.preprocess(
  (v) =>
    v === undefined || v === ""
      ? undefined
      : ["true", "1", "yes", "on"].includes(String(v).toLowerCase()),
  z.boolean().optional(),
);

const envSchema = z.object({
  ENCRYPTION_KEY: z.string().trim().length(64).default(
    // Fallback only for dev. 64 hex chars = 32 bytes
    "0000000000000000000000000000000000000000000000000000000000000000"
  ),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: optionalString,
  CLERK_SECRET_KEY: optionalString,
  CLERK_PUBLISHABLE_KEY: optionalString,
  CLIENT_URL: optionalUrl.default("http://localhost:3000"),
  OWNER_EMAIL: optionalString,
  GROQ_API_KEY: optionalString,
  GROQ_MODEL: optionalString.default("llama-3.3-70b-versatile"),
  GROQ_BASE_URL: optionalUrl.default("https://api.groq.com/openai/v1"),
  EMAIL_HOST: optionalString,
  EMAIL_PORT: optionalNumber,
  EMAIL_USER: optionalString,
  EMAIL_PASSWORD: optionalString,
  EMAIL_FROM: optionalString,
  EMAIL_TEST_MODE: booleanish.default(false),
  EMAIL_MIN_INTERVAL_MS: optionalNumber.default(1000),
  INNGEST_EVENT_KEY: optionalString,
  INNGEST_SIGNING_KEY: optionalString,
  INNGEST_BASE_URL: optionalUrl,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const data = parsed.data;

const isTest = data.NODE_ENV === "test";

/** Validate required vars at runtime (not during Vercel build bundling). */
export function assertRuntimeEnv(): void {
  if (isTest) return;

  const missing: string[] = [];
  if (!data.MONGODB_URI) missing.push("MONGODB_URI");
  if (!data.CLERK_SECRET_KEY) missing.push("CLERK_SECRET_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in the values.",
    );
  }
}

export const env = {
  encryptionKey: data.ENCRYPTION_KEY,
  nodeEnv: data.NODE_ENV,
  isProd: data.NODE_ENV === "production",
  isTest,
  port: data.PORT,
  mongodbUri: data.MONGODB_URI ?? "",
  clerkSecretKey: data.CLERK_SECRET_KEY ?? "",
  clerkPublishableKey: data.CLERK_PUBLISHABLE_KEY,
  clientUrl: data.CLIENT_URL,
  ownerEmail: data.OWNER_EMAIL,
  groqApiKey: data.GROQ_API_KEY,
  groqModel: data.GROQ_MODEL,
  groqBaseUrl: data.GROQ_BASE_URL,
  email: {
    host: data.EMAIL_HOST,
    port: data.EMAIL_PORT,
    user: data.EMAIL_USER,
    password: data.EMAIL_PASSWORD,
    from: data.EMAIL_FROM,
  },
  emailTestMode: data.EMAIL_TEST_MODE,
  emailMinIntervalMs: data.EMAIL_MIN_INTERVAL_MS,
  inngest: {
    eventKey: data.INNGEST_EVENT_KEY,
    signingKey: data.INNGEST_SIGNING_KEY,
    baseUrl: data.INNGEST_BASE_URL,
  },
} as const;