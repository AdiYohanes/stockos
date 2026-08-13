"use client";

import * as React from "react";
import type {
  SupplierFilterState,
  SupplierItem,
  SupplierMetrics,
  SupplierSortField,
  SupplierSortOrder,
  SupplierStatus,
  SupplierTier,
  PaymentTerms,
} from "../types";
import { MOCK_SUPPLIERS } from "../mock-data";

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
  createSupplier: (data: SupplierFormData) => void;
  updateSupplier: (id: string, data: SupplierFormData) => void;
  deleteSupplier: (id: string) => void;
}

export interface SupplierFormData {
  name: string;
  code: string;
  status: SupplierStatus;
  tier: SupplierTier;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  website?: string;
  paymentTerms: PaymentTerms;
  leadTimeDays: number;
  categories: string[];
  notes?: string;
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
  const [suppliers, setSuppliers] = React.useState<SupplierItem[]>(MOCK_SUPPLIERS);
  const [filterState, setFilterState] =
    React.useState<SupplierFilterState>(INITIAL_FILTER_STATE);

  // Selected supplier for slide-over sheet (Derived selection pattern)
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<string | null>(null);

  // Modal states
  const [supplierToEdit, setSupplierToEdit] = React.useState<SupplierItem | null>(null);
  const [supplierToDelete, setSupplierToDelete] = React.useState<SupplierItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);

  // Derived selected supplier
  const selectedSupplier = React.useMemo(() => {
    if (!selectedSupplierId) return null;
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

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
  const totalPages = Math.ceil(totalFilteredCount / filterState.pageSize) || 1;

  const paginatedSuppliers = React.useMemo(() => {
    const start = (filterState.page - 1) * filterState.pageSize;
    return filteredSuppliers.slice(start, start + filterState.pageSize);
  }, [filteredSuppliers, filterState.page, filterState.pageSize]);

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
  const createSupplier = React.useCallback((data: SupplierFormData) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const newId = `sup-${Date.now()}`;

    const newSupplier: SupplierItem = {
      id: newId,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      status: data.status,
      tier: data.tier,
      contactName: data.contactName.trim(),
      contactEmail: data.contactEmail.trim(),
      contactPhone: data.contactPhone.trim(),
      address: {
        street: data.street.trim(),
        city: data.city.trim(),
        province: data.province.trim(),
        postalCode: data.postalCode.trim(),
      },
      website: data.website?.trim() || undefined,
      paymentTerms: data.paymentTerms,
      leadTimeDays: data.leadTimeDays,
      totalOrders: 0,
      totalSpend: 0,
      onTimeDeliveryRate: 0,
      defectRate: 0,
      categories: data.categories,
      notes: data.notes?.trim() || undefined,
      orderHistory: [],
      createdAt: dateStr,
    };

    setSuppliers((prev) => [newSupplier, ...prev]);
    setIsCreateModalOpen(false);
  }, []);

  const updateSupplier = React.useCallback(
    (id: string, data: SupplierFormData) => {
      const dateStr = new Date().toISOString().split("T")[0];

      setSuppliers((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            code: data.code.toUpperCase().trim(),
            name: data.name.trim(),
            status: data.status,
            tier: data.tier,
            contactName: data.contactName.trim(),
            contactEmail: data.contactEmail.trim(),
            contactPhone: data.contactPhone.trim(),
            address: {
              street: data.street.trim(),
              city: data.city.trim(),
              province: data.province.trim(),
              postalCode: data.postalCode.trim(),
            },
            website: data.website?.trim() || undefined,
            paymentTerms: data.paymentTerms,
            leadTimeDays: data.leadTimeDays,
            categories: data.categories,
            notes: data.notes?.trim() || undefined,
            updatedAt: dateStr,
          };
        })
      );

      setSupplierToEdit(null);
    },
    []
  );

  const deleteSupplier = React.useCallback(
    (id: string) => {
      setSuppliers((prev) => prev.filter((item) => item.id !== id));
      if (selectedSupplierId === id) {
        setSelectedSupplierId(null);
      }
      setSupplierToDelete(null);
    },
    [selectedSupplierId]
  );

  return {
    suppliers,
    filterState,
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
