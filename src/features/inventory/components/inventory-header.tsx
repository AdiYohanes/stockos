"use client";

import * as React from "react";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
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

  const actionButtons = (
    <>
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
    </>
  );

  return (
    <PageHeader
      title={t.inventory.title}
      badgeText={`${totalItems} ${t.common.items}`}
      description={t.inventory.subtitle}
      actions={actionButtons}
    />
  );
}
