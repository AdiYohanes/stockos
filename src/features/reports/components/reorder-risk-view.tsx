"use client";

import * as React from "react";
import { AlertTriangle, Clock, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReorderRiskItem, RiskUrgency } from "../types";

interface ReorderRiskViewProps {
  reorderItems: ReorderRiskItem[];
  onInspect: (id: string, type: "velocity" | "reorder" | "warehouse") => void;
}

export function ReorderRiskView({ reorderItems, onInspect }: ReorderRiskViewProps) {
  const getUrgencyPill = (urgency: RiskUrgency, days: number) => {
    switch (urgency) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 rounded-xs border border-black bg-[#fee2e2] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#b91c1c]">
            <AlertTriangle className="h-3 w-3" />
            {days} Days Left
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 rounded-xs border border-black bg-[#fef9c3] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#a16207]">
            <Clock className="h-3 w-3" />
            {days} Days Left
          </span>
        );
      case "optimal":
        return (
          <span className="inline-flex items-center gap-1 rounded-xs border border-black bg-[#dcfce7] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#15803d]">
            <CheckCircle2 className="h-3 w-3" />
            Optimal ({days}d)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Reorder Summary Header */}
      <Card className="border border-black bg-white shadow-neo-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Stockout Risk & Reorder Capital Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-b border-border">
                  <TableHead className="font-mono text-xs font-bold text-foreground">SKU</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">Product & Supplier</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Current Stock</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Min Threshold</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-center">Stockout Risk</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Suggested Qty</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Est. Reorder Cost</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reorderItems.map((item) => (
                  <TableRow
                    key={item.productId}
                    onClick={() => onInspect(item.productId, "reorder")}
                    className="border-b border-border hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <TableCell>
                      <span className="inline-flex rounded-xs border border-black bg-[#f8f9fa] px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                        {item.sku}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-foreground">{item.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          Supplier: {item.supplierName} ({item.leadTimeDays}d lead)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold text-[#b91c1c]">
                      {formatNumber(item.currentStock)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right text-muted-foreground">
                      {formatNumber(item.minThreshold)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getUrgencyPill(item.urgency, item.daysRemaining)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold text-[#543afd]">
                      +{formatNumber(item.suggestedReorderQty)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right font-bold text-foreground">
                      {formatCurrency(item.totalReorderCost)}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alert(`Simulated Reorder Draft created for ${item.sku}`)}
                        className="h-7 border border-black bg-white px-2 font-mono text-[10px] font-bold text-foreground shadow-neo-sm hover:bg-[#543afd] hover:text-white"
                      >
                        <ShoppingCart className="mr-1 h-3 w-3" />
                        Reorder
                      </Button>
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
