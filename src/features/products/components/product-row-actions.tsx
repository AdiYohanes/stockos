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
        className="h-8 w-8 p-0 text-ink hover:text-ink hover:bg-paper rounded-none border-[3px] border-transparent hover:border-ink transition-all"
        title="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">{t.common.actions}</span>
      </Button>

      {/* Popover Menu: Neobrutalism dropdown menu */}
      {menuOpen && (
        <div
          className="absolute right-0 z-50 mt-1 w-44 border-[3px] border-ink bg-white p-1 shadow-hard-sm animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-mono tabular-nums uppercase tracking-widest text-ink/60 border-b-[2px] border-ink/20">
            {product.sku}
          </div>

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onViewDetails(product);
            }}
            className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors cursor-pointer text-left uppercase tracking-widest"
          >
            <Eye className="h-4 w-4 text-ink" />
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
                className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer text-left uppercase tracking-widest"
              >
                <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                <span>{t.products.actions.receiveStock}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onQuickMovement(product, "out");
                }}
                className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer text-left uppercase tracking-widest"
              >
                <ArrowUpFromLine className="h-4 w-4 text-rose-600" />
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
            className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs font-bold text-ink hover:bg-paper transition-colors cursor-pointer text-left uppercase tracking-widest"
          >
            <Edit2 className="h-4 w-4 text-ink" />
            <span>{t.products.actions.edit}</span>
          </button>

          <div className="my-1 border-t-[2px] border-ink/20" />

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete(product);
            }}
            className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left uppercase tracking-widest"
          >
            <Trash2 className="h-4 w-4 text-rose-600" />
            <span>{t.products.actions.delete}</span>
          </button>
        </div>
      )}
    </div>
  );
}
