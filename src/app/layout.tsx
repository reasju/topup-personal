import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopUp Admin",
  description: "Internal top-up management console",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}