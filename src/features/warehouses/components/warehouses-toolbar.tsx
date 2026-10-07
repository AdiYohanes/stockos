"use client";

import * as React from "react";
import { Icon } from "@iconify/react";

interface WarehousesToolbarProps {
  totalCount: number;
  viewMode: "grid" | "table";
  onViewModeChange: (viewMode: "grid" | "table") => void;
}

export function WarehousesToolbar({
  totalCount,
  viewMode,
  onViewModeChange,
}: WarehousesToolbarProps) {
  return (
    <div className="p-5 border-b-[3px] border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="font-display font-[900] uppercase text-xl">
          Warehouse Directory
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mt-1">
          {totalCount} locations indexed
        </p>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center border-[2px] border-ink px-3 py-2 bg-paper">
          <Icon icon="ph:magnifying-glass-bold" className="text-lg" />
          <input
            className="input-focus bg-transparent outline-none ml-2 w-32 font-mono text-[10px] uppercase"
            placeholder="Search WH"
          />
        </div>
        <div className="flex border-[2px] border-ink">
          <button
            onClick={() => onViewModeChange("table")}
            className={`px-3 flex items-center justify-center ${
              viewMode === "table" ? "bg-ink text-paper" : "bg-white text-ink hover:bg-acid"
            }`}
          >
            <Icon icon="ph:list-bold" className="text-lg" />
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`px-3 flex items-center justify-center border-l-[2px] border-ink ${
              viewMode === "grid" ? "bg-ink text-paper" : "bg-white text-ink hover:bg-acid"
            }`}
          >
            <Icon icon="ph:squares-four-bold" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}