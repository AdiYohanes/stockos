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
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "../types";

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetItem: InventoryItem | null;
  defaultType: "in" | "out" | null;
  allItems: InventoryItem[];
  onRecordMovement: (
    itemId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => void;
}

interface FormInnerProps {
  initialItem: InventoryItem | null;
  initialType: "in" | "out" | null;
  allItems: InventoryItem[];
  onSubmit: (
    itemId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => void;
  onCancel: () => void;
}

function StockMovementForm({
  initialItem,
  initialType,
  allItems,
  onSubmit,
  onCancel,
}: FormInnerProps) {
  const [selectedItemId, setSelectedItemId] = React.useState<string>(
    initialItem ? initialItem.id : allItems[0]?.id || ""
  );
  const [type, setType] = React.useState<"in" | "out">(initialType || "in");
  const [quantity, setQuantity] = React.useState<string>("");
  const [reference, setReference] = React.useState<string>(
    initialType === "out" ? "SO-DISP" : "PO-REC"
  );
  const [note, setNote] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const activeItem = allItems.find((i) => i.id === selectedItemId) || initialItem;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity greater than 0.");
      return;
    }

    if (!activeItem) {
      setError("Please select an item.");
      return;
    }

    if (type === "out" && qty > activeItem.currentStock) {
      setError(
        `Cannot dispatch ${qty} ${activeItem.unit}. Available on hand: ${activeItem.currentStock} ${activeItem.unit}.`
      );
      return;
    }

    if (!reference.trim()) {
      setError("Please provide a reference code (e.g. PO number, Sales Order, Work Order).");
      return;
    }

    onSubmit(activeItem.id, type, qty, reference.trim().toUpperCase(), note.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody className="space-y-4">
        {/* 1. Type Switcher */}
        <div>
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Movement Type
          </Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => {
                setType("in");
                if (!reference || reference.startsWith("SO-")) {
                  setReference("PO-REC");
                }
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold border transition-all",
                type === "in"
                  ? "bg-emerald-600 text-white border-black shadow-neo-sm font-bold"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              )}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Stock In (Receive +)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("out");
                if (!reference || reference.startsWith("PO-")) {
                  setReference("SO-DISP");
                }
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold border transition-all",
                type === "out"
                  ? "bg-rose-600 text-white border-black shadow-neo-sm font-bold"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Stock Out (Dispatch -)</span>
            </button>
          </div>
        </div>

        {/* 2. Item Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="itemSelect" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Inventory Item
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
              onChange={(e) => setSelectedItemId(e.target.value)}
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

        {/* 3. Quantity & Reference Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="quantity" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Quantity ({activeItem?.unit || "units"})
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="e.g. 25"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-9 text-xs font-mono border-slate-300 focus:border-black"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Reference Code
            </Label>
            <Input
              id="reference"
              type="text"
              placeholder="PO-XXXX / SO-XXXX"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-9 text-xs font-mono uppercase border-slate-300 focus:border-black"
            />
          </div>
        </div>

        {/* 4. Notes / Reason */}
        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Transaction Note (Optional)
          </Label>
          <Input
            id="note"
            type="text"
            placeholder="e.g. Received from Supplier X / Order fulfillment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 text-xs border-slate-300 focus:border-black"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-sans">
            {error}
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
          className={cn(
            "text-xs font-semibold border-[1.5px] border-black text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5",
            type === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
          )}
        >
          Confirm {type === "in" ? "Stock In" : "Stock Out"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StockMovementModal({
  open,
  onOpenChange,
  targetItem,
  defaultType,
  allItems,
  onRecordMovement,
}: StockMovementModalProps) {
  // Keyed form pattern for React 19 safety
  const formKey = `${targetItem?.id || "general"}-${defaultType || "in"}-${open}`;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md border-[1.5px] border-black p-0 shadow-neo">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">
              Record Stock Movement
            </DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Log physical receiving (IN) or dispatch (OUT) with reference auditing
            </DialogDescription>
          </DialogHeader>

          {open && (
            <StockMovementForm
              key={formKey}
              initialItem={targetItem}
              initialType={defaultType}
              allItems={allItems}
              onSubmit={(itemId, type, qty, ref, note) => {
                onRecordMovement(itemId, type, qty, ref, note);
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
