"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, ArrowLeft } from "lucide-react";

interface DemoBannerProps {
  onReset: () => void;
  activeTab: "kasir" | "stok" | "ringkasan";
  onTabChange: (tab: "kasir" | "stok" | "ringkasan") => void;
}

export function DemoBanner({ onReset, activeTab, onTabChange }: DemoBannerProps) {
  return (
    <div className="flex flex-col gap-3 border-[3px] border-ink bg-[#fff176] p-4 text-ink shadow-hard mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-[2px] border-ink/20 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center border-[2px] border-ink bg-ink text-white font-mono text-xs font-black">
            !
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-sm uppercase tracking-wide">
                Mode Demo Interaktif (Sandbox)
              </span>
              <span className="hidden font-mono text-[10px] font-bold uppercase bg-white px-2 py-0.5 border border-ink sm:inline-block">
                Nol Database
              </span>
            </div>
            <p className="font-sans text-xs text-ink/80">
              Data berjalan lokal di memori browser. Bebas uji transaksi tanpa merusak data asli.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="press inline-flex h-8 items-center gap-1.5 border-[2px] border-ink bg-white px-3 font-mono text-xs font-bold uppercase tracking-wider text-ink shadow-hard-sm hover:bg-neutral-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo</span>
          </button>
          <Link
            href="/"
            className="press inline-flex h-8 items-center gap-1.5 border-[2px] border-ink bg-ink px-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-hard-sm hover:bg-neutral-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Keluar Demo</span>
          </Link>
        </div>
      </div>

      {/* 3 Step Interactive Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => onTabChange("kasir")}
          className={`flex items-start gap-2 p-2 border-[2px] text-left transition-all ${
            activeTab === "kasir"
              ? "border-ink bg-white shadow-hard-sm"
              : "border-ink/20 bg-white/60 hover:bg-white"
          }`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-ink bg-primary text-white font-bold text-[10px]">
            1
          </span>
          <div>
            <span className="font-bold uppercase text-[11px] block">Langkah 1: Kasir Walk-in</span>
            <span className="text-[10px] text-ink/75">Klik produk di bawah untuk masukkan belanjaan ke struk.</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("kasir")}
          className={`flex items-start gap-2 p-2 border-[2px] text-left transition-all ${
            activeTab === "kasir"
              ? "border-ink bg-white shadow-hard-sm"
              : "border-ink/20 bg-white/60 hover:bg-white"
          }`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-ink bg-acid text-white font-bold text-[10px]">
            2
          </span>
          <div>
            <span className="font-bold uppercase text-[11px] block">Langkah 2: Rekonsiliasi</span>
            <span className="text-[10px] text-ink/75">Tekan Tutup Kasir di struk untuk simulasi potong stok.</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("stok")}
          className={`flex items-start gap-2 p-2 border-[2px] text-left transition-all ${
            activeTab === "stok" || activeTab === "ringkasan"
              ? "border-ink bg-white shadow-hard-sm"
              : "border-ink/20 bg-white/60 hover:bg-white"
          }`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-ink bg-ink text-white font-bold text-[10px]">
            3
          </span>
          <div>
            <span className="font-bold uppercase text-[11px] block">Langkah 3: Pantau Hasil</span>
            <span className="text-[10px] text-ink/75">Cek perubahan stok fisik dan potensi keuntungan otomatis.</span>
          </div>
        </button>
      </div>
    </div>
  );
}
