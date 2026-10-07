"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

interface SuppliersHeaderProps {
  onOpenCreateModal: () => void;
}

export function SuppliersHeader({
  onOpenCreateModal,
}: SuppliersHeaderProps) {
  return (
    <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
      <div>
        <div className="inline-flex items-center gap-2 bg-white border-2 border-ink px-3 py-1 mb-4">
          <span className="w-2 h-2 bg-acid border border-ink"></span>
          <span className="font-mono text-[10px] uppercase tracking-[.18em]">
            Vendor directory
          </span>
        </div>
        <h1 className="font-display font-[900] uppercase leading-[.9] tracking-tighter text-[clamp(2.4rem,6vw,4.6rem)]">
          SUPPLIER<br />
          <span className="bg-acid px-2">NETWORK.</span>
        </h1>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[.16em] opacity-60">
          Manage partnerships and evaluate performance
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onOpenCreateModal}
          className="press bg-acid border-[3px] border-ink shadow-hard px-5 py-3 font-display font-[900] uppercase text-xs flex items-center gap-2"
        >
          <Icon icon="ph:plus-bold" className="text-lg" />
          Add Supplier
        </button>
        <button className="press bg-white border-[2px] border-ink shadow-hard-sm px-4 py-3 font-display font-bold uppercase text-xs flex items-center gap-2">
          <Icon icon="ph:funnel-bold" className="text-lg" />
          Filter
        </button>
        <button className="press bg-white border-[2px] border-ink shadow-hard-sm px-4 py-3 font-display font-bold uppercase text-xs flex items-center gap-2">
          <Icon icon="ph:export-bold" className="text-lg" />
          Export
        </button>
      </div>
    </section>
  );
}