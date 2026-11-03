"use client";

import * as React from "react";
import { Search, X, PackageX } from "lucide-react";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import type { TallyItem } from "../types";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

interface ProductCatalogGridProps {
  products: ProductDto[];
  tally: TallyItem[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  onSelectProduct: (product: ProductDto) => void;
}

export function ProductCatalogGrid({
  products,
  tally,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onSelectProduct,
}: ProductCatalogGridProps) {
  const tallyCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of tally) {
      map.set(item.productId, item.quantity);
    }
    return map;
  }, [tally]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col gap-3 bg-card p-4 border-[3px] border-border shadow-hard-sm">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari produk (nama, SKU, barcode)..."
            className="w-full h-11 pl-10 pr-9 border-[3px] border-border bg-background text-sm font-sans focus:outline-none focus:border-primary transition-colors uppercase placeholder:normal-case"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === "ALL" ? "Semua Kategori" : cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono font-bold uppercase whitespace-nowrap border-[3px] transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground border-border shadow-hard-sm"
                    : "bg-muted text-foreground border-border hover:bg-muted/80"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Products */}
      {products.length === 0 ? (
        <div className="p-12 text-center border-[3px] border-dashed border-border bg-card/60 flex flex-col items-center justify-center">
          <PackageX className="h-10 w-10 text-muted-foreground mb-3" />
          <h4 className="font-heading font-bold uppercase text-base text-foreground mb-1">
            Produk Tidak Ditemukan
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            Tidak ada produk yang cocok dengan pencarian atau filter kategori saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tallyCount={tallyCountMap.get(product.id) || 0}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}
