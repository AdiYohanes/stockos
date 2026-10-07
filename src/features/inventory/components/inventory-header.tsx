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
        size="sm"
        onClick={onOpenAdjustmentModal}
        className="h-9 gap-1.5 px-3 text-xs font-medium text-foreground hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-800"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{t.inventory.adjustStock}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        onClick={onOpenMovementModal}
        className="h-9 gap-1.5 px-3.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-none"
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
