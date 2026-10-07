"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

interface InventoryToolbarProps {
  totalItems: number;
}

export function InventoryToolbar({ totalItems }: InventoryToolbarProps) {
  return (
    <section className="flex flex-wrap justify-between items-center gap-4 mb-5">
      <div>
        <h3 className="font-display font-[900] uppercase text-xl tracking-tight">
          Inventory Items
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mt-1">
          {totalItems.toLocaleString("id-ID")} products indexed
        </p>
      </div>
      <div className="flex border-[3px] border-ink font-mono text-[10px] font-bold uppercase">
        <button className="px-4 py-2 bg-ink text-paper border-r-[3px] border-ink flex items-center gap-2">
          <Icon icon="ph:list-bold" className="text-lg" />
          List View
        </button>
        <button className="px-4 py-2 bg-white hover:bg-acid flex items-center gap-2">
          <Icon icon="ph:squares-four-bold" className="text-lg" />
          Grid View
        </button>
      </div>
    </section>
  );
}