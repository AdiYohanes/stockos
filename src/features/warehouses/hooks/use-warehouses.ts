"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import { useWarehousesStore } from "@/components/providers/feature-stores-provider";
import type {
  InterWarehouseTransferPayload,
  WarehouseFilterState,
  WarehouseItem,
  WarehouseMetrics,
  WarehouseSortField,
  WarehouseStatus,
  WarehouseTransferLog,
  WarehouseType,
  WarehouseViewMode,
} from "../types";
import type { CreateWarehouseInput, UpdateWarehouseInput } from "../store";

export interface UseWarehousesReturn {
  // Master state
  warehouses: WarehouseItem[];
  transferLogs: WarehouseTransferLog[];

  // Filter state
  filterState: WarehouseFilterState;
  hasActiveFilters: boolean;

  // Derived filtered data
  filteredWarehouses: WarehouseItem[];
  paginatedWarehouses: WarehouseItem[];
  totalFilteredCount: number;
  totalPages: number;

  // Metrics
  metrics: WarehouseMetrics;

  // Selected item & Modals
  selectedWarehouseId: string | null;
  selectedWarehouse: WarehouseItem | null;
  warehouseToEdit: WarehouseItem | null;
  warehouseToDelete: WarehouseItem | null;
  isCreateModalOpen: boolean;
  isTransferModalOpen: boolean;
  transferSourceWarehouseId: string | null;

  // Actions & Setters
  setSelectedWarehouseId: (id: string | null) => void;
  setWarehouseToEdit: (item: WarehouseItem | null) => void;
  setWarehouseToDelete: (item: WarehouseItem | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setIsTransferModalOpen: (open: boolean, sourceWarehouseId?: string | null) => void;

  setSearchQuery: (query: string) => void;
  setStatus: (status: "all" | WarehouseStatus) => void;
  setType: (type: "all" | WarehouseType) => void;
  setViewMode: (viewMode: WarehouseViewMode) => void;
  setSorting: (field: WarehouseSortField) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;

  // Mutations
  createWarehouse: (data: CreateWarehouseInput) => WarehouseItem;
  updateWarehouse: (id: string, data: UpdateWarehouseInput) => WarehouseItem;
  deleteWarehouse: (id: string) => WarehouseItem;
  transferStock: (payload: InterWarehouseTransferPayload) => WarehouseTransferLog;
}

const INITIAL_FILTER_STATE: WarehouseFilterState = {
  searchQuery: "",
  status: "all",
  type: "all",
  viewMode: "grid",
  sortField: "name",
  sortOrder: "asc",
  page: 1,
  pageSize: 9,
};

export function useWarehouses(): UseWarehousesReturn {
  const warehouses = useWarehousesStore((s) => s.warehouses);
  const transferLogs = useWarehousesStore((s) => s.transferLogs);
  const {
    createWarehouse: storeCreateWarehouse,
    updateWarehouse: storeUpdateWarehouse,
    deleteWarehouse: storeDeleteWarehouse,
    transferStock: storeTransferStock,
  } = useWarehousesStore(
    useShallow((s) => ({
      createWarehouse: s.createWarehouse,
      updateWarehouse: s.updateWarehouse,
      deleteWarehouse: s.deleteWarehouse,
      transferStock: s.transferStock,
    }))
  );

  const [filterState, setFilterState] =
    React.useState<WarehouseFilterState>(INITIAL_FILTER_STATE);

  // Selected warehouse for slide-over sheet (Derived selection pattern)
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string | null>(null);

  // Modal target IDs (Derived from store data instead of storing snapshot objects)
  const [editWarehouseId, setEditWarehouseId] = React.useState<string | null>(null);
  const [deleteWarehouseId, setDeleteWarehouseId] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpenState] = React.useState<boolean>(false);
  const [transferSourceWarehouseId, setTransferSourceWarehouseId] = React.useState<
    string | null
  >(null);

  const setIsTransferModalOpen = React.useCallback(
    (open: boolean, sourceWarehouseId?: string | null) => {
      setIsTransferModalOpenState(open);
      setTransferSourceWarehouseId(sourceWarehouseId || null);
    },
    []
  );

  // Derived selected warehouse
  const selectedWarehouse = React.useMemo(() => {
    if (!selectedWarehouseId) return null;
    return warehouses.find((w) => w.id === selectedWarehouseId) || null;
  }, [warehouses, selectedWarehouseId]);

  // Derived warehouse to edit & delete
  const warehouseToEdit = React.useMemo(() => {
    if (!editWarehouseId) return null;
    return warehouses.find((w) => w.id === editWarehouseId) || null;
  }, [warehouses, editWarehouseId]);

  const warehouseToDelete = React.useMemo(() => {
    if (!deleteWarehouseId) return null;
    return warehouses.find((w) => w.id === deleteWarehouseId) || null;
  }, [warehouses, deleteWarehouseId]);

  const setWarehouseToEdit = React.useCallback((item: WarehouseItem | null) => {
    setEditWarehouseId(item ? item.id : null);
  }, []);

  const setWarehouseToDelete = React.useCallback((item: WarehouseItem | null) => {
    setDeleteWarehouseId(item ? item.id : null);
  }, []);

  // Derived metrics
  const metrics = React.useMemo<WarehouseMetrics>(() => {
    const totalWarehouses = warehouses.length;
    let activeCount = 0;
    let maintenanceCount = 0;
    let fullCount = 0;
    let totalStockUnits = 0;
    let totalValuation = 0;
    let totalCapacity = 0;

    for (const wh of warehouses) {
      if (wh.status === "active") activeCount++;
      else if (wh.status === "maintenance") maintenanceCount++;
      else if (wh.status === "full") fullCount++;

      totalStockUnits += wh.usedCapacityUnits;
      totalValuation += wh.totalValuation;
      totalCapacity += wh.totalCapacityUnits;
    }

    const avgUtilization =
      totalCapacity > 0 ? Math.round((totalStockUnits / totalCapacity) * 1000) / 10 : 0;

    return {
      totalWarehouses,
      activeCount,
      maintenanceCount,
      fullCount,
      avgUtilization,
      totalStockUnits,
      totalValuation,
    };
  }, [warehouses]);

  // Check active filters
  const hasActiveFilters = React.useMemo(() => {
    return (
      filterState.searchQuery.trim() !== "" ||
      filterState.status !== "all" ||
      filterState.type !== "all"
    );
  }, [filterState]);

  // Filter and sort warehouses
  const filteredWarehouses = React.useMemo(() => {
    return warehouses
      .filter((item) => {
        // Search query (matches code, name, manager, city)
        if (filterState.searchQuery.trim()) {
          const query = filterState.searchQuery.toLowerCase().trim();
          const matchCode = item.code.toLowerCase().includes(query);
          const matchName = item.name.toLowerCase().includes(query);
          const matchManager = item.manager.name.toLowerCase().includes(query);
          const matchCity = item.address.city.toLowerCase().includes(query);
          if (!matchCode && !matchName && !matchManager && !matchCity) {
            return false;
          }
        }

        // Status filter
        if (filterState.status !== "all" && item.status !== filterState.status) {
          return false;
        }

        // Type filter
        if (filterState.type !== "all" && item.type !== filterState.type) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const orderMultiplier = filterState.sortOrder === "asc" ? 1 : -1;
        switch (filterState.sortField) {
          case "name":
            return a.name.localeCompare(b.name) * orderMultiplier;
          case "code":
            return a.code.localeCompare(b.code) * orderMultiplier;
          case "capacity":
            return (a.totalCapacityUnits - b.totalCapacityUnits) * orderMultiplier;
          case "utilization": {
            const utilA = a.totalCapacityUnits > 0 ? a.usedCapacityUnits / a.totalCapacityUnits : 0;
            const utilB = b.totalCapacityUnits > 0 ? b.usedCapacityUnits / b.totalCapacityUnits : 0;
            return (utilA - utilB) * orderMultiplier;
          }
          case "valuation":
            return (a.totalValuation - b.totalValuation) * orderMultiplier;
          case "skus":
            return (a.totalSkusCount - b.totalSkusCount) * orderMultiplier;
          case "createdAt":
            return a.createdAt.localeCompare(b.createdAt) * orderMultiplier;
          default:
            return 0;
        }
      });
  }, [warehouses, filterState]);

  const totalFilteredCount = filteredWarehouses.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / filterState.pageSize));
  // Derived page clamp without useEffect syncing
  const currentPage = Math.min(Math.max(1, filterState.page), totalPages);

  const paginatedWarehouses = React.useMemo(() => {
    const start = (currentPage - 1) * filterState.pageSize;
    return filteredWarehouses.slice(start, start + filterState.pageSize);
  }, [filteredWarehouses, currentPage, filterState.pageSize]);

  // Setters
  const setSearchQuery = React.useCallback((searchQuery: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery, page: 1 }));
  }, []);

  const setStatus = React.useCallback((status: "all" | WarehouseStatus) => {
    setFilterState((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setType = React.useCallback((type: "all" | WarehouseType) => {
    setFilterState((prev) => ({ ...prev, type, page: 1 }));
  }, []);

  const setViewMode = React.useCallback((viewMode: WarehouseViewMode) => {
    setFilterState((prev) => ({ ...prev, viewMode }));
  }, []);

  const setSorting = React.useCallback((sortField: WarehouseSortField) => {
    setFilterState((prev) => {
      const isSame = prev.sortField === sortField;
      const sortOrder = isSame && prev.sortOrder === "asc" ? "desc" : "asc";
      return { ...prev, sortField, sortOrder, page: 1 };
    });
  }, []);

  const setPage = React.useCallback((page: number) => {
    setFilterState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilterState((prev) => ({
      ...prev,
      searchQuery: "",
      status: "all",
      type: "all",
      page: 1,
    }));
  }, []);

  // Mutations
  const createWarehouse = React.useCallback(
    (data: CreateWarehouseInput) => {
      const created = storeCreateWarehouse(data);
      setIsCreateModalOpen(false);
      return created;
    },
    [storeCreateWarehouse]
  );

  const updateWarehouse = React.useCallback(
    (id: string, data: UpdateWarehouseInput) => {
      const updated = storeUpdateWarehouse(id, data);
      setEditWarehouseId(null);
      return updated;
    },
    [storeUpdateWarehouse]
  );

  const deleteWarehouse = React.useCallback(
    (id: string) => {
      const deleted = storeDeleteWarehouse(id);
      if (selectedWarehouseId === id) {
        setSelectedWarehouseId(null);
      }
      setDeleteWarehouseId(null);
      return deleted;
    },
    [storeDeleteWarehouse, selectedWarehouseId]
  );

  const transferStock = React.useCallback(
    (payload: InterWarehouseTransferPayload) => {
      const log = storeTransferStock(payload);
      setIsTransferModalOpenState(false);
      setTransferSourceWarehouseId(null);
      return log;
    },
    [storeTransferStock]
  );

  return {
    warehouses,
    transferLogs,
    filterState: { ...filterState, page: currentPage },
    hasActiveFilters,
    filteredWarehouses,
    paginatedWarehouses,
    totalFilteredCount,
    totalPages,
    metrics,
    selectedWarehouseId,
    selectedWarehouse,
    warehouseToEdit,
    warehouseToDelete,
    isCreateModalOpen,
    isTransferModalOpen,
    transferSourceWarehouseId,
    setSelectedWarehouseId,
    setWarehouseToEdit,
    setWarehouseToDelete,
    setIsCreateModalOpen,
    setIsTransferModalOpen,
    setSearchQuery,
    setStatus,
    setType,
    setViewMode,
    setSorting,
    setPage,
    resetFilters,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    transferStock,
  };
}
