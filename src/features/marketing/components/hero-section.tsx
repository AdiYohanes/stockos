"use client";

import * as React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { marketingTranslations } from "../copy";
import { ArrowDown, Calculator, CheckCircle2, AlertTriangle } from "lucide-react";

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  const { language } = useI18n();
  const copy = marketingTranslations[language].hero;

  return (
    <section className="relative overflow-hidden border-b-[3px] border-ink bg-paper px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      {/* Background Dot Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid-dots opacity-25"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.05]">
              {copy.title}
            </h1>

            <p className="max-w-2xl text-base text-ink/85 sm:text-lg leading-relaxed font-sans">
              {copy.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="press inline-flex h-12 items-center justify-center gap-3 border-[3px] border-ink bg-primary px-6 font-mono text-sm font-bold uppercase tracking-wider text-white shadow-hard hover:brightness-105"
                >
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  <span>{copy.dashboardCta}</span>
                </Link>
              ) : (
                <Link
                  href="/demo"
                  className="press inline-flex h-12 items-center justify-center gap-3 border-[3px] border-ink bg-primary px-6 font-mono text-sm font-bold uppercase tracking-wider text-white shadow-hard hover:brightness-105"
                >
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  <span>{copy.primaryCta}</span>
                </Link>
              )}

              <a
                href="#fitur"
                className="press inline-flex h-12 items-center justify-center gap-2 border-[3px] border-ink bg-white px-6 font-mono text-sm font-bold uppercase tracking-wider text-ink shadow-hard hover:bg-neutral-50"
              >
                <span>{copy.secondaryCta}</span>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            {/* Real Operational Footprint */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t-[2px] border-ink/20 font-mono text-xs text-ink/75">
              <span className="flex items-center gap-1.5 font-bold text-ink">
                <CheckCircle2 className="h-4 w-4 text-[#00e676]" aria-hidden="true" />
                Nol Biaya Mesin POS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-bold text-ink">
                <CheckCircle2 className="h-4 w-4 text-[#00e676]" aria-hidden="true" />
                Browser & HP Ready
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-bold text-ink">
                <CheckCircle2 className="h-4 w-4 text-[#00e676]" aria-hidden="true" />
                Otomatis Hitung HPP
              </span>
            </div>
          </div>

          {/* Right Column: Tactile Neo-Brutalist UI Preview */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md border-[3px] border-ink bg-white p-5 shadow-hard-lg">
              {/* Terminal Window Header Bar */}
              <div className="mb-4 flex items-center justify-between border-b-[3px] border-ink pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 border-[2px] border-ink bg-[#ff1744]" />
                  <span className="h-3 w-3 border-[2px] border-ink bg-[#ff9100]" />
                  <span className="h-3 w-3 border-[2px] border-ink bg-[#00e676]" />
                </div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
                  KASIR MEJA DEPAN • LIVE
                </div>
              </div>

              {/* Receipt / Register Slip */}
              <div className="border-[2px] border-dashed border-ink bg-[#fffef2] p-4 font-mono text-xs mb-4">
                <div className="flex items-center justify-between border-b border-ink/30 pb-2 mb-2 font-bold text-[11px]">
                  <span>STRUK #KSR-042</span>
                  <span className="text-ink/60">08:45 WIB</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span>2x Indomie Goreng</span>
                    <span className="font-bold">Rp 7.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Minyak Bimoli 1L</span>
                    <span className="font-bold">Rp 21.000</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-ink/40 space-y-1">
                  <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL BELANJA</span>
                    <span className="text-primary">Rp 28.000</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-ink/70">
                    <span>TUNAI DITERIMA</span>
                    <span>Rp 50.000</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs bg-[#00e676]/20 p-1 border border-ink/40">
                    <span>KEMBALIAN</span>
                    <span className="font-extrabold text-[#00a34c]">Rp 22.000</span>
                  </div>
                </div>
              </div>

              {/* Shelf Status Snapshot */}
              <div className="border-[2px] border-ink bg-white p-3 font-mono text-xs">
                <div className="flex items-center justify-between font-bold text-[10px] text-ink/70 uppercase tracking-wider mb-2">
                  <span>Pantauan Stok Rak</span>
                  <span className="text-primary font-bold">MUTASI OTOMATIS</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-ink/10 pb-1.5">
                    <div>
                      <div className="font-bold">Minyak Bimoli 1L</div>
                      <div className="text-[10px] text-ink/60">Sisa 3 btl (Min 6 btl)</div>
                    </div>
                    <span className="flex items-center gap-1 border border-ink bg-[#ff9100]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#b36200]">
                      <AlertTriangle className="h-3 w-3" />
                      MENIPIS
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">Telur Ayam Negeri</div>
                      <div className="text-[10px] text-ink/60">Sisa 15 kg (Min 5 kg)</div>
                    </div>
                    <span className="border border-ink bg-[#00e676]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#008a3e]">
                      AMAN
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
