"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { useI18n } from "@/lib/i18n/context";

export function ProductsHeader({ onAdd }: { onAdd: () => void }) {
  const { t } = useI18n();
  return <PageHeader title={t.products.title} description={t.products.subtitle} actions={
    <button type="button" onClick={onAdd} className="btn-neo-primary h-10 gap-2 px-5 text-xs flex items-center justify-center">
      <Plus className="h-4 w-4" /><span>{t.products.addProduct}</span>
    </button>
  } />;
}
