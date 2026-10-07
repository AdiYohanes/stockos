"use client";

import * as React from "react";
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type { ProductMetrics } from "../types";

interface ProductsMetricsProps {
  metrics: ProductMetrics;
  selectedStatus?: string;
  onSelectStatus?: (status: "all" | "in_stock" | "low_stock" | "out_of_stock") => void;
}

export function ProductsMetrics({
  metrics,
  selectedStatus = "all",
  onSelectStatus,
}: ProductsMetricsProps) {
  const { t } = useI18n();

  const healthyPercentage =
    metrics.totalProducts > 0
      ? Math.round((metrics.inStockCount / metrics.totalProducts) * 100)
      : 0;

  const items = [
    {
      id: "all" as const,
      title: t.products.totalCatalog,
      value: formatNumber(metrics.totalProducts),
      meta: `${t.products.valuation}: ${formatCurrency(metrics.totalValuation)}`,
      icon: Package,
      statusDot: null,
    },
    {
      id: "in_stock" as const,
      title: t.products.inStock,
      value: formatNumber(metrics.inStockCount),
      meta: `${healthyPercentage}% ${t.products.ofTotalInventory}`,
      icon: CheckCircle2,
      statusDot: "bg-emerald-600",
    },
    {
      id: "low_stock" as const,
      title: t.products.lowStock,
      value: formatNumber(metrics.lowStockCount),
      meta: t.products.requiresReordering,
      icon: AlertTriangle,
      statusDot: metrics.lowStockCount > 0 ? "bg-amber-600" : "bg-slate-300 dark:bg-slate-700",
    },
    {
      id: "out_of_stock" as const,
      title: t.products.outOfStock,
      value: formatNumber(metrics.outOfStockCount),
      meta: t.products.criticalZeroQuantity,
      icon: XCircle,
      statusDot: metrics.outOfStockCount > 0 ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 divide-y border border-border bg-card rounded-md overflow-hidden sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
      {items.map((item, index) => {
        const isSelected = selectedStatus === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectStatus && onSelectStatus(item.id)}
            className={cn(
              "group relative flex flex-col justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer",
              index === 1 && "sm:border-r lg:border-r-0",
              isSelected
                ? "bg-slate-50 dark:bg-slate-900/60 ring-1 ring-inset ring-slate-900/10 dark:ring-slate-100/20"
                : "hover:bg-slate-50/60 dark:hover:bg-slate-900/30"
            )}
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                {item.statusDot && (
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.statusDot)} />
                )}
                <span className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                  {item.title}
                </span>
              </div>
              <Icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono tabular-nums text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {item.value}
              </span>
            </div>

            <p className="mt-1 text-[11px] font-mono tabular-nums text-muted-foreground truncate">
              {item.meta}
            </p>
          </button>
        );
      })}
    </div>
  );
}
