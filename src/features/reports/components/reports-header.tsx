"use client";

import * as React from "react";
import { Download, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { ReportTimeframe } from "../types";

interface ReportsHeaderProps {
  timeframe: ReportTimeframe;
  onTimeframeChange: (tf: ReportTimeframe) => void;
  onOpenExportModal: () => void;
}

export function ReportsHeader({
  timeframe,
  onTimeframeChange,
  onOpenExportModal,
}: ReportsHeaderProps) {
  const { language, t } = useI18n();

  const TIMEFRAMES: { label: string; value: ReportTimeframe }[] = [
    { label: language === "id" ? "7 Hari" : "7 Days", value: "7d" },
    { label: language === "id" ? "30 Hari" : "30 Days", value: "30d" },
    { label: language === "id" ? "90 Hari" : "90 Days", value: "90d" },
    { label: language === "id" ? "12 Bulan" : "12 Months", value: "12m" },
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
      {/* Title & Icon */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-black bg-[#543afd] text-white shadow-neo shrink-0">
          <BarChart3 className="h-5.5 w-5.5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t.reports.title}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-sm border border-black bg-[#543afd] px-2.5 py-0.5 font-mono text-[13px] font-bold uppercase tracking-wider text-white shadow-neo-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t.reports.badgeText}
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
            {t.reports.subtitle}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
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
          size="sm"
          onClick={onOpenExportModal}
          className="h-9 border-[1.5px] border-black bg-[#543afd] text-white font-mono text-xs font-bold shadow-neo-sm hover:bg-[#462ee0] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {language === "id" ? "Ekspor Data" : "Export Data"}
        </Button>
      </div>
    </div>
  );
}
