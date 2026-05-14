import { TransactionStatus } from "@prisma/client";

const STATUS_MAP: Record<string, TransactionStatus> = {
  Sukses: TransactionStatus.SUCCESS,
  sukses: TransactionStatus.SUCCESS,
  success: TransactionStatus.SUCCESS,
  SUCCESS: TransactionStatus.SUCCESS,
  Pending: TransactionStatus.PENDING,
  pending: TransactionStatus.PENDING,
  PENDING: TransactionStatus.PENDING,
  Gagal: TransactionStatus.FAILED,
  gagal: TransactionStatus.FAILED,
  failed: TransactionStatus.FAILED,
  FAILED: TransactionStatus.FAILED,
};

export function mapDigiflazzStatus(raw: string): TransactionStatus {
  return STATUS_MAP[raw] ?? TransactionStatus.PENDING;
}

// Allowed transitions: PROCESSING->any, PENDING->SUCCESS|FAILED, SUCCESS/FAILED->nothing
export function isValidTransition(
  current: TransactionStatus,
  next: TransactionStatus,
): boolean {
  if (current === TransactionStatus.SUCCESS || current === TransactionStatus.FAILED) {
    return false; // final states
  }
  if (current === TransactionStatus.PENDING) {
    return next === TransactionStatus.SUCCESS || next === TransactionStatus.FAILED;
  }
  return true; // PROCESSING -> anything
}
