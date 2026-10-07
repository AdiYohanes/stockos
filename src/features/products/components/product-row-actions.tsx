"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import type { Product } from "../types";

interface ProductRowActionsProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onQuickMovement?: (product: Product, type: "in" | "out") => void;
}

export function ProductRowActions({
  product,
  onViewDetails,
  onEdit,
  onDelete,
  onQuickMovement,
}: ProductRowActionsProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="relative inline-block text-right" ref={menuRef}>
      {/* Quick Action Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
        title="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </Button>

      {/* Popover Menu: 1px hairline boundary with soft shadow-md */}
      {menuOpen && (
        <div
          className="absolute right-0 z-50 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-mono tabular-nums uppercase tracking-wider text-muted-foreground border-b border-border">
            {product.sku}
          </div>

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onViewDetails(product);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t.products.actions.view}</span>
          </button>

          {onQuickMovement && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onQuickMovement(product, "in");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer text-left font-medium"
              >
                <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t.products.actions.receiveStock}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onQuickMovement(product, "out");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left font-medium"
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-600" />
                <span>{t.products.actions.issueStock}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onEdit(product);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t.products.actions.edit}</span>
          </button>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete(product);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left font-medium"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>{t.products.actions.delete}</span>
          </button>
        </div>
      )}
    </div>
  );
}
