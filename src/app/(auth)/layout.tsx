import type { Metadata } from "next";
import Link from "next/link";
import { Warehouse, Package } from "lucide-react";
import { StockOSLogo } from "@/components/stockos-logo";

export const metadata: Metadata = {
  title: {
    template: "%s | StockOS",
    default: "Authentication | StockOS",
  },
};

/**
 * Hard Neobrutalist Authentication Layout
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background px-5 py-4 text-foreground sm:px-8 lg:px-10 [@media(max-height:700px)]:py-2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-dots opacity-20" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-10 right-10 hidden items-end gap-4 text-foreground/15 xl:flex">
        <Warehouse className="h-40 w-40" strokeWidth={1} />
        <div className="flex flex-col items-center gap-1">
          <Package className="h-10 w-10" strokeWidth={1.5} />
          <div className="flex gap-1">
            <Package className="h-10 w-10" strokeWidth={1.5} />
            <Package className="h-10 w-10" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Top Header Bar / Logo */}
      <header className="relative flex shrink-0">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 font-semibold outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="flex h-11 w-11 items-center justify-center border-[3px] border-border bg-primary text-primary-foreground shadow-brutal-sm">
            <StockOSLogo size={22} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-heading text-lg font-black leading-none tracking-tight">STOCKOS</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Terminal</span>
          </div>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative flex flex-1 items-center justify-center py-5 [@media(max-height:700px)]:py-2">
        <div className="w-full max-w-[450px]">
          {children}
        </div>
      </main>
    </div>
  );
}
