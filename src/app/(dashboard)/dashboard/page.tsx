import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TransactionStatus } from "@prisma/client";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeProducts, totalTx, pendingTx, successToday, recentTx] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: { in: [TransactionStatus.PROCESSING, TransactionStatus.PENDING] } } }),
    prisma.transaction.count({ where: { status: TransactionStatus.SUCCESS, createdAt: { gte: today } } }),
    prisma.transaction.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Produk Aktif", value: activeProducts, icon: "📦", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
    { label: "Total Transaksi", value: totalTx, icon: "📊", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Pending", value: pendingTx, icon: "⏳", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Sukses Hari Ini", value: successToday, icon: "✅", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">Selamat datang, <span className="text-brand-400 font-medium">{session?.user?.name}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`card border p-4 ${s.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-stone-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Transaction Form */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-500 rounded-full inline-block" />
            Transaksi Baru
          </h2>
          <TransactionForm />
        </div>

        {/* Recent Transactions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-brand-500 rounded-full inline-block" />
              Transaksi Terbaru
            </h2>
            <Link href="/transactions" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Lihat semua &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-stone-800/50 hover:bg-stone-800 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-200 truncate">{tx.product.name}</p>
                  <p className="text-xs text-stone-500 font-mono">{tx.customerNo}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <StatusBadge status={tx.status} />
                  <span className="text-xs text-stone-600">{new Date(tx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </Link>
            ))}
            {recentTx.length === 0 && (
              <div className="text-center py-8 text-stone-600">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}