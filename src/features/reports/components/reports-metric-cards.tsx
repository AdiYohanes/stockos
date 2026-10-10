"use client";

import * as React from "react";
import { DollarSign, TrendingUp, AlertTriangle, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { ReportTab, ValuationSummary, ReorderRiskItem, MovementVelocityItem } from "../types";

interface ReportsMetricCardsProps {
  valuationSummary: ValuationSummary;
  reorderRiskList: ReorderRiskItem[];
  velocityList?: MovementVelocityItem[];
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

export function ReportsMetricCards({
  valuationSummary,
  reorderRiskList,
  velocityList = [],
  activeTab,
  onTabChange,
}: ReportsMetricCardsProps) {
  const { t } = useI18n();
  const criticalCount = reorderRiskList.filter((r) => r.urgency === "critical").length;
  const warningCount = reorderRiskList.length - criticalCount;

  const totalIn = velocityList.reduce((acc, curr) => acc + curr.stockInQty, 0);
  const totalOut = velocityList.reduce((acc, curr) => acc + curr.stockOutQty, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Asset Valuation */}
      <Card
        onClick={() => onTabChange("valuation")}
        className={cn(
          "cursor-pointer border-[3px] border-ink bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]",
          activeTab === "valuation"
            ? "shadow-hard border-acid"
            : "shadow-hard-sm hover:shadow-hard"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t.reports.totalAssetValue || "Total Nilai Jual"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-acid text-white shadow-hard-sm">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(valuationSummary.totalValuation)}
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
              <span>Modal: {formatCurrency(valuationSummary.totalCost)}</span>
              <span className="font-bold text-emerald-700">
                {valuationSummary.totalSKUs} SKU
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Potensi Laba Kotor */}
      <Card
        onClick={() => onTabChange("valuation")}
        className={cn(
          "cursor-pointer border-[3px] border-ink bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]",
          activeTab === "valuation"
            ? "shadow-hard border-acid"
            : "shadow-hard-sm hover:shadow-hard"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Potensi Laba Kotor
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-emerald-600 text-white shadow-hard-sm">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(valuationSummary.grossMargin)}
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Margin Valuasi</span>
              <span className="inline-flex items-center rounded-none bg-emerald-100 border-[2px] border-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                +{valuationSummary.marginPercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Pergerakan Stok (Masuk & Keluar) */}
      <Card
        onClick={() => onTabChange("velocity")}
        className={cn(
          "cursor-pointer border-[3px] border-ink bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]",
          activeTab === "velocity"
            ? "shadow-hard border-acid"
            : "shadow-hard-sm hover:shadow-hard"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Volume Pergerakan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-[#09090b] text-white shadow-hard-sm">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(totalOut)} <span className="text-xs font-normal text-muted-foreground">keluar</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Masuk: +{formatNumber(totalIn)}</span>
              <span className="font-bold text-slate-800">
                {velocityList.length} Item
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Peringatan Stok Menipis & Habis */}
      <Card
        onClick={() => onTabChange("reorder")}
        className={cn(
          "cursor-pointer border-[3px] border-ink bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]",
          activeTab === "reorder"
            ? "shadow-hard border-acid"
            : "shadow-hard-sm hover:shadow-hard"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Peringatan Stok
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-red-100 text-red-700 shadow-hard-sm">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {reorderRiskList.length} <span className="text-xs font-normal text-muted-foreground">SKU Alert</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">{warningCount} Menipis</span>
              <span className="inline-flex items-center rounded-none bg-red-100 border-[2px] border-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                {criticalCount} Habis
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
