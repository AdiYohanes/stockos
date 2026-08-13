"use client";

import * as React from "react";
import { Building2, Truck, ShieldCheck, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WarehousePerformance, SupplierPerformance } from "../types";

interface PerformanceAnalyticsViewProps {
  warehouses: WarehousePerformance[];
  suppliers: SupplierPerformance[];
}

export function PerformanceAnalyticsView({
  warehouses,
  suppliers,
}: PerformanceAnalyticsViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Warehouse Utilization & Valuation */}
      <Card className="border border-black bg-white shadow-neo-sm">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#543afd]" />
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Warehouse Space & Valuation Share
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {warehouses.map((wh) => (
            <div
              key={wh.warehouseId}
              className="rounded-md border border-slate-200 bg-[#f8f9fa] p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{wh.name}</span>
                    <span className="inline-flex rounded-xs border border-black bg-white px-1.5 py-0.2 font-mono text-[10px] font-bold">
                      {wh.code}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">{wh.location}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#543afd]">
                    {formatCurrency(wh.totalValuation)}
                  </span>
                  <p className="font-mono text-[10px] text-muted-foreground">{formatNumber(wh.stockCount)} units</p>
                </div>
              </div>

              {/* Progress Bar for capacity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground">Capacity Used</span>
                  <span className="font-bold text-foreground">{wh.capacityUsedPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                  <div
                    className={cn(
                      "h-full transition-all",
                      wh.capacityUsedPercent > 80
                        ? "bg-[#b91c1c]"
                        : wh.capacityUsedPercent > 50
                        ? "bg-[#543afd]"
                        : "bg-[#15803d]"
                    )}
                    style={{ width: `${wh.capacityUsedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Supplier Fulfillment Performance Ranking */}
      <Card className="border border-black bg-white shadow-neo-sm">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#543afd]" />
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Supplier On-Time & Performance Scorecard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-b border-border">
                  <TableHead className="font-mono text-xs font-bold text-foreground">Supplier</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Orders</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">On-Time %</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Rating</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Total Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((sup) => (
                  <TableRow key={sup.supplierId} className="border-b border-border hover:bg-slate-50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-foreground">{sup.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{sup.code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-medium">
                      {sup.fulfilledOrders}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-xs px-1.5 py-0.5 font-bold",
                          sup.onTimeDeliveryRate >= 95
                            ? "bg-[#dcfce7] text-[#15803d]"
                            : sup.onTimeDeliveryRate >= 90
                            ? "bg-[#dbeafe] text-[#1d4ed8]"
                            : "bg-[#fee2e2] text-[#b91c1c]"
                        )}
                      >
                        {sup.onTimeDeliveryRate}%
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold text-foreground">
                      ★ {sup.qualityRating}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold text-[#543afd]">
                      {formatCurrency(sup.totalSpend)}
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
