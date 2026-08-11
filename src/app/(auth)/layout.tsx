import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { StockOSLogo } from "@/components/stockos-logo";

export const metadata: Metadata = {
  title: {
    template: "%s | StockOS",
    default: "Authentication | StockOS",
  },
};

/**
 * Hybrid Neo-SaaS Authentication Layout (70% Clean SaaS + 30% Neobrutalism)
 * - Clean neutral canvas background (#f8f9fa)
 * - Flat pure-white containers with 1px border (#e2e8f0) and shadow-neo accents
 * - Electric purple primary accent (#543afd)
 * - Space Grotesk headings + Space Mono badge tags
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground selection:bg-[#543afd] selection:text-white">
      {/* Top Header Bar */}
      <header className="relative z-20 w-full border-b border-border bg-white py-3 px-4 sm:px-6">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-foreground transition-opacity hover:opacity-85"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-primary text-white shadow-neo-sm">
              <StockOSLogo size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-bold tracking-tight text-foreground">StockOS</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Inventory ERP</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-black bg-[#dcfce7] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#15803d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#15803d] animate-pulse" />
              Core Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Split Grid Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        
        {/* 2-Column Responsive Layout */}
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Visual Showcase (Clean SaaS + Neo Accent) */}
          <div className="hidden lg:col-span-6 xl:col-span-7 lg:flex flex-col space-y-6">
            
            {/* Display Hero Card */}
            <div className="relative rounded-xl border border-border bg-white p-7 xl:p-9 shadow-neo">
              <div className="space-y-3">
                <span className="inline-block rounded-sm border border-black bg-[#ede9fe] px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#543afd]">
                  Enterprise Inventory
                </span>
                <h1 className="font-heading text-3xl xl:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  Real-time warehouse command and stock management.
                </h1>
                <p className="text-sm xl:text-base font-normal text-muted-foreground leading-relaxed max-w-xl">
                  Automated reorders, multi-hub SKU synchronization, and tamper-evident audit trails designed for high-throughput logistics.
                </p>
              </div>

              {/* Graphic Frame */}
              <div className="relative mt-6 h-[260px] xl:h-[290px] w-full rounded-lg border border-border overflow-hidden bg-slate-900 shadow-neo-sm">
                <Image
                  src="/assets/login-background.png"
                  alt="StockOS warehouse illustration"
                  fill
                  priority
                  className="object-cover object-center contrast-105 opacity-90 hover:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute top-3 left-3 rounded-sm border border-black bg-[#543afd] text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shadow-neo-sm">
                  Live Telemetry
                </div>
                <div className="absolute bottom-3 right-3 rounded-sm border border-black bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground shadow-neo-sm">
                  Hub 01 Active
                </div>
              </div>

              {/* Feature Indicators */}
              <div className="mt-6 grid grid-cols-3 gap-3 pt-1">
                <div className="rounded-md border border-border bg-slate-50 p-2.5 text-center">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Speed
                  </span>
                  <span className="font-heading text-base font-bold text-foreground">
                    &lt;15ms
                  </span>
                </div>
                <div className="rounded-md border border-black bg-[#543afd] text-white p-2.5 text-center shadow-neo-sm">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    Accuracy
                  </span>
                  <span className="font-heading text-base font-bold text-white">
                    99.98%
                  </span>
                </div>
                <div className="rounded-md border border-border bg-slate-50 p-2.5 text-center">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Uptime
                  </span>
                  <span className="font-heading text-base font-bold text-foreground">
                    100.0%
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Form Container */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
            <div className="w-full max-w-[450px]">
              {children}
            </div>
          </div>

        </div>
      </div>

      {/* Clean SaaS Footer */}
      <footer className="relative z-10 border-t border-border bg-white py-3 px-4 font-mono text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} StockOS Corp. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/help" className="hover:text-foreground transition-colors">
              System Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
