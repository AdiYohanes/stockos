"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { useProducts } from "../hooks/use-products";
import { getProductAction, getProductHistoryAction } from "../actions";
import { ProductsHeader } from "./products-header";
import { ProductsMetrics } from "./products-metrics";
import { ProductsToolbar } from "./products-toolbar";
import { ProductsTable } from "./products-table";
import { ProductDetailSheet } from "./product-detail-sheet";
import { EditProductModal } from "./edit-product-modal";
import { DeleteProductDialog } from "./delete-product-dialog";
import { QuickMovementModal } from "./quick-movement-modal";
import { ProductAddModal } from "./product-add-modal";
import type { ProductFilterState } from "../types";
import type { ProductDto, ProductsPage, ProductMetrics, ProductFailure } from "../schemas/product-rpc.schema";

type Mode = "detail" | "edit" | "lifecycle" | "in" | "out";
interface ProductsContainerProps {
  filterState: ProductFilterState;
  catalog: ProductsPage | null;
  metrics: ProductMetrics | null;
  categories: string[];
  failure: ProductFailure | null;
}

export function ProductsContainer({ filterState, catalog, metrics, categories, failure }: ProductsContainerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const p = t.products.persistent;
  const filters = useProducts(filterState);
  const [addOpen, setAddOpen] = React.useState(false);
  const [selection, setSelection] = React.useState<{ id: string; product: ProductDto; mode: Mode; identityLocked: boolean } | null>(null);
  const [readError, setReadError] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState(false);
  const request = React.useRef(0);
  const selected = React.useMemo(() => selection ? catalog?.items.find((product) => product.id === selection.id &&
    BigInt(product.metadataVersion) >= BigInt(selection.product.metadataVersion) &&
    BigInt(product.stockVersion) >= BigInt(selection.product.stockVersion)) ?? selection.product : null, [catalog, selection]);

  async function open(product: ProductDto, mode: Mode) {
    const sequence = ++request.current;
    setReading(true);
    setReadError(null);
    try {
      const current = await getProductAction({ id: product.id });
      const history = mode === "edit" ? await getProductHistoryAction({ productId: product.id, page: 1, pageSize: 1 }) : null;
      if (sequence !== request.current) return;
      if (!current.ok || (history && !history.ok)) {
        const error = !current.ok ? current : history && !history.ok ? history : null;
        setReadError(error ? p.errors[error.code] ?? t.common.error : t.common.error);
        return;
      }
      setSelection({ id: product.id, product: current.data, mode, identityLocked: history?.ok ? history.data.total > 0 : false });
    } catch { if (sequence === request.current) setReadError(t.common.error); }
    finally { if (sequence === request.current) setReading(false); }
  }

  async function committed(snapshot: ProductDto) {
    const current = await getProductAction({ id: snapshot.id });
    if (!current.ok) throw new Error(p.refreshError);
    setSelection((previous) => previous?.id === snapshot.id ? { ...previous, product: current.data } : previous);
    router.refresh();
  }
  function close(opened: boolean) {
    if (!opened) { request.current++; setSelection(null); }
  }

  return <div className="flex flex-col gap-4 sm:gap-5 w-full pb-10" aria-busy={filters.pending || reading}>
    <ProductsHeader onAdd={() => setAddOpen(true)} />
    <p className="border-[3px] border-ink bg-paper p-3 text-xs font-mono">{p.localData} · {filterState.archive === "all" ? p.allArchives : filterState.archive === "archived" ? p.archived : t.common.active}</p>
    {(failure || readError) && <div role="alert" className="border-[3px] border-ink p-3">
      <p>{readError ?? (failure ? p.errors[failure.code] ?? t.common.error : t.common.error)}</p>
      <button type="button" onClick={() => router.refresh()} className="btn-neo mt-2">{p.retry}</button>
    </div>}
    {(filters.pending || reading) && <p role="status">{t.common.loading}</p>}
    {metrics && <ProductsMetrics metrics={metrics} selectedStatus={filterState.status} onSelectStatus={filters.setStatus} />}
    {catalog && metrics && <div className="ledger-container">
      <ProductsToolbar filterState={filterState} metrics={metrics} categories={categories} hasActiveFilters={filters.hasActiveFilters}
        onSearchChange={filters.setSearchQuery} onCategoryChange={filters.setCategory} onStatusChange={filters.setStatus}
        onArchiveChange={filters.setArchive} onSortChange={filters.setSorting} onResetFilters={filters.resetFilters} />
      <ProductsTable products={catalog.items} totalCount={catalog.total} filterState={filterState} hasActiveFilters={filters.hasActiveFilters}
        onPageChange={filters.setPage} onResetFilters={filters.resetFilters} onViewDetails={(product) => void open(product, "detail")}
        onEdit={(product) => void open(product, "edit")} onDelete={(product) => void open(product, "lifecycle")}
        onQuickMovement={(product, type) => void open(product, type)} onAddProductClick={() => setAddOpen(true)} />
    </div>}
    {selected && selection?.mode === "detail" && <ProductDetailSheet key={selected.id} product={selected} open onOpenChange={close}
      onEdit={(product) => void open(product, "edit")} onMovement={(product, type) => void open(product, type)} onLifecycle={(product) => void open(product, "lifecycle")} />}
    {selected && selection?.mode === "edit" && <EditProductModal key={selected.id} product={selected} open onOpenChange={close} onCommitted={committed} identityLocked={selection.identityLocked} />}
    {selected && selection?.mode === "lifecycle" && <DeleteProductDialog key={selected.id} product={selected} open onOpenChange={close} onCommitted={committed} />}
    {selected && (selection?.mode === "in" || selection?.mode === "out") && <QuickMovementModal key={`${selected.id}:${selection.mode}`} product={selected} type={selection.mode} open onOpenChange={close} onCommitted={committed} />}
    <ProductAddModal open={addOpen} onOpenChange={setAddOpen} onCommitted={committed} />
  </div>;
}
