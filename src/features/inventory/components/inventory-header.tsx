"use client";

import * as React from "react";
import { Boxes, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryHeaderProps {
  totalItems: number;
  onOpenMovementModal: () => void;
  onOpenAdjustmentModal: () => void;
}

export function InventoryHeader({
  totalItems,
  onOpenMovementModal,
  onOpenAdjustmentModal,
}: InventoryHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
      {/* Title & Eyebrow */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-white border border-black shadow-neo-sm">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Inventory Control
            </h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-300">
              {totalItems} Items
            </span>
          </div>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground ml-10">
          Real-time stock balance, warehouse allocations & movement logs
        </p>
      </div>

      {/* Action CTAs */}
      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenAdjustmentModal}
          className="h-9 gap-2 border-[1.5px] border-black bg-white font-medium text-xs text-foreground shadow-neo-sm hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Adjust Stock</span>
        </Button>

        <Button
          type="button"
          onClick={onOpenMovementModal}
          className="h-9 gap-2 bg-[#543afd] hover:bg-[#462ee0] text-white border-[1.5px] border-black font-semibold text-xs shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>Record Movement</span>
        </Button>
      </div>
    </div>
  );
}
