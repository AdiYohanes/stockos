"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

interface PurchaseOrdersToolbarProps {
  totalOrders: number;
}

export function PurchaseOrdersToolbar({
  totalOrders,
}: PurchaseOrdersToolbarProps) {
  return (
    <div className="p-5 border-b-[3px] border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="font-display font-[900] uppercase text-xl">
          Purchase Order Register
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mt-1">
          {totalOrders} supplier orders across 4 warehouses
        </p>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center border-[2px] border-ink px-3 py-2 bg-paper">
          <Icon icon="ph:magnifying-glass-bold" className="text-lg" />
          <input
            className="input-focus bg-transparent outline-none ml-2 w-32 font-mono text-[10px] uppercase"
            placeholder="Search PO"
          />
        </div>
        <button className="press border-[2px] border-ink bg-white px-3 flex items-center justify-center">
          <Icon icon="ph:list-bold" className="text-lg" />
        </button>
      </div>
    </div>
  );
}