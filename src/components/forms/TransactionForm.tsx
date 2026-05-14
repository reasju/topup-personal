"use client";
import { useState, useEffect } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  sellPrice: number;
  price: number;
  buyerSkuCode: string;
};

const CUSTOMER_HINTS: Record<string, string> = {
  "MOBILE LEGENDS": "Format: UserID+ServerID (contoh: 123456789 1234 : 1234567891234)",
  "Mobile Legend": "Format: UserID+ServerID (contoh: 123456789 1234 : 1234567891234)",
  "Mobile Legends": "Format: UserID+ServerID (contoh: 123456789 1234 : 1234567891234)",
  "Free Fire": "Masukkan UID Free Fire",
  "GoPay": "Masukkan nomor HP akun GoPay",
  "OVO": "Masukkan nomor HP akun OVO",
  "DANA": "Masukkan nomor HP akun DANA",
  "ShopeePay": "Masukkan nomor HP akun ShopeePay",
  "Pulsa": "Masukkan nomor HP tujuan",
  "Data": "Masukkan nomor HP tujuan",
};

function getHint(brand: string, category: string): string {
  const brandKey = Object.keys(CUSTOMER_HINTS).find((k) => k.toLowerCase() === brand.toLowerCase());
  const catKey = Object.keys(CUSTOMER_HINTS).find((k) => k.toLowerCase() === category.toLowerCase());
  return (brandKey ? CUSTOMER_HINTS[brandKey] : null) ?? (catKey ? CUSTOMER_HINTS[catKey] : null) ?? "Masukkan nomor/ID tujuan";
}

export function TransactionForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerNo, setCustomerNo] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; refId?: string; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const prods: Product[] = data.products ?? [];
        setProducts(prods);
        setCategories(Array.from(new Set(prods.map((p) => p.category))).sort());
      });
  }, []);

  useEffect(() => {
    if (!selectedCategory) { setBrands([]); setSelectedBrand(""); return; }
    const filtered = products.filter((p) => p.category === selectedCategory);
    setBrands(Array.from(new Set(filtered.map((p) => p.brand))).sort());
    setSelectedBrand("");
    setSelectedProduct(null);
  }, [selectedCategory, products]);

  useEffect(() => {
    if (!selectedBrand) { setFilteredProducts([]); setSelectedProduct(null); return; }
    setFilteredProducts(products.filter((p) => p.category === selectedCategory && p.brand === selectedBrand));
    setSelectedProduct(null);
  }, [selectedBrand, selectedCategory, products]);

  async function handleSubmit() {
    if (!selectedProduct || !customerNo.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id, customerNo: customerNo.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, refId: data.refId });
        setCustomerNo("");
        setSelectedProduct(null);
        setShowConfirm(false);
      } else {
        setResult({ error: data.error ?? "Transaksi gagal" });
        setShowConfirm(false);
      }
    } catch {
      setResult({ error: "Koneksi gagal" });
      setShowConfirm(false);
    }
    setLoading(false);
  }

  const hint = selectedBrand ? getHint(selectedBrand, selectedCategory) : "";

  return (
    <div className="space-y-3">
      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-stone-400 mb-1.5">Kategori</label>
        <select className="select" value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setResult(null); }}>
          <option value="">-- Pilih Kategori --</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Brand */}
      {selectedCategory && (
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5">Brand / Game</label>
          <select className="select" value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setResult(null); }}>
            <option value="">-- Pilih Brand --</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}

      {/* Product */}
      {selectedBrand && (
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5">Produk / Nominal</label>
          <select className="select" value={selectedProduct?.id ?? ""} onChange={(e) => { setSelectedProduct(filteredProducts.find((x) => x.id === e.target.value) ?? null); setResult(null); }}>
            <option value="">-- Pilih Produk --</option>
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — Rp {p.price.toLocaleString("id-ID")}</option>
            ))}
          </select>
        </div>
      )}

      {/* Customer No */}
      {selectedProduct && (
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1.5">Nomor / ID Tujuan</label>
          {hint && <p className="text-xs text-brand-500/80 mb-1.5 flex items-center gap-1"><span>ℹ️</span>{hint}</p>}
          <input type="text" className="input font-mono" value={customerNo} onChange={(e) => { setCustomerNo(e.target.value); setResult(null); }} placeholder={hint} />
        </div>
      )}

      {/* Submit */}
      {selectedProduct && customerNo.trim() && (
        <button onClick={() => setShowConfirm(true)} className="btn-primary w-full py-2.5">
          Proses Transaksi
        </button>
      )}

      {/* Result */}
      {result?.success && (
        <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <span className="text-green-400 text-lg">&#10003;</span>
          <div>
            <p className="text-green-400 text-sm font-medium">Transaksi berhasil dikirim</p>
            <p className="text-green-500/70 text-xs font-mono mt-0.5">Ref: {result.refId}</p>
          </div>
        </div>
      )}
      {result?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <span className="text-red-400">⚠️</span>
          <p className="text-red-400 text-sm">{result.error}</p>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card border border-stone-700 p-6 w-full max-w-sm shadow-gold">
            <h3 className="text-lg font-bold text-white mb-4">Konfirmasi Transaksi</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Produk</span>
                <span className="text-stone-200 font-medium text-right max-w-[60%]">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Tujuan</span>
                <span className="text-stone-200 font-mono">{customerNo}</span>
              </div>
              <div className="h-px bg-stone-800 my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total</span>
                <span className="text-brand-400 font-bold text-base">Rp {selectedProduct.price.toLocaleString("id-ID")}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Batal</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memproses...
                  </span>
                ) : "Ya, Proses"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}