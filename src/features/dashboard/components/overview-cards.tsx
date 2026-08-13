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
import type { OverviewMetric } from "../types";

interface OverviewCardsProps {
  metrics: OverviewMetric[];
}

export function OverviewCards({ metrics }: OverviewCardsProps) {
  return (
    <section
      aria-label="Inventory Overview Summary"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {metrics.map((metric) => {
        const iconConfig = getIconConfig(metric.iconName);
        const IconComponent = iconConfig.icon;

        return (
          <Card
            key={metric.id}
            className={cn(
              "relative overflow-hidden transition-all duration-150 hover:border-black/40",
              metric.variant === "destructive" && "border-destructive/30 bg-destructive/[0.02]",
              metric.variant === "warning" && "border-amber-500/30 bg-amber-500/[0.02]"
            )}
          >
            <CardContent className="p-3 sm:p-3.5 flex flex-col justify-between h-full gap-1.5">
              {/* Header: Label + Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {metric.label}
                </span>
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-black/80 shadow-neo-sm transition-transform",
                    iconConfig.wrapperClass
                  )}
                  aria-hidden="true"
                >
                  <IconComponent className={cn("h-3.5 w-3.5", iconConfig.iconClass)} />
                </div>
              </div>

              {/* Metric Value + Trend */}
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <div className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {metric.value}
                </div>
                {metric.change && (
                  <div className="font-mono text-[11px] font-semibold truncate shrink-0">
                    {metric.trend === "up" && (
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 gap-0.5">
                        <TrendingUp className="h-3 w-3" />
                        {metric.change}
                      </span>
                    )}
                    {metric.trend === "down" && (
                      <span className="inline-flex items-center text-rose-600 dark:text-rose-400 gap-0.5">
                        <TrendingDown className="h-3 w-3" />
                        {metric.change}
                      </span>
                    )}
                    {metric.trend === "neutral" && (
                      <span className="inline-flex items-center text-amber-600 dark:text-amber-400 gap-0.5">
                        <Minus className="h-3 w-3" />
                        {metric.change}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Supporting note */}
              {metric.supportingText && (
                <p className="text-[11px] text-muted-foreground font-medium truncate leading-none">
                  {metric.supportingText}
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
