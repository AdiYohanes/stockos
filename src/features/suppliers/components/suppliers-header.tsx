"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { useI18n } from "@/lib/i18n/context";

interface SuppliersHeaderProps {
  totalCount: number;
  onOpenCreateModal: () => void;
}

export function SuppliersHeader({
  totalCount,
  onOpenCreateModal,
}: SuppliersHeaderProps) {
  const { language, t } = useI18n();

  const actionButtons = (
    <Button
      type="button"
      onClick={onOpenCreateModal}
      className="h-9 gap-2 bg-[#543afd] hover:bg-[#462ee0] text-white border-[1.5px] border-black font-semibold text-xs shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
    >
      <Plus className="h-3.5 w-3.5" />
      <span>{t.suppliers.addSupplier}</span>
    </Button>
  );

  return (
    <PageHeader
      title={t.suppliers.title}
      badgeText={`${totalCount} ${language === "id" ? "PEMASOK" : "SUPPLIERS"}`}
      description={t.suppliers.subtitle}
      actions={actionButtons}
    />
  );
}
