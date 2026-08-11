"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttentionItem, AttentionStatus } from "../types";
import { MOCK_ATTENTION_ITEMS } from "../mock-data";

interface NeedAttentionTableProps {
  items?: AttentionItem[];
}

export function NeedAttentionTable({ items = MOCK_ATTENTION_ITEMS }: NeedAttentionTableProps) {
  const [filter, setFilter] = React.useState<"all" | AttentionStatus>("all");

  const filteredItems = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const outOfStockCount = items.filter((i) => i.status === "out_of_stock").length;
  const lowStockCount = items.filter((i) => i.status === "low_stock").length;

  return (
    <Card className="flex flex-col h-full justify-between overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5 space-y-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-[#fee2e2] text-[#b91c1c] shadow-neo-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold truncate">
                Need Attention
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Critical and low inventory items
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                filter === "all"
                  ? "bg-white text-foreground border border-black shadow-neo-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("out_of_stock")}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                filter === "out_of_stock"
                  ? "bg-[#fee2e2] text-[#b91c1c] border border-black shadow-neo-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Out ({outOfStockCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("low_stock")}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                filter === "low_stock"
                  ? "bg-[#fef3c7] text-[#b45309] border border-black shadow-neo-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Low ({lowStockCount})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-between">
        <div className="w-full max-h-[340px] overflow-y-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="sticky top-0 z-10 border-y border-border bg-slate-50/90 backdrop-blur-xs font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th scope="col" className="w-[50%] px-4 py-2.5">
                  Item & SKU
                </th>
                <th scope="col" className="w-[24%] px-2 py-2.5 text-center">
                  Stock / Min
                </th>
                <th scope="col" className="w-[26%] px-4 py-2.5 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => {
                const stockPercentage = Math.min(
                  100,
                  Math.round((item.currentStock / item.minStock) * 100)
                );

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 group cursor-pointer"
                  >
                    <td className="px-4 py-2.5 min-w-0">
                      <div className="font-medium text-foreground truncate text-sm group-hover:text-primary transition-colors">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                        {item.sku} <span className="text-muted-foreground/40">•</span> {item.warehouse}
                      </div>
                    </td>

                    <td className="px-2 py-2.5 text-center font-mono">
                      <div className="text-xs font-bold text-foreground">
                        <span
                          className={
                            item.currentStock === 0
                              ? "text-destructive font-extrabold"
                              : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-muted-foreground text-xs font-normal">
                          /{item.minStock} {item.unit}
                        </span>
                      </div>
                      <div className="mx-auto mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                        <div
                          style={{ width: `${stockPercentage}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            item.currentStock === 0 ? "bg-destructive" : "bg-amber-500"
                          )}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      {item.status === "out_of_stock" ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3" />
                          Out of Stock
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
