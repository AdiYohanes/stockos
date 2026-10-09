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
    isIn ? `IN-2026-REC` : `SO-2026-DISP`
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
        {error && <p role="alert" className="text-[10px] font-bold uppercase tracking-widest text-destructive">{error}</p>}
        {/* Product Info Card */}
        <div className="border-[3px] border-ink bg-paper p-3 flex items-center justify-between shadow-hard-sm">
          <div className="min-w-0 pr-2 space-y-1">
            <SkuBadge code={product.sku} />
            <p className="font-sans font-bold uppercase text-xs text-ink truncate">
              {product.name}
            </p>
          </div>
          <div className="text-right shrink-0 font-mono tabular-nums text-xs">
            <span className="text-[10px] text-ink/60 font-bold uppercase tracking-widest block font-sans">Current</span>
            <strong className="text-ink text-sm">{product.currentStock} {product.unit}</strong>
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label htmlFor="mov-qty" className="text-[10px] font-bold uppercase tracking-widest text-ink">
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
            className="h-10 font-mono tabular-nums text-sm font-bold border-[3px] border-ink rounded-none bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow"
          />
        </div>

        {/* Reference */}
        <div className="space-y-1.5">
          <Label htmlFor="mov-ref" className="text-[10px] font-bold uppercase tracking-widest text-ink">Reference Code *</Label>
          <Input
            id="mov-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. IN-2026-101"
            required
            className="h-10 font-mono tabular-nums uppercase text-xs sm:text-sm border-[3px] border-ink rounded-none bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow"
          />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="mov-note" className="text-[10px] font-bold uppercase tracking-widest text-ink">Reason / Note</Label>
          <Input
            id="mov-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Brief note..."
            className="h-10 text-xs sm:text-sm border-[3px] border-ink rounded-none bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow"
          />
        </div>
      </DialogBody>

      <DialogFooter className="mt-4 pt-3 border-t-[3px] border-ink">
        <DialogClose
          render={<Button variant="outline" size="sm" type="button" className="h-10 px-4 rounded-none border-[3px] border-ink text-[10px] font-bold uppercase tracking-widest text-ink bg-white shadow-hard-sm press" />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          size="sm"
          className={cn(
            "h-10 px-4 rounded-none border-[3px] border-ink text-[10px] font-bold uppercase tracking-widest text-ink shadow-hard-sm press flex items-center gap-1.5",
            isIn
              ? "bg-emerald-400 hover:bg-emerald-500"
              : "bg-rose-400 hover:bg-rose-500"
          )}
        >
          {isIn ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
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
        <DialogPopup className="max-w-md overflow-hidden rounded-none border-[3px] border-ink shadow-hard-lg bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center border-[3px] border-ink shrink-0 shadow-hard-sm",
                  isIn
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                )}
              >
                {isIn ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-ink uppercase tracking-wider font-sans">
                  {isIn ? "Stock In (Receive Inventory)" : "Stock Out (Issue Inventory)"}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
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
