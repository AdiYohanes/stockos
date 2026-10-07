"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import type { InventoryMetrics, StockStatus } from "../types";

interface InventoryMetricsProps {
  metrics: InventoryMetrics;
  selectedStatus: "all" | StockStatus;
  onSelectStatus: (status: "all" | StockStatus) => void;
  onSelectTab: (tab: "stock_levels" | "movements") => void;
}

export function InventoryMetricsView({
  metrics,
  selectedStatus,
  onSelectStatus,
  onSelectTab,
}: InventoryMetricsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-widest text-black/50">
            Total SKUs
          </span>
          <span className="w-8 h-8 bg-paper border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:barcode-bold" className="text-lg" />
          </span>
        </div>
        <strong className="font-display font-[900] text-4xl block mt-3">
          {metrics.totalItems.toLocaleString("id-ID")}
        </strong>
        <p className="font-mono text-[9px] uppercase tracking-widest opacity-50 mt-3">
          +128 this month
        </p>
      </div>

      <div className="bg-white border-[3px] border-ink shadow-hard p-5">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-widest text-black/50">
            Total Quantity
          </span>
          <span className="w-8 h-8 bg-acid border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:stack-bold" className="text-lg" />
          </span>
        </div>
        <strong className="font-display font-[900] text-4xl block mt-3">
          {metrics.totalQuantity.toLocaleString("id-ID")}
        </strong>
        <p className="font-mono text-[9px] uppercase tracking-widest opacity-50 mt-3">
          units across 4 warehouses
        </p>
      </div>

      <button
        onClick={() => {
          onSelectTab("stock_levels");
          onSelectStatus(selectedStatus === "low_stock" ? "all" : "low_stock");
        }}
        className="text-left press bg-white border-[3px] border-ink shadow-hard p-5 transition-colors"
      >
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-widest text-black/50">
            Low Stock Items
          </span>
          <span className="w-8 h-8 bg-orange-400 border-2 border-ink flex items-center justify-center">
            <Icon icon="ph:warning-bold" className="text-lg" />
          </span>
        </div>
        <strong className="font-display font-[900] text-4xl block mt-3">
          {metrics.lowStockCount}
        </strong>
        <p className="font-mono text-[9px] uppercase tracking-widest text-orange-700 mt-3">
          3 purchase orders open
        </p>
      </button>

      <button
        onClick={() => {
          onSelectTab("stock_levels");
          onSelectStatus(selectedStatus === "out_of_stock" ? "all" : "out_of_stock");
        }}
        className="text-left press bg-ink text-paper border-[3px] border-ink shadow-hard p-5 transition-colors"
      >
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
            Out of Stock
          </span>
          <span className="w-8 h-8 bg-red-600 border-2 border-paper flex items-center justify-center">
            <Icon icon="ph:prohibit-bold" className="text-lg" />
          </span>
        </div>
        <strong className="font-display font-[900] text-4xl text-acid block mt-3">
          {metrics.outOfStockCount}
        </strong>
        <p className="font-mono text-[9px] uppercase tracking-widest text-acid mt-3">
          Immediate action needed
        </p>
      </button>
    </section>
  );
}