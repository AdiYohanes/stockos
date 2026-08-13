"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductRowActions } from "./product-row-actions";
import { ProductEmptyState } from "./product-empty-state";
import type { Product, ProductFilterState } from "../types";

interface ProductsTableProps {
  products: Product[];
  totalCount: number;
  filterState: ProductFilterState;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onViewDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onQuickMovement: (product: Product, type: "in" | "out") => void;
  onAddProductClick: () => void;
}

export function ProductsTable({
  products,
  totalCount,
  filterState,
  hasActiveFilters,
  onPageChange,
  onResetFilters,
  onViewDetails,
  onEdit,
  onDelete,
  onQuickMovement,
  onAddProductClick,
}: ProductsTableProps) {
  const { page, pageSize } = filterState;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  if (products.length === 0) {
    return (
      <ProductEmptyState
        hasFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        onAddProduct={onAddProductClick}
      />
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[850px]">
          <thead className="border-b border-border bg-slate-50/90 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
            <tr>
              <th scope="col" className="px-4 py-3 min-w-[220px]">
                Product Name & Category
              </th>
              <th scope="col" className="px-3 py-3 w-[150px]">
                SKU / Barcode
              </th>
              <th scope="col" className="px-3 py-3 w-[170px]">
                Stock Level
              </th>
              <th scope="col" className="px-3 py-3 w-[140px] text-right">
                Price / Value
              </th>
              <th scope="col" className="px-3 py-3 w-[150px]">
                Location
              </th>
              <th scope="col" className="px-3 py-3 w-[130px] text-center">
                Status
              </th>
              <th scope="col" className="px-3 py-3 w-[70px] text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const stockPercentage =
                product.minStock > 0
                  ? Math.min(100, Math.round((product.currentStock / product.minStock) * 100))
                  : 100;
              const totalProductValue = product.currentStock * (product.unitPrice || 0);

              return (
                <tr
                  key={product.id}
                  onClick={() => onViewDetails(product)}
                  className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                >
                  {/* Col 1: Product Name & Category */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-heading font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-sm border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {product.category}
                        </span>
                        {product.supplier && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {product.supplier}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Col 2: SKU & Barcode */}
                  <td className="px-3 py-3 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex w-fit items-center rounded-sm border border-black bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary tracking-wider shadow-neo-sm">
                        {product.sku}
                      </span>
                      {product.barcode && (
                        <span className="text-[10px] text-muted-foreground">
                          #{product.barcode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Col 3: Stock Level & Progress Bar */}
                  <td className="px-3 py-3 font-mono">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={cn(
                            "font-bold",
                            product.status === "out_of_stock"
                              ? "text-destructive font-extrabold"
                              : product.status === "low_stock"
                              ? "text-amber-600"
                              : "text-foreground"
                          )}
                        >
                          {formatNumber(product.currentStock)} {product.unit}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Min: {product.minStock}
                        </span>
                      </div>

                      {/* Stock Bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          style={{ width: `${Math.max(product.currentStock > 0 ? 8 : 0, stockPercentage)}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            product.status === "out_of_stock"
                              ? "bg-destructive"
                              : product.status === "low_stock"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Col 4: Price & Valuation */}
                  <td className="px-3 py-3 text-right font-mono">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">
                        {formatCurrency(product.unitPrice || 0)}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /{product.unit}
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Total: {formatCurrency(totalProductValue)}
                      </span>
                    </div>
                  </td>

                  {/* Col 5: Warehouse Location */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Warehouse className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-xs font-medium">{product.warehouse}</span>
                    </div>
                  </td>

                  {/* Col 6: Status Badge */}
                  <td className="px-3 py-3 text-center">
                    {product.status === "in_stock" && (
                      <Badge variant="success" className="mx-auto">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>In Stock</span>
                      </Badge>
                    )}
                    {product.status === "low_stock" && (
                      <Badge variant="warning" className="mx-auto">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Low Stock</span>
                      </Badge>
                    )}
                    {product.status === "out_of_stock" && (
                      <Badge variant="destructive" className="mx-auto">
                        <XCircle className="h-3 w-3" />
                        <span>Out of Stock</span>
                      </Badge>
                    )}
                    {product.status === "draft" && (
                      <Badge variant="neutral" className="mx-auto">
                        <span>Draft</span>
                      </Badge>
                    )}
                  </td>

                  {/* Col 7: Actions Menu */}
                  <td className="px-3 py-3 text-right">
                    <ProductRowActions
                      product={product}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onQuickMovement={onQuickMovement}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border px-4 py-3 bg-slate-50/50">
        <div className="text-xs text-muted-foreground font-mono">
          Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
          <span className="font-semibold text-foreground">{endItem}</span> of{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> products
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="btn-neo h-8 px-2.5 text-xs gap-1 font-mono"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>

          <span className="text-xs font-mono text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="btn-neo h-8 px-2.5 text-xs gap-1 font-mono"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
