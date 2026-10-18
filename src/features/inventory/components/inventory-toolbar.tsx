"use client";

import { useI18n } from "@/lib/i18n/context";

interface InventoryToolbarProps {
  totalItems: number;
}

export function InventoryToolbar({ totalItems }: InventoryToolbarProps) {
  const { t } = useI18n();

  return (
    <section className="flex flex-wrap justify-between items-center gap-4 mb-5">
      <div>
        <h3 className="font-display font-[900] uppercase text-xl tracking-tight">
          {t.inventory.inventoryItem}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mt-1">
          {totalItems.toLocaleString("id-ID")} {t.inventory.totalCatalogItems}
        </p>
      </div>
    </section>
  );
}
