"use client";

import * as React from "react";
import {
  X,
  MapPin,
  SlidersHorizontal,
  Plus,
  Minus,
  History,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SkuBadge } from "@/components/shared/sku-badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { formatProductMoney } from "@/features/products/format";
import { ProductPhoto } from "@/features/products/components/product-photo";
import { listInventoryEventsAction } from "../actions";
import { mapEventToStockMovement } from "../adapters";
import type { InventoryItem, StockMovement } from "../types";

interface InventoryDetailSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onAdjustStock: (item: InventoryItem) => void;
  onAdjustCost: (item: InventoryItem) => void;
  onQuickMove: (item: InventoryItem, type: "in" | "out") => void;
  onCorrectQuantity?: (movement: StockMovement) => void;
}

export function InventoryDetailSheet({
  item,
  open,
  onClose,
  onAdjustStock,
  onAdjustCost,
  onQuickMove,
  onCorrectQuantity,
}: InventoryDetailSheetProps) {
  const { t } = useI18n();
  const [events, setEvents] = React.useState<StockMovement[]>(item?.movementLogs || []);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [eventsError, setEventsError] = React.useState(false);
  const [reload, setReload] = React.useState(0);

  React.useEffect(() => {
    if (!item?.id || !open) return;
    let active = true;
    React.startTransition(async () => {
      setLoadingEvents(true);
      setEventsError(false);
      try {
        const result = await listInventoryEventsAction({ productId: item.id, pageSize: 25 });
        if (!active) return;
        if (result.ok && result.data) {
          setEvents(result.data.items.map(mapEventToStockMovement));
        } else {
          setEventsError(true);
        }
      } catch {
        if (active) setEventsError(true);
      } finally {
        if (active) setLoadingEvents(false);
      }
    });
    return () => {
      active = false;
    };
  }, [item?.id, open, item?.movementLogs, reload]);

  if (!item) return null;

  const stockRatio = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent showCloseButton={false} className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg gap-0 border-l-[3px] border-ink bg-white shadow-hard-lg motion-reduce:transition-none">
        <SheetHeader className="border-b-[3px] border-ink bg-paper pr-14">
          <div className="flex items-center gap-2">
            <SkuBadge code={item.sku} />
            <span className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60 bg-white border border-ink/20 px-1">
              {item.category}
            </span>
          </div>
          <SheetTitle className="font-sans text-lg font-bold tracking-tight text-ink truncate uppercase">
            {item.name}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {item.category} · {item.unit}
          </SheetDescription>
        </SheetHeader>
        <SheetClose render={<Button variant="outline" size="icon-sm" className="absolute right-3 top-3" />}>
          <X className="h-4 w-4" />
          <span className="sr-only">{t.common.close}</span>
        </SheetClose>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-6">
          <ProductPhoto photo={item.photo} name={item.name} display />
          {/* Quick Actions Panel */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickMove(item, "in")}
              className="flex-1 flex justify-center items-center h-10 gap-1.5 border-[3px] border-ink text-emerald-800 bg-emerald-100 hover:bg-emerald-200 text-[10px] font-bold uppercase tracking-widest shadow-hard-sm press"
            >
              <Plus className="h-4 w-4" />
              <span>{t.inventory.stockInType}</span>
            </button>

            <button
              type="button"
              onClick={() => onQuickMove(item, "out")}
              disabled={item.currentStock === 0}
              className="flex-1 flex justify-center items-center h-10 gap-1.5 border-[3px] border-ink text-rose-800 bg-rose-100 hover:bg-rose-200 text-[10px] font-bold uppercase tracking-widest shadow-hard-sm press disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
              <span>{t.inventory.stockOutType}</span>
            </button>

            <button
              type="button"
              onClick={() => onAdjustStock(item)}
              className="flex-1 flex justify-center items-center h-10 gap-1.5 border-[3px] border-ink bg-white text-ink hover:bg-paper text-[10px] font-bold uppercase tracking-widest shadow-hard-sm press"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{t.inventory.adjustStock}</span>
            </button>
          </div>

          {/* Live Stock Health Card */}
          <div className="border-[3px] border-ink bg-paper p-4 space-y-3 shadow-hard-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink/80">
                {t.inventory.stockHealthGauge}
              </span>
              <span className="font-mono tabular-nums text-[10px] font-bold text-ink bg-white border border-ink/20 px-1">
                {stockRatio}% {t.inventory.ofMaxScale}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white border border-ink h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 border-r border-ink",
                  item.status === "out_of_stock" && "bg-rose-500",
                  item.status === "low_stock" && "bg-amber-500",
                  item.status === "in_stock" && "bg-emerald-500",
                  item.status === "overstocked" && "bg-blue-500"
                )}
                style={{ width: `${Math.max(4, stockRatio)}%` }}
              />
            </div>

            {/* Stock Metric Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t-[2px] border-ink/20">
              <div className="text-center p-2 bg-white border-[3px] border-ink shadow-neo-sm">
                <div className="font-sans text-[10px] font-bold text-ink uppercase tracking-widest">{t.inventory.onHand}</div>
                <div className="font-mono tabular-nums text-lg font-bold text-ink my-1">
                  {item.currentStock}
                </div>
                <div className="text-[10px] font-bold text-ink/60 font-mono uppercase tracking-widest">{item.unit}</div>
              </div>

              <div className="text-center p-2 bg-white border-[3px] border-ink shadow-neo-sm">
                <div className="font-sans text-[10px] font-bold text-ink uppercase tracking-widest">{t.inventory.reserved}</div>
                <div className="font-mono tabular-nums text-lg font-bold text-amber-600 my-1">
                  {item.reservedStock}
                </div>
                <div className="text-[10px] font-bold text-ink/60 font-mono uppercase tracking-widest">{item.unit}</div>
              </div>

              <div className="text-center p-2 bg-white border-[3px] border-ink shadow-neo-sm">
                <div className="font-sans text-[10px] font-bold text-ink uppercase tracking-widest">{t.inventory.available}</div>
                <div
                  className={cn(
                    "font-mono tabular-nums text-lg font-bold my-1",
                    item.availableStock === 0 ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {item.availableStock}
                </div>
                <div className="text-[10px] font-bold text-ink/60 font-mono uppercase tracking-widest">{item.unit}</div>
              </div>
            </div>
          </div>

          {/* Storage Location Specs */}
          <div className="border-[3px] border-ink bg-white p-4 space-y-4 shadow-hard-sm">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ink bg-acid/10 p-0.5 border border-ink" />
              <span>{t.inventory.storageBin}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">{t.inventory.storageBin}</span>
                <span className="font-mono tabular-nums font-bold text-ink bg-paper px-1 border border-ink/20">
                  {item.locationBin}
                </span>
              </div>
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">{t.inventory.minReorderThreshold}</span>
                <span className="font-mono tabular-nums font-bold text-amber-600">{item.minStock} {item.unit}</span>
              </div>
            </div>
          </div>

          {/* Valuation Card */}
          <div className="border-[3px] border-ink bg-white p-4 space-y-4 shadow-hard-sm">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-ink bg-emerald-100 p-0.5 border border-ink" />
              <span>{t.inventory.valuationUnitEconomics}</span>
              <button type="button" onClick={() => onAdjustCost(item)}
                className="ml-auto border-[3px] border-ink bg-white px-2 py-1 shadow-hard-sm press focus-visible:outline-2 focus-visible:outline-offset-2">
                {t.inventory.costCorrection.title}
              </button>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">{t.inventory.unitCost}</span>
                <span className="font-mono tabular-nums font-bold text-ink bg-paper px-1 border border-ink/20">{formatProductMoney(item.averagePurchaseCost)}</span>
              </div>
              <div>
                <span className="text-ink/60 block text-[10px] font-bold uppercase tracking-widest mb-1">{t.inventory.totalStockValuation}</span>
                <span className="font-mono tabular-nums font-bold text-ink bg-paper px-1 border border-ink/20">{formatProductMoney(item.inventoryCostValue)}</span>
              </div>
            </div>
          </div>

          {/* Item Specific Movement Logs Timeline */}
          <div className="space-y-3">
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <History className="h-4 w-4 text-ink bg-blue-100 p-0.5 border border-ink" />
              <span>{t.inventory.recentMovementTimeline}</span>
            </h3>

            {loadingEvents ? (
              <div className="text-center py-6 border-[3px] border-dashed border-ink/40 bg-paper">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60 font-mono">
                  {t.common.loading}...
                </p>
              </div>
            ) : eventsError ? (
              <div className="text-center py-6 border-[3px] border-ink bg-rose-50" role="alert">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700 font-mono">
                  {t.common.error}
                </p>
                <button
                  type="button"
                  onClick={() => setReload((value) => value + 1)}
                  className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ink border-[3px] border-ink bg-white px-3 py-1.5 shadow-hard-sm press"
                >
                  {t.products.persistent.retry}
                </button>
              </div>
            ) : events.length > 0 ? (
              <div className="divide-y-[2px] divide-ink/20 border-[3px] border-ink bg-white overflow-hidden shadow-hard-sm">
                {events.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex flex-col gap-2 hover:bg-paper transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono tabular-nums font-bold text-[10px] uppercase text-ink bg-acid/10 px-1 border border-ink/20">
                        {log.reference}
                      </span>
                      <span className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60">
                        {log.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 font-mono tabular-nums text-[11px]">
                        {log.type === "in" && (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <ArrowDownRight className="h-3 w-3" /> +{Math.abs(log.quantity)} {item.unit}
                          </span>
                        )}
                        {log.type === "out" && (
                          <span className="text-rose-700 font-bold flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" /> -{Math.abs(log.quantity)} {item.unit}
                          </span>
                        )}
                        {log.type === "adjustment" && (
                          <span className="text-amber-700 font-bold flex items-center gap-0.5">
                            <SlidersHorizontal className="h-3 w-3" /> {log.quantity >= 0 ? `+${log.quantity}` : log.quantity} {item.unit}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/80 font-mono">
                        {t.inventory.by} {log.performedBy}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/60 bg-paper p-1.5 border border-ink/20 mt-1">
                        {log.note}
                      </p>
                    )}
                    {log.correctionOfEventId && (
                      <p className="text-[10px] font-mono break-all text-ink/80">
                        {t.inventory.quantityCorrection.parent}: {log.correctionOfEventId}
                      </p>
                    )}
                    {log.kind && log.kind !== "cost_adjustment" && onCorrectQuantity && (
                      <button
                        type="button"
                        aria-label={`${t.inventory.quantityCorrection.title}: ${log.reference} · ${log.id}`}
                        onClick={() => onCorrectQuantity(log)}
                        className="mt-1 self-start border-[3px] border-ink bg-white px-2 py-1 shadow-hard-sm press text-[10px] font-bold uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {t.inventory.quantityCorrection.title}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-[3px] border-dashed border-ink/40 bg-paper">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60 font-mono">
                  {t.inventory.noMovementLogs}
                </p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="border-t-[3px] border-ink bg-paper flex-row items-center justify-between">
          <span className="font-mono tabular-nums text-[10px] font-bold uppercase tracking-widest text-ink/60">
            {t.inventory.lastUpdated} {item.lastMovementAt}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-ink bg-white border-[3px] border-ink shadow-hard-sm press"
          >
            {t.common.close}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
