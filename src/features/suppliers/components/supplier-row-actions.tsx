"use client";

import * as React from "react";
import {
  MoreVertical,
  Eye,
  Pencil,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SupplierItem } from "../types";

interface SupplierRowActionsProps {
  supplier: SupplierItem;
  onViewDetails: (id: string) => void;
  onEdit: (supplier: SupplierItem) => void;
  onDelete: (supplier: SupplierItem) => void;
}

export function SupplierRowActions({
  supplier,
  onViewDetails,
  onEdit,
  onDelete,
}: SupplierRowActionsProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-right" ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="h-7 w-7 p-0 text-muted-foreground hover:bg-slate-200/60 hover:text-foreground rounded"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </Button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-44 rounded-md border border-black bg-white p-1 shadow-neo animate-in fade-in zoom-in-95 duration-100 text-left font-sans text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onViewDetails(supplier.id);
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-purple-50 hover:text-[#543afd] transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-[#543afd]" />
            <span>View Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(supplier);
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-slate-100 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-600" />
            <span>Edit Supplier</span>
          </button>

          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Place Order</span>
          </button>

          <div className="my-1 border-t border-slate-200" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(supplier);
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Supplier</span>
          </button>
        </div>
      )}
    </div>
  );
}
