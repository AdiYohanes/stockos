"use client";

import * as React from "react";
import {
  ArrowUpFromLine,
  Plus,
  Sparkles,
  Tag,
  FileText,
} from "lucide-react";
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";

interface StockOutModalProps {
  children: React.ReactNode;
}

interface StockOutFormData {
  sku: string;
  qty: string;
  reason: string;
  ref: string;
  notes: string;
}

const MOCK_PRODUCTS = [
  { sku: "CABL-USBC-2M", name: "Braided USB-C Cable 2m", stock: 240, unit: "pcs" },
  { sku: "FILA-PLA-BLK", name: "PLA+ Filament Black 1kg", stock: 180, unit: "spools" },
  { sku: "FAST-M3-SS", name: "M3 SS Screw Kit (500pcs)", stock: 95, unit: "kits" },
  { sku: "TOOL-PRC-24", name: "Precision Screwdriver Set", stock: 74, unit: "sets" },
  { sku: "SENS-ENV-BME", name: "BME280 Sensor Module", stock: 115, unit: "pcs" },
];

const INITIAL_FORM_DATA: StockOutFormData = {
  sku: "",
  qty: "",
  reason: "",
  ref: "",
  notes: "",
};

export function StockOutModal({ children }: StockOutModalProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<StockOutFormData>(INITIAL_FORM_DATA);
  const [submittedData, setSubmittedData] = React.useState<StockOutFormData | null>(null);

  const REASONS = [
    { value: "sale", label: t.modals.stockOut.reasons.sale },
    { value: "usage", label: t.modals.stockOut.reasons.usage },
    { value: "damaged", label: t.modals.stockOut.reasons.damaged },
    { value: "return_supplier", label: t.modals.stockOut.reasons.returnSupplier },
    { value: "other", label: t.modals.stockOut.reasons.other },
  ];

  const currentStock = MOCK_PRODUCTS.find((p) => p.sku === formData.sku)?.stock;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        setFormData(INITIAL_FORM_DATA);
        setSubmittedData(null);
      }, 200);
    }
  };

  const handleInputChange = (field: keyof StockOutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedData({ ...formData });
    setIsSuccess(true);
  };

  const handleRecordAnother = () => {
    setIsSuccess(false);
    setFormData(INITIAL_FORM_DATA);
    setSubmittedData(null);
  };

  const matchedProduct = MOCK_PRODUCTS.find((p) => p.sku === (submittedData?.sku || formData.sku));
  const matchedReason = REASONS.find((r) => r.value === (submittedData?.reason || formData.reason))?.label;

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="overflow-hidden">
          {!isSuccess ? (
            /* ================= FORM VIEW ================= */
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-ink bg-amber-100 shadow-hard-sm">
                    <ArrowUpFromLine className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-ink uppercase tracking-wider font-sans">
                      {t.modals.stockOut.title}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-ink/60 font-mono uppercase tracking-widest mt-0.5">
                      {t.modals.stockOut.subtitle}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockout-product" className="text-[10px] font-bold uppercase tracking-widest text-ink">{t.modals.product}</Label>
                      <select
                        id="stockout-product"
                        className="h-10 w-full rounded-none border-[3px] border-ink bg-white px-3 py-1.5 text-sm font-sans font-bold text-ink transition-shadow outline-none focus:shadow-hard-sm cursor-pointer"
                        required
                        value={formData.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                      >
                        <option value="">{t.modals.selectProduct}</option>
                        {MOCK_PRODUCTS.map((p) => (
                          <option key={p.sku} value={p.sku}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                      {currentStock !== undefined && (
                        <p className="text-[10px] font-mono uppercase tracking-widest text-ink/60">
                          {t.modals.stockOut.currentStock}{" "}
                          <span className="font-bold text-ink bg-paper px-1 border border-ink/20">{currentStock}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="stockout-qty" className="text-[10px] font-bold uppercase tracking-widest text-ink">{t.modals.quantity}</Label>
                      <Input
                        id="stockout-qty"
                        type="number"
                        min="1"
                        max={currentStock}
                        placeholder={t.modals.enterQuantity}
                        required
                        value={formData.qty}
                        onChange={(e) => handleInputChange("qty", e.target.value)}
                        className="font-mono rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="stockout-reason" className="text-[10px] font-bold uppercase tracking-widest text-ink">{t.modals.stockOut.reasonLabel}</Label>
                      <select
                        id="stockout-reason"
                        className="h-10 w-full rounded-none border-[3px] border-ink bg-white px-3 py-1.5 text-sm font-sans font-bold text-ink transition-shadow outline-none focus:shadow-hard-sm cursor-pointer"
                        required
                        value={formData.reason}
                        onChange={(e) => handleInputChange("reason", e.target.value)}
                      >
                        <option value="">{t.modals.stockOut.selectReason}</option>
                        {REASONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockout-ref" className="text-[10px] font-bold uppercase tracking-widest text-ink">{t.modals.stockOut.orderRefLabel}</Label>
                      <Input
                        id="stockout-ref"
                        placeholder={t.modals.stockOut.orderRefPlaceholder}
                        value={formData.ref}
                        onChange={(e) => handleInputChange("ref", e.target.value)}
                        className="rounded-none border-[3px] border-ink bg-white shadow-none focus-visible:shadow-hard-sm transition-shadow h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockout-notes" className="text-[10px] font-bold uppercase tracking-widest text-ink">{t.modals.notes}</Label>
                      <textarea
                        id="stockout-notes"
                        rows={2}
                        placeholder={t.modals.notesOptional}
                        className="w-full rounded-none border-[3px] border-ink bg-white px-3 py-2 text-sm font-sans text-ink transition-shadow outline-none focus:shadow-hard-sm resize-none placeholder:text-ink/50"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" className="btn-neo border-[3px]" />}
                  >
                    {t.common.cancel}
                  </DialogClose>
                  <Button type="submit" size="sm" className="bg-amber-400 hover:bg-amber-500 text-ink border-[3px] border-ink shadow-hard-sm press">
                    {t.modals.stockOut.submit}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            /* ================= MODERN SUCCESS VIEW ================= */
            <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                {/* Modern Animated Checkmark with Amber Accent */}
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="absolute h-24 w-24 rounded-none bg-amber-500/15 animate-ring-pulse pointer-events-none" />

                  <div className="absolute -top-1.5 -right-2 text-amber-500 animate-in fade-in zoom-in duration-500 delay-300">
                    <Sparkles className="h-4 w-4 fill-amber-500/30" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 text-emerald-500 animate-in fade-in zoom-in duration-500 delay-500">
                    <Sparkles className="h-3 w-3 fill-emerald-500/30" />
                  </div>

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-none border-[3px] border-ink bg-amber-50 shadow-hard-sm animate-check-pop">
                    <svg
                      className="h-12 w-12 text-amber-600"
                      viewBox="0 0 52 52"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="stroke-amber-200/80"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="2.5"
                      />
                      <circle
                        className="stroke-amber-600 animate-check-circle"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        className="stroke-amber-600 animate-check-path"
                        d="M15 26.5L22.5 34L37 18.5"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Text Announcement */}
                <DialogTitle className="text-xl font-bold font-sans uppercase tracking-widest text-ink">
                  {t.modals.stockOut.successTitle}
                </DialogTitle>
                <DialogDescription className="mt-1 text-[10px] text-ink/60 max-w-xs font-mono uppercase tracking-widest">
                  {t.modals.stockOut.successSubtitle}
                </DialogDescription>

                {/* Summary Preview Card */}
                {submittedData && (
                  <div className="mt-5 w-full border-[3px] border-ink bg-paper p-4 text-left shadow-hard-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 space-y-2.5">
                    <div className="flex items-start justify-between gap-3 border-b-[2px] border-ink/20 pb-2.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center border-[3px] border-ink bg-amber-400 px-2 py-0.5 font-mono text-[10px] font-bold text-ink tracking-wider uppercase">
                            {submittedData.sku || "N/A"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-ink/60 font-mono truncate uppercase tracking-widest">
                            <Tag className="h-3 w-3" />
                            {matchedReason || t.modals.stockOut.reasonLabel}
                          </span>
                        </div>
                        <p className="font-sans font-bold text-ink text-sm truncate pt-0.5 uppercase">
                          {matchedProduct?.name || t.modals.stockIn.selectedProduct}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-widest text-ink/60 font-mono font-bold block">
                          {t.modals.stockOut.stockDeducted}
                        </span>
                        <span className="font-mono text-base font-bold text-ink">
                          -{submittedData.qty}{" "}
                          <span className="text-xs font-normal text-ink/60">
                            {matchedProduct?.unit || "unit"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {submittedData.ref && (
                      <div className="flex items-center gap-1.5 text-[10px] text-ink/60 font-mono uppercase tracking-widest">
                        <FileText className="h-3 w-3 text-ink/60" />
                        <span>Ref ID: <span className="font-bold text-ink">{submittedData.ref}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <DialogClose
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-neo flex-1 sm:flex-initial sm:px-6 border-[3px]"
                      />
                    }
                  >
                    {t.modals.finish}
                  </DialogClose>
                  <Button
                    type="button"
                    className="bg-amber-400 hover:bg-amber-500 text-ink border-[3px] border-ink shadow-hard-sm press flex-1 sm:flex-initial sm:px-6 gap-1.5"
                    onClick={handleRecordAnother}
                  >
                    <Plus className="h-4 w-4" />
                    {t.modals.stockOut.dispatchAnother}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
