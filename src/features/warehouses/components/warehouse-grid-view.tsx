"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { WarehouseItem, WarehouseStatus, WarehouseType } from "../types";

interface WarehouseGridViewProps {
  warehouses: WarehouseItem[];
  onSelectWarehouse: (id: string) => void;
  onOpenTransferModal: (warehouseId: string) => void;
  onEditWarehouse?: (warehouse: WarehouseItem) => void;
  onDeleteWarehouse?: (warehouse: WarehouseItem) => void;
}

export function WarehouseGridView({
  warehouses,
  onSelectWarehouse,
  onOpenTransferModal,
}: WarehouseGridViewProps) {
  const getStatusBadge = (status: WarehouseStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="bg-acid border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink">
            Active
          </span>
        );
      case "maintenance":
        return (
          <span className="bg-orange-400 border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink">
            Maintenance
          </span>
        );
      case "full":
        return (
          <span className="bg-ink text-acid border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase">
            Full
          </span>
        );
      case "inactive":
        return (
          <span className="bg-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink/70">
            Inactive
          </span>
        );
      default:
        return (
          <span className="bg-paper border-2 border-ink px-2 py-1 font-mono text-[9px] font-bold uppercase text-ink">
            {status}
          </span>
        );
    }
  };

  const getTypeLabel = (type: WarehouseType) => {
    const labels: Record<WarehouseType, string> = {
      central_hub: "Central Hub",
      regional_depot: "Regional Depot",
      cold_storage: "Cold Storage",
      fulfillment: "Fulfillment",
      transit: "Transit",
    };
    return labels[type] || type;
  };

  if (warehouses.length === 0) {
    return (
      <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
        <p className="font-display font-bold uppercase text-ink text-lg mt-4">
          No matching facilities
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 max-w-sm">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
      {warehouses.map((wh) => {
        const utilPercent =
          wh.totalCapacityUnits > 0
            ? Math.round((wh.usedCapacityUnits / wh.totalCapacityUnits) * 100)
            : 0;
        const isNearFull = utilPercent >= 90;

        return (
          <div
            key={wh.id}
            className="group relative flex flex-col justify-between border-[3px] border-ink bg-white shadow-hard transition-all cursor-pointer press"
            onClick={() => onSelectWarehouse(wh.id)}
          >
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display font-[900] text-lg uppercase text-ink">
                    {wh.code}
                  </span>
                  {getStatusBadge(wh.status)}
                </div>
              </div>

              <div>
                <h3 className="font-display text-xl font-bold uppercase text-ink">
                  {wh.name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[9px] opacity-45">
                    {getTypeLabel(wh.type)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-ink opacity-45 font-sans truncate">
                    <Icon icon="ph:map-pin-bold" className="shrink-0" />
                    <span>{wh.address.city}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full text-ink">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="opacity-50">
                    {wh.usedCapacityUnits.toLocaleString("id-ID")} /{" "}
                    {wh.totalCapacityUnits.toLocaleString("id-ID")}
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      isNearFull ? "text-red-600" : ""
                    )}
                  >
                    {utilPercent}%
                  </span>
                </div>
                <div className="h-2 w-full border-[2px] border-ink flex">
                  <div
                    className="h-full bg-ink transition-all"
                    style={{ width: `${utilPercent}%` }}
                  />
                  <div
                    className="h-full bg-paper transition-all"
                    style={{ width: `${100 - utilPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t-[3px] border-ink pt-3">
                <div className="flex flex-col text-ink">
                  <span className="font-mono text-[10px] uppercase tracking-wider opacity-50">
                    SKUs
                  </span>
                  <span className="font-display text-lg font-[900]">
                    {wh.totalSkusCount}
                  </span>
                </div>
                <div className="flex flex-col text-ink">
                  <span className="font-mono text-[10px] uppercase tracking-wider opacity-50">
                    Valuation
                  </span>
                  <span className="font-display text-lg font-[900]">
                    ${(wh.totalValuation / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center pt-0 border-t-[3px] border-ink bg-paper divide-x-[3px] divide-ink">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTransferModal(wh.id);
                }}
                className="flex-1 px-3 py-2 font-display font-bold uppercase text-xs hover:bg-acid transition-colors text-ink"
              >
                Transfer
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWarehouse(wh.id);
                }}
                className="flex-1 px-3 py-2 font-display font-bold uppercase text-xs hover:bg-acid transition-colors text-ink"
              >
                Inspect
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}