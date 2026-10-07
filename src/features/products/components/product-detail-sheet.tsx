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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkuBadge } from "@/components/shared/sku-badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
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
      {/* Backdrop: calm flat semi-transparent overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Panel: 1px hairline separation, soft structural elevation */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-lg animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5">
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <SkuBadge code={product.sku} />
              {product.status === "in_stock" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>{t.products.inStock}</span>
                </span>
              )}
              {product.status === "low_stock" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                  <span>{t.products.lowStock}</span>
                </span>
              )}
              {product.status === "out_of_stock" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                  <span>{t.products.outOfStock}</span>
                </span>
              )}
            </div>

            <h2 className="font-sans text-base sm:text-lg font-semibold text-foreground line-clamp-2 leading-snug">
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
        <div className="flex border-b border-border bg-slate-50/40 dark:bg-slate-900/20 px-4 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
              activeTab === "specs"
                ? "border-slate-900 text-slate-900 font-semibold dark:border-slate-100 dark:text-slate-100"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Info className="h-3.5 w-3.5" />
            <span>{t.products.sheet.specsAndStock}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
              activeTab === "history"
                ? "border-slate-900 text-slate-900 font-semibold dark:border-slate-100 dark:text-slate-100"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="h-3.5 w-3.5" />
            <span>{t.products.sheet.movementHistory} ({product.movementLogs?.length || 0})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === "specs" ? (
            <>
              {/* Stock Gauge Container */}
              <div className="rounded-md border border-border bg-slate-50/50 dark:bg-slate-900/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t.products.sheet.inventoryLevel}
                  </span>
                  <span className="font-mono tabular-nums text-xs text-muted-foreground">
                    {t.products.sheet.minThreshold}: <strong className="text-foreground">{product.minStock} {product.unit}</strong>
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between font-mono tabular-nums">
                  <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                    {formatNumber(product.currentStock)}{" "}
                    <span className="text-sm font-normal text-muted-foreground font-sans">{product.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block font-sans">{t.products.sheet.stockRatio}</span>
                    <span className="text-sm font-semibold text-foreground">{stockPercentage}%</span>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    style={{ width: `${Math.max(product.currentStock > 0 ? 5 : 0, stockPercentage)}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      product.status === "out_of_stock"
                        ? "bg-rose-600"
                        : product.status === "low_stock"
                        ? "bg-amber-600"
                        : "bg-emerald-600"
                    )}
                  />
                </div>
              </div>

              {/* Financials & Valuation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border bg-card p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{t.products.unitPrice}</span>
                  </div>
                  <div className="mt-1 font-mono tabular-nums text-lg font-semibold text-foreground">
                    {formatCurrency(product.unitPrice || 0)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-sans">Per {product.unit}</span>
                </div>

                <div className="rounded-md border border-border bg-card p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>{t.products.totalValue}</span>
                  </div>
                  <div className="mt-1 font-mono tabular-nums text-lg font-semibold text-foreground">
                    {formatCurrency(totalValue)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-sans">{t.products.sheet.heldInventoryValue}</span>
                </div>
              </div>

              {/* Metadata Details Grid */}
              <div className="rounded-md border border-border bg-card p-4 space-y-3">
                <h4 className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                  {t.products.sheet.itemSpecifications}
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {t.common.category}
                    </span>
                    <p className="font-medium text-foreground mt-0.5">{product.category}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Warehouse className="h-3 w-3" /> {t.products.warehouseLocation}
                    </span>
                    <p className="font-medium text-foreground mt-0.5">{product.warehouse}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Barcode className="h-3 w-3" /> {t.products.sheet.barcodeUpc}
                    </span>
                    <p className="font-mono tabular-nums font-medium text-foreground mt-0.5">
                      {product.barcode || t.products.sheet.notConfigured}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {t.products.supplier}
                    </span>
                    <p className="font-medium text-foreground mt-0.5">{product.supplier || "—"}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {t.products.sheet.registeredDate}
                    </span>
                    <p className="font-mono tabular-nums text-foreground mt-0.5">{product.createdAt}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <History className="h-3 w-3" /> {t.products.sheet.lastRestocked}
                    </span>
                    <p className="font-medium text-foreground mt-0.5">{product.lastRestocked || t.products.sheet.never}</p>
                  </div>
                </div>

                {product.description && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[11px] text-muted-foreground block font-sans">{t.products.description}</span>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Movement History Tab */
            <div className="space-y-2.5">
              {(!product.movementLogs || product.movementLogs.length === 0) ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                  {t.products.sheet.noMovements}
                </div>
              ) : (
                product.movementLogs.map((log) => {
                  const isIn = log.type === "in";
                  return (
                    <div
                      key={log.id}
                      className="rounded-md border border-border bg-card p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono tabular-nums text-[11px] font-medium uppercase tracking-wider",
                              isIn
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
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
                          <span className="font-mono tabular-nums text-xs font-medium text-foreground">
                            Ref: {log.reference}
                          </span>
                        </div>

                        <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                          {log.timestamp}
                        </span>
                      </div>

                      {log.note && (
                        <p className="text-xs text-muted-foreground pl-0.5">{log.note}</p>
                      )}

                      <div className="text-[10px] text-muted-foreground pl-0.5 pt-1 border-t border-border/40 flex items-center justify-between">
                        <span>{t.products.sheet.initiatedBy}: <strong className="font-medium text-foreground">{log.performedBy}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-slate-50/80 dark:bg-slate-900/60 p-3.5 sm:p-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onQuickMovement(product, "in")}
              className="gap-1.5 h-8.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300"
            >
              <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
              {t.products.sheet.stockIn}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onQuickMovement(product, "out")}
              className="gap-1.5 h-8.5 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300"
            >
              <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-600" />
              {t.products.sheet.stockOut}
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onEdit(product)}
            className="gap-1.5 h-8.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Edit2 className="h-3.5 w-3.5" />
            {t.products.sheet.editItem}
          </Button>
        </div>
      </div>
    </div>
  );
}
