"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { formatProductMoney } from "@/features/products/format";
import { useI18n } from "@/lib/i18n/context";
import type { ValuationSummary } from "../types";
import { moneyChartShare } from "../chart";

interface ValuationReportViewProps {
  summary: ValuationSummary;
}

const emptySubscribe = () => () => {};

export function ValuationReportView({ summary }: ValuationReportViewProps) {
  const { t } = useI18n();
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const chartData = React.useMemo(() => {
    return summary.categories.map((c) => ({
      name: c.categoryName.split(" ")[0], // short name for x-axis
      fullName: c.categoryName,
      cost: moneyChartShare(c.totalCost, [summary.totalCost, summary.totalValuation]),
      retail: moneyChartShare(c.totalRetailValue, [summary.totalCost, summary.totalValuation]),
      costExact: c.totalCost,
      retailExact: c.totalRetailValue,
    }));
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Chart Card */}
      <Card className="border-[3px] border-ink bg-white shadow-neo-sm">
        <CardHeader className="border-b border-ink pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Inventory Asset Valuation by Category
            </CardTitle>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-none bg-[#543afd]" />
                <span className="text-muted-foreground">Asset Cost</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-none bg-[#a23cb8]" />
                <span className="text-muted-foreground">Retail Value</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="mb-3 font-mono text-xs text-muted-foreground">{t.reports.chartScale}</p>
          <div className="h-[280px] w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                    tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-none border-[3px] border-ink bg-white p-3 font-mono text-xs shadow-neo">
                          <p className="font-bold text-foreground mb-1">{data.fullName}</p>
                          <div className="space-y-1">
                            <p className="text-foreground">Total Cost: {formatProductMoney(data.costExact)}</p>
                            <p className="text-[#09090b]">Retail Value: {formatProductMoney(data.retailExact)}</p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="cost" fill="#543afd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="retail" fill="#a23cb8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-mono text-muted-foreground">
                {t.common.loading || "Loading valuation chart..."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown Table */}
      <Card className="border-[3px] border-ink bg-white shadow-neo-sm">
        <CardHeader className="border-b border-ink pb-3">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Category Asset & Margin Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-b border-ink">
                  <TableHead className="font-mono text-xs font-bold text-foreground">{t.common.category || "Category Name"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">{t.common.sku || "SKUs"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">{t.common.quantity || "Total Units"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Total Cost</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Retail Value</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Margin %</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">Valuation Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.categories.map((cat) => (
                  <TableRow key={cat.categoryId} className="border-b border-ink hover:bg-slate-50">
                    <TableCell className="font-semibold text-xs text-foreground">
                      {cat.categoryName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-medium">
                      {cat.itemCount}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-medium">
                      {formatNumber(cat.stockQty)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold text-[#543afd]">
                      {formatProductMoney(cat.totalCost)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold text-foreground">
                      {formatProductMoney(cat.totalRetailValue)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right">
                      <span className="inline-flex rounded-none bg-[#dcfce7] px-1.5 py-0.5 font-bold text-[#15803d]">
                        {cat.marginPercent}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-none bg-slate-100 overflow-hidden border-[3px] border-ink">
                          <div
                            className="h-full bg-[#543afd]"
                            style={{ width: `${cat.ratioPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-muted-foreground w-9 text-right">
                          {cat.ratioPercent}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
