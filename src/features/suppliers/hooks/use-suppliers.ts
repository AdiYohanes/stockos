"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import { useSuppliersStore } from "@/components/providers/feature-stores-provider";
import type {
  SupplierFilterState,
  SupplierItem,
  SupplierMetrics,
  SupplierSortField,
  SupplierSortOrder,
  SupplierStatus,
  SupplierTier,
} from "../types";
import type { SupplierFormData } from "../store";

export type { SupplierFormData };

export interface UseSuppliersReturn {
  // Master state
  suppliers: SupplierItem[];

  // Filter state
  filterState: SupplierFilterState;
  hasActiveFilters: boolean;

  // Derived filtered data
  filteredSuppliers: SupplierItem[];
  paginatedSuppliers: SupplierItem[];
  totalFilteredCount: number;
  totalPages: number;

  // Metrics
  metrics: SupplierMetrics;

  // Selected item & Modals
  selectedSupplierId: string | null;
  selectedSupplier: SupplierItem | null;
  supplierToEdit: SupplierItem | null;
  supplierToDelete: SupplierItem | null;
  isCreateModalOpen: boolean;

  // Actions & Setters
  setSelectedSupplierId: (id: string | null) => void;
  setSupplierToEdit: (item: SupplierItem | null) => void;
  setSupplierToDelete: (item: SupplierItem | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;

  setSearchQuery: (query: string) => void;
  setStatus: (status: "all" | SupplierStatus) => void;
  setTier: (tier: "all" | SupplierTier) => void;
  setCategory: (category: string) => void;
  setSorting: (field: SupplierSortField) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;

  // Mutations
  createSupplier: (data: SupplierFormData) => SupplierItem;
  updateSupplier: (id: string, data: SupplierFormData) => SupplierItem;
  deleteSupplier: (id: string) => SupplierItem;
}

const INITIAL_FILTER_STATE: SupplierFilterState = {
  searchQuery: "",
  status: "all",
  tier: "all",
  category: "all",
  sortField: "name",
  sortOrder: "asc",
  page: 1,
  pageSize: 10,
};

export function useSuppliers(): UseSuppliersReturn {
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const {
    createSupplier: storeCreateSupplier,
    updateSupplier: storeUpdateSupplier,
    deleteSupplier: storeDeleteSupplier,
  } = useSuppliersStore(
    useShallow((s) => ({
      createSupplier: s.createSupplier,
      updateSupplier: s.updateSupplier,
      deleteSupplier: s.deleteSupplier,
    }))
  );

  const [filterState, setFilterState] =
    React.useState<SupplierFilterState>(INITIAL_FILTER_STATE);

  // Selected supplier for slide-over sheet (Derived selection pattern)
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<string | null>(null);

  // Modal target IDs (Derived from store data instead of storing snapshot objects)
  const [editSupplierId, setEditSupplierId] = React.useState<string | null>(null);
  const [deleteSupplierId, setDeleteSupplierId] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);

  // Derived selected supplier
  const selectedSupplier = React.useMemo(() => {
    if (!selectedSupplierId) return null;
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Derived supplier to edit & delete
  const supplierToEdit = React.useMemo(() => {
    if (!editSupplierId) return null;
    return suppliers.find((s) => s.id === editSupplierId) || null;
  }, [suppliers, editSupplierId]);

  const supplierToDelete = React.useMemo(() => {
    if (!deleteSupplierId) return null;
    return suppliers.find((s) => s.id === deleteSupplierId) || null;
  }, [suppliers, deleteSupplierId]);

  const setSupplierToEdit = React.useCallback((item: SupplierItem | null) => {
    setEditSupplierId(item ? item.id : null);
  }, []);

  const setSupplierToDelete = React.useCallback((item: SupplierItem | null) => {
    setDeleteSupplierId(item ? item.id : null);
  }, []);

  // Derived metrics
  const metrics = React.useMemo<SupplierMetrics>(() => {
    let activeCount = 0;
    let onHoldCount = 0;
    let inactiveCount = 0;
    let totalSpend = 0;
    let totalOnTime = 0;
    let totalLeadTime = 0;

    for (const sup of suppliers) {
      if (sup.status === "active") activeCount++;
      else if (sup.status === "on_hold") onHoldCount++;
      else if (sup.status === "inactive") inactiveCount++;

      totalSpend += sup.totalSpend;
      totalOnTime += sup.onTimeDeliveryRate;
      totalLeadTime += sup.leadTimeDays;
    }

    const count = suppliers.length;
    const avgOnTimeDelivery = count > 0 ? Math.round((totalOnTime / count) * 10) / 10 : 0;
    const avgLeadTime = count > 0 ? Math.round((totalLeadTime / count) * 10) / 10 : 0;

    return {
      totalSuppliers: count,
      activeCount,
      onHoldCount,
      inactiveCount,
      totalSpend,
      avgOnTimeDelivery,
      avgLeadTime,
    };
  }, [suppliers]);

  // Check active filters
  const hasActiveFilters = React.useMemo(() => {
    return (
      filterState.searchQuery.trim() !== "" ||
      filterState.status !== "all" ||
      filterState.tier !== "all" ||
      filterState.category !== "all"
    );
  }, [filterState]);

  // Filter and sort suppliers
  const filteredSuppliers = React.useMemo(() => {
    return suppliers
      .filter((item) => {
        // Search query (matches code, name, contact, city)
        if (filterState.searchQuery.trim()) {
          const query = filterState.searchQuery.toLowerCase().trim();
          const matchCode = item.code.toLowerCase().includes(query);
          const matchName = item.name.toLowerCase().includes(query);
          const matchContact = item.contactName.toLowerCase().includes(query);
          const matchCity = item.address.city.toLowerCase().includes(query);
          if (!matchCode && !matchName && !matchContact && !matchCity) {
            return false;
          }
        }

        // Status filter
        if (filterState.status !== "all" && item.status !== filterState.status) {
          return false;
        }

        // Tier filter
        if (filterState.tier !== "all" && item.tier !== filterState.tier) {
          return false;
        }

        // Category filter
        if (filterState.category !== "all" && !item.categories.includes(filterState.category)) {
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
          case "status":
            return a.status.localeCompare(b.status) * orderMultiplier;
          case "tier": {
            const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
            return (tierOrder[a.tier] - tierOrder[b.tier]) * orderMultiplier;
          }
          case "leadTime":
            return (a.leadTimeDays - b.leadTimeDays) * orderMultiplier;
          case "orders":
            return (a.totalOrders - b.totalOrders) * orderMultiplier;
          case "spend":
            return (a.totalSpend - b.totalSpend) * orderMultiplier;
          case "onTime":
            return (a.onTimeDeliveryRate - b.onTimeDeliveryRate) * orderMultiplier;
          case "createdAt":
            return a.createdAt.localeCompare(b.createdAt) * orderMultiplier;
          default:
            return 0;
        }
      });
  }, [suppliers, filterState]);

  const totalFilteredCount = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / filterState.pageSize));
  // Derived page clamp without useEffect syncing
  const currentPage = Math.min(Math.max(1, filterState.page), totalPages);

  const paginatedSuppliers = React.useMemo(() => {
    const start = (currentPage - 1) * filterState.pageSize;
    return filteredSuppliers.slice(start, start + filterState.pageSize);
  }, [filteredSuppliers, currentPage, filterState.pageSize]);

  // Setters
  const setSearchQuery = React.useCallback((searchQuery: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery, page: 1 }));
  }, []);

  const setStatus = React.useCallback((status: "all" | SupplierStatus) => {
    setFilterState((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setTier = React.useCallback((tier: "all" | SupplierTier) => {
    setFilterState((prev) => ({ ...prev, tier, page: 1 }));
  }, []);

  const setCategory = React.useCallback((category: string) => {
    setFilterState((prev) => ({ ...prev, category, page: 1 }));
  }, []);

  const setSorting = React.useCallback((sortField: SupplierSortField) => {
    setFilterState((prev) => {
      const isSame = prev.sortField === sortField;
      const sortOrder: SupplierSortOrder = isSame && prev.sortOrder === "asc" ? "desc" : "asc";
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
      tier: "all",
      category: "all",
      page: 1,
    }));
  }, []);

  // Mutations
  const createSupplier = React.useCallback(
    (data: SupplierFormData) => {
      const created = storeCreateSupplier(data);
      setIsCreateModalOpen(false);
      return created;
    },
    [storeCreateSupplier]
  );

  const updateSupplier = React.useCallback(
    (id: string, data: SupplierFormData) => {
      const updated = storeUpdateSupplier(id, data);
      setEditSupplierId(null);
      return updated;
    },
    [storeUpdateSupplier]
  );

  const deleteSupplier = React.useCallback(
    (id: string) => {
      const deleted = storeDeleteSupplier(id);
      if (selectedSupplierId === id) {
        setSelectedSupplierId(null);
      }
      setDeleteSupplierId(null);
      return deleted;
    },
    [storeDeleteSupplier, selectedSupplierId]
  );

  return {
    suppliers,
    filterState: { ...filterState, page: currentPage },
    hasActiveFilters,
    filteredSuppliers,
    paginatedSuppliers,
    totalFilteredCount,
    totalPages,
    metrics,
    selectedSupplierId,
    selectedSupplier,
    supplierToEdit,
    supplierToDelete,
    isCreateModalOpen,
    setSelectedSupplierId,
    setSupplierToEdit,
    setSupplierToDelete,
    setIsCreateModalOpen,
    setSearchQuery,
    setStatus,
    setTier,
    setCategory,
    setSorting,
    setPage,
    resetFilters,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
