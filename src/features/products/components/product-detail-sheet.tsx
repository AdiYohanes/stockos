"use client";

import * as React from "react";
import {
  X,
  Package,
  Layers,
  Warehouse,
  Barcode,
  Truck,
  Calendar,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit2,
  History,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "../types";

interface ProductDetailSheetProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onQuickMovement: (product: Product, type: "in" | "out") => void;
}

export function ProductDetailSheet({
  product,
  open,
  onClose,
  onEdit,
  onQuickMovement,
}: ProductDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState<"specs" | "history">("specs");

  // Prevent scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open || !product) return null;

  const totalValue = product.currentStock * (product.unitPrice || 0);
  const stockPercentage =
    product.minStock > 0
      ? Math.min(100, Math.round((product.currentStock / product.minStock) * 100))
      : 100;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l-2 border-black bg-card shadow-neo-lg animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border bg-slate-50/80 p-4 sm:p-5">
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-sm border border-black bg-primary text-white px-2 py-0.5 font-mono text-xs font-bold tracking-wider shadow-neo-sm">
                {product.sku}
              </span>
              {product.status === "in_stock" && (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>In Stock</span>
                </Badge>
              )}
              {product.status === "low_stock" && (
                <Badge variant="warning">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Low Stock</span>
                </Badge>
              )}
              {product.status === "out_of_stock" && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3" />
                  <span>Out of Stock</span>
                </Badge>
              )}
            </div>

            <h2 className="font-heading text-lg font-bold text-foreground line-clamp-2">
              {product.name}
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-muted/30 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "specs"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Specifications & Stock</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "history"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="h-3.5 w-3.5" />
            <span>Movement History ({product.movementLogs?.length || 0})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {activeTab === "specs" ? (
            <>
              {/* Stock Gauge Card */}
              <div className="rounded-lg border border-border bg-slate-50/50 p-4 shadow-neo-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Inventory Level
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    Min Threshold: <strong className="text-foreground">{product.minStock} {product.unit}</strong>
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between font-mono">
                  <div className="text-3xl font-bold text-foreground">
                    {formatNumber(product.currentStock)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{product.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Stock Ratio</span>
                    <span className="text-sm font-bold text-foreground">{stockPercentage}%</span>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    style={{ width: `${Math.max(product.currentStock > 0 ? 5 : 0, stockPercentage)}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      product.status === "out_of_stock"
                        ? "bg-destructive"
                        : product.status === "low_stock"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                  />
                </div>
              </div>

              {/* Financials & Valuation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Unit Price</span>
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-foreground">
                    {formatCurrency(product.unitPrice || 0)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">Per {product.unit}</span>
                </div>

                <div className="rounded-lg border border-border bg-card p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Package className="h-3.5 w-3.5" />
                    <span>Total Value</span>
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-foreground">
                    {formatCurrency(totalValue)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">Held inventory value</span>
                </div>
              </div>

              {/* Metadata Details Grid */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                  Item Specifications
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Category
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">{product.category}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Warehouse className="h-3 w-3" /> Warehouse Location
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">{product.warehouse}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Barcode className="h-3 w-3" /> Barcode / UPC
                    </span>
                    <p className="font-mono font-semibold text-foreground mt-0.5">
                      {product.barcode || "Not configured"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Supplier
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">{product.supplier || "—"}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Registered Date
                    </span>
                    <p className="font-mono text-foreground mt-0.5">{product.createdAt}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <History className="h-3 w-3" /> Last Restocked
                    </span>
                    <p className="font-medium text-foreground mt-0.5">{product.lastRestocked || "Never"}</p>
                  </div>
                </div>

                {product.description && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[11px] text-muted-foreground font-mono block">Description</span>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Movement History Tab */
            <div className="space-y-3">
              {(!product.movementLogs || product.movementLogs.length === 0) ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                  No stock movements recorded yet for this item.
                </div>
              ) : (
                product.movementLogs.map((log) => {
                  const isIn = log.type === "in";
                  return (
                    <div
                      key={log.id}
                      className="rounded-lg border border-border bg-card p-3.5 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider",
                              isIn
                                ? "border-black bg-[#dcfce7] text-[#15803d] shadow-neo-sm"
                                : "border-black bg-[#fee2e2] text-[#b91c1c] shadow-neo-sm"
                            )}
                          >
                            {isIn ? (
                              <>
                                <ArrowDownToLine className="h-3 w-3" /> Inbound (+{log.quantity})
                              </>
                            ) : (
                              <>
                                <ArrowUpFromLine className="h-3 w-3" /> Outbound (-{log.quantity})
                              </>
                            )}
                          </span>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            Ref: {log.reference}
                          </span>
                        </div>

                        <span className="font-mono text-[11px] text-muted-foreground">
                          {log.timestamp}
                        </span>
                      </div>

                      {log.note && (
                        <p className="text-xs text-muted-foreground pl-1">{log.note}</p>
                      )}

                      <div className="text-[10px] text-muted-foreground font-mono pl-1 pt-1 border-t border-border/40">
                        Initiated by: <span className="font-medium text-foreground">{log.performedBy}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-slate-50/90 p-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onQuickMovement(product, "in")}
              className="btn-neo gap-1.5 h-9 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
              Stock In
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onQuickMovement(product, "out")}
              className="btn-neo gap-1.5 h-9 text-xs text-rose-700 hover:bg-rose-50"
            >
              <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-600" />
              Stock Out
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onEdit(product)}
            className="btn-neo-black gap-1.5 h-9 text-xs font-medium"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Item
          </Button>
        </div>
      </div>
    </div>
  );
}
