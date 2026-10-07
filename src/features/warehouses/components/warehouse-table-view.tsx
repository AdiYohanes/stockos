"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { WarehouseItem, WarehouseStatus, WarehouseType } from "../types";

interface WarehouseTableViewProps {
  warehouses: WarehouseItem[];
  currentPage: number;
  totalPages: number;
  totalFilteredCount: number;
  onPageChange: (page: number) => void;
  onSelectWarehouse: (id: string) => void;
  onOpenTransferModal: (warehouseId: string) => void;
  onEditWarehouse: (warehouse: WarehouseItem) => void;
  onDeleteWarehouse: (warehouse: WarehouseItem) => void;
}

export function WarehouseTableView({
  warehouses,
  currentPage,
  totalPages,
  totalFilteredCount,
  onPageChange,
  onSelectWarehouse,
  onOpenTransferModal,
  onEditWarehouse,
  onDeleteWarehouse,
}: WarehouseTableViewProps) {
  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, totalFilteredCount);

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

  return (
    <div className="overflow-x-auto border-t-0">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-paper border-b-[3px] border-ink font-mono text-[9px] uppercase tracking-widest text-ink">
          <tr>
            <th className="px-5 py-4">Facility</th>
            <th className="px-5 py-4">Location</th>
            <th className="px-5 py-4">Capacity Utilization</th>
            <th className="px-5 py-4">Stock Volume</th>
            <th className="px-5 py-4">Manager</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y-[2px] divide-black/10">
          {warehouses.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="font-display font-bold uppercase text-ink text-lg mt-4">
                    No matching facilities
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 max-w-sm">
                    Try adjusting your filters
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            warehouses.map((wh) => {
              const utilPercent =
                wh.totalCapacityUnits > 0
                  ? Math.round((wh.usedCapacityUnits / wh.totalCapacityUnits) * 100)
                  : 0;
              const isNearFull = utilPercent >= 90;

              return (
                <tr
                  key={wh.id}
                  className="hover:bg-acid/10 cursor-pointer"
                  onClick={() => onSelectWarehouse(wh.id)}
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col text-ink">
                      <span className="font-display font-[900] text-lg uppercase">
                        {wh.code}
                      </span>
                      <span className="font-display font-bold text-sm uppercase">
                        {wh.name}
                      </span>
                      <span className="font-mono text-[9px] opacity-45">
                        {getTypeLabel(wh.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2 text-ink">
                      <Icon icon="ph:map-pin-bold" className="text-lg mt-0.5" />
                      <div>
                        <p className="font-display font-bold uppercase text-sm">
                          {wh.address.city}
                        </p>
                        <p className="font-mono text-[9px] opacity-45">
                          {wh.address.street}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 w-48">
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
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col text-ink">
                      <span className="font-display font-[900] text-lg">
                        {wh.usedCapacityUnits.toLocaleString("id-ID")}
                      </span>
                      <span className="font-mono text-[9px] opacity-45">
                        {wh.totalSkusCount} SKUs stored
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col text-ink">
                      <span className="font-display font-bold uppercase text-sm">
                        {wh.manager.name}
                      </span>
                      <span className="font-mono text-[9px] opacity-45">
                        {wh.manager.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(wh.status)}</td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onOpenTransferModal(wh.id)}
                        title="Transfer Stock"
                        className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center text-ink"
                      >
                        <Icon icon="ph:arrows-left-right-bold" className="text-lg" />
                      </button>
                      <button
                        onClick={() => onEditWarehouse(wh)}
                        title="Edit Warehouse"
                        className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center text-ink"
                      >
                        <Icon icon="ph:pencil-bold" className="text-lg" />
                      </button>
                      <button
                        onClick={() => onSelectWarehouse(wh.id)}
                        title="View Details"
                        className="press w-8 h-8 border-2 border-ink bg-white flex items-center justify-center text-ink"
                      >
                        <Icon icon="ph:eye-bold" className="text-lg" />
                      </button>
                      <button
                        onClick={() => onDeleteWarehouse(wh)}
                        title="Delete"
                        className="press w-8 h-8 border-2 border-ink bg-ink flex items-center justify-center text-acid"
                      >
                        <Icon icon="ph:trash-bold" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {totalFilteredCount > 0 && (
        <div className="p-4 border-t-[3px] border-ink flex items-center justify-between text-ink">
          <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            Showing {startIndex}-{endIndex} of {totalFilteredCount} facilities
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="press border-[2px] border-ink bg-white w-8 h-8 flex items-center justify-center disabled:opacity-50"
            >
              <Icon icon="ph:caret-left-bold" className="text-lg" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="press border-[2px] border-ink bg-acid w-8 h-8 flex items-center justify-center disabled:opacity-50"
            >
              <Icon icon="ph:caret-right-bold" className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}