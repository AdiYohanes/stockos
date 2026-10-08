import type { Metadata } from "next";
import Link from "next/link";
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

      {/* Decorative Neobrutalist Shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -right-16 h-64 w-64 rotate-12 border-[4px] border-border bg-primary shadow-hard-lg opacity-80 xl:h-96 xl:w-96" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 -rotate-6 rounded-full border-[4px] border-border bg-[#00e676] shadow-hard-lg opacity-80 xl:h-[30rem] xl:w-[30rem]" />
        <div className="absolute top-1/3 left-8 h-20 w-20 rotate-45 border-[4px] border-border bg-[#ff9100] shadow-hard hidden lg:block" />
        <div className="absolute bottom-1/3 right-16 h-24 w-24 -rotate-12 border-[4px] border-border bg-[#ff1744] shadow-hard hidden xl:block" />
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
