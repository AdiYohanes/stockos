"use client";

import * as React from "react";
import { ErrorBoundaryCard } from "@/components/shared";

// Nested boundary reloads only the failed route segment; no home fallback offered.
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-4">
      <ErrorBoundaryCard
        title="Gagal Memuat Data Halaman"
        fallback="Terjadi kendala saat membaca data tampilan."
        error={error}
        onRetry={() => retry()}
        retryLabel="Muat Ulang Komponen"
        logLabel="Dashboard Module Error:"
      />
    </div>
  );
}
