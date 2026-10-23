"use client";

import * as React from "react";
import { ErrorBoundaryCard } from "@/components/shared";

// Root boundary spans the full application, so keep the original minimum-height page feel.
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper p-4 sm:p-6">
      <ErrorBoundaryCard
        title="Terjadi Kesalahan Sistem"
        fallback="Sistem mengalami kendala saat memproses halaman."
        error={error}
        onRetry={() => retry()}
        retryLabel="Coba Lagi"
        homeHref="/"
        homeLabel="Dashboard"
        logLabel="Root Application Error:"
      />
    </div>
  );
}
