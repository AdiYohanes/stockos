"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
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
import type { PurchaseOrder, POLineItem } from "../types";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (po: PurchaseOrder) => void;
}

export function CreatePOModal({ isOpen, onClose, onCreate }: CreatePOModalProps) {
  const [supplierId, setSupplierId] = React.useState("sup-1");
  const [warehouseId, setWarehouseId] = React.useState("wh-1");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState("2026-08-25");
  const [notes, setNotes] = React.useState("");

  const [lineItems, setLineItems] = React.useState<POLineItem[]>([
    {
      id: `li-${Date.now()}-1`,
      productId: "prod-1",
      productName: "NVIDIA RTX 4090 GPU",
      sku: "GPU-NV-4090",
      orderedQuantity: 5,
      receivedQuantity: 0,
      unitCost: 1600,
    },
  ]);

  const totalCost = React.useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.orderedQuantity * item.unitCost, 0);
  }, [lineItems]);

  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}-${prev.length + 1}`,
        productId: "prod-2",
        productName: "Intel i9 14900K Processor",
        sku: "CPU-INT-14900K",
        orderedQuantity: 5,
        receivedQuantity: 0,
        unitCost: 500,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: "orderedQuantity" | "unitCost", value: number) => {
    setLineItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const suppliersMap: Record<string, { name: string; tier: string }> = {
      "sup-1": { name: "Nvidia Global Logistics", tier: "Tier 1 Preferred" },
      "sup-2": { name: "Logitech Official Direct", tier: "Tier 1 Preferred" },
      "sup-3": { name: "Samsung Semiconductor Asia", tier: "Tier 2 Standard" },
      "sup-4": { name: "ASUS Tek Procurement", tier: "Tier 2 Standard" },
    };

    const warehouseMap: Record<string, string> = {
      "wh-1": "Gudang Utama Jakarta",
      "wh-2": "Hub Surabaya",
      "wh-3": "Depot Medan",
    };

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-0${Math.floor(Math.random() * 90) + 10}`,
      supplierId,
      supplierName: suppliersMap[supplierId]?.name || "Vendor",
      supplierTier: suppliersMap[supplierId]?.tier || "Tier 1",
      destinationWarehouseId: warehouseId,
      destinationWarehouseName: warehouseMap[warehouseId] || "Main Warehouse",
      status: "ISSUED",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate,
      totalCost,
      lineItems,
      receipts: [],
      notes,
    };

    onCreate(newPo);
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(openStatus: boolean) => !openStatus && onClose()}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="w-full max-w-2xl border-2 border-black bg-card p-6 shadow-neo">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
            <DialogTitle className="font-heading text-xl font-bold tracking-tight">
              Create Purchase Order
            </DialogTitle>
            <DialogClose onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-sm">Supplier Vendor</Label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm font-medium focus:border-black focus:ring-2 focus:ring-[#543afd]"
                >
                  <option value="sup-1">Nvidia Global Logistics</option>
                  <option value="sup-2">Logitech Official Direct</option>
                  <option value="sup-3">Samsung Semiconductor Asia</option>
                  <option value="sup-4">ASUS Tek Procurement</option>
                </select>
              </div>

              <div>
                <Label className="font-semibold text-sm">Destination Warehouse</Label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm font-medium focus:border-black focus:ring-2 focus:ring-[#543afd]"
                >
                  <option value="wh-1">Gudang Utama Jakarta</option>
                  <option value="wh-2">Hub Surabaya</option>
                  <option value="wh-3">Depot Medan</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="font-semibold text-sm">Expected Delivery Date</Label>
              <Input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            {/* Line Items Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm">Order Items List</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-md border border-border p-2 bg-slate-50">
                    <div className="flex-1">
                      <span className="font-semibold text-xs text-foreground">{item.productName}</span>
                      <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">{item.sku}</span>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min={1}
                        value={item.orderedQuantity}
                        onChange={(e) => handleUpdateItem(item.id, "orderedQuantity", parseInt(e.target.value) || 1)}
                        className="h-8 text-xs text-center font-mono"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        value={item.unitCost}
                        onChange={(e) => handleUpdateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs text-right font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold text-sm text-muted-foreground">Total Estimated Cost:</span>
              <span className="font-mono text-xl font-bold text-foreground">${totalCost.toLocaleString()}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="border border-black bg-[#543afd] font-medium text-white shadow-neo hover:bg-[#462ee0]"
              >
                Issue Purchase Order
              </Button>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
