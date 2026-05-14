import { describe, it, expect } from "vitest";
import { mapDigiflazzStatus, isValidTransition } from "@/lib/transaction/status-mapper";
import { TransactionStatus } from "@prisma/client";

describe("mapDigiflazzStatus", () => {
  it.each([
    ["Sukses", TransactionStatus.SUCCESS],
    ["sukses", TransactionStatus.SUCCESS],
    ["success", TransactionStatus.SUCCESS],
    ["SUCCESS", TransactionStatus.SUCCESS],
    ["Pending", TransactionStatus.PENDING],
    ["pending", TransactionStatus.PENDING],
    ["PENDING", TransactionStatus.PENDING],
    ["Gagal", TransactionStatus.FAILED],
    ["gagal", TransactionStatus.FAILED],
    ["failed", TransactionStatus.FAILED],
    ["FAILED", TransactionStatus.FAILED],
  ])("maps %s -> %s", (raw, expected) => {
    expect(mapDigiflazzStatus(raw)).toBe(expected);
  });

  it("defaults unknown status to PENDING", () => {
    expect(mapDigiflazzStatus("unknown")).toBe(TransactionStatus.PENDING);
    expect(mapDigiflazzStatus("")).toBe(TransactionStatus.PENDING);
  });
});

describe("isValidTransition", () => {
  it("PROCESSING can transition to any status", () => {
    expect(isValidTransition(TransactionStatus.PROCESSING, TransactionStatus.SUCCESS)).toBe(true);
    expect(isValidTransition(TransactionStatus.PROCESSING, TransactionStatus.FAILED)).toBe(true);
    expect(isValidTransition(TransactionStatus.PROCESSING, TransactionStatus.PENDING)).toBe(true);
  });

  it("PENDING can only go to SUCCESS or FAILED", () => {
    expect(isValidTransition(TransactionStatus.PENDING, TransactionStatus.SUCCESS)).toBe(true);
    expect(isValidTransition(TransactionStatus.PENDING, TransactionStatus.FAILED)).toBe(true);
    expect(isValidTransition(TransactionStatus.PENDING, TransactionStatus.PROCESSING)).toBe(false);
    expect(isValidTransition(TransactionStatus.PENDING, TransactionStatus.PENDING)).toBe(false);
  });

  it("SUCCESS is a final state", () => {
    expect(isValidTransition(TransactionStatus.SUCCESS, TransactionStatus.FAILED)).toBe(false);
    expect(isValidTransition(TransactionStatus.SUCCESS, TransactionStatus.PENDING)).toBe(false);
    expect(isValidTransition(TransactionStatus.SUCCESS, TransactionStatus.PROCESSING)).toBe(false);
  });

  it("FAILED is a final state", () => {
    expect(isValidTransition(TransactionStatus.FAILED, TransactionStatus.SUCCESS)).toBe(false);
    expect(isValidTransition(TransactionStatus.FAILED, TransactionStatus.PENDING)).toBe(false);
    expect(isValidTransition(TransactionStatus.FAILED, TransactionStatus.PROCESSING)).toBe(false);
  });
});