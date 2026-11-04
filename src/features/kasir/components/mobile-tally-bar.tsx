"use client";

import * as React from "react";
import { ReceiptText, ChevronUp } from "lucide-react";
import type { TallyItem, TallyTotals } from "../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TallySheet } from "./tally-sheet";

interface MobileTallyBarProps {
  tally: TallyItem[];
  totals: TallyTotals;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onReset: () => void;
  onOpenClosing: () => void;
}

export function MobileTallyBar({
  tally,
  totals,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
  onReset,
  onOpenClosing,
}: MobileTallyBarProps) {
  const [open, setOpen] = React.useState(false);
  const revenueFmt = new Intl.NumberFormat("id-ID").format(totals.expectedRevenue);

  const handleOpenClosing = () => {
    setOpen(false);
    onOpenClosing();
  };

  return (
    <div className="lg:hidden fixed bottom-16 md:bottom-4 left-0 right-0 z-40 p-3 pointer-events-none">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="w-full pointer-events-auto h-14 bg-foreground text-background border-[3px] border-border shadow-hard flex items-center justify-between px-4 cursor-pointer active:translate-x-[2px] active:translate-y-[2px]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary text-primary-foreground border-[3px] border-border">
              <ReceiptText className="h-4 w-4" />
            </div>
            <div className="text-left font-mono">
              <span className="text-[10px] uppercase text-muted block leading-none">
                Nota ({totals.totalQuantity} item)
              </span>
              <span className="text-sm font-bold text-background">
                Rp{revenueFmt}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs font-bold uppercase text-primary-foreground bg-primary px-3 py-1.5 border-[3px] border-border">
            <span>Buka Nota</span>
            <ChevronUp className="h-4 w-4" />
          </div>
        </SheetTrigger>

        <SheetContent side="bottom" className="p-0 max-h-[85vh] border-t-[3px] border-border bg-card">
          <SheetHeader className="sr-only">
            <SheetTitle>Nota Penjualan Harian</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-hidden">
            <TallySheet
              tally={tally}
              totals={totals}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onSetQuantity={onSetQuantity}
              onRemove={onRemove}
              onReset={() => {
                onReset();
                setOpen(false);
              }}
              onOpenClosing={handleOpenClosing}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
