"use client";

import * as React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { marketingTranslations } from "../copy";
import { formatNumber } from "@/lib/format";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface ValueCalculatorProps {
  isLoggedIn: boolean;
}

const PRESET_VALUES = [
  { label: "Rp 1 Juta", value: 1000000 },
  { label: "Rp 2,5 Juta", value: 2500000 },
  { label: "Rp 5 Juta", value: 5000000 },
  { label: "Rp 10 Juta", value: 10000000 },
];

export function ValueCalculator({ isLoggedIn }: ValueCalculatorProps) {
  const { language } = useI18n();
  const copy = marketingTranslations[language].simulator;
  const [dailyTurnover, setDailyTurnover] = React.useState<number>(3000000);

  // Conservative 3% retail leakage metric
  const dailyPreserved = Math.round(dailyTurnover * 0.03);
  const monthlyPreserved = dailyPreserved * 30;

  return (
    <section id="kalkulator" className="border-b-[3px] border-ink bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Section Header (No eyebrow per craft floor ban) */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ink/80 leading-relaxed font-sans">
            {copy.subtitle}
          </p>
        </div>

        {/* Interactive Simulator Box */}
        <div className="border-[3px] border-ink bg-[#fffef2] p-6 sm:p-10 shadow-hard-lg">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label htmlFor="turnover-slider" className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                    {copy.dailyTurnover}
                  </label>
                  <span className="font-mono text-lg sm:text-xl font-black text-primary">
                    Rp {formatNumber(dailyTurnover)}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  id="turnover-slider"
                  type="range"
                  min={500000}
                  max={15000000}
                  step={250000}
                  value={dailyTurnover}
                  onChange={(e) => setDailyTurnover(Number(e.target.value))}
                  className="h-3 w-full border-[2px] border-ink bg-white accent-primary cursor-pointer"
                  aria-label={copy.dailyTurnover}
                />
              </div>

              {/* Quick Presets */}
              <div>
                <div className="font-mono text-[11px] font-bold text-ink/60 uppercase tracking-wider mb-2">
                  Pilih Cepat Estimasi Omzet:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_VALUES.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setDailyTurnover(preset.value)}
                      className={`border-[2px] border-ink p-2 font-mono text-xs font-bold transition-all cursor-pointer ${
                        dailyTurnover === preset.value
                          ? "bg-primary text-white shadow-hard-sm"
                          : "bg-white text-ink hover:bg-neutral-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="border-l-[3px] border-ink bg-white p-3 font-mono text-[11px] text-ink/75 leading-relaxed">
                {copy.calculationNote}
              </p>
            </div>

            {/* Calculated Output Card */}
            <div className="lg:col-span-5 border-[3px] border-ink bg-ink p-6 text-white shadow-hard">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00e676] uppercase tracking-wider mb-4">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>MODAL TERSELAMATKAN</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[10px] uppercase text-white/60">
                    Estimasi Cegah Bocor Harian (3%)
                  </div>
                  <div className="font-mono text-xl font-bold text-white">
                    Rp {formatNumber(dailyPreserved)} <span className="text-xs font-normal text-white/60">/ hari</span>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <div className="font-mono text-[10px] uppercase text-white/60">
                    {copy.monthlyPreserved}
                  </div>
                  <div className="font-heading text-3xl sm:text-4xl font-black text-[#00e676] leading-none mt-1">
                    Rp {formatNumber(monthlyPreserved)}
                  </div>
                  <div className="font-mono text-[11px] text-white/70 mt-1">
                    per bulan tetap di kantong warung
                  </div>
                </div>

                <div className="pt-2">
                  {isLoggedIn ? (
                    <Link
                      href="/dashboard"
                      className="press flex w-full items-center justify-center gap-2 border-[2px] border-white bg-primary p-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-hard-sm hover:brightness-105"
                    >
                      <span>Buka Dashboard Warung</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="press flex w-full items-center justify-center gap-2 border-[2px] border-white bg-primary p-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-hard-sm hover:brightness-105"
                    >
                      <span>Kunci Margin di StockOS</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
