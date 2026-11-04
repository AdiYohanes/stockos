"use client";

import * as React from "react";
import Link from "next/link";
import { StockOSLogo } from "@/components/stockos-logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useI18n } from "@/lib/i18n/context";
import { marketingTranslations } from "../copy";
import { Menu, X, LayoutDashboard, LogIn } from "lucide-react";

interface MarketingNavbarProps {
  isLoggedIn: boolean;
}

export function MarketingNavbar({ isLoggedIn }: MarketingNavbarProps) {
  const { language } = useI18n();
  const copy = marketingTranslations[language].nav;
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b-[3px] border-ink bg-card px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="flex h-10 w-10 items-center justify-center border-[3px] border-ink bg-primary text-primary-foreground shadow-hard-sm">
            <StockOSLogo size={20} aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-black tracking-tight text-ink uppercase leading-none">
              StockOS
            </span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/75 mt-0.5">
              Terminal Warung
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-6 lg:gap-8 font-mono text-xs font-bold uppercase tracking-wider"
        >
          <a
            href="#fitur"
            className="text-ink/80 hover:text-ink transition-colors hover:underline underline-offset-4 decoration-2"
          >
            {copy.features}
          </a>
          <a
            href="#kalkulator"
            className="text-ink/80 hover:text-ink transition-colors hover:underline underline-offset-4 decoration-2"
          >
            {copy.simulator}
          </a>
          <a
            href="#faq"
            className="text-ink/80 hover:text-ink transition-colors hover:underline underline-offset-4 decoration-2"
          >
            {copy.faq}
          </a>
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageToggle />
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="press inline-flex h-10 items-center justify-center gap-2 border-[3px] border-ink bg-primary px-4 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-hard-sm hover:brightness-105"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span>{copy.dashboard}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/demo"
                className="press inline-flex h-10 items-center justify-center gap-2 border-[3px] border-ink bg-primary px-4 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-hard-sm hover:brightness-105"
              >
                <span>{copy.demo}</span>
              </Link>
              <Link
                href="/login"
                className="press inline-flex h-10 items-center justify-center gap-1.5 border-[2px] border-ink/40 bg-white px-3 font-mono text-xs font-bold uppercase tracking-wider text-ink shadow-hard-sm hover:bg-neutral-100"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copy.login}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="flex h-10 w-10 items-center justify-center border-[3px] border-ink bg-card text-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t-[3px] border-ink bg-card p-4 md:hidden"
        >
          <nav className="flex flex-col gap-3 font-mono text-xs font-bold uppercase tracking-wider">
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="border-[2px] border-ink/20 p-2.5 text-ink hover:bg-muted"
            >
              {copy.features}
            </a>
            <a
              href="#kalkulator"
              onClick={() => setMobileMenuOpen(false)}
              className="border-[2px] border-ink/20 p-2.5 text-ink hover:bg-muted"
            >
              {copy.simulator}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="border-[2px] border-ink/20 p-2.5 text-ink hover:bg-muted"
            >
              {copy.faq}
            </a>
            <div className="pt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-primary p-3 font-mono text-xs font-bold uppercase text-white shadow-hard-sm"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  <span>{copy.dashboard}</span>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/demo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-primary p-3 font-mono text-xs font-bold uppercase text-white shadow-hard-sm"
                  >
                    <span>{copy.demo}</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 border-[2px] border-ink/40 bg-white p-2.5 font-mono text-xs font-bold uppercase text-ink shadow-hard-sm"
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    <span>{copy.login}</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
