"use client";

import * as React from "react";
import { Truck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SupplierPerformance } from "../types";

interface PerformanceAnalyticsViewProps {
  suppliers: SupplierPerformance[];
}

export function PerformanceAnalyticsView({
  suppliers,
}: PerformanceAnalyticsViewProps) {
  return (
    <div className="grid gap-6">
      {/* Supplier Fulfillment Performance Ranking */}
      <Card className="border-[3px] border-ink bg-white shadow-neo-sm">
        <CardHeader className="border-b border-ink pb-3">
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
                <TableRow className="border-b border-ink">
                  <TableHead className="font-mono text-xs font-bold text-foreground">Supplier</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Orders</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">On-Time %</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Rating</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Total Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((sup) => (
                  <TableRow key={sup.supplierId} className="border-b border-ink hover:bg-slate-50">
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
                          "inline-flex rounded-none px-1.5 py-0.5 font-bold",
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
