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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { OverviewMetric } from "../types";

interface OverviewCardsProps {
  metrics: OverviewMetric[];
}

export function OverviewCards({ metrics }: OverviewCardsProps) {
  const { language, t } = useI18n();

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
    if (language === "en") {
      switch (metric.id) {
        case "products":
          return "Across 8 categories";
        case "inventory_value":
          return "Avg cost $174.12";
        case "low_stock":
          return "Below min reorder threshold";
        case "out_of_stock":
          return "Zero units available";
        default:
          return metric.supportingText;
      }
    }
    return metric.supportingText;
  };

  return (
    <section
      aria-label="Ringkasan Ikhtisar Inventaris"
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
              "relative overflow-hidden transition-all duration-150 hover:border-black/40",
              metric.variant === "destructive" && "border-destructive/30 bg-destructive/[0.02]",
              metric.variant === "warning" && "border-amber-500/30 bg-amber-500/[0.02]"
            )}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
              {/* Header: Label + Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {label}
                </span>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-black/80 shadow-neo-sm transition-transform",
                    iconConfig.wrapperClass
                  )}
                  aria-hidden="true"
                >
                  <IconComponent className={cn("h-4 w-4", iconConfig.iconClass)} />
                </div>
              </div>

              {/* Metric Value + Trend */}
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <div className="font-heading text-2xl sm:text-[30px] sm:leading-9 font-bold tracking-tight text-foreground">
                  {metric.value}
                </div>
                {metric.change && (
                  <div className="font-mono text-xs sm:text-sm font-semibold truncate shrink-0">
                    {metric.trend === "up" && (
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 gap-0.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {metric.change}
                      </span>
                    )}
                    {metric.trend === "down" && (
                      <span className="inline-flex items-center text-rose-600 dark:text-rose-400 gap-0.5">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {metric.change}
                      </span>
                    )}
                    {metric.trend === "neutral" && (
                      <span className="inline-flex items-center text-amber-600 dark:text-amber-400 gap-0.5">
                        <Minus className="h-3.5 w-3.5" />
                        {metric.change}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Supporting note */}
              {supportingText && (
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate leading-tight">
                  {supportingText}
                </p>
              )}
            </CardContent>
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
        wrapperClass: "bg-[#ede9fe] text-[#543afd]",
        iconClass: "text-[#543afd]",
      };
    case "value":
      return {
        icon: CircleDollarSign,
        wrapperClass: "bg-[#dcfce7] text-[#15803d]",
        iconClass: "text-[#15803d]",
      };
    case "low_stock":
      return {
        icon: AlertTriangle,
        wrapperClass: "bg-[#fef3c7] text-[#b45309]",
        iconClass: "text-[#b45309]",
      };
    case "out_of_stock":
      return {
        icon: AlertOctagon,
        wrapperClass: "bg-[#fee2e2] text-[#b91c1c]",
        iconClass: "text-[#b91c1c]",
      };
  }
}
