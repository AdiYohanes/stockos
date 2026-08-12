"use client";

import * as React from "react";
import {
  X,
  MapPin,
  User,
  Mail,
  Phone,
  ArrowLeftRight,
  Edit,
  Building2,
  Layers,
  Boxes,
  History,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WarehouseItem, WarehouseStatus, WarehouseType } from "../types";

interface WarehouseDetailSheetProps {
  warehouse: WarehouseItem | null;
  open: boolean;
  onClose: () => void;
  onOpenTransferModal: (warehouseId: string) => void;
  onEditWarehouse: (warehouse: WarehouseItem) => void;
}

type SheetTab = "overview" | "zones" | "inventory" | "logs";

export function WarehouseDetailSheet({
  warehouse,
  open,
  onClose,
  onOpenTransferModal,
  onEditWarehouse,
}: WarehouseDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState<SheetTab>("overview");

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Reset active tab when warehouse changes
  React.useEffect(() => {
    if (warehouse) {
      setActiveTab("overview");
    }
  }, [warehouse?.id]);

  if (!open || !warehouse) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const utilPercent =
    warehouse.totalCapacityUnits > 0
      ? Math.round((warehouse.usedCapacityUnits / warehouse.totalCapacityUnits) * 1000) / 10
      : 0;

  const isNearFull = utilPercent >= 90;
  const isModerate = utilPercent >= 75 && utilPercent < 90;

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

  const getTypeLabel = (type: WarehouseType) => {
    const map: Record<WarehouseType, string> = {
      central_hub: "Central Hub",
      regional_depot: "Regional Depot",
      cold_storage: "Cold Storage & Lab",
      fulfillment: "Fulfillment Center",
      transit: "Transit Hub",
    };
    return map[type] || "Storage Facility";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="border-b border-border p-5 bg-slate-50/70">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-black text-white border border-black shadow-neo-sm">
                    {warehouse.code}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {getTypeLabel(warehouse.type)}
                  </span>
                  {getStatusBadge(warehouse.status)}
                </div>
                <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground mt-1">
                  {warehouse.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenTransferModal(warehouse.id)}
                className="flex-1 gap-1.5 bg-[#543afd] hover:bg-[#462ee0] text-white font-semibold text-xs border border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Transfer Stock</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditWarehouse(warehouse)}
                className="gap-1.5 border-[1.5px] border-black bg-white text-xs font-medium shadow-neo-sm hover:bg-slate-100"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Facility</span>
              </Button>
            </div>

            {/* Internal Tabs Switcher */}
            <div className="mt-4 flex items-center gap-1 border-b border-slate-200 pt-1 -mb-5 px-1">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "flex items-center gap-1.5 py-2 px-3 font-mono text-xs font-semibold border-b-2 transition-all",
                  activeTab === "overview"
                    ? "border-black text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("zones")}
                className={cn(
                  "flex items-center gap-1.5 py-2 px-3 font-mono text-xs font-semibold border-b-2 transition-all",
                  activeTab === "zones"
                    ? "border-black text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Zones ({warehouse.zones?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={cn(
                  "flex items-center gap-1.5 py-2 px-3 font-mono text-xs font-semibold border-b-2 transition-all",
                  activeTab === "inventory"
                    ? "border-black text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Inventory ({warehouse.storedInventory?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={cn(
                  "flex items-center gap-1.5 py-2 px-3 font-mono text-xs font-semibold border-b-2 transition-all",
                  activeTab === "logs"
                    ? "border-black text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <History className="h-3.5 w-3.5" />
                <span>Transfers ({warehouse.transferLogs?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* 1. Capacity Utilization Meter Card */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Storage Capacity Utilization
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm font-bold",
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

                  <div className="mt-2 h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
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

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs border-t border-slate-200/80 pt-2.5">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Used Stock</div>
                      <div className="font-bold text-foreground">
                        {warehouse.usedCapacityUnits.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="border-x border-slate-200">
                      <div className="text-[10px] text-muted-foreground uppercase">Available Space</div>
                      <div className="font-bold text-emerald-700">
                        {Math.max(0, warehouse.totalCapacityUnits - warehouse.usedCapacityUnits).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Max Capacity</div>
                      <div className="font-bold text-foreground">
                        {warehouse.totalCapacityUnits.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Key Metrics Summary Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border border-border bg-white p-3 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Stored SKUs
                    </span>
                    <div className="font-heading text-lg font-bold text-foreground mt-0.5">
                      {warehouse.totalSkusCount}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-white p-3 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Storage Zones
                    </span>
                    <div className="font-heading text-lg font-bold text-foreground mt-0.5">
                      {warehouse.zones?.length || 0}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-white p-3 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Valuation
                    </span>
                    <div className="font-heading text-xs font-bold text-foreground mt-1 truncate">
                      {formatCurrency(warehouse.totalValuation)}
                    </div>
                  </div>
                </div>

                {/* 3. PIC Manager Information */}
                <div className="rounded-lg border border-border bg-white p-4">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
                    Facility Manager / PIC
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white font-mono text-sm font-bold border border-black shadow-neo-sm">
                      {warehouse.manager.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-heading text-sm font-bold text-foreground">
                        {warehouse.manager.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <a
                          href={`mailto:${warehouse.manager.email}`}
                          className="flex items-center gap-1 hover:text-[#543afd] transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          <span>{warehouse.manager.email}</span>
                        </a>
                        <a
                          href={`tel:${warehouse.manager.phone}`}
                          className="flex items-center gap-1 font-mono hover:text-[#543afd] transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{warehouse.manager.phone}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Location & Address */}
                <div className="rounded-lg border border-border bg-white p-4 space-y-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Location & Shipping Address
                  </span>
                  <div className="flex items-start gap-2 text-xs text-slate-700">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{warehouse.address.street}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {warehouse.address.city}, {warehouse.address.province}{" "}
                        <span className="font-mono font-semibold text-slate-700">
                          {warehouse.address.postalCode}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono pt-2 border-t border-slate-100">
                    <Calendar className="h-3 w-3" />
                    <span>Facility established: {warehouse.createdAt}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STORAGE ZONES */}
            {activeTab === "zones" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Internal Storage Zones & Aisles
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {warehouse.zones?.length || 0} Registered Zones
                  </span>
                </div>

                {warehouse.zones && warehouse.zones.length > 0 ? (
                  <div className="space-y-2.5">
                    {warehouse.zones.map((zone) => {
                      const zoneUtil =
                        zone.capacityUnits > 0
                          ? Math.round((zone.usedUnits / zone.capacityUnits) * 100)
                          : 0;

                      return (
                        <div
                          key={zone.id}
                          className="rounded-lg border border-border bg-white p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded border border-black bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-900">
                                {zone.code}
                              </span>
                              <span className="font-heading text-xs font-bold text-foreground">
                                {zone.name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                              {zone.type}
                            </span>
                          </div>

                          {/* Capacity gauge */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                              <span>
                                {zone.usedUnits.toLocaleString("id-ID")} / {zone.capacityUnits.toLocaleString("id-ID")} units
                              </span>
                              <span className="font-bold text-foreground">{zoneUtil}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className="h-full rounded-full bg-[#543afd]"
                                style={{ width: `${Math.min(100, zoneUtil)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-muted-foreground">
                    No custom zones defined for this warehouse yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: STORED INVENTORY */}
            {activeTab === "inventory" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Stock In This Facility
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {warehouse.storedInventory?.length || 0} Products
                  </span>
                </div>

                {warehouse.storedInventory && warehouse.storedInventory.length > 0 ? (
                  <div className="rounded-lg border border-border bg-white overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-slate-50 font-mono text-[10px] uppercase text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3">SKU & Item</th>
                          <th className="py-2.5 px-3 text-center">Bin</th>
                          <th className="py-2.5 px-3 text-right">On Hand</th>
                          <th className="py-2.5 px-3 text-right">Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {warehouse.storedInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <div className="flex flex-col">
                                <span className="font-mono text-[10px] font-bold text-foreground">
                                  {item.sku}
                                </span>
                                <span className="font-sans text-xs text-slate-700 truncate max-w-[160px]">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[10px] text-muted-foreground">
                              {item.locationBin}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className="font-bold text-foreground">{item.quantity}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">
                                {item.unit}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-xs font-semibold text-slate-800">
                              {formatCurrency(item.quantity * item.unitCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-muted-foreground">
                    No active product stock assigned to this warehouse.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: TRANSFER LOGS */}
            {activeTab === "logs" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Transfer & Dispatch Audit Logs
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {warehouse.transferLogs?.length || 0} Transfers
                  </span>
                </div>

                {warehouse.transferLogs && warehouse.transferLogs.length > 0 ? (
                  <div className="space-y-2.5">
                    {warehouse.transferLogs.map((log) => {
                      const isSource = log.sourceWarehouseId === warehouse.id;

                      return (
                        <div
                          key={log.id}
                          className="rounded-lg border border-border bg-white p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="font-bold px-1.5 py-0.5 rounded bg-black text-white text-[10px]">
                                {log.reference}
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                {log.timestamp}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border",
                                isSource
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}
                            >
                              {isSource ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3" />
                                  <span>Transfer Out</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="h-3 w-3" />
                                  <span>Transfer In</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div>
                              <span className="font-mono font-bold text-foreground">
                                {log.sku}
                              </span>{" "}
                              <span className="text-slate-600">• {log.itemName}</span>
                            </div>
                            <span className="font-mono font-bold text-foreground">
                              {isSource ? `-${log.quantity}` : `+${log.quantity}`} units
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground border-t border-slate-100 pt-1.5">
                            <span>
                              {isSource
                                ? `To: ${log.destinationWarehouseName}`
                                : `From: ${log.sourceWarehouseName}`}
                            </span>
                            <span>PIC: {log.dispatchedBy}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-muted-foreground">
                    No transfer history recorded for this facility yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 bg-slate-50 flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">
              ID: <code className="text-foreground">{warehouse.id}</code>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 border-slate-300 text-xs"
            >
              Close Panel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
