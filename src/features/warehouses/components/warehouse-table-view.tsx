"use client";

import * as React from "react";
import {
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WarehouseItem, WarehouseStatus, WarehouseType } from "../types";
import { WarehouseRowActions } from "./warehouse-row-actions";

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
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: WarehouseStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center rounded-sm border border-emerald-600 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Active
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center rounded-sm border border-amber-600 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Maintenance
          </span>
        );
      case "full":
        return (
          <span className="inline-flex items-center rounded-sm border border-red-600 bg-red-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-700">
            Near Full
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center rounded-sm border border-slate-400 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Inactive
          </span>
        );
    }
  };

  const getTypeBadge = (type: WarehouseType) => {
    const map: Record<WarehouseType, { label: string; text: string }> = {
      central_hub: { label: "Central Hub", text: "text-[#543afd]" },
      regional_depot: { label: "Regional Depot", text: "text-blue-700" },
      cold_storage: { label: "Cold Storage", text: "text-cyan-700" },
      fulfillment: { label: "Fulfillment", text: "text-indigo-700" },
      transit: { label: "Transit Hub", text: "text-slate-700" },
    };

    const config = map[type] || map.central_hub;
    return (
      <span className={cn("font-mono text-[10px] font-semibold", config.text)}>
        {config.label}
      </span>
    );
  };

  if (warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground">
          No warehouses found
        </h3>
        <p className="font-sans text-xs text-muted-foreground mt-1 max-w-sm">
          No facilities match your active search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white shadow-none overflow-hidden">
      {/* High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-slate-50/80 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4 w-[100px]">Code</th>
              <th className="py-3 px-4 min-w-[180px]">Facility & Type</th>
              <th className="py-3 px-4 min-w-[150px]">Location</th>
              <th className="py-3 px-4 min-w-[200px]">Capacity Utilization</th>
              <th className="py-3 px-4 min-w-[120px]">Stock Volume</th>
              <th className="py-3 px-4 min-w-[130px]">Valuation</th>
              <th className="py-3 px-4 min-w-[140px]">Manager</th>
              <th className="py-3 px-4 min-w-[110px]">Status</th>
              <th className="py-3 px-4 w-[60px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {warehouses.map((wh) => {
              const utilPercent =
                wh.totalCapacityUnits > 0
                  ? Math.round((wh.usedCapacityUnits / wh.totalCapacityUnits) * 1000) / 10
                  : 0;
              const isNearFull = utilPercent >= 90;
              const isModerate = utilPercent >= 75 && utilPercent < 90;

              return (
                <tr
                  key={wh.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectWarehouse(wh.id)}
                >
                  {/* Col 1: Code */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded border border-black bg-black px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-neo-sm">
                      {wh.code}
                    </span>
                  </td>

                  {/* Col 2: Name & Type */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-heading text-xs font-bold text-foreground group-hover:text-[#543afd] transition-colors">
                        {wh.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getTypeBadge(wh.type)}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          • {wh.zones.length} Zones
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Col 3: Location */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{wh.address.city}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-sans truncate block max-w-[150px]">
                      {wh.address.street}
                    </span>
                  </td>

                  {/* Col 4: Capacity Bar */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 w-full max-w-[180px]">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-muted-foreground">
                          {wh.usedCapacityUnits.toLocaleString("id-ID")} / {wh.totalCapacityUnits.toLocaleString("id-ID")}
                        </span>
                        <span
                          className={cn(
                            "font-bold",
                            isNearFull
                              ? "text-red-600"
                              : isModerate
                              ? "text-amber-600"
                              : "text-[#543afd]"
                          )}
                        >
                          {utilPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isNearFull
                              ? "bg-red-500"
                              : isModerate
                              ? "bg-amber-500"
                              : "bg-[#543afd]"
                          )}
                          style={{ width: `${Math.min(100, utilPercent)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Col 5: Stock Volume */}
                  <td className="py-3 px-4 font-mono">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">
                        {wh.usedCapacityUnits.toLocaleString("id-ID")} units
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {wh.totalSkusCount} SKUs stored
                      </span>
                    </div>
                  </td>

                  {/* Col 6: Valuation */}
                  <td className="py-3 px-4 font-mono font-semibold text-foreground">
                    {formatCurrency(wh.totalValuation)}
                  </td>

                  {/* Col 7: Manager */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-700">
                        {wh.manager.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-medium text-foreground truncate max-w-[100px]">
                          {wh.manager.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">
                          {wh.manager.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Col 8: Status */}
                  <td className="py-3 px-4">{getStatusBadge(wh.status)}</td>

                  {/* Col 9: Row Actions */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <WarehouseRowActions
                      warehouse={wh}
                      onSelectWarehouse={onSelectWarehouse}
                      onOpenTransferModal={onOpenTransferModal}
                      onEditWarehouse={onEditWarehouse}
                      onDeleteWarehouse={onDeleteWarehouse}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-slate-50/50">
        <div className="font-mono text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{warehouses.length}</span> of{" "}
          <span className="font-semibold text-foreground">{totalFilteredCount}</span> facilities
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 gap-1 border-slate-300 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <span className="font-mono text-xs text-muted-foreground px-2">
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 gap-1 border-slate-300 text-xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
