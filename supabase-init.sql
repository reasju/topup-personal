-- Enums
CREATE TYPE "Role" AS ENUM (''OWNER'', ''OPERATOR'');
CREATE TYPE "TransactionStatus" AS ENUM (''PROCESSING'', ''PENDING'', ''SUCCESS'', ''FAILED'');

-- Users
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          "Role" NOT NULL DEFAULT ''OPERATOR'',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE products (
  id            TEXT PRIMARY KEY,
  sku           TEXT UNIQUE NOT NULL,
  "buyerSkuCode" TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  brand         TEXT NOT NULL,
  price         INTEGER NOT NULL,
  "sellPrice"   INTEGER NOT NULL,
  provider      TEXT NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_category_idx ON products(category);
CREATE INDEX products_brand_idx ON products(brand);
CREATE INDEX products_isActive_idx ON products("isActive");

-- Transactions
CREATE TABLE transactions (
  id               TEXT PRIMARY KEY,
  "refId"          TEXT UNIQUE NOT NULL,
  "userId"         TEXT NOT NULL REFERENCES users(id),
  "productId"      TEXT NOT NULL REFERENCES products(id),
  "customerNo"     TEXT NOT NULL,
  status           "TransactionStatus" NOT NULL DEFAULT ''PROCESSING'',
  amount           INTEGER NOT NULL,
  "providerPrice"  INTEGER,
  "serialNumber"   TEXT,
  "providerMessage" TEXT,
  rc               TEXT,
  "rawRequest"     JSONB,
  "rawResponse"    JSONB,
  "rawWebhook"     JSONB,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transactions_status_idx ON transactions(status);
CREATE INDEX transactions_createdAt_idx ON transactions("createdAt");
CREATE INDEX transactions_customerNo_idx ON transactions("customerNo");
CREATE INDEX transactions_product_customer_status_idx ON transactions("productId", "customerNo", status);

-- Webhook Events
CREATE TABLE webhook_events (
  id            TEXT PRIMARY KEY,
  "refId"       TEXT NOT NULL,
  event         TEXT NOT NULL,
  payload       JSONB NOT NULL,
  "processedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_events_refId_idx ON webhook_events("refId");

-- Sync Logs
CREATE TABLE sync_logs (
  id            TEXT PRIMARY KEY,
  status        TEXT NOT NULL,
  message       TEXT,
  "syncedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prisma migrations table (required by Prisma)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  id                  TEXT PRIMARY KEY,
  checksum            TEXT NOT NULL,
  finished_at         TIMESTAMPTZ,
  migration_name      TEXT NOT NULL,
  logs                TEXT,
  rolled_back_at      TIMESTAMPTZ,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
);