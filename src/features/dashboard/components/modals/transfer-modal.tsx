"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Plus,
  Sparkles,
  Building2,
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

interface TransferModalProps {
  children: React.ReactNode;
}

interface TransferFormData {
  sku: string;
  qty: string;
  fromWarehouse: string;
  toWarehouse: string;
  notes: string;
}

const MOCK_PRODUCTS = [
  { sku: "CABL-USBC-2M", name: "Braided USB-C Cable 2m", unit: "pcs" },
  { sku: "FILA-PLA-BLK", name: "PLA+ Filament Black 1kg", unit: "spools" },
  { sku: "FAST-M3-SS", name: "M3 SS Screw Kit (500pcs)", unit: "kits" },
  { sku: "TOOL-PRC-24", name: "Precision Screwdriver Set", unit: "sets" },
  { sku: "SENS-ENV-BME", name: "BME280 Sensor Module", unit: "pcs" },
  { sku: "ELEC-ESP-32", name: "ESP32-WROOM-32D Module", unit: "pcs" },
];

const WAREHOUSES = [
  "Main Hub (WH-1)",
  "East Annex (WH-2)",
  "South Depot (WH-3)",
];

const INITIAL_FORM_DATA: TransferFormData = {
  sku: "",
  qty: "",
  fromWarehouse: "",
  toWarehouse: "",
  notes: "",
};

export function TransferModal({ children }: TransferModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<TransferFormData>(INITIAL_FORM_DATA);
  const [submittedData, setSubmittedData] = React.useState<TransferFormData | null>(null);

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

  const handleInputChange = (field: keyof TransferFormData, value: string) => {
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-blue-500/10 shadow-neo-sm">
                    <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground font-heading">
                      Transfer Stock
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Move inventory between warehouses
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="transfer-product">Product</Label>
                      <select
                        id="transfer-product"
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
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="transfer-qty">Quantity</Label>
                      <Input
                        id="transfer-qty"
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        required
                        value={formData.qty}
                        onChange={(e) => handleInputChange("qty", e.target.value)}
                      />
                    </div>

                    {/* Warehouse transfer direction */}
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="transfer-from">From</Label>
                          <select
                            id="transfer-from"
                            className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                            required
                            value={formData.fromWarehouse}
                            onChange={(e) => handleInputChange("fromWarehouse", e.target.value)}
                          >
                            <option value="">Origin</option>
                            {WAREHOUSES.map((wh) => (
                              <option key={wh} value={wh}>{wh}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex h-9 items-center justify-center">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted">
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="transfer-to">To</Label>
                          <select
                            id="transfer-to"
                            className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                            required
                            value={formData.toWarehouse}
                            onChange={(e) => handleInputChange("toWarehouse", e.target.value)}
                          >
                            <option value="">Destination</option>
                            {WAREHOUSES.filter((wh) => wh !== formData.fromWarehouse).map((wh) => (
                              <option key={wh} value={wh}>{wh}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="transfer-notes">Notes</Label>
                      <textarea
                        id="transfer-notes"
                        rows={2}
                        placeholder="Optional transfer notes..."
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
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-black btn-neo">
                    Transfer Stock
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            /* ================= MODERN SUCCESS VIEW ================= */
            <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                {/* Modern Animated Checkmark with Blue Accent */}
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="absolute h-24 w-24 rounded-full bg-blue-500/15 animate-ring-pulse pointer-events-none" />
                  
                  <div className="absolute -top-1.5 -right-2 text-blue-500 animate-in fade-in zoom-in duration-500 delay-300">
                    <Sparkles className="h-4 w-4 fill-blue-500/30" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 text-primary animate-in fade-in zoom-in duration-500 delay-500">
                    <Sparkles className="h-3 w-3 fill-primary/30" />
                  </div>

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-blue-50 shadow-neo animate-check-pop">
                    <svg
                      className="h-12 w-12 text-blue-600"
                      viewBox="0 0 52 52"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="stroke-blue-200/80"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="2.5"
                      />
                      <circle
                        className="stroke-blue-600 animate-check-circle"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        className="stroke-blue-600 animate-check-path"
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
                  Transfer Initiated Successfully!
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground max-w-xs font-sans">
                  Inventory is scheduled and transferred between warehouse locations.
                </DialogDescription>

                {/* Summary Preview Card */}
                {submittedData && (
                  <div className="mt-5 w-full rounded-lg border border-border bg-muted/40 p-4 text-left shadow-neo-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-2.5">
                      <div className="space-y-1 min-w-0">
                        <span className="inline-flex items-center rounded-sm border border-black bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 tracking-wider uppercase shadow-neo-sm">
                          {submittedData.sku || "N/A"}
                        </span>
                        <p className="font-heading font-semibold text-foreground text-sm truncate pt-0.5">
                          {matchedProduct?.name || "Selected Product"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-blue-600 font-mono font-bold block">
                          Transfer Qty
                        </span>
                        <span className="font-mono text-base font-bold text-blue-700">
                          {submittedData.qty}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {matchedProduct?.unit || "units"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Transfer Route */}
                    <div className="flex items-center gap-2 text-xs font-mono bg-card p-2 rounded border border-border">
                      <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                        <Building2 className="h-3.5 w-3.5 text-foreground shrink-0" />
                        <span className="truncate">{submittedData.fromWarehouse || "Origin"}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <div className="flex items-center gap-1.5 text-foreground font-semibold truncate">
                        <span className="truncate">{submittedData.toWarehouse || "Destination"}</span>
                      </div>
                    </div>

                    {submittedData.notes && (
                      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground font-mono">
                        <FileText className="h-3 w-3 text-foreground/60 shrink-0 mt-0.5" />
                        <span className="italic truncate">{submittedData.notes}</span>
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
                    className="btn-neo-primary flex-1 sm:flex-initial sm:px-6 gap-1.5 bg-blue-600 hover:bg-blue-700"
                    onClick={handleRecordAnother}
                  >
                    <Plus className="h-4 w-4" />
                    Transfer Another Item
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
