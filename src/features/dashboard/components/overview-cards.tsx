"use client";

import * as React from "react";
import {
  Package,
  CircleDollarSign,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
      case "inventory_value":
        return t.dashboard.inventoryValuation;
      case "low_stock":
        return t.dashboard.lowStockAlerts;
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
      case "inventory_value":
        return t.dashboard.avgCost;
      case "low_stock":
        return t.dashboard.belowMinReorder;
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

        return (
          <Card
            key={metric.id}
            className={cn(
              "relative transition-all duration-150 hover:border-black/60 dark:hover:border-white/60 !p-4 !gap-2 flex flex-col justify-between h-full",
              metric.variant === "destructive" && "border-destructive",
              metric.variant === "warning" && "border-amber-500"
            )}
          >
            {/* Header: Label + Icon */}
            <div className="flex flex-row items-center justify-between gap-4">
              <span className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-tight truncate">
                {label}
              </span>
              <IconComponent className={cn("h-6 w-6 shrink-0", iconConfig.iconClass)} />
            </div>

            {/* Metric Value + Trend */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 mt-1">
              <div className="font-heading text-3xl font-black tracking-tighter text-foreground">
                {metric.value}
              </div>
              {metric.change && (
                <div className="font-mono text-xs font-semibold shrink-0">
                  {metric.trend === "up" && (
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="mr-1 h-3.5 w-3.5" />
                      {metric.change}
                    </span>
                  )}
                  {metric.trend === "down" && (
                    <span className="flex items-center text-rose-600 dark:text-rose-400">
                      <TrendingDown className="mr-1 h-3.5 w-3.5" />
                      {metric.change}
                    </span>
                  )}
                  {metric.trend === "neutral" && (
                    <span className="flex items-center text-amber-600 dark:text-amber-400">
                      <Minus className="mr-1 h-3.5 w-3.5" />
                      {metric.change}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Supporting note */}
            {supportingText && (
              <p className="text-xs text-muted-foreground font-medium truncate mt-1">
                {supportingText}
              </p>
            )}
          </Card>
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
    case "value":
      return {
        icon: CircleDollarSign,
        iconClass: "text-emerald-600 dark:text-emerald-400",
      };
    case "low_stock":
      return {
        icon: AlertTriangle,
        iconClass: "text-amber-600 dark:text-amber-500",
      };
    case "out_of_stock":
      return {
        icon: AlertOctagon,
        iconClass: "text-destructive dark:text-red-400",
      };
  }
}
