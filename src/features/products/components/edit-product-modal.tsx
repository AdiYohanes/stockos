"use client";

import * as React from "react";
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
import type { Product } from "../types";

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
  const [name, setName] = React.useState(product.name);
  const [sku, setSku] = React.useState(product.sku);
  const [category, setCategory] = React.useState(product.category);
  const [unit, setUnit] = React.useState(product.unit);
  const [unitPrice, setUnitPrice] = React.useState(product.unitPrice ? product.unitPrice.toString() : "");
  const [minStock, setMinStock] = React.useState(product.minStock.toString());
  const [warehouse, setWarehouse] = React.useState(product.warehouse);
  const [supplier, setSupplier] = React.useState(product.supplier || "");
  const [description, setDescription] = React.useState(product.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProduct(product.id, {
      name,
      sku: sku.toUpperCase(),
      category,
      unit,
      unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
      minStock: minStock ? parseInt(minStock, 10) : 0,
      warehouse,
      supplier,
      description,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody className="max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="edit-name">Product Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-neo"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-sku">SKU Code *</Label>
            <div className="relative">
              <Input
                id="edit-sku"
                className="input-neo pr-8 font-mono uppercase"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                required
              />
              <Barcode className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-category">Category *</Label>
            <select
              id="edit-category"
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-unit">Unit *</Label>
            <select
              id="edit-unit"
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer font-mono"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-warehouse">Warehouse *</Label>
            <select
              id="edit-warehouse"
              className="h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-all outline-none focus:border-black focus:shadow-[2px_2px_0px_#543afd] cursor-pointer"
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              required
            >
              {WAREHOUSES.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-unit-price">Unit Price ($)</Label>
            <div className="relative">
              <Input
                id="edit-unit-price"
                type="number"
                step="0.01"
                min="0"
                className="input-neo pl-7 font-mono"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
              <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-min-stock">Min Stock Level *</Label>
            <Input
              id="edit-min-stock"
              type="number"
              min="0"
              className="input-neo font-mono"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-supplier">Supplier</Label>
            <Input
              id="edit-supplier"
              className="input-neo"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Input
              id="edit-desc"
              className="input-neo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="mt-4 pt-3 border-t border-border">
        <DialogClose
          render={<Button variant="outline" size="sm" type="button" className="btn-neo" />}
        >
          Cancel
        </DialogClose>
        <Button type="submit" size="sm" className="btn-neo-primary">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-primary/10 shadow-neo-sm">
                <Edit2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground font-heading">
                  Edit Product
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update inventory metadata and threshold parameters
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

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
