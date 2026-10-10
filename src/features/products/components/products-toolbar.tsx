"use client";

import * as React from "react";
import { Search, RotateCcw, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { ProductFilterState, ProductMetrics, ProductSortField } from "../types";

interface ProductsToolbarProps {
  filterState: ProductFilterState;
  metrics: ProductMetrics;
  categories: string[];
  hasActiveFilters: boolean;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: ProductFilterState["status"]) => void;
  onArchiveChange: (archive: ProductFilterState["archive"]) => void;
  onSortChange: (field: ProductSortField) => void;
  onResetFilters: () => void;
}

export function ProductsToolbar(props: ProductsToolbarProps) {
  const { filterState, metrics, onSearchChange } = props;
  const { t } = useI18n();
  const p = t.products.persistent;
  const [search, setSearch] = React.useState({ source: filterState.searchQuery, value: filterState.searchQuery });
  if (search.source !== filterState.searchQuery) {
    setSearch({ source: filterState.searchQuery, value: filterState.searchQuery });
  }
  React.useEffect(() => {
    if (search.value === filterState.searchQuery) return;
    const timer = setTimeout(() => onSearchChange(search.value), 250);
    return () => clearTimeout(timer);
  }, [search.value, filterState.searchQuery, onSearchChange]);
  const control = "input-focus h-10 max-w-full border-[3px] border-ink bg-white px-3 text-xs font-bold text-ink";
  const statuses = [
    ["all", t.common.all, metrics.totalProducts],
    ["in_stock", t.products.inStock, metrics.inStockCount],
    ["low_stock", t.products.lowStock, metrics.lowStockCount],
    ["out_of_stock", t.products.outOfStock, metrics.outOfStockCount],
  ] as const;

  return (
    <div className="flex flex-col gap-4 p-4 border-b-[3px] border-ink bg-white dark:bg-black">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md border-[3px] border-ink shadow-hard-sm">
          <Search className="absolute left-3 top-3 h-4 w-4" aria-hidden />
          <input type="search" aria-label={p.search} placeholder={p.search} maxLength={120}
            value={search.value} onChange={(e) => setSearch({ source: filterState.searchQuery, value: e.target.value })}
            className="input-focus w-full pl-9 pr-3 h-10 bg-transparent text-sm text-ink" />
        </div>
        <div className="flex w-fit max-w-full overflow-x-auto border-[3px] border-ink bg-paper p-1">
          {statuses.map(([status, label, count]) => (
            <button key={status} type="button" aria-pressed={filterState.status === status}
              onClick={() => props.onStatusChange(status)}
              className={cn("px-3 py-2 whitespace-nowrap text-xs font-bold uppercase focus-visible:outline-2", filterState.status === status ? "bg-ink text-paper" : "text-ink hover:bg-ink/10")}>
              {label} <span className="font-mono">({count})</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t-[3px] border-ink pt-3">
        <form onSubmit={(e) => { e.preventDefault(); props.onCategoryChange(String(new FormData(e.currentTarget).get("category") ?? "").trim()); }} className="flex max-w-full gap-2">
          <input key={filterState.category} name="category" aria-label={t.common.category} defaultValue={filterState.category} list="catalog-categories" maxLength={120} placeholder={t.products.allCategories} className={control} />
          <datalist id="catalog-categories">{props.categories.map((category) => <option key={category} value={category} />)}</datalist>
          <button className={control} type="submit">{t.common.filter}</button>
        </form>
        <select aria-label={p.archive} className={control} value={filterState.archive} onChange={(e) => props.onArchiveChange(e.target.value as ProductFilterState["archive"])}>
          <option value="active">{t.common.active}</option><option value="archived">{p.archived}</option><option value="all">{p.allArchives}</option>
        </select>
        <select aria-label={t.products.sort} className={control} value={filterState.sortField} onChange={(e) => props.onSortChange(e.target.value as ProductSortField)}>
          <option value="name">{t.products.sortName}</option><option value="sku">{t.products.sortSku}</option>
          <option value="currentStock">{t.products.sortStock}</option><option value="sellingPrice">{t.products.sortPrice}</option>
          <option value="createdAt">{t.products.sheet.registeredDate}</option>
        </select>
        <button type="button" onClick={() => props.onSortChange(filterState.sortField)} className={cn(control, "flex items-center gap-2")} aria-label={`${t.products.sort}: ${filterState.sortOrder}`}><ArrowUpDown className="h-4 w-4" />{filterState.sortOrder.toUpperCase()}</button>
        {props.hasActiveFilters && <button type="button" onClick={props.onResetFilters} className={cn(control, "flex items-center gap-2")}><RotateCcw className="h-4 w-4" />{t.common.reset}</button>}
      </div>
    </div>
  );
}
