"use client";

import * as React from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportTimeframe } from "../types";

interface ReportsHeaderProps {
  timeframe: ReportTimeframe;
  onTimeframeChange: (tf: ReportTimeframe) => void;
  onOpenExportModal: () => void;
}

const TIMEFRAMES: { label: string; value: ReportTimeframe }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "12 Months", value: "12m" },
];

export function ReportsHeader({
  timeframe,
  onTimeframeChange,
  onOpenExportModal,
}: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
      {/* Title & Badge */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Reports & Intelligence
          </h1>
          <span className="inline-flex items-center gap-1 rounded-sm border border-black bg-[#543afd] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-neo-sm">
            <Sparkles className="h-3 w-3" />
            Analytics
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Operational visibility into stock valuation, movement velocity, reorder risks, and supplier health.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Timeframe Selector Pills */}
        <div className="flex items-center rounded-md border border-black bg-[#f8f9fa] p-1 shadow-neo-sm">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf.value;
            return (
              <button
                key={tf.value}
                type="button"
                onClick={() => onTimeframeChange(tf.value)}
                className={cn(
                  "rounded-xs px-2.5 py-1 font-mono text-xs font-semibold transition-all",
                  isActive
                    ? "bg-[#543afd] text-white shadow-xs"
                    : "text-slate-600 hover:text-foreground hover:bg-slate-200/60"
                )}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Primary CTA button */}
        <Button
          onClick={onOpenExportModal}
          className="border-[1.5px] border-black bg-[#543afd] text-white shadow-neo hover:bg-[#462ee0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
    </div>
  );
}
