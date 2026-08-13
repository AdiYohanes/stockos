"use client";

import * as React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PurchaseOrder } from "../types";

interface PurchaseOrdersToolbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSupplier: string;
  onSupplierChange: (supplier: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (warehouse: string) => void;
  onResetFilters: () => void;
  orders: PurchaseOrder[];
}

export function PurchaseOrdersToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedSupplier,
  onSupplierChange,
  selectedWarehouse,
  onWarehouseChange,
  onResetFilters,
  orders,
}: PurchaseOrdersToolbarProps) {
  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "pending", label: "Issued", count: orders.filter((o) => o.status === "ISSUED").length },
    { id: "partial", label: "Partial", count: orders.filter((o) => o.status === "PARTIALLY_RECEIVED").length },
    { id: "received", label: "Received", count: orders.filter((o) => o.status === "RECEIVED").length },
    { id: "draft", label: "Draft", count: orders.filter((o) => o.status === "DRAFT").length },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {/* Search & Select Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search PO Code, Supplier, or SKU..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-base focus:border-black focus:ring-2 focus:ring-[#543afd]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Supplier Selector */}
          <select
            value={selectedSupplier}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-[#543afd]"
          >
            <option value="all">All Suppliers</option>
            <option value="sup-1">Nvidia Global Logistics</option>
            <option value="sup-2">Logitech Official Direct</option>
            <option value="sup-3">Samsung Semiconductor Asia</option>
            <option value="sup-4">ASUS Tek Procurement</option>
          </select>

          {/* Warehouse Selector */}
          <select
            value={selectedWarehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-[#543afd]"
          >
            <option value="all">All Warehouses</option>
            <option value="wh-1">Gudang Utama Jakarta</option>
            <option value="wh-2">Hub Surabaya</option>
            <option value="wh-3">Depot Medan</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-10 border-border px-3 hover:bg-slate-100"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Status Pills Row */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-semibold transition-all",
                isActive
                  ? "border border-black bg-black text-white shadow-neo-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <span>{tab.label}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "px-1 py-0 text-[10px]",
                  isActive ? "bg-white text-black" : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
