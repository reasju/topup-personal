import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    DIGIFLAZZ_USERNAME: z.string().min(1),
    DIGIFLAZZ_API_KEY: z.string().min(1),
    DIGIFLAZZ_WEBHOOK_SECRET: z.string().min(1),
    DIGIFLAZZ_BASE_URL: z.string().url().default("https://api.digiflazz.com/v1"),
    DIGIFLAZZ_TESTING: z.enum(["true", "false"]).default("false"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DIGIFLAZZ_USERNAME: process.env.DIGIFLAZZ_USERNAME,
    DIGIFLAZZ_API_KEY: process.env.DIGIFLAZZ_API_KEY,
    DIGIFLAZZ_WEBHOOK_SECRET: process.env.DIGIFLAZZ_WEBHOOK_SECRET,
    DIGIFLAZZ_BASE_URL: process.env.DIGIFLAZZ_BASE_URL,
    DIGIFLAZZ_TESTING: process.env.DIGIFLAZZ_TESTING,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
