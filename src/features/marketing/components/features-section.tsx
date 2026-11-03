"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n/context";
import { marketingTranslations } from "../copy";
import { Check, Keyboard } from "lucide-react";

export function FeaturesSection() {
  const { language } = useI18n();
  const copy = marketingTranslations[language].features;

  return (
    <section id="fitur" className="border-b-[3px] border-ink bg-paper px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header (No eyebrow per craft floor ban) */}
        <div className="max-w-3xl mb-14">
          <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ink/80 leading-relaxed font-sans">
            {copy.subtitle}
          </p>
        </div>

        {/* Feature 1: Walk-In Cashier (Split Card) */}
        <div className="mb-12 border-[3px] border-ink bg-white p-6 sm:p-8 lg:p-10 shadow-hard-lg">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <span className="inline-block border-[2px] border-ink bg-primary px-3 py-1 font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">
                {copy.f1Badge}
              </span>
              <h3 className="font-heading text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight mb-4">
                {copy.f1Title}
              </h3>
              <p className="text-base text-ink/85 leading-relaxed font-sans mb-6">
                {copy.f1Desc}
              </p>
              <ul className="space-y-3 font-mono text-xs text-ink/90">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#00e676] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f1Bullet1}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#00e676] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f1Bullet2}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#00e676] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f1Bullet3}</span>
                </li>
              </ul>
            </div>

            {/* Visual: Keyboard & Cashier Register UI */}
            <div className="lg:col-span-5 border-[3px] border-ink bg-[#f8f9fa] p-5 shadow-hard">
              <div className="flex items-center justify-between border-b-[2px] border-ink pb-2 mb-3 font-mono text-xs font-bold">
                <span className="flex items-center gap-1.5 text-ink">
                  <Keyboard className="h-4 w-4" /> SHORTCUT CEPAT
                </span>
                <span className="text-primary">F2 / ENTER</span>
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between border border-ink bg-white p-2">
                  <span className="text-ink/60">Cari Barang:</span>
                  <span className="font-bold">Kopi Kapal Api</span>
                </div>
                <div className="flex justify-between border border-ink bg-white p-2">
                  <span className="text-ink/60">Qty Jual:</span>
                  <span className="font-bold">5 sachet @ Rp 1.500</span>
                </div>
                <div className="flex justify-between border border-ink bg-white p-2">
                  <span className="text-ink/60">Subtotal:</span>
                  <span className="font-bold text-primary">Rp 7.500</span>
                </div>
                <div className="border-[2px] border-ink bg-[#00e676]/20 p-2.5 font-bold flex justify-between items-center">
                  <span>BAYAR TUNAI:</span>
                  <span className="text-sm">Rp 10.000</span>
                </div>
                <div className="p-2 border border-ink bg-ink text-white flex justify-between font-bold">
                  <span>KEMBALIAN:</span>
                  <span className="text-[#00e676]">Rp 2.500</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Stock Health & Low Stock Alerts (Reversed Split) */}
        <div className="mb-12 border-[3px] border-ink bg-white p-6 sm:p-8 lg:p-10 shadow-hard-lg">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Visual: Shelf Gauge & Thresholds */}
            <div className="order-2 lg:order-1 lg:col-span-5 border-[3px] border-ink bg-[#f8f9fa] p-5 shadow-hard">
              <div className="border-b-[2px] border-ink pb-2 mb-3 font-mono text-xs font-bold text-ink">
                DISTRIBUSI KESEHATAN RAK
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1 font-bold">
                    <span>Stok Aman (Di atas Minimum)</span>
                    <span className="text-[#008a3e]">82%</span>
                  </div>
                  <div className="h-4 w-full border border-ink bg-white p-0.5">
                    <div className="h-full bg-[#00e676] w-[82%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-bold">
                    <span>Stok Menipis (Perlu Restok)</span>
                    <span className="text-[#b36200]">12%</span>
                  </div>
                  <div className="h-4 w-full border border-ink bg-white p-0.5">
                    <div className="h-full bg-[#ff9100] w-[12%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-bold">
                    <span>Stok Habis (Rak Kosong)</span>
                    <span className="text-[#d50000]">6%</span>
                  </div>
                  <div className="h-4 w-full border border-ink bg-white p-0.5">
                    <div className="h-full bg-[#ff1744] w-[6%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Text details */}
            <div className="order-1 lg:order-2 lg:col-span-7">
              <span className="inline-block border-[2px] border-ink bg-[#ff9100] px-3 py-1 font-mono text-xs font-bold text-ink uppercase tracking-wider mb-4">
                {copy.f2Badge}
              </span>
              <h3 className="font-heading text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight mb-4">
                {copy.f2Title}
              </h3>
              <p className="text-base text-ink/85 leading-relaxed font-sans mb-6">
                {copy.f2Desc}
              </p>
              <ul className="space-y-3 font-mono text-xs text-ink/90">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#ff9100] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f2Bullet1}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#ff9100] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f2Bullet2}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#ff9100] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f2Bullet3}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature 3: Gross Profit & HPP Valuation (Wide Ledger Card) */}
        <div className="border-[3px] border-ink bg-white p-6 sm:p-8 lg:p-10 shadow-hard-lg">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <span className="inline-block border-[2px] border-ink bg-[#00e676] px-3 py-1 font-mono text-xs font-bold text-ink uppercase tracking-wider mb-4">
                {copy.f3Badge}
              </span>
              <h3 className="font-heading text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight mb-4">
                {copy.f3Title}
              </h3>
              <p className="text-base text-ink/85 leading-relaxed font-sans mb-6">
                {copy.f3Desc}
              </p>
              <ul className="space-y-3 font-mono text-xs text-ink/90">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#00e676] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f3Bullet1}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#00e676] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f3Bullet2}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center border border-ink bg-[#00e676] text-ink font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{copy.f3Bullet3}</span>
                </li>
              </ul>
            </div>

            {/* Visual: Real Cost & Margin Ledger */}
            <div className="lg:col-span-5 border-[3px] border-ink bg-ink p-5 text-white shadow-hard">
              <div className="border-b border-white/20 pb-2 mb-3 font-mono text-xs font-bold text-white/80">
                RUMUS LABA KOTOR OTOMATIS
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-white/10 p-3 border border-white/20">
                  <div className="text-white/60 text-[10px] uppercase">Modal Beli (HPP Masuk)</div>
                  <div className="text-lg font-bold text-white">Rp 2.800 <span className="text-xs font-normal text-white/60">/ bungkus</span></div>
                </div>
                <div className="bg-white/10 p-3 border border-white/20">
                  <div className="text-white/60 text-[10px] uppercase">Harga Jual Konsumen</div>
                  <div className="text-lg font-bold text-white">Rp 3.500 <span className="text-xs font-normal text-white/60">/ bungkus</span></div>
                </div>
                <div className="bg-[#00e676] p-3 text-ink font-black border border-white">
                  <div className="text-[10px] uppercase tracking-wider">Potensi Margin Kotor</div>
                  <div className="text-xl leading-tight">+Rp 700 (+25.0%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
