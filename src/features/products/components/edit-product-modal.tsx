"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Barcode, DollarSign } from "lucide-react";
import {
  DialogRoot,
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
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, WAREHOUSES } from "../mock-data";
import {
  EditProductInputSchema,
  type EditProductInput,
  type Product,
} from "../schemas/product.schema";

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
}

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
}

function EditProductForm({ product, onClose, onUpdateProduct }: EditProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProductInput>({
    resolver: zodResolver(EditProductInputSchema),
    defaultValues: {
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      unitPrice: product.unitPrice ?? 0,
      minStock: product.minStock,
      warehouse: product.warehouse,
      supplier: product.supplier || "",
      description: product.description || "",
    },
  });

  const onSubmit = (data: EditProductInput) => {
    onUpdateProduct(product.id, {
      ...data,
      sku: data.sku.toUpperCase(),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogBody className="max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="edit-name">Product Name *</Label>
            <Input
              id="edit-name"
              {...register("name")}
              className="h-9 text-xs sm:text-sm"
            />
            {errors.name && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-sku">SKU Code *</Label>
            <div className="relative">
              <Input
                id="edit-sku"
                className="h-9 pr-8 font-mono tabular-nums uppercase text-xs sm:text-sm"
                {...register("sku")}
              />
              <Barcode className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.sku && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.sku.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-category">Category *</Label>
            <select
              id="edit-category"
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer"
              {...register("category")}
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-unit">Unit *</Label>
            <select
              id="edit-unit"
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer font-mono"
              {...register("unit")}
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {errors.unit && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.unit.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-warehouse">Warehouse *</Label>
            <select
              id="edit-warehouse"
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors outline-none hover:border-slate-400 focus:ring-1 focus:ring-slate-900 cursor-pointer"
              {...register("warehouse")}
            >
              {WAREHOUSES.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>
            {errors.warehouse && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.warehouse.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-unit-price">Unit Price ($)</Label>
            <div className="relative">
              <Input
                id="edit-unit-price"
                type="number"
                step="0.01"
                min="0"
                className="h-9 pl-7 font-mono tabular-nums text-xs sm:text-sm"
                {...register("unitPrice", { valueAsNumber: true })}
              />
              <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.unitPrice && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.unitPrice.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-min-stock">Min Stock Level *</Label>
            <Input
              id="edit-min-stock"
              type="number"
              min="0"
              className="h-9 font-mono tabular-nums text-xs sm:text-sm"
              {...register("minStock", { valueAsNumber: true })}
            />
            {errors.minStock && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.minStock.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-supplier">Supplier</Label>
            <Input
              id="edit-supplier"
              className="h-9 text-xs sm:text-sm"
              {...register("supplier")}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Input
              id="edit-desc"
              className="h-9 text-xs sm:text-sm"
              {...register("description")}
            />
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="mt-4 pt-3 border-t border-border">
        <DialogClose
          render={<Button variant="outline" size="sm" type="button" className="h-9 text-xs hover:border-slate-400" />}
        >
          Cancel
        </DialogClose>
        <Button type="submit" size="sm" className="h-9 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditProductModal({
  product,
  open,
  onOpenChange,
  onUpdateProduct,
}: EditProductModalProps) {
  if (!product) return null;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-lg overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-slate-100 dark:bg-slate-800 text-foreground">
                <Edit2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground font-sans">
                  Edit Product
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update inventory attributes and thresholds for {product.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Keyed Form Pattern for React 19 compliance */}
          <EditProductForm
            key={product.id}
            product={product}
            onClose={() => onOpenChange(false)}
            onUpdateProduct={onUpdateProduct}
          />
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
