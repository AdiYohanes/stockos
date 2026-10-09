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
import { SkuBadge } from "@/components/shared/sku-badge";
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
    initialType === "out" ? "SO-DISP" : "IN-REC"
  );
  const [note, setNote] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const activeItem = allItems.find((i) => i.id === selectedItemId) || initialItem;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (!Number.isSafeInteger(qty) || qty <= 0) {
      setError("Please enter a valid quantity greater than 0.");
      return;
    }

    if (!activeItem) {
      setError("Please select an item.");
      return;
    }

    if (type === "out" && qty > activeItem.availableStock) {
      setError(
        `Cannot dispatch ${qty} ${activeItem.unit}. Available stock: ${activeItem.availableStock} ${activeItem.unit}.`
      );
      return;
    }

    if (!reference.trim()) {
      setError("Please provide a reference code (e.g. receipt or sale number).");
      return;
    }

    try {
      onSubmit(activeItem.id, type, qty, reference.trim().toUpperCase(), note.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record movement");
    }
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
                  setReference("IN-REC");
                }
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-none text-xs font-medium border transition-colors cursor-pointer",
                type === "in"
                  ? "bg-emerald-600 text-white border-transparent hover:bg-emerald-700"
                  : "bg-background text-foreground border-ink hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Stock In (Receive +)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("out");
                if (!reference || reference.startsWith("IN-")) {
                  setReference("SO-DISP");
                }
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-none text-xs font-medium border transition-colors cursor-pointer",
                type === "out"
                  ? "bg-rose-600 text-white border-transparent hover:bg-rose-700"
                  : "bg-background text-foreground border-ink hover:bg-slate-50 dark:hover:bg-slate-800"
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
            <div className="p-3 rounded-none border-[3px] border-ink bg-slate-50/60 dark:bg-slate-900/40 text-xs flex items-center justify-between">
              <div className="flex flex-col gap-1 min-w-0 pr-2">
                <SkuBadge code={initialItem.sku} />
                <span className="font-sans font-medium text-foreground truncate">{initialItem.name}</span>
                <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                  Shelf: {initialItem.locationBin}
                </span>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-foreground shrink-0 text-right">
                {initialItem.currentStock} {initialItem.unit}
                <span className="block text-[10px] font-sans text-muted-foreground font-normal">on hand</span>
              </span>
            </div>
          ) : (
            <select
              id="itemSelect"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-9 rounded-none border-[3px] border-ink bg-background px-3 text-xs font-medium text-foreground focus:border-slate-900 focus:outline-none"
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
              Quantity ({activeItem?.unit || "units"}) *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="e.g. 25"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="h-9 text-xs font-mono tabular-nums border-ink focus:border-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Reference Code *
            </Label>
            <Input
              id="reference"
              type="text"
              placeholder="IN-XXXX / SO-XXXX"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              className="h-9 text-xs font-mono tabular-nums uppercase border-ink focus:border-slate-900"
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
            className="h-9 text-xs border-ink focus:border-slate-900"
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-400 font-sans"
          >
            {error}
          </div>
        )}
      </DialogBody>

      {/* Footer */}
      <DialogFooter className="mt-4 pt-3 border-t border-ink">
        <DialogClose
          render={<Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-9 text-xs border-ink hover:border-slate-400" />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          size="sm"
          className={cn(
            "h-9 text-xs font-medium text-white",
            type === "in"
              ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
          )}
        >
          {type === "in" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
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
        <DialogPopup className="max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Record Stock Movement
            </DialogTitle>
            <DialogDescription className="font-mono tabular-nums text-xs uppercase tracking-wider text-muted-foreground">
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
