"use client";

import * as React from "react";
import { PackageCheck, X } from "lucide-react";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaseOrder } from "../types";

interface ReceiveGoodsModalProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReceive: (
    poId: string,
    receivedItems: { lineItemId: string; quantityReceived: number }[],
    warehouseId: string,
    notes?: string
  ) => void;
}

export function ReceiveGoodsModal({
  po,
  isOpen,
  onClose,
  onConfirmReceive,
}: ReceiveGoodsModalProps) {
  const [receivedQtyMap, setReceivedQtyMap] = React.useState<Record<string, number>>({});
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (po) {
      const initialMap: Record<string, number> = {};
      po.lineItems.forEach((item) => {
        const remaining = Math.max(0, item.orderedQuantity - item.receivedQuantity);
        initialMap[item.id] = remaining;
      });
      setReceivedQtyMap(initialMap);
    }
  }, [po]);

  if (!po) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const receivedItems = po.lineItems.map((item) => ({
      lineItemId: item.id,
      quantityReceived: receivedQtyMap[item.id] || 0,
    }));

    onConfirmReceive(po.id, receivedItems, po.destinationWarehouseId, notes);
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(openStatus: boolean) => !openStatus && onClose()}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="w-full max-w-xl border-2 border-black bg-card p-6 shadow-neo">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
            <DialogTitle className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              Receive Stock Items — <span className="font-mono text-base">{po.poNumber}</span>
            </DialogTitle>
            <DialogClose onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              <span className="font-semibold">Target Warehouse:</span> {po.destinationWarehouseName}
              <br />
              Submitting this form will automatically inject <strong>Stock In</strong> records into your warehouse inventory.
            </div>

            {/* Line Items Receive Inputs */}
            <div className="space-y-3">
              <Label className="font-semibold text-sm">Quantities Received Now</Label>

              {po.lineItems.map((item) => {
                const remaining = Math.max(0, item.orderedQuantity - item.receivedQuantity);
                const currentVal = receivedQtyMap[item.id] ?? remaining;

                return (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3 bg-card">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{item.productName}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        SKU: {item.sku} | Ordered: {item.orderedQuantity} | Received: {item.receivedQuantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Receiving:</span>
                      <Input
                        type="number"
                        min={0}
                        max={remaining}
                        value={currentVal}
                        onChange={(e) =>
                          setReceivedQtyMap((prev) => ({
                            ...prev,
                            [item.id]: Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)),
                          }))
                        }
                        className="w-20 font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <Label className="font-semibold text-sm">Receipt Notes / Inspection Remarks</Label>
              <Input
                placeholder="e.g. Batch 1 inspected. Box condition intact."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="border border-black bg-emerald-600 font-medium text-white shadow-neo hover:bg-emerald-700"
              >
                Confirm Stock Receipt
              </Button>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
