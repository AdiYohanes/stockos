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

const REASONS = [
  { value: "sale", label: "Sale / Order Fulfillment" },
  { value: "usage", label: "Internal Usage" },
  { value: "damaged", label: "Damaged / Defective" },
  { value: "return_supplier", label: "Return to Supplier" },
  { value: "other", label: "Other" },
];

const INITIAL_FORM_DATA: StockOutFormData = {
  sku: "",
  qty: "",
  reason: "",
  ref: "",
  notes: "",
};

export function StockOutModal({ children }: StockOutModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<StockOutFormData>(INITIAL_FORM_DATA);
  const [submittedData, setSubmittedData] = React.useState<StockOutFormData | null>(null);

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
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-amber-500/10 shadow-neo-sm">
                    <ArrowUpFromLine className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground font-heading">
                      Stock Out
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Record dispatch, sales, or usage
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockout-product">Product</Label>
                      <select
                        id="stockout-product"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                        required
                        value={formData.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                      >
                        <option value="">Select product</option>
                        {MOCK_PRODUCTS.map((p) => (
                          <option key={p.sku} value={p.sku}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                      {currentStock !== undefined && (
                        <p className="text-[10px] text-muted-foreground">
                          Current stock:{" "}
                          <span className="font-mono font-bold text-foreground">{currentStock}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="stockout-qty">Quantity</Label>
                      <Input
                        id="stockout-qty"
                        type="number"
                        min="1"
                        max={currentStock}
                        placeholder="Enter quantity"
                        required
                        value={formData.qty}
                        onChange={(e) => handleInputChange("qty", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="stockout-reason">Reason</Label>
                      <select
                        id="stockout-reason"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                        required
                        value={formData.reason}
                        onChange={(e) => handleInputChange("reason", e.target.value)}
                      >
                        <option value="">Select reason</option>
                        {REASONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockout-ref">Reference / Order ID</Label>
                      <Input
                        id="stockout-ref"
                        placeholder="e.g. SO-2026-1234"
                        value={formData.ref}
                        onChange={(e) => handleInputChange("ref", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="stockout-notes">Notes</Label>
                      <textarea
                        id="stockout-notes"
                        rows={2}
                        placeholder="Optional notes..."
                        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] resize-none placeholder:text-muted-foreground"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" />}
                  >
                    Cancel
                  </DialogClose>
                  <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-black btn-neo">
                    Dispatch Stock
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
                  <div className="absolute h-24 w-24 rounded-full bg-amber-500/15 animate-ring-pulse pointer-events-none" />
                  
                  <div className="absolute -top-1.5 -right-2 text-amber-500 animate-in fade-in zoom-in duration-500 delay-300">
                    <Sparkles className="h-4 w-4 fill-amber-500/30" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 text-emerald-500 animate-in fade-in zoom-in duration-500 delay-500">
                    <Sparkles className="h-3 w-3 fill-emerald-500/30" />
                  </div>

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-amber-50 shadow-neo animate-check-pop">
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
                <DialogTitle className="text-xl font-bold font-heading text-foreground">
                  Stock Dispatched Successfully!
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground max-w-xs font-sans">
                  Inventory count has been deducted and movement is recorded.
                </DialogDescription>

                {/* Summary Preview Card */}
                {submittedData && (
                  <div className="mt-5 w-full rounded-lg border border-border bg-muted/40 p-4 text-left shadow-neo-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 space-y-2.5">
                    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-2.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-sm border border-black bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-700 tracking-wider uppercase shadow-neo-sm">
                            {submittedData.sku || "N/A"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono truncate">
                            <Tag className="h-3 w-3" />
                            {matchedReason || "Dispatch"}
                          </span>
                        </div>
                        <p className="font-heading font-semibold text-foreground text-sm truncate pt-0.5">
                          {matchedProduct?.name || "Selected Product"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-amber-600 font-mono font-bold block">
                          Stock Deducted
                        </span>
                        <span className="font-mono text-base font-bold text-amber-700">
                          -{submittedData.qty}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {matchedProduct?.unit || "units"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {submittedData.ref && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                        <FileText className="h-3 w-3 text-foreground/60" />
                        <span>Order / Ref ID: <span className="font-semibold text-foreground">{submittedData.ref}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-neo flex-1 sm:flex-initial sm:px-6"
                    onClick={() => handleOpenChange(false)}
                  >
                    Done
                  </Button>
                  <Button
                    type="button"
                    className="btn-neo-primary flex-1 sm:flex-initial sm:px-6 gap-1.5 bg-amber-600 hover:bg-amber-700"
                    onClick={handleRecordAnother}
                  >
                    <Plus className="h-4 w-4" />
                    Dispatch Another Item
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
