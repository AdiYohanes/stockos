import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { StockOSLogo } from "@/components/stockos-logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { DemoContainer } from "@/features/demo";
import { LogIn } from "lucide-react";

export const metadata: Metadata = {
  title: "Demo Kasir & Stok Warung | StockOS",
  description: "Uji coba langsung kasir kilat, rekonsiliasi harian, dan pantau stok warung tanpa registrasi.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Demo Header */}
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-card px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="flex h-8 w-8 items-center justify-center border-[2px] border-ink bg-primary text-primary-foreground shadow-hard-sm">
              <StockOSLogo size={16} aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-black tracking-tight text-ink uppercase leading-none">
                StockOS
              </span>
              <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-ink/75 mt-0.5">
                Terminal Demo
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/login"
              className="press inline-flex h-8 items-center justify-center gap-1.5 border-[2px] border-ink bg-white px-3 font-mono text-xs font-bold uppercase tracking-wider text-ink shadow-hard-sm hover:bg-neutral-100"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Masuk Pemilik</span>
              <span className="sm:hidden">Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Sandbox Interactive Experience */}
      <main className="flex-1">
        <DemoContainer />
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-ink bg-card px-4 py-4 font-mono text-[11px] text-ink/70">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2">
          <span>StockOS • Sistem Operasi Warung Tunggal</span>
          <span className="text-ink font-bold">Mode Sandbox (In-Memory Browser)</span>
        </div>
      </footer>
    </div>
  );
}
