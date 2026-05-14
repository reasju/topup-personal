import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TransactionStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUSES = ["ALL", "PROCESSING", "PENDING", "SUCCESS", "FAILED"] as const;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await auth();
  const status = searchParams.status as TransactionStatus | undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;
  const where = status && Object.values(TransactionStatus).includes(status) ? { status } : {};

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        product: { select: { name: true, category: true } },
        user: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Riwayat Transaksi</h1>
        <p className="text-stone-500 text-sm mt-1">{total} total transaksi</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const active = (s === "ALL" && !status) || s === status;
          const href = s === "ALL" ? "/transactions" : `/transactions?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active
                  ? "bg-brand-500 text-stone-900"
                  : "bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-700"
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Ref ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">No. Tujuan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Harga</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">SN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/transactions/${tx.id}`} className="text-brand-400 hover:text-brand-300 font-mono text-xs transition-colors">
                      {tx.refId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-200">{tx.product.name}</td>
                  <td className="px-4 py-3 font-mono text-stone-300">{tx.customerNo}</td>
                  <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                  <td className="px-4 py-3 text-brand-400 font-semibold">Rp {tx.amount.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{tx.serialNumber ?? "-"}</td>
                  <td className="px-4 py-3 text-stone-400">{tx.user.name}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-stone-500 text-sm">Tidak ada transaksi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/transactions?${status ? `status=${status}&` : ""}page=${p}`}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                p === page
                  ? "bg-brand-500 text-stone-900"
                  : "bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}