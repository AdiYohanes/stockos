"use client";

import * as React from "react";
import { DollarSign, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { ReportTab, ValuationSummary, ReorderRiskItem } from "../types";

interface ReportsMetricCardsProps {
  valuationSummary: ValuationSummary;
  reorderRiskList: ReorderRiskItem[];
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

export function ReportsMetricCards({
  valuationSummary,
  reorderRiskList,
  activeTab,
  onTabChange,
}: ReportsMetricCardsProps) {
  const { t } = useI18n();
  const criticalCount = reorderRiskList.filter((r) => r.urgency === "critical").length;
  const totalReorderCapital = reorderRiskList.reduce((acc, curr) => acc + curr.totalReorderCost, 0);

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
              {t.reports.totalAssetValue || "Total Asset Value"}
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
              <span>Cost: {formatCurrency(valuationSummary.totalCost)}</span>
              <span className="font-bold text-emerald-700">
                Margin: {valuationSummary.marginPercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Inventory Turnover Rate */}
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
              Movement Turnover
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-[#09090b] text-white shadow-hard-sm">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              4.2x <span className="text-xs font-normal text-muted-foreground">/ yr</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Flow Health</span>
              <span className="inline-flex items-center rounded-none bg-emerald-100 border border-emerald-700 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                High Velocity
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Reorder Capital & Risk */}
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
              Reorder Capital Needed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-red-100 border border-red-700 text-red-700 shadow-hard-sm">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalReorderCapital)}
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">{reorderRiskList.length} SKUs Alert</span>
              <span className="inline-flex items-center rounded-none bg-red-100 border border-red-700 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                {criticalCount} Critical
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Supplier Fulfillment Score */}
      <Card
        onClick={() => onTabChange("performance")}
        className={cn(
          "cursor-pointer border-[3px] border-ink bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]",
          activeTab === "performance"
            ? "shadow-hard border-acid"
            : "shadow-hard-sm hover:shadow-hard"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Supplier On-Time Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-emerald-100 border border-emerald-700 text-emerald-700 shadow-hard-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              96.4%
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Supplier delivery summary</span>
              <span className="font-bold text-emerald-700">Optimal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
