"use client";

import * as React from "react";
import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import type { InventoryHealthData } from "../types";
import { MOCK_INVENTORY_HEALTH } from "../mock-data";

interface InventoryHealthProps {
  data?: InventoryHealthData;
  className?: string;
}

export function InventoryHealth({ data = MOCK_INVENTORY_HEALTH, className }: InventoryHealthProps) {
  const { t } = useI18n();

  return (
    <div className={cn("flex flex-col shrink-0 bg-white border-[3px] border-ink shadow-hard-sm", className)}>
      <div className="pb-3 pt-5 px-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-ink bg-emerald-100 text-emerald-700 shadow-hard-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink font-sans">
                {t.dashboard.inventoryHealthTitle}
              </h3>
            </div>
          </div>
          <span
            className={cn(
              "px-2 py-1 font-mono text-[10px] font-bold uppercase border-[3px] border-ink",
              data.healthScore >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            )}
          >
            {data.healthScore}% {t.dashboard.optimal}
          </span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="space-y-1 pt-2">
          <div
            className="flex h-3 w-full overflow-hidden bg-paper border-[3px] border-ink"
            role="progressbar"
            aria-valuenow={data.healthy.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t.dashboard.healthDistribution}
          >
            <div
              style={{ width: `${data.healthy.percentage}%` }}
              className="h-full bg-emerald-500 transition-all duration-300 border-r border-ink"
              title={`${t.dashboard.healthy}: ${data.healthy.percentage}%`}
            />
            <div
              style={{ width: `${data.lowStock.percentage}%` }}
              className="h-full bg-amber-500 transition-all duration-300 border-r border-ink"
              title={`${t.dashboard.lowStock}: ${data.lowStock.percentage}%`}
            />
            <div
              style={{ width: `${data.outOfStock.percentage}%` }}
              className="h-full bg-rose-500 transition-all duration-300"
              title={`${t.dashboard.outOfStock}: ${data.outOfStock.percentage}%`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 px-5 pb-5 pt-2 font-mono">
        {/* Healthy row */}
        <div className="flex items-center justify-between border-[3px] border-ink bg-paper px-3 py-2 text-xs transition-colors hover:bg-white press cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 border border-ink shrink-0" />
            <span className="font-sans font-bold uppercase text-ink text-[10px] tracking-widest">{t.dashboard.healthy}</span>
            <span className="text-[10px] text-ink/60">({data.healthy.percentage}%)</span>
          </div>
          <span className="font-bold text-ink text-xs">
            ${formatNumber(data.healthy.value)}
          </span>
        </div>

        {/* Low Stock row */}
        <div className="flex items-center justify-between border-[3px] border-ink bg-paper px-3 py-2 text-xs transition-colors hover:bg-white press cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 border border-ink shrink-0" />
            <span className="font-sans font-bold uppercase text-ink text-[10px] tracking-widest">{t.dashboard.lowStock}</span>
            <span className="text-[10px] text-ink/60">({data.lowStock.percentage}%)</span>
          </div>
          <span className="font-bold text-ink text-xs">
            ${formatNumber(data.lowStock.value)}
          </span>
        </div>

        {/* Out of Stock row */}
        <div className="flex items-center justify-between border-[3px] border-ink bg-paper px-3 py-2 text-xs transition-colors hover:bg-white press cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 border border-ink shrink-0" />
            <span className="font-sans font-bold uppercase text-ink text-[10px] tracking-widest">{t.dashboard.outOfStock}</span>
            <span className="text-[10px] text-ink/60">({data.outOfStock.percentage}%)</span>
          </div>
          <span className="font-bold text-red-600 text-xs">
            ${formatNumber(data.outOfStock.value)}
          </span>
        </div>
      </div>
    </div>
  );
}
