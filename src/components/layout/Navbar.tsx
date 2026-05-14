"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import type { Role } from "@prisma/client";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "⚡" },
  { href: "/products", label: "Produk", icon: "📦" },
  { href: "/transactions", label: "Transaksi", icon: "📋" },
];

interface NavbarUser {
  name?: string | null;
  username: string;
  role: Role;
}

export function Navbar({ user }: { user: NavbarUser }) {
  const pathname = usePathname();
  return (
    <nav className="bg-stone-900 border-b border-stone-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-stone-900 font-black text-sm">T</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">TopUp<span className="text-brand-400">Admin</span></span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-brand-500/20 text-brand-400"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-800",
                  )}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-stone-200">{user.name ?? user.username}</span>
            <span className="text-xs text-brand-400 font-semibold">{user.role}</span>
          </div>
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
            <span className="text-stone-900 font-bold text-sm">
              {(user.name ?? user.username).charAt(0).toUpperCase()}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-stone-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}