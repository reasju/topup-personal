"use client";
import { useState } from "react";
import type { Product } from "@prisma/client";

export function ProductsClient({ products, isOwner }: { products: Product[]; isOwner: boolean }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  const filtered = products.filter((p) => {
    const matchCat = !filterCategory || p.category === filterCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.buyerSkuCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.isActive : !p.isActive);
    return matchCat && matchSearch && matchStatus;
  });

  async function saveSellPrice(id: string) {
    const price = parseInt(editPrice);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sellPrice: price }),
    });
    setSaving(false);
    setEditId(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari produk..."
            className="input pl-9 w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select w-44" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex rounded-xl overflow-hidden border border-stone-700">
          {[["active", "Aktif"], ["inactive", "Nonaktif"], ["all", "Semua"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                filterStatus === val
                  ? "bg-brand-500 text-stone-900"
                  : "bg-stone-800 text-stone-400 hover:text-stone-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-500 ml-auto">{filtered.length} produk</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Modal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Jual</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                {isOwner && <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-stone-400">{p.buyerSkuCode}</td>
                  <td className="px-4 py-3 text-stone-200 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-stone-400">{p.category}</td>
                  <td className="px-4 py-3 text-stone-400">{p.brand}</td>
                  <td className="px-4 py-3 text-stone-400">Rp {p.price.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">
                    {editId === p.id ? (
                      <input type="number" className="input w-28 py-1" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} autoFocus />
                    ) : (
                      <span className="text-brand-400 font-semibold">Rp {p.sellPrice.toLocaleString("id-ID")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.isActive
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "bg-stone-700/50 text-stone-500 border border-stone-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-green-400" : "bg-stone-500"}`} />
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3">
                      {editId === p.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveSellPrice(p.id)} disabled={saving} className="text-xs bg-brand-500 hover:bg-brand-400 text-stone-900 font-semibold px-2.5 py-1 rounded-lg disabled:opacity-60 transition-colors">
                            {saving ? "..." : "Simpan"}
                          </button>
                          <button onClick={() => setEditId(null)} className="text-xs btn-secondary px-2.5 py-1">Batal</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditId(p.id); setEditPrice(String(p.sellPrice)); }} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                          Edit Harga
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-stone-500 text-sm">Tidak ada produk</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}