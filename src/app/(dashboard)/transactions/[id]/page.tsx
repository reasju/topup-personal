import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckStatusButton } from "@/components/ui/CheckStatusButton";
import { TransactionStatus } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  await auth();
  const tx = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      user: { select: { name: true, username: true } },
    },
  });
  if (!tx) notFound();

  const canCheck = tx.status === TransactionStatus.PROCESSING || tx.status === TransactionStatus.PENDING;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Back */}
      <Link href="/transactions" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-400 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Riwayat Transaksi
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-white">Detail Transaksi</h1>
            <p className="text-stone-500 font-mono text-xs mt-1">{tx.refId}</p>
          </div>
          <StatusBadge status={tx.status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Produk", value: tx.product.name, mono: false },
            { label: "SKU", value: tx.product.buyerSkuCode, mono: true },
            { label: "No. Tujuan", value: tx.customerNo, mono: true },
            { label: "Kasir", value: `${tx.user.name} (${tx.user.username})`, mono: false },
            { label: "Harga Jual", value: `Rp ${tx.amount.toLocaleString("id-ID")}`, mono: false },
            { label: "Harga Provider", value: tx.providerPrice ? `Rp ${tx.providerPrice.toLocaleString("id-ID")}` : "-", mono: false },
            { label: "Serial Number", value: tx.serialNumber || "-", mono: true },
            { label: "RC", value: tx.rc || "-", mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="bg-stone-800/50 rounded-xl p-3">
              <p className="text-xs text-stone-500 mb-1">{label}</p>
              <p className={`text-sm text-stone-200 font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
            </div>
          ))}
          <div className="col-span-2 bg-stone-800/50 rounded-xl p-3">
            <p className="text-xs text-stone-500 mb-1">Pesan Provider</p>
            <p className="text-sm text-stone-200">{tx.providerMessage || "-"}</p>
          </div>
          <div className="bg-stone-800/50 rounded-xl p-3">
            <p className="text-xs text-stone-500 mb-1">Dibuat</p>
            <p className="text-sm text-stone-200">{new Date(tx.createdAt).toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-stone-800/50 rounded-xl p-3">
            <p className="text-xs text-stone-500 mb-1">Diperbarui</p>
            <p className="text-sm text-stone-200">{new Date(tx.updatedAt).toLocaleString("id-ID")}</p>
          </div>
        </div>

        {canCheck && (
          <div className="mt-4 pt-4 border-t border-stone-800">
            <CheckStatusButton transactionId={tx.id} />
          </div>
        )}
      </div>

      {/* Raw Response */}
      {tx.rawResponse && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Raw Response</p>
          <pre className="text-xs text-stone-400 bg-stone-950 rounded-xl p-4 overflow-x-auto">{JSON.stringify(tx.rawResponse, null, 2)}</pre>
        </div>
      )}

      {/* Raw Webhook */}
      {tx.rawWebhook && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Raw Webhook</p>
          <pre className="text-xs text-stone-400 bg-stone-950 rounded-xl p-4 overflow-x-auto">{JSON.stringify(tx.rawWebhook, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}