"use client";

import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
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
import type { Product } from "../types";

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: (id: string) => void;
}

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onConfirmDelete,
}: DeleteProductDialogProps) {
  if (!product) return null;

  const handleDelete = () => {
    onConfirmDelete(product.id);
    onOpenChange(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md overflow-hidden border-2 border-black shadow-neo">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black bg-rose-100 text-rose-600 shadow-neo-sm shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground font-heading">
                  Delete Product Item
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Are you sure you want to remove this product from inventory?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            <div className="rounded-lg border border-border bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm border border-black">
                  {product.sku}
                </span>
                <span className="font-heading font-semibold text-sm text-foreground truncate">
                  {product.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Current stock: <strong>{product.currentStock} {product.unit}</strong> • Location: <strong>{product.warehouse}</strong>
              </p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              This action will remove the product and its associated records from your local catalog view.
            </p>
          </DialogBody>

          <DialogFooter className="mt-4 pt-3 border-t border-border">
            <DialogClose
              render={<Button variant="outline" size="sm" type="button" className="btn-neo" />}
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={handleDelete}
              className="btn-neo bg-rose-600 text-white hover:bg-rose-700 gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
