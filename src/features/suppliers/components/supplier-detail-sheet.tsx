"use client";

import * as React from "react";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Tag,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SupplierItem } from "../types";
import { PAYMENT_TERMS_LABELS } from "../mock-data";

interface SupplierDetailSheetProps {
  supplier: SupplierItem | null;
  open: boolean;
  onClose: () => void;
  onEditSupplier: (supplier: SupplierItem) => void;
}

type SheetTab = "overview" | "performance" | "categories" | "orders";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "ACTIVE",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  on_hold: {
    label: "ON HOLD",
    className: "bg-amber-50 text-amber-700 border-amber-300",
  },
  inactive: {
    label: "INACTIVE",
    className: "bg-slate-100 text-slate-500 border-slate-300",
  },
};

const TIER_CONFIG: Record<string, { label: string; dotColor: string; className: string }> = {
  platinum: {
    label: "PLATINUM",
    dotColor: "bg-violet-500",
    className: "bg-violet-50 text-violet-700 border-violet-300",
  },
  gold: {
    label: "GOLD",
    dotColor: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-300",
  },
  silver: {
    label: "SILVER",
    dotColor: "bg-slate-400",
    className: "bg-slate-50 text-slate-600 border-slate-300",
  },
  bronze: {
    label: "BRONZE",
    dotColor: "bg-orange-500",
    className: "bg-orange-50 text-orange-700 border-orange-300",
  },
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  delivered: {
    label: "DELIVERED",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  in_transit: {
    label: "IN TRANSIT",
    className: "bg-blue-50 text-blue-700 border-blue-300",
  },
  processing: {
    label: "PROCESSING",
    className: "bg-amber-50 text-amber-700 border-amber-300",
  },
  cancelled: {
    label: "CANCELLED",
    className: "bg-red-50 text-red-600 border-red-300",
  },
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

const TABS: { value: SheetTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "performance", label: "Performance" },
  { value: "categories", label: "Categories" },
  { value: "orders", label: "Orders" },
];

export function SupplierDetailSheet({
  supplier,
  open,
  onClose,
  onEditSupplier,
}: SupplierDetailSheetProps) {
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

  // Reset tab on supplier change
  React.useEffect(() => {
    if (supplier) {
      setActiveTab("overview");
    }
  }, [supplier?.id]);

  if (!open || !supplier) return null;

  const statusConfig = STATUS_CONFIG[supplier.status];
  const tierConfig = TIER_CONFIG[supplier.tier];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg border-l-[1.5px] border-black bg-white shadow-xl animate-in slide-in-from-right flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold tracking-wider text-foreground bg-slate-100 border border-slate-300 rounded-sm px-1.5 py-0.5">
                  {supplier.code}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                    statusConfig?.className
                  )}
                >
                  {statusConfig?.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                    tierConfig?.className
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", tierConfig?.dotColor)}
                  />
                  {tierConfig?.label}
                </span>
              </div>
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                {supplier.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEditSupplier(supplier)}
            className="mt-2 h-8 gap-1.5 text-xs border-[1.5px] border-black shadow-neo-sm hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Pencil className="h-3 w-3" />
            Edit Supplier
          </Button>
        </div>

        {/* Tab Bar */}
        <div className="shrink-0 flex items-center gap-0 border-b border-border px-5 bg-slate-50/50">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all border-b-2",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </h3>
                <div className="rounded-lg border border-border p-3 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">{supplier.contactName}</span>
                      <span className="text-xs text-muted-foreground">{supplier.contactEmail}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground">{supplier.contactPhone}</span>
                  </div>
                  {supplier.website && (
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-primary truncate">{supplier.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Address
                </h3>
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground leading-relaxed">
                      <p>{supplier.address.street}</p>
                      <p>{supplier.address.city}, {supplier.address.province} {supplier.address.postalCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Terms */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Business Terms
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Payment Terms
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {PAYMENT_TERMS_LABELS[supplier.paymentTerms] || supplier.paymentTerms}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Avg Lead Time
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {supplier.leadTimeDays} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {supplier.notes && (
                <div className="space-y-3">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Internal Notes
                  </h3>
                  <div className="rounded-lg border border-border bg-slate-50 p-3">
                    <p className="text-xs text-foreground leading-relaxed">{supplier.notes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-border pt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Created {supplier.createdAt}
                  </span>
                </div>
                {supplier.updatedAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Updated {supplier.updatedAt}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Performance */}
          {activeTab === "performance" && (
            <div className="space-y-5">
              {/* On-Time Rate */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      On-Time Delivery
                    </span>
                  </div>
                  <span
                    className={cn(
                      "font-heading text-2xl font-bold tabular-nums",
                      supplier.onTimeDeliveryRate >= 95
                        ? "text-emerald-600"
                        : supplier.onTimeDeliveryRate >= 85
                          ? "text-amber-600"
                          : "text-red-600"
                    )}
                  >
                    {supplier.onTimeDeliveryRate}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      supplier.onTimeDeliveryRate >= 95
                        ? "bg-emerald-500"
                        : supplier.onTimeDeliveryRate >= 85
                          ? "bg-amber-500"
                          : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(supplier.onTimeDeliveryRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Defect Rate */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Defect Rate
                    </span>
                  </div>
                  <span
                    className={cn(
                      "font-heading text-2xl font-bold tabular-nums",
                      supplier.defectRate <= 1
                        ? "text-emerald-600"
                        : supplier.defectRate <= 3
                          ? "text-amber-600"
                          : "text-red-600"
                    )}
                  >
                    {supplier.defectRate}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      supplier.defectRate <= 1
                        ? "bg-emerald-500"
                        : supplier.defectRate <= 3
                          ? "bg-amber-500"
                          : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(supplier.defectRate * 10, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-border p-3 text-center">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Total Orders
                  </p>
                  <p className="font-heading text-xl font-bold text-foreground mt-0.5">
                    {supplier.totalOrders}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Total Spend
                  </p>
                  <p className="font-heading text-xl font-bold text-foreground mt-0.5">
                    {formatCurrency(supplier.totalSpend)}
                  </p>
                </div>
              </div>

              {/* Last Order */}
              {supplier.lastOrderDate && (
                <div className="rounded-lg border border-border p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Last Order Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {supplier.lastOrderDate}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Categories */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Product Categories Supplied ({supplier.categories.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {supplier.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-black bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground shadow-neo-sm"
                  >
                    <Tag className="h-3 w-3" />
                    {cat}
                  </span>
                ))}
              </div>
              {supplier.categories.length === 0 && (
                <p className="text-xs text-muted-foreground">No categories assigned.</p>
              )}
            </div>
          )}

          {/* Tab 4: Order History */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Order History ({supplier.orderHistory?.length ?? 0})
              </h3>
              {(!supplier.orderHistory || supplier.orderHistory.length === 0) ? (
                <p className="text-xs text-muted-foreground">No order history available.</p>
              ) : (
                <div className="space-y-2">
                  {supplier.orderHistory.map((order) => {
                    const orderStatusConfig = ORDER_STATUS_CONFIG[order.status];
                    return (
                      <div
                        key={order.id}
                        className="rounded-lg border border-border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold tracking-wider text-foreground">
                            {order.reference}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                              orderStatusConfig?.className
                            )}
                          >
                            {orderStatusConfig?.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Date</p>
                            <p className="text-xs font-medium text-foreground">{order.date}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Items</p>
                            <p className="text-xs font-medium text-foreground">{order.itemCount}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Amount</p>
                            <p className="text-xs font-medium text-foreground">{formatCurrency(order.totalAmount)}</p>
                          </div>
                        </div>
                        {order.deliveredDate && (
                          <p className="font-mono text-[10px] text-muted-foreground">
                            Delivered: {order.deliveredDate}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
