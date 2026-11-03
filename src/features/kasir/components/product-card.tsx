"use client";

import * as React from "react";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import { ProductPhoto } from "@/features/products/components/product-photo";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductDto;
  tallyCount: number;
  onSelect: (product: ProductDto) => void;
}

export function ProductCard({ product, tallyCount, onSelect }: ProductCardProps) {
  const isOutOfStock = product.currentStock <= 0;
  const priceFormatted = new Intl.NumberFormat("id-ID").format(Number(product.sellingPrice));

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onSelect(product)}
      className={cn(
        "group relative flex flex-col justify-between text-left p-3 bg-card border-[3px] border-border shadow-hard transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isOutOfStock
          ? "opacity-50 cursor-not-allowed bg-muted/60"
          : "hover:-translate-y-0.5 hover:shadow-hard-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
      )}
    >
      {/* Tally Count Indicator Badge */}
      {tallyCount > 0 && (
        <span className="absolute -top-2.5 -right-2.5 z-10 bg-primary text-primary-foreground border-[2px] border-border font-mono text-xs font-bold px-2 py-0.5 shadow-hard-sm">
          {tallyCount}x
        </span>
      )}

      {/* Top: Photo & Info */}
      <div className="flex gap-3 items-start w-full">
        <ProductPhoto
          photo={product.photo}
          className="h-14 w-14 shrink-0 bg-paper border-[2px]"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground truncate">
              {product.sku}
            </span>
          </div>

          <h3 className="font-heading font-bold text-sm text-foreground leading-snug line-clamp-2 uppercase">
            {product.name}
          </h3>
        </div>
      </div>

      {/* Bottom: Price & Stock Badge */}
      <div className="mt-3 pt-2 border-t-[2px] border-border/20 flex items-center justify-between w-full">
        <span className="font-mono font-bold text-sm text-primary">
          Rp{priceFormatted}
        </span>

        {isOutOfStock ? (
          <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 bg-destructive/10 text-destructive border border-destructive/40">
            Habis
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 bg-muted text-foreground border border-border/30">
            Sisa {product.currentStock}
          </span>
        )}
      </div>
    </button>
  );
}
