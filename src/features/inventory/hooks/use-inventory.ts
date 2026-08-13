"use client";

import * as React from "react";
import type {
  AdjustmentReason,
  InventoryFilterState,
  InventoryItem,
  InventoryMetrics,
  InventorySortField,
  InventoryTab,
  MovementType,
  StockMovement,
  StockStatus,
} from "../types";
import { MOCK_INVENTORY_ITEMS, MOCK_STOCK_MOVEMENTS } from "../mock-data";

export interface UseInventoryReturn {
  // Master lists
  items: InventoryItem[];
  movements: StockMovement[];

  // Tab & Filter states
  tab: InventoryTab;
  filterState: InventoryFilterState;
  hasActiveFilters: boolean;

  // Derived filtered & paginated data
  filteredItems: InventoryItem[];
  paginatedItems: InventoryItem[];
  totalFilteredItemsCount: number;
  totalItemPages: number;

  filteredMovements: StockMovement[];
  paginatedMovements: StockMovement[];
  totalFilteredMovementsCount: number;
  totalMovementPages: number;

  // Derived metrics
  metrics: InventoryMetrics;

  // Selected item references for Drawers/Modals
  selectedItemId: string | null;
  selectedItem: InventoryItem | null;
  itemToAdjust: InventoryItem | null;
  itemToMove: { item: InventoryItem | null; type: "in" | "out" | null };

  // Setters
  setTab: (tab: InventoryTab) => void;
  setSelectedItemId: (id: string | null) => void;
  setItemToAdjust: (item: InventoryItem | null) => void;
  setItemToMove: (payload: { item: InventoryItem | null; type: "in" | "out" | null }) => void;
  setSearchQuery: (query: string) => void;
  setWarehouse: (warehouse: string) => void;
  setStatus: (status: "all" | StockStatus) => void;
  setMovementType: (type: "all" | MovementType) => void;
  setCategory: (category: string) => void;
  setSorting: (field: InventorySortField) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;

  // Mutations
  recordMovement: (
    itemId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => void;
  adjustStock: (
    itemId: string,
    newStock: number,
    reason: AdjustmentReason,
    reference: string,
    note?: string
  ) => void;
}

const INITIAL_FILTER_STATE: InventoryFilterState = {
  tab: "stock_levels",
  searchQuery: "",
  warehouse: "all",
  status: "all",
  movementType: "all",
  category: "all",
  sortField: "name",
  sortOrder: "asc",
  page: 1,
  pageSize: 10,
};

function calculateStockStatus(currentStock: number, minStock: number, maxStock: number): StockStatus {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minStock) return "low_stock";
  if (currentStock > maxStock) return "overstocked";
  return "in_stock";
}

export function useInventory(): UseInventoryReturn {
  const [items, setItems] = React.useState<InventoryItem[]>(MOCK_INVENTORY_ITEMS);
  const [movements, setMovements] = React.useState<StockMovement[]>(MOCK_STOCK_MOVEMENTS);
  const [filterState, setFilterState] = React.useState<InventoryFilterState>(INITIAL_FILTER_STATE);

  // Selected item IDs
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [itemToAdjust, setItemToAdjust] = React.useState<InventoryItem | null>(null);
  const [itemToMove, setItemToMove] = React.useState<{
    item: InventoryItem | null;
    type: "in" | "out" | null;
  }>({
    item: null,
    type: null,
  });

  // Derived selected item (React 19 safe selection pattern)
  const selectedItem = React.useMemo(() => {
    if (!selectedItemId) return null;
    const found = items.find((i) => i.id === selectedItemId);
    if (!found) return null;

    // Attach matching movement logs for this item
    const itemLogs = movements.filter((m) => m.itemId === found.id || m.sku === found.sku);
    return {
      ...found,
      movementLogs: itemLogs,
    };
  }, [items, movements, selectedItemId]);

  // Derived Metrics
  const metrics: InventoryMetrics = React.useMemo(() => {
    let totalQty = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let overstocked = 0;
    let totalVal = 0;

    for (const item of items) {
      totalQty += item.currentStock;
      totalVal += item.currentStock * item.unitCost;

      if (item.currentStock <= 0 || item.status === "out_of_stock") {
        outOfStock++;
      } else if (item.currentStock <= item.minStock || item.status === "low_stock") {
        lowStock++;
      } else if (item.currentStock > item.maxStock || item.status === "overstocked") {
        overstocked++;
      }
    }

    // Movements today (comparing YYYY-MM-DD)
    const todayStr = new Date().toISOString().split("T")[0];
    const todayMovements = movements.filter((m) => m.timestamp.startsWith(todayStr) || m.timestamp.startsWith("2026-08-12"));

    return {
      totalItems: items.length,
      totalQuantity: totalQty,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      overstockedCount: overstocked,
      totalValuation: totalVal,
      todayMovementsCount: todayMovements.length,
    };
  }, [items, movements]);

  // 1. Filtered Items (Stock Levels Tab)
  const filteredItems = React.useMemo(() => {
    const query = filterState.searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // Search query (SKU, Name, Category, Location Bin)
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesSku = item.sku.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesBin = item.locationBin ? item.locationBin.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesSku && !matchesCategory && !matchesBin) {
          return false;
        }
      }

      // Warehouse filter
      if (filterState.warehouse !== "all" && item.warehouse !== filterState.warehouse) {
        return false;
      }

      // Status filter
      if (filterState.status !== "all" && item.status !== filterState.status) {
        return false;
      }

      // Category filter
      if (filterState.category !== "all" && item.category !== filterState.category) {
        return false;
      }

      return true;
    });
  }, [items, filterState]);

  // Sorted Items
  const sortedItems = React.useMemo(() => {
    const sorted = [...filteredItems];
    const { sortField, sortOrder } = filterState;

    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "sku":
          comparison = a.sku.localeCompare(b.sku);
          break;
        case "currentStock":
          comparison = a.currentStock - b.currentStock;
          break;
        case "availableStock":
          comparison = a.availableStock - b.availableStock;
          break;
        case "valuation":
          comparison = a.currentStock * a.unitCost - b.currentStock * b.unitCost;
          break;
        case "lastMovementAt":
          comparison = new Date(a.lastMovementAt).getTime() - new Date(b.lastMovementAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredItems, filterState]);

  // Paginated Items
  const totalFilteredItemsCount = sortedItems.length;
  const totalItemPages = Math.max(1, Math.ceil(totalFilteredItemsCount / filterState.pageSize));
  const paginatedItems = React.useMemo(() => {
    const start = (filterState.page - 1) * filterState.pageSize;
    return sortedItems.slice(start, start + filterState.pageSize);
  }, [sortedItems, filterState]);

  // 2. Filtered Movements (Audit Logs Tab)
  const filteredMovements = React.useMemo(() => {
    const query = filterState.searchQuery.trim().toLowerCase();

    return movements.filter((mov) => {
      // Search query (Reference, SKU, Product Name, Performed By)
      if (query) {
        const matchesRef = mov.reference.toLowerCase().includes(query);
        const matchesSku = mov.sku.toLowerCase().includes(query);
        const matchesName = mov.itemName.toLowerCase().includes(query);
        const matchesUser = mov.performedBy.toLowerCase().includes(query);
        if (!matchesRef && !matchesSku && !matchesName && !matchesUser) {
          return false;
        }
      }

      // Warehouse filter
      if (filterState.warehouse !== "all" && mov.warehouse !== filterState.warehouse) {
        return false;
      }

      // Movement Type filter
      if (filterState.movementType !== "all" && mov.type !== filterState.movementType) {
        return false;
      }

      return true;
    });
  }, [movements, filterState]);

  // Paginated Movements
  const totalFilteredMovementsCount = filteredMovements.length;
  const totalMovementPages = Math.max(1, Math.ceil(totalFilteredMovementsCount / filterState.pageSize));
  const paginatedMovements = React.useMemo(() => {
    const start = (filterState.page - 1) * filterState.pageSize;
    return filteredMovements.slice(start, start + filterState.pageSize);
  }, [filteredMovements, filterState]);

  // Check active filters
  const hasActiveFilters =
    filterState.searchQuery !== "" ||
    filterState.warehouse !== "all" ||
    filterState.status !== "all" ||
    filterState.movementType !== "all" ||
    filterState.category !== "all";

  // Setters
  const setTab = (tab: InventoryTab) => {
    setFilterState((prev) => ({
      ...prev,
      tab,
      page: 1,
      // Reset incompatible tab-specific filters
      status: "all",
      movementType: "all",
    }));
  };

  const setSearchQuery = (query: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery: query, page: 1 }));
  };

  const setWarehouse = (warehouse: string) => {
    setFilterState((prev) => ({ ...prev, warehouse, page: 1 }));
  };

  const setStatus = (status: "all" | StockStatus) => {
    setFilterState((prev) => ({ ...prev, status, page: 1 }));
  };

  const setMovementType = (movementType: "all" | MovementType) => {
    setFilterState((prev) => ({ ...prev, movementType, page: 1 }));
  };

  const setCategory = (category: string) => {
    setFilterState((prev) => ({ ...prev, category, page: 1 }));
  };

  const setSorting = (field: InventorySortField) => {
    setFilterState((prev) => {
      if (prev.sortField === field) {
        return { ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" };
      }
      return { ...prev, sortField: field, sortOrder: "asc" };
    });
  };

  const setPage = (page: number) => {
    const maxPage = filterState.tab === "stock_levels" ? totalItemPages : totalMovementPages;
    setFilterState((prev) => ({ ...prev, page: Math.max(1, Math.min(page, maxPage)) }));
  };

  const resetFilters = () => {
    setFilterState((prev) => ({
      ...prev,
      searchQuery: "",
      warehouse: "all",
      status: "all",
      movementType: "all",
      category: "all",
      page: 1,
    }));
  };

  // Mutations
  const recordMovement = (
    itemId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const previousStock = targetItem.currentStock;
    const delta = type === "in" ? quantity : -quantity;
    const newStock = Math.max(0, previousStock + delta);
    const newAvailable = Math.max(0, newStock - targetItem.reservedStock);
    const newStatus = calculateStockStatus(newStock, targetItem.minStock, targetItem.maxStock);
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: targetItem.id,
      sku: targetItem.sku,
      itemName: targetItem.name,
      type,
      quantity: delta,
      previousStock,
      newStock,
      warehouse: targetItem.warehouse,
      reference,
      note,
      performedBy: "Alex Morgan",
      timestamp,
    };

    // Update items state
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          currentStock: newStock,
          availableStock: newAvailable,
          status: newStatus,
          lastMovementAt: timestamp,
        };
      })
    );

    // Prepend to movements
    setMovements((prev) => [newMovement, ...prev]);
  };

  const adjustStock = (
    itemId: string,
    newStock: number,
    reason: AdjustmentReason,
    reference: string,
    note?: string
  ) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const previousStock = targetItem.currentStock;
    const delta = newStock - previousStock;
    const newAvailable = Math.max(0, newStock - targetItem.reservedStock);
    const newStatus = calculateStockStatus(newStock, targetItem.minStock, targetItem.maxStock);
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: targetItem.id,
      sku: targetItem.sku,
      itemName: targetItem.name,
      type: "adjustment",
      quantity: delta,
      previousStock,
      newStock,
      warehouse: targetItem.warehouse,
      reference: reference || `ADJ-${Date.now().toString().slice(-4)}`,
      reason,
      note,
      performedBy: "Alex Morgan",
      timestamp,
    };

    // Update items state
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          currentStock: newStock,
          availableStock: newAvailable,
          status: newStatus,
          lastMovementAt: timestamp,
        };
      })
    );

    // Prepend to movements
    setMovements((prev) => [newMovement, ...prev]);
  };

  return {
    items,
    movements,
    tab: filterState.tab,
    filterState,
    hasActiveFilters,

    filteredItems,
    paginatedItems,
    totalFilteredItemsCount,
    totalItemPages,

    filteredMovements,
    paginatedMovements,
    totalFilteredMovementsCount,
    totalMovementPages,

    metrics,

    selectedItemId,
    selectedItem,
    itemToAdjust,
    itemToMove,

    setTab,
    setSelectedItemId,
    setItemToAdjust,
    setItemToMove,
    setSearchQuery,
    setWarehouse,
    setStatus,
    setMovementType,
    setCategory,
    setSorting,
    setPage,
    resetFilters,

    recordMovement,
    adjustStock,
  };
}
