import * as React from "react";
import type { Metadata } from "next";
import { getOwnerSession } from "@/features/auth/server";
import { MarketingNavbar, MarketingFooter } from "@/features/marketing";

export const metadata: Metadata = {
  title: "StockOS | Sistem Manajemen Stok & Kasir Warung Kelontong",
  description:
    "Sistem stok dan kasir walk-in ringan untuk warung kelontong. Pantau stok menipis, catat transaksi harian, dan hitung potensi laba kotor otomatis.",
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOwnerSession();

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink selection:bg-primary selection:text-white">
      <MarketingNavbar isLoggedIn={!!user} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
