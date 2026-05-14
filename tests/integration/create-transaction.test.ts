import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionStatus } from "@prisma/client";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock digiflazz client
vi.mock("@/lib/digiflazz/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/digiflazz/client")>();
  return {
    ...actual,
    createDigiflazzClient: vi.fn(),
  };
});

import { prisma } from "@/lib/db";
import { createDigiflazzClient } from "@/lib/digiflazz/client";
import { createTransaction, DoubleSubmitError } from "@/lib/transaction/service";

const mockProduct = {
  id: "prod-1",
  buyerSkuCode: "MLBB-86",
  name: "ML 86 Diamond",
  sellPrice: 22000,
  isActive: true,
};

const mockDigiflazz = {
  topup: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createDigiflazzClient).mockReturnValue(mockDigiflazz as any);
  vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
  vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.transaction.create).mockResolvedValue({
    id: "tx-1",
    refId: "TXN-TEST-001",
  } as any);
  vi.mocked(prisma.transaction.update).mockResolvedValue({} as any);
});

describe("createTransaction", () => {
  it("creates transaction and calls Digiflazz on success", async () => {
    mockDigiflazz.topup.mockResolvedValue({
      ref_id: "TXN-TEST-001",
      customer_no: "123456789|1234",
      buyer_sku_code: "MLBB-86",
      message: "Sukses",
      status: "Sukses",
      rc: "00",
      sn: "SN123",
      price: 20000,
    });

    const result = await createTransaction({
      userId: "user-1",
      productId: "prod-1",
      customerNo: "123456789|1234",
    });

    expect(result.transactionId).toBe("tx-1");
    expect(prisma.transaction.create).toHaveBeenCalledOnce();
    expect(mockDigiflazz.topup).toHaveBeenCalledOnce();
    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TransactionStatus.SUCCESS }),
      }),
    );
  });

  it("sets status FAILED when Digiflazz returns error rc", async () => {
    const { DigiflazzError } = await import("@/lib/digiflazz/client");
    mockDigiflazz.topup.mockRejectedValue(
      new DigiflazzError("Gagal", "14", { data: { rc: "14", message: "Gagal" } }),
    );

    await expect(
      createTransaction({ userId: "user-1", productId: "prod-1", customerNo: "123456789" }),
    ).rejects.toThrow();

    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TransactionStatus.FAILED }),
      }),
    );
  });

  it("throws DoubleSubmitError when duplicate PROCESSING transaction exists", async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue({
      id: "tx-existing",
      refId: "TXN-EXISTING",
      status: TransactionStatus.PROCESSING,
    } as any);

    await expect(
      createTransaction({ userId: "user-1", productId: "prod-1", customerNo: "123456789" }),
    ).rejects.toThrow(DoubleSubmitError);

    expect(mockDigiflazz.topup).not.toHaveBeenCalled();
  });

  it("does NOT block when previous transaction is FAILED", async () => {
    // findFirst returns null (FAILED not in the query filter)
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);
    mockDigiflazz.topup.mockResolvedValue({
      ref_id: "TXN-TEST-002",
      customer_no: "123456789",
      buyer_sku_code: "MLBB-86",
      message: "Sukses",
      status: "Sukses",
      rc: "00",
      sn: "SN456",
    });

    const result = await createTransaction({
      userId: "user-1",
      productId: "prod-1",
      customerNo: "123456789",
    });
    expect(result.transactionId).toBeDefined();
  });

  it("throws when product is inactive", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ ...mockProduct, isActive: false } as any);
    await expect(
      createTransaction({ userId: "user-1", productId: "prod-1", customerNo: "123456789" }),
    ).rejects.toThrow("inactive");
  });
});