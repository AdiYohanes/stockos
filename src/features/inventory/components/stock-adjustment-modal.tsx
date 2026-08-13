"use client";

import * as React from "react";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdjustmentReason, InventoryItem } from "../types";

export interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetItem: InventoryItem | null;
  allItems: InventoryItem[];
  onAdjustStock: (
    itemId: string,
    newStock: number,
    reason: AdjustmentReason,
    reference: string,
    note?: string
  ) => void;
}

interface FormInnerProps {
  initialItem: InventoryItem | null;
  allItems: InventoryItem[];
  onSubmit: (
    itemId: string,
    newStock: number,
    reason: AdjustmentReason,
    reference: string,
    note?: string
  ) => void;
  onCancel: () => void;
}

function StockAdjustmentForm({
  initialItem,
  allItems,
  onSubmit,
  onCancel,
}: FormInnerProps) {
  const [selectedItemId, setSelectedItemId] = React.useState<string>(
    initialItem ? initialItem.id : allItems[0]?.id || ""
  );
  const activeItem = allItems.find((i) => i.id === selectedItemId) || initialItem;

  const [newStockStr, setNewStockStr] = React.useState<string>(
    activeItem ? activeItem.currentStock.toString() : "0"
  );
  const [reason, setReason] = React.useState<AdjustmentReason>("cycle_count");
  const [reference, setReference] = React.useState<string>("ADJ-AUDIT");
  const [note, setNote] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const currentStock = activeItem ? activeItem.currentStock : 0;
  const newStockNum = parseInt(newStockStr, 10);
  const delta = isNaN(newStockNum) ? 0 : newStockNum - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(newStockNum) || newStockNum < 0) {
      setError("Please enter a valid non-negative physical stock count.");
      return;
    }

    if (!activeItem) {
      setError("Please select an item.");
      return;
    }

    if (delta === 0) {
      setError("The new stock quantity is identical to the current stock. No adjustment needed.");
      return;
    }

    if (!reference.trim()) {
      setError("Please specify an adjustment reference code.");
      return;
    }

    onSubmit(activeItem.id, newStockNum, reason, reference.trim().toUpperCase(), note.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody className="space-y-4">
        {/* 1. Item Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="itemSelect" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Select Inventory Item
          </Label>
          {initialItem ? (
            <div className="p-2.5 rounded-md border border-slate-300 bg-slate-50 text-xs flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-heading font-semibold text-foreground">{initialItem.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  SKU: {initialItem.sku} • {initialItem.warehouse}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-foreground">
                {initialItem.currentStock} {initialItem.unit} on hand
              </span>
            </div>
          ) : (
            <select
              id="itemSelect"
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const nextItem = allItems.find((i) => i.id === e.target.value);
                if (nextItem) setNewStockStr(nextItem.currentStock.toString());
              }}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-foreground focus:border-black focus:outline-none"
            >
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} - {item.name} ({item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 2. Current vs New Stock Comparison & Delta */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <span className="text-[11px] font-mono uppercase text-muted-foreground block">
              Current On-Hand
            </span>
            <span className="font-mono text-lg font-bold text-slate-700">
              {currentStock} <span className="text-xs font-normal text-muted-foreground">{activeItem?.unit}</span>
            </span>
          </div>

          <div>
            <Label htmlFor="newStock" className="text-[11px] font-mono uppercase text-muted-foreground block">
              Actual Physical Count
            </Label>
            <Input
              id="newStock"
              type="number"
              min="0"
              value={newStockStr}
              onChange={(e) => setNewStockStr(e.target.value)}
              className="h-8 text-xs font-mono font-bold bg-white border-slate-300 focus:border-black"
            />
          </div>

          {/* Delta feedback */}
          <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">Calculated Adjustment:</span>
            <span
              className={cn(
                "font-bold px-2 py-0.5 rounded-sm border",
                delta > 0 && "bg-emerald-50 text-emerald-800 border-emerald-300",
                delta < 0 && "bg-rose-50 text-rose-800 border-rose-300",
                delta === 0 && "bg-slate-100 text-slate-700 border-slate-300"
              )}
            >
              {delta > 0 ? `+${delta}` : delta} {activeItem?.unit || "units"}
            </span>
          </div>
        </div>

        {/* 3. Reason Code & Reference */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reasonSelect" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Adjustment Reason
            </Label>
            <select
              id="reasonSelect"
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-foreground focus:border-black focus:outline-none"
            >
              <option value="cycle_count">Cycle Count Audit</option>
              <option value="damaged_goods">Damaged Goods</option>
              <option value="expired">Expired / Obsolete</option>
              <option value="theft_loss">Discrepancy / Loss</option>
              <option value="supplier_return">Supplier Return</option>
              <option value="correction">Correction Entry</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjReference" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Reference Code
            </Label>
            <Input
              id="adjReference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-9 text-xs font-mono uppercase border-slate-300 focus:border-black"
            />
          </div>
        </div>

        {/* 4. Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="adjNote" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Audit Note / Justification
          </Label>
          <Input
            id="adjNote"
            type="text"
            placeholder="e.g. Annual physical count variance in shelf A-02"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 text-xs border-slate-300 focus:border-black"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-sans flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </DialogBody>

      {/* Footer */}
      <DialogFooter className="gap-2 pt-2">
        <DialogClose
          render={<Button type="button" variant="outline" onClick={onCancel} className="text-xs border-slate-300" />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          className="text-xs font-semibold bg-black hover:bg-slate-800 border-[1.5px] border-black text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5"
        >
          Apply Adjustment
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  targetItem,
  allItems,
  onAdjustStock,
}: StockAdjustmentModalProps) {
  // Keyed form pattern for React 19 safety
  const formKey = `${targetItem?.id || "general"}-${open}`;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md border-[1.5px] border-black p-0 shadow-neo">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Stock Adjustment & Audit</span>
            </DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Reconcile physical stock count with audit reason codes
            </DialogDescription>
          </DialogHeader>

          {open && (
            <StockAdjustmentForm
              key={formKey}
              initialItem={targetItem}
              allItems={allItems}
              onSubmit={(itemId, newStock, reason, ref, note) => {
                onAdjustStock(itemId, newStock, reason, ref, note);
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
