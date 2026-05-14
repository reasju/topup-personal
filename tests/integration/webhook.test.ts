import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { TransactionStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    webhookEvent: { create: vi.fn() },
    transaction: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/digiflazz/webhook";
import { mapDigiflazzStatus, isValidTransition } from "@/lib/transaction/status-mapper";

const SECRET = "test-secret";

function makeBody(data: object): string {
  return JSON.stringify({ data });
}

function makeSig(body: string): string {
  return "sha1=" + crypto.createHmac("sha1", SECRET).update(body).digest("hex");
}

describe("Webhook processing logic", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies valid signature", () => {
    const body = makeBody({ ref_id: "TXN-1", status: "Sukses", rc: "00", message: "OK", customer_no: "123", buyer_sku_code: "SKU" });
    expect(verifyWebhookSignature(body, makeSig(body), SECRET)).toBe(true);
  });

  it("rejects invalid signature", () => {
    const body = makeBody({ ref_id: "TXN-1" });
    expect(verifyWebhookSignature(body, "sha1=badhash", SECRET)).toBe(false);
  });

  it("updates PROCESSING->SUCCESS on Sukses webhook", async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({
      id: "tx-1",
      refId: "TXN-1",
      status: TransactionStatus.PROCESSING,
    } as any);
    vi.mocked(prisma.transaction.update).mockResolvedValue({} as any);
    vi.mocked(prisma.webhookEvent.create).mockResolvedValue({} as any);

    const newStatus = mapDigiflazzStatus("Sukses");
    const canTransition = isValidTransition(TransactionStatus.PROCESSING, newStatus);
    expect(canTransition).toBe(true);
    expect(newStatus).toBe(TransactionStatus.SUCCESS);
  });

  it("does NOT update SUCCESS->FAILED (idempotent final state)", () => {
    const newStatus = mapDigiflazzStatus("Gagal");
    const canTransition = isValidTransition(TransactionStatus.SUCCESS, newStatus);
    expect(canTransition).toBe(false);
  });

  it("does NOT update PENDING->PENDING", () => {
    const newStatus = mapDigiflazzStatus("Pending");
    const canTransition = isValidTransition(TransactionStatus.PENDING, newStatus);
    expect(canTransition).toBe(false);
  });

  it("updates PENDING->SUCCESS", () => {
    const newStatus = mapDigiflazzStatus("Sukses");
    const canTransition = isValidTransition(TransactionStatus.PENDING, newStatus);
    expect(canTransition).toBe(true);
  });
});