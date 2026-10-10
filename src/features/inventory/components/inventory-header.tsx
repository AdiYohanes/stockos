"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { useI18n } from "@/lib/i18n/context";

interface InventoryHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenMovementModal: () => void;
  onOpenAdjustmentModal: () => void;
}

export function InventoryHeader({
  searchQuery,
  onSearchChange,
  onOpenMovementModal,
  onOpenAdjustmentModal,
}: InventoryHeaderProps) {
  const { t } = useI18n();

  const [localSearch, setLocalSearch] = React.useState(searchQuery);

  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  return (
    <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[.18em] opacity-50 mb-2">
          {t.nav.platform} / {t.nav.inventory}
        </p>
        <h2 className="font-display font-[900] uppercase tracking-tighter text-4xl md:text-5xl leading-[.9]">
          {t.inventory.title}<br />
          <span>overview.</span>
        </h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center bg-white border-[3px] border-ink shadow-hard-sm">
          <Icon icon="ph:magnifying-glass-bold" className="ml-3 text-ink text-lg" />
          <input
            className="input-focus w-full sm:w-64 px-3 py-3 bg-transparent font-body text-sm text-ink placeholder:text-ink/50"
            placeholder={t.inventory.searchStockPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <button
          onClick={onOpenMovementModal}
          className="press bg-white text-ink border-[3px] border-ink shadow-hard-sm px-4 py-3 font-display font-bold uppercase text-xs flex items-center gap-2"
        >
          <Icon icon="ph:arrows-down-up-bold" className="text-lg" />
          {t.inventory.recordStockMovement}
        </button>
        <button
          onClick={onOpenAdjustmentModal}
          className="press bg-acid text-ink border-[3px] border-ink shadow-hard px-5 py-3 font-display font-[900] uppercase text-xs flex items-center gap-2"
        >
          <Icon icon="ph:plus-bold" className="text-lg" />
          {t.inventory.adjustStock}
        </button>
      </div>
    </section>
  );
}