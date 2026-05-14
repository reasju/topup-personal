import { vi } from "vitest";

// Prevent env validation from running in tests
process.env.SKIP_ENV_VALIDATION = "true";
process.env.DIGIFLAZZ_USERNAME = "test-user";
process.env.DIGIFLAZZ_API_KEY = "test-key";
process.env.DIGIFLAZZ_WEBHOOK_SECRET = "test-secret";
process.env.DIGIFLAZZ_BASE_URL = "http://localhost:9999";
process.env.DIGIFLAZZ_TESTING = "true";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-chars-long!!";