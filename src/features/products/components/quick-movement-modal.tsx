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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10) || 0;
    if (qty > 0) {
      onRecordMovement(product.id, type, qty, reference, note);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody className="space-y-3">
        {/* Product Info Card */}
        <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-wider">
              {product.sku}
            </span>
            <p className="font-heading font-semibold text-xs text-foreground truncate">
              {product.name}
            </p>
          </div>
          <div className="text-right shrink-0 font-mono text-xs">
            <span className="text-[10px] text-muted-foreground block">Current</span>
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
            className="input-neo font-mono text-base font-bold"
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
            className="input-neo font-mono uppercase"
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
            className="input-neo"
          />
        </div>
      </DialogBody>

      <DialogFooter className="mt-4 pt-3 border-t border-border">
        <DialogClose
          render={<Button variant="outline" size="sm" type="button" className="btn-neo" />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          size="sm"
          className={cn(
            "gap-1.5",
            isIn ? "btn-neo bg-[#15803d] text-white hover:bg-[#166534]" : "btn-neo bg-[#b91c1c] text-white hover:bg-[#991b1b]"
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
        <DialogPopup className="max-w-md overflow-hidden border-2 border-black shadow-neo">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-black shadow-neo-sm shrink-0",
                  isIn ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#b91c1c]"
                )}
              >
                {isIn ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground font-heading">
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
