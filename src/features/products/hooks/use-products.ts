"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ProductFilterState, ProductSortField } from "../types";

export function useProducts(filterState: ProductFilterState) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function update(updates: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || (value === "all" && key !== "archive") ||
          (key === "archive" && value === "active") || (key === "page" && value === 1) ||
          (key === "sort" && value === "name") || (key === "order" && value === "asc")) {
        params.delete(key);
      } else params.set(key, String(value));
    });
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }));
  }

  return {
    pending,
    hasActiveFilters: Boolean(filterState.searchQuery || filterState.category || filterState.status !== "all" || filterState.archive !== "active"),
    setSearchQuery: (q: string) => update({ q: q.trim(), page: 1 }),
    setCategory: (category: string) => update({ category, page: 1 }),
    setStatus: (status: ProductFilterState["status"]) => update({ status, page: 1 }),
    setArchive: (archive: ProductFilterState["archive"]) => update({ archive, page: 1 }),
    setSorting: (sort: ProductSortField) => update({ sort, order: filterState.sortField === sort && filterState.sortOrder === "asc" ? "desc" : "asc", page: 1 }),
    setPage: (page: number) => update({ page }),
    resetFilters: () => startTransition(() => router.replace(pathname, { scroll: false })),
  };
}
