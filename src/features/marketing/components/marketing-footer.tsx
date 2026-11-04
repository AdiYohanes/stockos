"use client";

import * as React from "react";
import Link from "next/link";
import { StockOSLogo } from "@/components/stockos-logo";
import { useI18n } from "@/lib/i18n/context";
import { marketingTranslations } from "../copy";

export function MarketingFooter() {
  const { language } = useI18n();
  const copy = marketingTranslations[language].footer;
  const navCopy = marketingTranslations[language].nav;

  return (
    <footer className="border-t-[3px] border-ink bg-ink text-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start">
          {/* Brand & Purpose */}
          <div className="md:col-span-6 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
            >
              <div className="flex h-11 w-11 items-center justify-center border-[3px] border-white bg-primary text-white shadow-hard-sm">
                <StockOSLogo size={22} aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-xl font-black uppercase tracking-tight text-white leading-none">
                  StockOS
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00e676] mt-1">
                  Terminal Warung
                </span>
              </div>
            </Link>

            <p className="max-w-md font-sans text-sm text-white/80 leading-relaxed">
              {copy.tagline}
            </p>

            <div className="inline-block border-[2px] border-white/40 bg-white/10 px-3 py-1 font-mono text-[10px] font-bold text-white uppercase tracking-wider">
              {copy.architectureBadge}
            </div>
          </div>

          {/* Quick Nav (Content-driven, NOT generic 4-column slop) */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#00e676]">
              {copy.linksTitle}
            </div>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <a
                  href="#fitur"
                  className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {navCopy.features}
                </a>
              </li>
              <li>
                <a
                  href="#kalkulator"
                  className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {navCopy.simulator}
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {navCopy.faq}
                </a>
              </li>
            </ul>
          </div>

          {/* Terminal Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#00e676]">
              {copy.operationsTitle}
            </div>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {navCopy.login}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {navCopy.dashboard}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-white/60">
          <div>© {new Date().getFullYear()} StockOS. {copy.copyright}</div>
          <div>{copy.disclaimer}</div>
        </div>
      </div>
    </footer>
  );
}
