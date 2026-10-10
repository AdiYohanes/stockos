"use client";

import * as React from "react";
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { formatProductMoney } from "../format";
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
      meta: `${t.products.persistent.inventoryCostValue}: ${formatProductMoney(metrics.totalValuation)}`,
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
      {items.map((item) => {
        const isSelected = selectedStatus === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectStatus && onSelectStatus(item.id)}
            className={cn(
              "press group relative flex flex-col justify-between p-4 sm:p-5 text-left transition-colors cursor-pointer border-[3px] border-ink shadow-hard-sm",
              isSelected
                ? "bg-ink text-paper"
                : "bg-white dark:bg-black text-ink hover:bg-paper"
            )}
          >
            <div className="flex items-center justify-between gap-2 w-full mb-3">
              <div className="flex items-center gap-2 min-w-0">
                {item.statusDot && (
                  <span className={cn("w-2 h-2 shrink-0 border-[1.5px] border-ink", item.statusDot)} />
                )}
                <span className={cn(
                  "font-sans text-xs font-bold uppercase tracking-widest truncate",
                  isSelected ? "text-paper opacity-80" : "text-ink opacity-80"
                )}>
                  {item.title}
                </span>
              </div>
              <Icon className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isSelected ? "text-paper opacity-80" : "text-ink opacity-60 group-hover:opacity-100"
              )} />
            </div>

            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className={cn(
                "font-display tabular-nums text-2xl sm:text-3xl font-[900] tracking-tight",
                isSelected ? "text-paper" : "text-ink"
              )}>
                {item.value}
              </span>
            </div>

            <p className={cn(
              "mt-2 text-[10px] font-mono tabular-nums uppercase truncate",
              isSelected ? "text-paper opacity-70" : "text-ink opacity-60"
            )}>
              {item.meta}
            </p>
          </button>
        );
      })}
    </div>
  );
}
