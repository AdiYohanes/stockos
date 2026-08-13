"use client";

import * as React from "react";
import { Warehouse, Plus, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

interface WarehousesHeaderProps {
  totalCount: number;
  onOpenCreateModal: () => void;
  onOpenTransferModal: () => void;
}

export function WarehousesHeader({
  totalCount,
  onOpenCreateModal,
  onOpenTransferModal,
}: WarehousesHeaderProps) {
  const { language, t } = useI18n();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
      {/* Title & Eyebrow */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white border border-black shadow-neo-sm">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t.warehouses.title}
            </h1>
            <span className="font-mono text-[13px] font-semibold px-2.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-300">
              {totalCount} {language === "id" ? "Lokasi" : "Facilities"}
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground ml-12">
          {t.warehouses.subtitle}
        </p>
      </div>

      {/* Action CTAs */}
      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenTransferModal}
          className="h-9 gap-2 border-[1.5px] border-black bg-white font-medium text-xs text-foreground shadow-neo-sm hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span>{language === "id" ? "Transfer Stok" : "Transfer Stock"}</span>
        </Button>

        <Button
          type="button"
          onClick={onOpenCreateModal}
          className="h-9 gap-2 bg-[#543afd] hover:bg-[#462ee0] text-white border-[1.5px] border-black font-semibold text-xs shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t.warehouses.addWarehouse}</span>
        </Button>
      </div>
    </div>
  );
}
