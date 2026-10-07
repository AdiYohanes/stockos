"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Product } from "../types";

interface QuickMovementModalProps {
  product: Product | null;
  type: "in" | "out" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordMovement: (
    productId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => void;
}

interface QuickMovementFormProps {
  product: Product;
  type: "in" | "out";
  onClose: () => void;
  onRecordMovement: (
    productId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => void;
}

function QuickMovementForm({
  product,
  type,
  onClose,
  onRecordMovement,
}: QuickMovementFormProps) {
  const isIn = type === "in";
  const [quantity, setQuantity] = React.useState("10");
  const [reference, setReference] = React.useState(
    isIn ? `PO-2026-REC` : `SO-2026-DISP`
  );
  const [note, setNote] = React.useState(
    isIn ? "Received inbound restock shipment." : "Outbound order dispatch."
  );

  const [error, setError] = React.useState<string | null>(null);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      onRecordMovement(product.id, type, Number(quantity), reference, note);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to record movement.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody className="space-y-3">
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {/* Product Info Card */}
        <div className="rounded-md border border-border bg-slate-50/60 dark:bg-slate-900/40 p-3 flex items-center justify-between">
          <div className="min-w-0 pr-2 space-y-1">
            <SkuBadge code={product.sku} />
            <p className="font-sans font-medium text-xs text-foreground truncate">
              {product.name}
            </p>
          </div>
          <div className="text-right shrink-0 font-mono tabular-nums text-xs">
            <span className="text-[10px] text-muted-foreground block font-sans">Current</span>
            <strong>{product.currentStock} {product.unit}</strong>
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <Label htmlFor="mov-qty">
            Quantity to {isIn ? "Add" : "Deduct"} ({product.unit}) *
          </Label>
          <Input
            id="mov-qty"
            type="number"
            min="1"
            max={!isIn ? product.currentStock : undefined}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="h-9 font-mono tabular-nums text-sm font-semibold"
          />
        </div>

        {/* Reference */}
        <div className="space-y-1">
          <Label htmlFor="mov-ref">Reference Code *</Label>
          <Input
            id="mov-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. PO-2026-101"
            required
            className="h-9 font-mono tabular-nums uppercase text-xs sm:text-sm"
          />
        </div>

        {/* Note */}
        <div className="space-y-1">
          <Label htmlFor="mov-note">Reason / Note</Label>
          <Input
            id="mov-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Brief note..."
            className="h-9 text-xs sm:text-sm"
          />
        </div>
      </DialogBody>

      <DialogFooter className="mt-4 pt-3 border-t border-border">
        <DialogClose
          render={<Button variant="outline" size="sm" type="button" className="h-9 text-xs hover:border-slate-400" />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          size="sm"
          className={cn(
            "h-9 text-xs font-medium gap-1.5 text-white",
            isIn
              ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
          )}
        >
          {isIn ? <ArrowDownToLine className="h-3.5 w-3.5" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
          Confirm {isIn ? "Stock In" : "Stock Out"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function QuickMovementModal({
  product,
  type,
  open,
  onOpenChange,
  onRecordMovement,
}: QuickMovementModalProps) {
  if (!product || !type) return null;
  const isIn = type === "in";

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md border shrink-0",
                  isIn
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                )}
              >
                {isIn ? <ArrowDownToLine className="h-4.5 w-4.5" /> : <ArrowUpFromLine className="h-4.5 w-4.5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground font-sans">
                  {isIn ? "Stock In (Receive Inventory)" : "Stock Out (Issue Inventory)"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record immediate inventory movement for this product
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <QuickMovementForm
            key={`${product.id}-${type}`}
            product={product}
            type={type}
            onClose={() => onOpenChange(false)}
            onRecordMovement={onRecordMovement}
          />
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
