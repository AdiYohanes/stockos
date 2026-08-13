"use client";

import * as React from "react";
import { Eye, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PurchaseOrder, POStatus } from "../types";

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  onInspect: (poId: string) => void;
  onReceiveGoods: (poId: string) => void;
}

export function PurchaseOrdersTable({
  orders,
  onInspect,
  onReceiveGoods,
}: PurchaseOrdersTableProps) {
  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="border-slate-400 bg-slate-100 font-mono text-[11px] text-slate-800 shadow-neo-sm">DRAFT</Badge>;
      case "ISSUED":
        return <Badge className="border-blue-400 bg-blue-100 font-mono text-[11px] text-blue-900 shadow-neo-sm">ISSUED</Badge>;
      case "PARTIALLY_RECEIVED":
        return <Badge className="border-amber-400 bg-amber-100 font-mono text-[11px] text-amber-900 shadow-neo-sm">PARTIAL</Badge>;
      case "RECEIVED":
        return <Badge className="border-emerald-400 bg-emerald-100 font-mono text-[11px] text-emerald-900 shadow-neo-sm">RECEIVED</Badge>;
      case "CANCELLED":
        return <Badge className="border-rose-400 bg-rose-100 font-mono text-[11px] text-rose-900 shadow-neo-sm">CANCELLED</Badge>;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
        <Truck className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No Purchase Orders Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          No orders match your current filter criteria. Try resetting filters or create a new Purchase Order.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-[15px]">
        <thead className="border-b border-border bg-slate-50 font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">PO Code</th>
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3">Destination</th>
            <th className="px-4 py-3">Fulfillment</th>
            <th className="px-4 py-3">Expected Date</th>
            <th className="px-4 py-3 text-right">Total Cost</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((po) => {
            const totalOrdered = po.lineItems.reduce((sum, item) => sum + item.orderedQuantity, 0);
            const totalReceived = po.lineItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
            const percent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

            const canReceive = po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED";

            return (
              <tr key={po.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3.5 font-mono font-bold text-foreground">{po.poNumber}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{po.supplierName}</span>
                    <span className="text-xs text-muted-foreground">{po.supplierTier}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-700">{po.destinationWarehouseName}</td>
                <td className="px-4 py-3.5">
                  <div className="flex w-36 flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span>{totalReceived}/{totalOrdered}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={cn(
                          "h-full transition-all",
                          percent === 100 ? "bg-emerald-500" : percent > 0 ? "bg-amber-500" : "bg-slate-300"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-slate-700">{po.expectedDeliveryDate}</td>
                <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                  ${po.totalCost.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-center">{getStatusBadge(po.status)}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canReceive && (
                      <Button
                        size="sm"
                        onClick={() => onReceiveGoods(po.id)}
                        className="h-8 border border-black bg-emerald-600 font-medium text-white shadow-neo-sm hover:bg-emerald-700"
                      >
                        <PackageCheck className="mr-1 h-3.5 w-3.5" />
                        Receive
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInspect(po.id)}
                      className="h-8 border-border px-2.5 hover:bg-slate-100"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Inspect
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
