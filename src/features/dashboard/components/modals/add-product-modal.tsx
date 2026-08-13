"use client";

import * as React from "react";
import {
  PackagePlus,
  Barcode,
  Plus,
  Sparkles,
  Layers,
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

interface AddProductModalProps {
  children: React.ReactNode;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unit: string;
  initialStock: string;
  minStock: string;
}

const CATEGORIES = [
  "Electronics",
  "Mechanical",
  "Structural",
  "Motors",
  "Power",
  "Consumables",
  "Cables & Adapters",
  "3D Printing",
  "Fasteners",
  "Tools",
  "Sensors",
];

const UNITS = ["pcs", "units", "kits", "sets", "spools", "bars", "cells", "tubes", "kg", "m"];

const INITIAL_FORM_DATA: ProductFormData = {
  name: "",
  sku: "",
  category: "",
  unit: "pcs",
  initialStock: "",
  minStock: "",
};

export function AddProductModal({ children }: AddProductModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<ProductFormData>(INITIAL_FORM_DATA);
  const [submittedProduct, setSubmittedProduct] = React.useState<ProductFormData | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Reset form on close after a brief delay so close animation stays clean
      setTimeout(() => {
        setIsSuccess(false);
        setFormData(INITIAL_FORM_DATA);
        setSubmittedProduct(null);
      }, 200);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedProduct({ ...formData });
    setIsSuccess(true);
  };

  const handleAddAnother = () => {
    setIsSuccess(false);
    setFormData(INITIAL_FORM_DATA);
    setSubmittedProduct(null);
  };

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
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-primary/10 shadow-neo-sm">
                    <PackagePlus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground font-heading">
                      Add New Product
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Register new item with SKU & details
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <DialogBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-name">Product Name</Label>
                      <Input
                        id="product-name"
                        placeholder="e.g. ESP32-WROOM-32D Module"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-sku">SKU Code</Label>
                      <div className="relative">
                        <Input
                          id="product-sku"
                          placeholder="e.g. ELEC-ESP-32"
                          className="pr-8 font-mono"
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value.toUpperCase())}
                          required
                        />
                        <Barcode className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-category">Category</Label>
                      <select
                        id="product-category"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        required
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-unit">Unit</Label>
                      <select
                        id="product-unit"
                        className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
                        value={formData.unit}
                        onChange={(e) => handleInputChange("unit", e.target.value)}
                        required
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-initial-stock">Initial Stock</Label>
                      <Input
                        id="product-initial-stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.initialStock}
                        onChange={(e) => handleInputChange("initialStock", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product-min-stock">Minimum Stock Level</Label>
                      <Input
                        id="product-min-stock"
                        type="number"
                        min="0"
                        placeholder="e.g. 50"
                        value={formData.minStock}
                        onChange={(e) => handleInputChange("minStock", e.target.value)}
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Alert triggers when stock falls below this level
                      </p>
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline" size="sm" type="button" />}
                  >
                    Cancel
                  </DialogClose>
                  <Button type="submit" size="sm">
                    Add Product
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            /* ================= MODERN SUCCESS VIEW ================= */
            <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                {/* Modern Animated Checkmark */}
                <div className="relative mb-5 flex items-center justify-center">
                  {/* Subtle pulsing background ring */}
                  <div className="absolute h-24 w-24 rounded-full bg-emerald-500/15 animate-ring-pulse pointer-events-none" />
                  
                  {/* Sparkle decorative icons */}
                  <div className="absolute -top-1.5 -right-2 text-emerald-500 animate-in fade-in zoom-in duration-500 delay-300">
                    <Sparkles className="h-4 w-4 fill-emerald-500/30" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 text-primary animate-in fade-in zoom-in duration-500 delay-500">
                    <Sparkles className="h-3 w-3 fill-primary/30" />
                  </div>

                  {/* Main Tactile Check Badge */}
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-emerald-50 shadow-neo animate-check-pop">
                    <svg
                      className="h-12 w-12 text-emerald-600"
                      viewBox="0 0 52 52"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Outer Circle Animation */}
                      <circle
                        className="stroke-emerald-200/80"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="2.5"
                      />
                      <circle
                        className="stroke-emerald-600 animate-check-circle"
                        cx="26"
                        cy="26"
                        r="23"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {/* Checkmark Path Animation */}
                      <path
                        className="stroke-emerald-600 animate-check-path"
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
                  Product Successfully Added!
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground max-w-xs font-sans">
                  The product is now registered in StockOS inventory and ready for stock movements.
                </DialogDescription>

                {/* Product Summary Preview Card */}
                {submittedProduct && (
                  <div className="mt-5 w-full rounded-lg border border-border bg-muted/40 p-4 text-left shadow-neo-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-sm border border-black bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary tracking-wider uppercase shadow-neo-sm">
                            {submittedProduct.sku || "N/A"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Layers className="h-3 w-3" />
                            {submittedProduct.category || "General"}
                          </span>
                        </div>
                        <p className="font-heading font-semibold text-foreground text-sm truncate pt-1">
                          {submittedProduct.name || "Untitled Product"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block">
                          Initial Stock
                        </span>
                        <span className="font-mono text-base font-bold text-foreground">
                          {submittedProduct.initialStock || "0"}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {submittedProduct.unit}
                          </span>
                        </span>
                      </div>
                    </div>
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
                    className="btn-neo-primary flex-1 sm:flex-initial sm:px-6 gap-1.5"
                    onClick={handleAddAnother}
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Product
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
