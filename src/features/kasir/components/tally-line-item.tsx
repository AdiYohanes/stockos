"use client";

import * as React from "react";
import { Plus, Minus, Trash2, AlertTriangle } from "lucide-react";
import type { TallyItem } from "../types";
import { cn } from "@/lib/utils";

interface TallyLineItemProps {
  item: TallyItem;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function TallyLineItem({
  item,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
}: TallyLineItemProps) {
  const isOverflow = item.quantity > item.availableStock;
  const subtotal = item.quantity * item.sellingPrice;
  const subtotalFmt = new Intl.NumberFormat("id-ID").format(subtotal);
  const priceFmt = new Intl.NumberFormat("id-ID").format(item.sellingPrice);

  const [prevQuantity, setPrevQuantity] = React.useState(item.quantity);
  const [localQtyStr, setLocalQtyStr] = React.useState(String(item.quantity));

  if (item.quantity !== prevQuantity) {
    setPrevQuantity(item.quantity);
    setLocalQtyStr(String(item.quantity));
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalQtyStr(raw);

    const val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0) {
      onSetQuantity(item.productId, val);
    }
  };

  const handleBlur = () => {
    const val = parseInt(localQtyStr, 10);
    if (isNaN(val) || val <= 0) {
      setLocalQtyStr(String(item.quantity));
    } else {
      onSetQuantity(item.productId, val);
    }
  };

  return (
    <div
      className={cn(
        "p-2.5 border-[3px] transition-colors flex flex-col gap-2",
        isOverflow
          ? "border-destructive bg-destructive/10"
          : "border-border bg-card hover:border-foreground"
      )}
    >
      {/* Product Title & Subtotal */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase text-muted-foreground font-bold">
              {item.sku}
            </span>
          </div>
          <h4 className="font-heading font-bold text-xs uppercase text-foreground truncate">
            {item.name}
          </h4>
          <span className="font-mono text-[11px] text-muted-foreground">
            Rp{priceFmt} / {item.unit}
          </span>
        </div>

        <div className="text-right">
          <span className="font-mono font-bold text-sm text-foreground block">
            Rp{subtotalFmt}
          </span>
        </div>
      </div>

      {/* Overflow Warning Pill */}
      {isOverflow && (
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-destructive bg-destructive/10 px-2 py-0.5 border-[2px] border-destructive">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>Melebihi stok sistem (Sisa: {item.availableStock})</span>
        </div>
      )}

      {/* Controls: [-] [input] [+] [Delete] */}
      <div className="flex items-center justify-between pt-1 border-t-[2px] border-border">
        <div className="flex items-center border-[2px] border-border bg-background">
          <button
            type="button"
            onClick={() => onDecrement(item.productId)}
            aria-label="Kurangi satu"
            className="h-7 w-7 flex items-center justify-center hover:bg-muted text-foreground border-r-[2px] border-border cursor-pointer active:bg-muted/80"
          >
            <Minus className="h-3 w-3" />
          </button>

          <input
            type="number"
            min={1}
            value={localQtyStr}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-12 h-7 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
          />

          <button
            type="button"
            onClick={() => onIncrement(item.productId)}
            aria-label="Tambah satu"
            className="h-7 w-7 flex items-center justify-center hover:bg-muted text-foreground border-l-[2px] border-border cursor-pointer active:bg-muted/80"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          title="Hapus dari nota"
          className="h-7 px-2 flex items-center gap-1 text-[10px] font-mono uppercase text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Hapus</span>
        </button>
      </div>
    </div>
  );
}
