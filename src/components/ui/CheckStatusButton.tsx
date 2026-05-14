"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckStatusButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleCheck() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/check-status`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `Status terbaru: ${data.status}`, ok: true });
        router.refresh();
      } else {
        setMsg({ text: `Error: ${data.error}`, ok: false });
      }
    } catch {
      setMsg({ text: "Koneksi gagal", ok: false });
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCheck}
        disabled={loading}
        className="flex items-center gap-2 bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-400 font-semibold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Mengecek...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Cek Status
          </>
        )}
      </button>
      {msg && (
        <span className={`text-xs px-3 py-1.5 rounded-lg border ${
          msg.ok
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>{msg.text}</span>
      )}
    </div>
  );
}