"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

// Production RSC redacts Server Component error details, so error.message differs between the server-rendered
// boundary and the client replay. Render the message only after mount to keep hydration deterministic.
// React replays a server-rendered failed boundary during hydration as Minified React error #419; that replay
// is the outage itself, not a client mismatch.
const neverSubscribe = () => () => {};

export interface ErrorBoundaryCardProps {
  title: string;
  fallback: string;
  error: Error & { digest?: string };
  onRetry: () => void;
  retryLabel: string;
  homeHref?: string;
  homeLabel?: string;
  logLabel: string;
}

export function ErrorBoundaryCard({
  title,
  fallback,
  error,
  onRetry,
  retryLabel,
  homeHref,
  homeLabel,
  logLabel,
}: ErrorBoundaryCardProps) {
  const mounted = React.useSyncExternalStore(neverSubscribe, () => true, () => false);
  React.useEffect(() => {
    console.error(logLabel, error);
  }, [error, logLabel]);

  return (
    <div className="flex flex-col items-center text-center border-[3px] border-ink bg-white p-6 sm:p-8 shadow-hard-lg max-w-md w-full">
      <div className="flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-destructive/10 text-destructive shadow-hard-sm mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h1 className="font-display font-[900] text-xl sm:text-2xl uppercase tracking-tight text-ink mb-2">
        {title}
      </h1>

      <p className="font-mono text-xs text-ink/70 uppercase tracking-wider mb-6">
        {(mounted && error?.message) || fallback}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          type="button"
          onClick={onRetry}
          className="press flex-1 inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-acid px-4 py-2.5 font-display text-xs font-[900] uppercase tracking-wider text-ink shadow-hard-sm hover:brightness-105 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </button>

        {homeHref && (
          <Link
            href={homeHref}
            className="press flex-1 inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-white px-4 py-2.5 font-display text-xs font-[900] uppercase tracking-wider text-ink shadow-hard-sm hover:bg-paper cursor-pointer"
          >
            <Home className="h-4 w-4" />
            {homeLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
