"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard Module Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-4">
      <div className="flex flex-col items-center text-center border-[3px] border-ink bg-white p-6 sm:p-8 shadow-hard-md max-w-lg w-full">
        <div className="flex h-12 w-12 items-center justify-center border-[3px] border-ink bg-destructive/10 text-destructive shadow-hard-sm mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>

        <h2 className="font-display font-[900] text-lg sm:text-xl uppercase tracking-tight text-ink mb-1">
          Gagal Memuat Data Halaman
        </h2>

        <p className="font-mono text-xs text-ink/70 uppercase tracking-wider mb-5">
          {error?.message || "Terjadi kendala saat membaca data tampilan."}
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="press inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-acid px-5 py-2.5 font-display text-xs font-[900] uppercase tracking-wider text-ink shadow-hard-sm hover:brightness-105 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Muat Ulang Komponen
        </button>
      </div>
    </div>
  );
}
