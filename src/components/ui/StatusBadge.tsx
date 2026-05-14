import { TransactionStatus } from "@prisma/client";
import clsx from "clsx";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  PROCESSING: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  PENDING:    "bg-brand-500/15 text-brand-400 border border-brand-500/20",
  SUCCESS:    "bg-green-500/15 text-green-400 border border-green-500/20",
  FAILED:     "bg-red-500/15 text-red-400 border border-red-500/20",
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PROCESSING: "Processing",
  PENDING:    "Pending",
  SUCCESS:    "Sukses",
  FAILED:     "Gagal",
};

const STATUS_DOTS: Record<TransactionStatus, string> = {
  PROCESSING: "bg-blue-400",
  PENDING:    "bg-brand-400",
  SUCCESS:    "bg-green-400",
  FAILED:     "bg-red-400",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_STYLES[status])}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOTS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}