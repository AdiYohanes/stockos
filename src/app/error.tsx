"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Root Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper p-4 sm:p-6">
      <div className="flex flex-col items-center text-center border-[3px] border-ink bg-white p-6 sm:p-8 shadow-hard-lg max-w-md w-full">
        <div className="flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-destructive/10 text-destructive shadow-hard-sm mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="font-display font-[900] text-xl sm:text-2xl uppercase tracking-tight text-ink mb-2">
          Terjadi Kesalahan Sistem
        </h1>

        <p className="font-mono text-xs text-ink/70 uppercase tracking-wider mb-6">
          {error?.message || "Sistem mengalami kendala saat memproses halaman."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="press flex-1 inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-acid px-4 py-2.5 font-display text-xs font-[900] uppercase tracking-wider text-ink shadow-hard-sm hover:brightness-105 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>

          <Link
            href="/"
            className="press flex-1 inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-white px-4 py-2.5 font-display text-xs font-[900] uppercase tracking-wider text-ink shadow-hard-sm hover:bg-paper cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
