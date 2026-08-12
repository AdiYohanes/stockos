"use client";

import * as React from "react";
import type {
  InterWarehouseTransferPayload,
  StoredInventorySummary,
  WarehouseFilterState,
  WarehouseItem,
  WarehouseMetrics,
  WarehouseSortField,
  WarehouseStatus,
  WarehouseTransferLog,
  WarehouseType,
  WarehouseViewMode,
  WarehouseZone,
} from "../types";
import { MOCK_GLOBAL_TRANSFER_LOGS, MOCK_WAREHOUSES } from "../mock-data";

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
  createWarehouse: (data: {
    name: string;
    code: string;
    type: WarehouseType;
    status: WarehouseStatus;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    managerName: string;
    managerEmail: string;
    managerPhone: string;
    totalCapacityUnits: number;
    zones?: WarehouseZone[];
  }) => void;

  updateWarehouse: (
    id: string,
    data: {
      name: string;
      code: string;
      type: WarehouseType;
      status: WarehouseStatus;
      street: string;
      city: string;
      province: string;
      postalCode: string;
      managerName: string;
      managerEmail: string;
      managerPhone: string;
      totalCapacityUnits: number;
      zones?: WarehouseZone[];
    }
  ) => void;

  deleteWarehouse: (id: string) => void;

  transferStock: (payload: InterWarehouseTransferPayload) => void;
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
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>(MOCK_WAREHOUSES);
  const [transferLogs, setTransferLogs] = React.useState<WarehouseTransferLog[]>(
    MOCK_GLOBAL_TRANSFER_LOGS
  );
  const [filterState, setFilterState] =
    React.useState<WarehouseFilterState>(INITIAL_FILTER_STATE);

  // Selected warehouse for slide-over sheet (Derived selection pattern)
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string | null>(null);

  // Modal states
  const [warehouseToEdit, setWarehouseToEdit] = React.useState<WarehouseItem | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = React.useState<WarehouseItem | null>(null);
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
  const totalPages = Math.ceil(totalFilteredCount / filterState.pageSize) || 1;

  const paginatedWarehouses = React.useMemo(() => {
    const start = (filterState.page - 1) * filterState.pageSize;
    return filteredWarehouses.slice(start, start + filterState.pageSize);
  }, [filteredWarehouses, filterState.page, filterState.pageSize]);

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
    (data: {
      name: string;
      code: string;
      type: WarehouseType;
      status: WarehouseStatus;
      street: string;
      city: string;
      province: string;
      postalCode: string;
      managerName: string;
      managerEmail: string;
      managerPhone: string;
      totalCapacityUnits: number;
      zones?: WarehouseZone[];
    }) => {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const newId = `wh-${Date.now()}`;

      const defaultZones: WarehouseZone[] = data.zones && data.zones.length > 0
        ? data.zones
        : [
            {
              id: `zn-${newId}-a`,
              code: "ZN-A",
              name: "Zone A - Primary Storage",
              type: "shelf",
              capacityUnits: Math.round(data.totalCapacityUnits * 0.5),
              usedUnits: 0,
            },
            {
              id: `zn-${newId}-b`,
              code: "ZN-B",
              name: "Zone B - Bulk Pallet Rack",
              type: "rack",
              capacityUnits: Math.round(data.totalCapacityUnits * 0.5),
              usedUnits: 0,
            },
          ];

      const newWarehouse: WarehouseItem = {
        id: newId,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        type: data.type,
        status: data.status,
        address: {
          street: data.street.trim(),
          city: data.city.trim(),
          province: data.province.trim(),
          postalCode: data.postalCode.trim(),
        },
        manager: {
          name: data.managerName.trim(),
          email: data.managerEmail.trim(),
          phone: data.managerPhone.trim(),
        },
        totalCapacityUnits: data.totalCapacityUnits,
        usedCapacityUnits: 0,
        totalSkusCount: 0,
        totalValuation: 0,
        zones: defaultZones,
        storedInventory: [],
        transferLogs: [],
        createdAt: dateStr,
      };

      setWarehouses((prev) => [newWarehouse, ...prev]);
      setIsCreateModalOpen(false);
    },
    []
  );

  const updateWarehouse = React.useCallback(
    (
      id: string,
      data: {
        name: string;
        code: string;
        type: WarehouseType;
        status: WarehouseStatus;
        street: string;
        city: string;
        province: string;
        postalCode: string;
        managerName: string;
        managerEmail: string;
        managerPhone: string;
        totalCapacityUnits: number;
        zones?: WarehouseZone[];
      }
    ) => {
      const dateStr = new Date().toISOString().split("T")[0];

      setWarehouses((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            code: data.code.toUpperCase().trim(),
            name: data.name.trim(),
            type: data.type,
            status: data.status,
            address: {
              street: data.street.trim(),
              city: data.city.trim(),
              province: data.province.trim(),
              postalCode: data.postalCode.trim(),
            },
            manager: {
              name: data.managerName.trim(),
              email: data.managerEmail.trim(),
              phone: data.managerPhone.trim(),
            },
            totalCapacityUnits: data.totalCapacityUnits,
            zones: data.zones && data.zones.length > 0 ? data.zones : item.zones,
            updatedAt: dateStr,
          };
        })
      );

      setWarehouseToEdit(null);
    },
    []
  );

  const deleteWarehouse = React.useCallback(
    (id: string) => {
      setWarehouses((prev) => prev.filter((item) => item.id !== id));
      if (selectedWarehouseId === id) {
        setSelectedWarehouseId(null);
      }
      setWarehouseToDelete(null);
    },
    [selectedWarehouseId]
  );

  const transferStock = React.useCallback((payload: InterWarehouseTransferPayload) => {
    const now = new Date();
    const timestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
    const logId = `trf-${Date.now()}`;

    setWarehouses((prev) => {
      const source = prev.find((w) => w.id === payload.sourceWarehouseId);
      const dest = prev.find((w) => w.id === payload.destinationWarehouseId);
      if (!source || !dest) return prev;

      // Locate item in source
      const sourceItem = source.storedInventory?.find((i) => i.sku === payload.sku);
      const unitCost = sourceItem ? sourceItem.unitCost : 0;
      const transferValuation = unitCost * payload.quantity;

      const newTransferLog: WarehouseTransferLog = {
        id: logId,
        reference: payload.reference,
        sourceWarehouseId: source.id,
        sourceWarehouseName: source.name,
        destinationWarehouseId: dest.id,
        destinationWarehouseName: dest.name,
        sku: payload.sku,
        itemName: payload.itemName,
        quantity: payload.quantity,
        dispatchedBy: payload.dispatchedBy,
        timestamp,
        notes: payload.notes,
        status: "completed",
      };

      // Append to global transfer logs
      setTransferLogs((oldLogs) => [newTransferLog, ...oldLogs]);

      return prev.map((wh) => {
        if (wh.id === payload.sourceWarehouseId) {
          // Decrement stock from source
          const updatedInventory: StoredInventorySummary[] = (wh.storedInventory || [])
            .map((inv) => {
              if (inv.sku === payload.sku) {
                const newQty = Math.max(0, inv.quantity - payload.quantity);
                const newAvail = Math.max(0, inv.available - payload.quantity);
                return { ...inv, quantity: newQty, available: newAvail };
              }
              return inv;
            })
            .filter((inv) => inv.quantity > 0);

          const newUsed = Math.max(0, wh.usedCapacityUnits - payload.quantity);
          const newValuation = Math.max(0, wh.totalValuation - transferValuation);

          return {
            ...wh,
            usedCapacityUnits: newUsed,
            totalValuation: newValuation,
            totalSkusCount: updatedInventory.length,
            storedInventory: updatedInventory,
            transferLogs: [newTransferLog, ...(wh.transferLogs || [])],
          };
        }

        if (wh.id === payload.destinationWarehouseId) {
          // Increment stock on destination
          const existingInv = wh.storedInventory?.find((i) => i.sku === payload.sku);
          let updatedInventory: StoredInventorySummary[];

          if (existingInv) {
            updatedInventory = (wh.storedInventory || []).map((inv) => {
              if (inv.sku === payload.sku) {
                return {
                  ...inv,
                  quantity: inv.quantity + payload.quantity,
                  available: inv.available + payload.quantity,
                };
              }
              return inv;
            });
          } else {
            const newInvItem: StoredInventorySummary = {
              id: `inv-${Date.now()}`,
              sku: payload.sku,
              name: payload.itemName,
              category: sourceItem ? sourceItem.category : "General",
              quantity: payload.quantity,
              available: payload.quantity,
              unitCost,
              unit: sourceItem ? sourceItem.unit : "pcs",
              locationBin: "A-01-01",
            };
            updatedInventory = [newInvItem, ...(wh.storedInventory || [])];
          }

          const newUsed = wh.usedCapacityUnits + payload.quantity;
          const newValuation = wh.totalValuation + transferValuation;

          return {
            ...wh,
            usedCapacityUnits: newUsed,
            totalValuation: newValuation,
            totalSkusCount: updatedInventory.length,
            storedInventory: updatedInventory,
            transferLogs: [newTransferLog, ...(wh.transferLogs || [])],
          };
        }

        return wh;
      });
    });

    setIsTransferModalOpenState(false);
  }, []);

  return {
    warehouses,
    transferLogs,
    filterState,
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
