"use client";

import * as React from "react";
import {
  Building2,
  MapPin,
  User,
  ArrowLeftRight,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WarehouseItem, WarehouseStatus, WarehouseType } from "../types";
import { WarehouseRowActions } from "./warehouse-row-actions";

interface WarehouseGridViewProps {
  warehouses: WarehouseItem[];
  onSelectWarehouse: (id: string) => void;
  onOpenTransferModal: (warehouseId: string) => void;
  onEditWarehouse: (warehouse: WarehouseItem) => void;
  onDeleteWarehouse: (warehouse: WarehouseItem) => void;
}

export function WarehouseGridView({
  warehouses,
  onSelectWarehouse,
  onOpenTransferModal,
  onEditWarehouse,
  onDeleteWarehouse,
}: WarehouseGridViewProps) {
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
    const map: Record<WarehouseType, { label: string; bg: string; text: string }> = {
      central_hub: {
        label: "Central Hub",
        bg: "bg-purple-50 border-purple-200",
        text: "text-[#543afd]",
      },
      regional_depot: {
        label: "Regional Depot",
        bg: "bg-blue-50 border-blue-200",
        text: "text-blue-700",
      },
      cold_storage: {
        label: "Cold Storage & Lab",
        bg: "bg-cyan-50 border-cyan-200",
        text: "text-cyan-700",
      },
      fulfillment: {
        label: "Fulfillment",
        bg: "bg-indigo-50 border-indigo-200",
        text: "text-indigo-700",
      },
      transit: {
        label: "Transit Hub",
        bg: "bg-slate-100 border-slate-300",
        text: "text-slate-700",
      },
    };

    const config = map[type] || map.central_hub;
    return (
      <span
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold border",
          config.bg,
          config.text
        )}
      >
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
          No facilities match your search query or filter criteria. Try resetting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {warehouses.map((wh) => {
        const utilPercent =
          wh.totalCapacityUnits > 0
            ? Math.round((wh.usedCapacityUnits / wh.totalCapacityUnits) * 1000) / 10
            : 0;

        const isNearFull = utilPercent >= 90;
        const isModerate = utilPercent >= 75 && utilPercent < 90;

        return (
          <Card
            key={wh.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-white shadow-none transition-all hover:border-black hover:shadow-neo-sm"
          >
            <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
              {/* Header: Code Badge + Status + Row Actions */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded border border-black bg-black px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-neo-sm">
                      {wh.code}
                    </span>
                    {getStatusBadge(wh.status)}
                  </div>

                  <WarehouseRowActions
                    warehouse={wh}
                    onSelectWarehouse={onSelectWarehouse}
                    onOpenTransferModal={onOpenTransferModal}
                    onEditWarehouse={onEditWarehouse}
                    onDeleteWarehouse={onDeleteWarehouse}
                  />
                </div>

                {/* Facility Name & Type */}
                <div className="mt-3">
                  <h3
                    onClick={() => onSelectWarehouse(wh.id)}
                    className="font-heading text-base font-bold text-foreground hover:text-[#543afd] cursor-pointer transition-colors"
                  >
                    {wh.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    {getTypeBadge(wh.type)}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-sans truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{wh.address.city}</span>
                    </span>
                  </div>
                </div>

                {/* Manager Tag */}
                <div className="mt-2.5 flex items-center gap-1.5 rounded bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 border border-slate-200">
                  <User className="h-3 w-3 text-slate-500 shrink-0" />
                  <span className="font-medium truncate">{wh.manager.name}</span>
                  <span className="text-slate-400 font-mono text-[10px] ml-auto">
                    {wh.manager.phone}
                  </span>
                </div>
              </div>

              {/* Middle: Capacity Utilization Progress Gauge */}
              <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Capacity Usage
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold",
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

                {/* Capacity Bar */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isNearFull
                        ? "bg-red-500"
                        : isModerate
                        ? "bg-amber-500"
                        : "bg-[#543afd]"
                    )}
                    style={{ width: `${Math.min(100, utilPercent)}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>
                    Used: <strong className="text-foreground">{wh.usedCapacityUnits.toLocaleString("id-ID")}</strong> / {wh.totalCapacityUnits.toLocaleString("id-ID")}
                  </span>
                  <span>
                    Free: <strong className="text-emerald-700">{Math.max(0, wh.totalCapacityUnits - wh.usedCapacityUnits).toLocaleString("id-ID")}</strong>
                  </span>
                </div>
              </div>

              {/* Stats Box & Zones Summary */}
              <div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Stored
                    </span>
                    <span className="font-heading text-sm font-bold text-foreground">
                      {wh.usedCapacityUnits.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex flex-col border-x border-slate-100">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      SKUs
                    </span>
                    <span className="font-heading text-sm font-bold text-foreground">
                      {wh.totalSkusCount}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Valuation
                    </span>
                    <span className="font-heading text-xs font-bold text-foreground truncate px-1">
                      {formatCurrency(wh.totalValuation)}
                    </span>
                  </div>
                </div>

                {/* Zones Pills */}
                {wh.zones && wh.zones.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-0.5">
                    <Layers className="h-3 w-3 text-slate-400 shrink-0 mr-0.5" />
                    {wh.zones.map((zn) => (
                      <span
                        key={zn.id}
                        className="inline-flex shrink-0 items-center rounded border border-slate-200 bg-white px-1.5 py-0.2 font-mono text-[9px] font-semibold text-slate-600"
                        title={`${zn.name} (${zn.usedUnits}/${zn.capacityUnits} units)`}
                      >
                        {zn.code}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground font-mono ml-auto shrink-0">
                      {wh.zones.length} Zones
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenTransferModal(wh.id)}
                  className="h-8 flex-1 gap-1.5 border-[1.5px] border-black bg-white text-xs font-medium shadow-neo-sm hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <ArrowLeftRight className="h-3 w-3 text-blue-600" />
                  <span>Transfer</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSelectWarehouse(wh.id)}
                  className="h-8 flex-1 gap-1 bg-black text-white text-xs font-semibold hover:bg-slate-800 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <span>Inspect</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
