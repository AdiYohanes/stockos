"use client";

import * as React from "react";
import { Boxes, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

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
  const { language, t } = useI18n();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
      {/* Title & Eyebrow */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white border border-black shadow-neo-sm">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t.inventory.title}
            </h1>
            <span className="font-mono text-[13px] font-semibold px-2.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-300">
              {totalItems} {t.common.items}
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground ml-12">
          {t.inventory.subtitle}
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
          <span>{t.inventory.adjustStock}</span>
        </Button>

        <Button
          type="button"
          onClick={onOpenMovementModal}
          className="h-9 gap-2 bg-[#543afd] hover:bg-[#462ee0] text-white border-[1.5px] border-black font-semibold text-xs shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>{language === "id" ? "Catat Pergerakan" : "Record Movement"}</span>
        </Button>
      </div>
    </div>
  );
}
