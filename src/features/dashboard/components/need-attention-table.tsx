"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { AttentionItem, AttentionStatus } from "../types";
import { MOCK_ATTENTION_ITEMS } from "../mock-data";

interface NeedAttentionTableProps {
  items?: AttentionItem[];
  className?: string;
}

export function NeedAttentionTable({ items = MOCK_ATTENTION_ITEMS, className }: NeedAttentionTableProps) {
  const { t } = useI18n();
  const [filter, setFilter] = React.useState<"all" | AttentionStatus>("all");

  const filteredItems = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const outOfStockCount = items.filter((i) => i.status === "out_of_stock").length;
  const lowStockCount = items.filter((i) => i.status === "low_stock").length;

  return (
    <Card className={cn("flex flex-col flex-1 min-h-[300px] overflow-hidden bg-white border-[3px] border-ink shadow-hard-sm", className)}>
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5 space-y-0 shrink-0 border-b-[3px] border-ink">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center border-[3px] border-ink bg-[#fee2e2] text-[#b91c1c] shadow-hard-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-ink font-sans truncate">
                {t.dashboard.needAttention}
              </CardTitle>
              <p className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
                {t.dashboard.needAttentionSubtitle}
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center overflow-x-auto max-w-full border-[3px] border-ink bg-paper p-0.5 shadow-hard-sm shrink-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1 font-mono text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap uppercase border-r-[2px] border-ink",
                filter === "all"
                  ? "bg-ink text-paper"
                  : "text-ink hover:bg-ink/10"
              )}
            >
              {t.common.all} ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("out_of_stock")}
              className={cn(
                "px-3 py-1 font-mono text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap uppercase border-r-[2px] border-ink",
                filter === "out_of_stock"
                  ? "bg-[#b91c1c] text-white"
                  : "text-ink hover:bg-ink/10"
              )}
            >
              {t.dashboard.outOfStock} ({outOfStockCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("low_stock")}
              className={cn(
                "px-3 py-1 font-mono text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap uppercase",
                filter === "low_stock"
                  ? "bg-[#b45309] text-white"
                  : "text-ink hover:bg-ink/10"
              )}
            >
              {t.dashboard.lowStock} ({lowStockCount})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-auto ledger-container">
          <table className="w-full min-w-[450px] table-fixed text-left text-sm">
            <thead className="sticky top-0 z-10 border-b-[3px] border-ink bg-paper font-sans text-[10px] font-bold text-ink uppercase tracking-widest shadow-hard-sm">
              <tr>
                <th scope="col" className="w-[48%] px-4 py-3 border-r-[2px] border-black/10">
                  {t.dashboard.itemAndSku}
                </th>
                <th scope="col" className="w-[26%] px-3 py-3 text-center border-r-[2px] border-black/10">
                  {t.dashboard.stockMin}
                </th>
                <th scope="col" className="w-[26%] px-3 py-3 text-right">
                  {t.common.status}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-[2px] divide-black/10">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[10px] uppercase tracking-widest text-ink/60 font-mono bg-paper">
                    {t.dashboard.noAttentionItems}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stockPercentage = Math.min(
                    100,
                    Math.round((item.currentStock / item.minStock) * 100)
                  );

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-paper group cursor-pointer bg-white"
                    >
                      <td className="px-4 py-3 overflow-hidden border-r-[2px] border-black/10">
                        <div className="font-bold text-ink truncate text-sm">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-ink/60 font-mono uppercase tracking-widest truncate mt-1">
                          <span className="font-bold text-ink bg-paper px-1 border border-ink/20 mr-2">{item.sku}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center font-mono overflow-hidden border-r-[2px] border-black/10">
                        <div className="text-[11px] font-bold text-ink mb-1.5">
                          <span
                            className={
                              item.currentStock === 0
                                ? "text-destructive"
                                : "text-amber-600 dark:text-amber-400"
                            }
                          >
                            {item.currentStock}
                          </span>
                          <span className="text-ink/60 ml-0.5">
                            /{item.minStock} <span className="text-[9px] uppercase">{item.unit}</span>
                          </span>
                        </div>
                        <div className="mx-auto h-2 w-full max-w-16 overflow-hidden bg-paper border border-ink">
                          <div
                            style={{ width: `${stockPercentage}%` }}
                            className={cn(
                              "h-full transition-all duration-300 border-r border-ink",
                              item.currentStock === 0 ? "bg-destructive" : "bg-amber-500"
                            )}
                          />
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right overflow-hidden">
                        {item.status === "out_of_stock" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border-[3px] border-ink bg-[#fee2e2] text-[#b91c1c] max-w-full">
                            <XCircle className="h-3 w-3 shrink-0" />
                            <span className="truncate">{t.dashboard.outOfStockBadge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border-[3px] border-ink bg-[#fef3c7] text-[#b45309] max-w-full">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="truncate">{t.dashboard.lowStockBadge}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
