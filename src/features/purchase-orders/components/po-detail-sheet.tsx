"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PurchaseOrder } from "../types";

interface PODetailSheetProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PODetailSheet({ po, isOpen, onClose }: PODetailSheetProps) {
  if (!po) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto border-l-2 border-black p-6 shadow-neo">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-mono text-xl font-bold">{po.poNumber}</SheetTitle>
            <Badge className="border-black bg-[#543afd] text-white shadow-neo-sm font-mono">
              {po.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Supplier: <strong className="text-foreground">{po.supplierName}</strong> ({po.supplierTier})
          </p>
        </SheetHeader>

        <Tabs defaultValue="items" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 border border-black bg-slate-100 font-mono text-xs">
            <TabsTrigger value="items">Items & Financials</TabsTrigger>
            <TabsTrigger value="receipts">Receipt Log ({po.receipts.length})</TabsTrigger>
            <TabsTrigger value="timeline">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Items & Financials Tab */}
          <TabsContent value="items" className="space-y-4 pt-4">
            <div className="rounded-lg border border-border bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination Warehouse:</span>
                <span className="font-semibold">{po.destinationWarehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-mono">{po.orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Delivery:</span>
                <span className="font-mono">{po.expectedDeliveryDate}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-muted-foreground">Total Value:</span>
                <span className="font-mono text-lg font-bold text-foreground">${po.totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Line Items Detail</h4>
              <div className="divide-y divide-border rounded-md border border-border">
                {po.lineItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{item.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold">{item.receivedQuantity} / {item.orderedQuantity} Received</p>
                      <p className="text-xs text-muted-foreground">${item.unitCost} / unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-3 pt-4">
            {po.receipts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No receiving records logged yet.</p>
            ) : (
              po.receipts.map((rc) => (
                <div key={rc.id} className="rounded-md border border-border p-3 space-y-2 text-sm bg-slate-50">
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>{rc.receivedAt}</span>
                    <span className="font-bold text-emerald-700">{rc.warehouseName}</span>
                  </div>
                  <div className="space-y-1">
                    {rc.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{item.productName} ({item.sku})</span>
                        <span className="font-mono font-bold text-emerald-600">+{item.quantityReceived} units</span>
                      </div>
                    ))}
                  </div>
                  {rc.notes && <p className="text-xs italic text-muted-foreground border-t border-border pt-1">"{rc.notes}"</p>}
                </div>
              ))
            )}
          </TabsContent>

          {/* Timeline Audit Tab */}
          <TabsContent value="timeline" className="space-y-3 pt-4 text-xs font-mono">
            <div className="border-l-2 border-black pl-3 space-y-3">
              <div>
                <p className="font-bold text-foreground">ORDER_CREATED</p>
                <p className="text-muted-foreground">{po.orderDate} — Issued to vendor</p>
              </div>
              {po.receipts.map((rc) => (
                <div key={rc.id}>
                  <p className="font-bold text-emerald-700">STOCK_RECEIVED</p>
                  <p className="text-muted-foreground">{rc.receivedAt} — Physical intake processed</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
