"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

interface WarehousesHeaderProps {
  onOpenCreateModal: () => void;
  onOpenTransferModal: () => void;
}

export function WarehousesHeader({
  onOpenCreateModal,
  onOpenTransferModal,
}: WarehousesHeaderProps) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-5 mb-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-black/50 mb-2">
          Operations / locations
        </p>
        <h2 className="font-display font-[900] text-[clamp(2.4rem,5vw,4.5rem)] uppercase tracking-tighter leading-[.88]">
          Control the<br />
          <span className="bg-acid px-2">floor.</span>
        </h2>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onOpenTransferModal}
          className="press bg-white border-[3px] border-ink shadow-hard px-4 py-3 font-display font-bold uppercase text-sm flex items-center gap-2"
        >
          <Icon icon="ph:arrows-left-right-bold" className="text-lg" />
          Transfer Stock
        </button>
        <button
          onClick={onOpenCreateModal}
          className="press bg-acid border-[3px] border-ink shadow-hard px-6 py-3 font-display font-[900] uppercase text-sm flex items-center gap-2"
        >
          <Icon icon="ph:plus-bold" className="text-lg" />
          Add Warehouse
        </button>
      </div>
    </section>
  );
}