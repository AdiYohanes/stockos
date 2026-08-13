"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MovementVelocityItem, MovementTrendPoint, VelocityTier } from "../types";

interface MovementVelocityViewProps {
  velocityItems: MovementVelocityItem[];
  trends: MovementTrendPoint[];
  onInspect: (id: string, type: "velocity" | "reorder" | "warehouse") => void;
}

const emptySubscribe = () => () => {};

export function MovementVelocityView({
  velocityItems,
  trends,
  onInspect,
}: MovementVelocityViewProps) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const getVelocityBadge = (tier: VelocityTier) => {
    switch (tier) {
      case "fast":
        return (
          <span className="inline-flex items-center rounded-xs border border-black bg-[#dcfce7] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#15803d]">
            Fast Moving
          </span>
        );
      case "moderate":
        return (
          <span className="inline-flex items-center rounded-xs border border-black bg-[#dbeafe] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#1d4ed8]">
            Moderate
          </span>
        );
      case "slow":
        return (
          <span className="inline-flex items-center rounded-xs border border-black bg-[#fef9c3] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#a16207]">
            Slow Moving
          </span>
        );
      case "dead":
        return (
          <span className="inline-flex items-center rounded-xs border border-black bg-[#fee2e2] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#b91c1c]">
            Dead Stock
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stock Volume Flow Trend Chart */}
      <Card className="border border-black bg-white shadow-neo-sm">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Inbound vs Outbound Stock Volume Flow (30-Day Trend)
            </CardTitle>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-[#543afd]" />
                <span className="text-muted-foreground">Inbound (Stock In)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-[#09090b]" />
                <span className="text-muted-foreground">Outbound (Stock Out)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px] w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#543afd" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#543afd" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#09090b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-md border border-black bg-white p-3 font-mono text-xs shadow-neo">
                          <p className="font-bold text-foreground mb-1">{label}</p>
                          <div className="space-y-1">
                            <p className="text-[#543afd]">Stock In: +{formatNumber(data.stockIn)} units</p>
                            <p className="text-[#09090b]">Stock Out: -{formatNumber(data.stockOut)} units</p>
                            <p className={cn("font-bold", data.netFlow >= 0 ? "text-[#15803d]" : "text-[#b91c1c]")}>
                              Net Flow: {data.netFlow >= 0 ? "+" : ""}{formatNumber(data.netFlow)}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="stockIn" stroke="#543afd" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="stockOut" stroke="#09090b" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-mono text-muted-foreground">
                Loading movement trends...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movement Velocity Table */}
      <Card className="border border-black bg-white shadow-neo-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Product Velocity & Movement Classification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-b border-border">
                  <TableHead className="font-mono text-xs font-bold text-foreground">SKU / Code</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">Product Name</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">Category</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Inbound</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Outbound</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Current Stock</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Turnover Ratio</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">Velocity Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {velocityItems.map((item) => (
                  <TableRow
                    key={item.productId}
                    onClick={() => onInspect(item.productId, "velocity")}
                    className="border-b border-border hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <TableCell>
                      <span className="inline-flex rounded-xs border border-black bg-[#f8f9fa] px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                        {item.sku}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {item.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.category}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right text-[#543afd] font-bold">
                      +{formatNumber(item.stockInQty)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right text-foreground font-bold">
                      -{formatNumber(item.stockOutQty)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-medium">
                      {formatNumber(item.currentStock)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold">
                      {item.turnoverRatio}x
                    </TableCell>
                    <TableCell>{getVelocityBadge(item.velocityTier)}</TableCell>
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
