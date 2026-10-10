"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type {
  InventoryFilterState,
  InventorySortField,
  InventoryTab,
  MovementType,
  StockStatus,
} from "../types";

export const INITIAL_INVENTORY_FILTER_STATE: InventoryFilterState = {
  tab: "stock_levels",
  searchQuery: "",
  status: "all",
  movementType: "all",
  category: "all",
  sortField: "name",
  sortOrder: "asc",
  page: 1,
  pageSize: 10,
};

export function useInventory(filterState: InventoryFilterState = INITIAL_INVENTORY_FILTER_STATE) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function update(updates: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === "" ||
        value === "all" ||
        (key === "tab" && value === "stock_levels") ||
        (key === "page" && Number(value) === 1) ||
        (key === "sort" && value === "name") ||
        (key === "order" && value === "asc")
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    startTransition(() => {
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    });
  }

  const hasActiveFilters = Boolean(
    filterState.searchQuery ||
    (filterState.category && filterState.category !== "all") ||
    (filterState.status && filterState.status !== "all") ||
    (filterState.movementType && filterState.movementType !== "all")
  );

  return {
    pending,
    hasActiveFilters,
    filterState,
    tab: filterState.tab,
    setTab: (tab: InventoryTab) => update({ tab: tab !== "stock_levels" ? tab : "", page: 1, status: "", type: "" }),
    setSearchQuery: (q: string) => update({ q: q.trim(), page: 1 }),
    setCategory: (category: string) => update({ category, page: 1 }),
    setStatus: (status: "all" | StockStatus) => update({ status: status !== "all" ? status : "", page: 1 }),
    setMovementType: (type: "all" | MovementType) => update({ type: type !== "all" ? type : "", page: 1 }),
    setSorting: (sort: InventorySortField) =>
      update({ sort, order: filterState.sortField === sort && filterState.sortOrder === "asc" ? "desc" : "asc", page: 1 }),
    setPage: (page: number) => update({ page }),
    resetFilters: () => startTransition(() => router.replace(pathname, { scroll: false })),
  };
}
