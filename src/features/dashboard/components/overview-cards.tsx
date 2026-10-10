"use client";

import * as React from "react";
import {
  Package,
  CircleDollarSign,
  Wallet,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { OverviewMetric } from "../types";

interface OverviewCardsProps {
  metrics: OverviewMetric[];
}

export function OverviewCards({ metrics }: OverviewCardsProps) {
  const { t } = useI18n();

  const getMetricLabel = (metric: OverviewMetric) => {
    switch (metric.id) {
      case "products":
        return t.dashboard.totalProducts;
      case "revenue":
        return t.dashboard.revenue;
      case "net_profit":
        return t.dashboard.estimatedNetProfit;
      case "out_of_stock":
        return t.products.outOfStock;
      default:
        return metric.label;
    }
  };

  const getSupportingText = (metric: OverviewMetric) => {
    switch (metric.id) {
      case "products":
        return t.dashboard.acrossCategories;
      case "revenue":
        return t.dashboard.revenueSupportingText;
      case "net_profit":
        return t.dashboard.netProfitSupportingText;
      case "out_of_stock":
        return t.dashboard.zeroUnitsAvailable;
      default:
        return metric.supportingText;
    }
  };

  return (
    <section
      aria-label={t.dashboard.inventoryOverview}
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {metrics.map((metric) => {
        const iconConfig = getIconConfig(metric.iconName);
        const IconComponent = iconConfig.icon;
        const label = getMetricLabel(metric);
        const supportingText = getSupportingText(metric);
        const isFinancial = metric.id === "revenue" || metric.id === "net_profit";

        return (
          <div
            key={metric.id}
            className={cn(
              "relative min-w-0 bg-white dark:bg-black border-[3px] border-ink shadow-hard-sm p-4 sm:p-5 flex flex-col justify-between h-full",
              metric.variant === "destructive" && "border-red-600 shadow-[4px_4px_0px_#dc2626]",
              metric.variant === "warning" && "border-amber-500 shadow-[4px_4px_0px_#f59e0b]"
            )}
          >
            {/* Header: Label + Icon */}
            <div className="flex flex-row items-start justify-between gap-2">
              <span className="min-w-0 font-sans text-xs font-bold uppercase tracking-widest text-ink/80 break-words">
                {label}
              </span>
              <IconComponent aria-hidden="true" className={cn("h-5 w-5 shrink-0", iconConfig.iconClass)} />
            </div>
            {isFinancial && (
              <p className="font-mono text-[10px] text-ink/80 mt-2">
                {t.dashboard.demoData} · {t.dashboard.financialPeriod}
              </p>
            )}

            {/* Metric Value + Trend */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 mt-3">
              <div className={cn("min-w-0 max-w-full font-mono text-xl sm:text-2xl font-bold tracking-tighter text-ink [overflow-wrap:anywhere]", !isFinancial && "text-3xl sm:text-3xl")}>
                {metric.value}
              </div>
              {metric.change && (
                <div className="max-w-full font-mono text-[10px] uppercase font-bold">
                  {metric.trend === "up" && (
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-1 border border-emerald-600">
                      <TrendingUp className="mr-1 h-3.5 w-3.5" />
                      {metric.change}
                    </span>
                  )}
                  {metric.trend === "down" && (
                    <span className="flex items-center text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 px-1 border border-rose-600">
                      <TrendingDown className="mr-1 h-3.5 w-3.5" />
                      {metric.change}
                    </span>
                  )}
                  {metric.trend === "neutral" && (
                    <span className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-1 border border-amber-600">
                      <Minus className="mr-1 h-3.5 w-3.5" />
                      {metric.change}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Supporting note */}
            {supportingText && (
              <p className="text-[10px] font-mono leading-relaxed text-ink/80 mt-2 break-words">
                {supportingText}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

function getIconConfig(name: OverviewMetric["iconName"]) {
  switch (name) {
    case "products":
      return {
        icon: Package,
        iconClass: "text-blue-600 dark:text-blue-400",
      };
    case "revenue":
      return {
        icon: CircleDollarSign,
        iconClass: "text-ink",
      };
    case "net_profit":
      return {
        icon: Wallet,
        iconClass: "text-ink",
      };
    case "out_of_stock":
      return {
        icon: AlertOctagon,
        iconClass: "text-destructive dark:text-red-400",
      };
  }
}
