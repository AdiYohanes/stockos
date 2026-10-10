"use client";

import * as React from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import type { ReorderRiskItem, RiskUrgency } from "../types";

interface ReorderRiskViewProps {
  reorderItems: ReorderRiskItem[];
  onInspect: (id: string, type: "velocity" | "reorder") => void;
}

export function ReorderRiskView({ reorderItems, onInspect }: ReorderRiskViewProps) {
  const { t } = useI18n();

  const getUrgencyPill = (urgency: RiskUrgency) => {
    switch (urgency) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 rounded-none border-[3px] border-ink bg-[#fee2e2] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#b91c1c]">
            <AlertTriangle className="h-3 w-3" />
            STOK HABIS (0)
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 rounded-none border-[3px] border-ink bg-[#fef9c3] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#a16207]">
            <AlertCircle className="h-3 w-3" />
            MENIPIS (≤ MIN)
          </span>
        );
      case "optimal":
        return (
          <span className="inline-flex items-center gap-1 rounded-none border-[3px] border-ink bg-[#dcfce7] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#15803d]">
            AMAN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Reorder Summary Header */}
      <Card className="border-[3px] border-ink bg-white shadow-neo-sm">
        <CardHeader className="border-b border-ink pb-3">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Daftar Produk Menipis & Habis (Perlu Pengadaan Ulang)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-b border-ink">
                  <TableHead className="font-mono text-xs font-bold text-foreground">{t.common.sku || "SKU"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">{t.common.name || "Nama Produk"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground">Pemasok</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">{t.products.sheet.inventoryLevel || "Stok Terkini"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">{t.products.sheet.minThreshold || "Batas Min"}</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-center">Status</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Kekurangan</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Modal Satuan</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-foreground text-right">Est. Modal Reorder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reorderItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-xs font-mono text-muted-foreground">
                      Semua stok aman di atas batas minimum.
                    </TableCell>
                  </TableRow>
                ) : (
                  reorderItems.map((item) => (
                    <TableRow
                      key={item.productId}
                      onClick={() => onInspect(item.productId, "reorder")}
                      className="border-b border-ink hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <TableCell>
                        <span className="inline-flex rounded-none border-[3px] border-ink bg-[#f8f9fa] px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                          {item.sku}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">{item.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.supplierName || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right font-bold text-[#b91c1c]">
                        {formatNumber(item.currentStock)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right text-muted-foreground">
                        {formatNumber(item.minThreshold)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getUrgencyPill(item.urgency)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right font-bold text-[#543afd]">
                        +{formatNumber(item.suggestedReorderQty)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right text-muted-foreground">
                        {formatCurrency(item.unitCost)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right font-bold text-foreground">
                        {formatCurrency(item.totalReorderCost)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
