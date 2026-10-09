"use client";

import * as React from "react";
import { X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/format";
import { MOCK_MOVEMENT_VELOCITY, MOCK_REORDER_RISK } from "../mock-data";
import { useI18n } from "@/lib/i18n/context";

interface ReportDetailSheetProps {
  selectedId: string | null;
  selectedType: "velocity" | "reorder" | null;
  onClose: () => void;
}

export function ReportDetailSheet({
  selectedId,
  selectedType,
  onClose,
}: ReportDetailSheetProps) {
  const { t } = useI18n();
  // Derived entity selection (React 19 pattern)
  const velocityItem = React.useMemo(() => {
    if (selectedType !== "velocity" || !selectedId) return null;
    return MOCK_MOVEMENT_VELOCITY.find((item) => item.productId === selectedId) || null;
  }, [selectedId, selectedType]);

  const reorderItem = React.useMemo(() => {
    if (selectedType !== "reorder" || !selectedId) return null;
    return MOCK_REORDER_RISK.find((item) => item.productId === selectedId) || null;
  }, [selectedId, selectedType]);

  if (!selectedId || !selectedType) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="flex h-full w-full max-w-md flex-col border-l-2 border-black bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink px-6 py-4 bg-[#f8f9fa]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-[#543afd] text-white shadow-neo-sm">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-foreground">
                {t.common.details || "Report Entity Inspector"}
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {selectedType} audit detail
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-500 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Inspection Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {velocityItem && (
            <div className="space-y-4 font-mono text-xs">
              <div className="rounded-none border-[3px] border-ink bg-[#f8f9fa] p-4 shadow-neo-sm space-y-2">
                <span className="inline-flex rounded-none border-[3px] border-ink bg-white px-2 py-0.5 font-bold text-foreground">
                  {velocityItem.sku}
                </span>
                <h4 className="font-heading text-base font-bold text-foreground">{velocityItem.name}</h4>
                <p className="text-muted-foreground">{velocityItem.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-none border-[3px] border-ink p-3">
                  <span className="text-muted-foreground text-[10px]">Turnover Ratio</span>
                  <div className="font-bold text-lg text-foreground">{velocityItem.turnoverRatio}x</div>
                </div>
                <div className="rounded-none border-[3px] border-ink p-3">
                  <span className="text-muted-foreground text-[10px]">Velocity Tier</span>
                  <div className="font-bold text-lg uppercase text-[#543afd]">{velocityItem.velocityTier}</div>
                </div>
                <div className="rounded-none border-[3px] border-ink p-3">
                  <span className="text-muted-foreground text-[10px]">{t.dashboard.stockIn || "Stock In"}</span>
                  <div className="font-bold text-base text-[#543afd]">+{formatNumber(velocityItem.stockInQty)}</div>
                </div>
                <div className="rounded-none border-[3px] border-ink p-3">
                  <span className="text-muted-foreground text-[10px]">{t.dashboard.stockOut || "Stock Out"}</span>
                  <div className="font-bold text-base text-foreground">-{formatNumber(velocityItem.stockOutQty)}</div>
                </div>
              </div>
            </div>
          )}

          {reorderItem && (
            <div className="space-y-4 font-mono text-xs">
              <div className="rounded-none border-[3px] border-ink bg-[#fee2e2] p-4 shadow-neo-sm space-y-2">
                <span className="inline-flex rounded-none border-[3px] border-ink bg-white px-2 py-0.5 font-bold text-foreground">
                  {reorderItem.sku}
                </span>
                <h4 className="font-heading text-base font-bold text-foreground">{reorderItem.name}</h4>
                <p className="text-[#b91c1c] font-bold">Estimated {reorderItem.daysRemaining} days of stock remaining</p>
              </div>

              <div className="space-y-2 rounded-none border-[3px] border-ink p-3">
                <div className="flex justify-between py-1 border-b border-ink">
                  <span className="text-muted-foreground">{t.products.sheet.inventoryLevel || "Current Stock"}:</span>
                  <span className="font-bold text-[#b91c1c]">{reorderItem.currentStock} units</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink">
                  <span className="text-muted-foreground">{t.products.sheet.minThreshold || "Min Threshold"}:</span>
                  <span className="font-bold">{reorderItem.minThreshold} units</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink">
                  <span className="text-muted-foreground">Suggested Order:</span>
                  <span className="font-bold text-[#543afd]">+{reorderItem.suggestedReorderQty} units</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink">
                  <span className="text-muted-foreground">{t.inventory.unitCost || "Unit Cost"}:</span>
                  <span className="font-bold">{formatCurrency(reorderItem.unitCost)}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                  <span>Est. Total Cost:</span>
                  <span className="text-[#543afd]">{formatCurrency(reorderItem.totalReorderCost)}</span>
                </div>
              </div>

              <div className="rounded-none border-[3px] border-ink bg-[#f8f9fa] p-3 text-[11px] space-y-1">
                <p className="font-bold text-foreground">{t.suppliers.supplierDetails || "Supplier Details"}:</p>
                <p>{reorderItem.supplierName}</p>
                <p className="text-muted-foreground">Expected Lead Time: {reorderItem.leadTimeDays} business days</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ink p-4 bg-[#f8f9fa]">
          <Button
            onClick={onClose}
            className="w-full border-[3px] border-ink bg-white font-mono text-xs font-bold text-foreground shadow-neo-sm hover:bg-slate-100"
          >
            {t.common.close || "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
