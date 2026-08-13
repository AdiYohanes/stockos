"use client";

import * as React from "react";
import type {
  Product,
  ProductFilterState,
  ProductMetrics,
  ProductSortField,
  ProductStatus,
} from "../types";
import { MOCK_PRODUCTS } from "../mock-data";

export interface UseProductsReturn {
  products: Product[];
  filteredProducts: Product[];
  paginatedProducts: Product[];
  metrics: ProductMetrics;
  filterState: ProductFilterState;
  totalPages: number;
  totalFilteredCount: number;
  selectedProduct: Product | null;
  productToEdit: Product | null;
  productToDelete: Product | null;
  hasActiveFilters: boolean;

  // State setters
  setSelectedProduct: (product: Product | null) => void;
  setProductToEdit: (product: Product | null) => void;
  setProductToDelete: (product: Product | null) => void;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
  setStatus: (status: "all" | ProductStatus) => void;
  setWarehouse: (warehouse: string) => void;
  setSorting: (field: ProductSortField) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;

  // CRUD actions
  addProduct: (productData: {
    name: string;
    sku: string;
    category: string;
    unit: string;
    unitPrice?: number;
    initialStock?: number;
    minStock: number;
    warehouse?: string;
    description?: string;
    supplier?: string;
  }) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordMovement: (
    productId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => void;
}

const INITIAL_FILTER_STATE: ProductFilterState = {
  searchQuery: "",
  category: "all",
  status: "all",
  warehouse: "all",
  sortField: "name",
  sortOrder: "asc",
  page: 1,
  pageSize: 10,
};

function calculateStatus(currentStock: number, minStock: number): ProductStatus {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minStock) return "low_stock";
  return "in_stock";
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = React.useState<Product[]>(MOCK_PRODUCTS);
  const [filterState, setFilterState] = React.useState<ProductFilterState>(INITIAL_FILTER_STATE);

  // Selected IDs for modals / drawers
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  // Derive selected product from current products state
  const selectedProduct = React.useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const setSelectedProduct = (product: Product | null) => {
    setSelectedProductId(product ? product.id : null);
  };

  // Derived Metrics from master products list
  const metrics: ProductMetrics = React.useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalVal = 0;

    for (const p of products) {
      if (p.status === "out_of_stock" || p.currentStock === 0) {
        outOfStock++;
      } else if (p.status === "low_stock" || p.currentStock <= p.minStock) {
        lowStock++;
      } else {
        inStock++;
      }
      totalVal += p.currentStock * (p.unitPrice || 0);
    }

    return {
      totalProducts: products.length,
      inStockCount: inStock,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      totalValuation: totalVal,
    };
  }, [products]);

  // Filtering
  const filteredProducts = React.useMemo(() => {
    const query = filterState.searchQuery.trim().toLowerCase();

    return products.filter((item) => {
      // 1. Search filter (Name, SKU, or Barcode)
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesSku = item.sku.toLowerCase().includes(query);
        const matchesBarcode = item.barcode ? item.barcode.toLowerCase().includes(query) : false;
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesCategory) {
          return false;
        }
      }

      // 2. Category filter
      if (filterState.category !== "all" && item.category !== filterState.category) {
        return false;
      }

      // 3. Status filter
      if (filterState.status !== "all" && item.status !== filterState.status) {
        return false;
      }

      // 4. Warehouse filter
      if (filterState.warehouse !== "all" && item.warehouse !== filterState.warehouse) {
        return false;
      }

      return true;
    });
  }, [products, filterState]);

  // Sorting
  const sortedProducts = React.useMemo(() => {
    const sorted = [...filteredProducts];
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
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "stock":
          comparison = a.currentStock - b.currentStock;
          break;
        case "price":
          comparison = (a.unitPrice || 0) - (b.unitPrice || 0);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredProducts, filterState]);

  // Pagination
  const totalFilteredCount = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / filterState.pageSize));

  const paginatedProducts = React.useMemo(() => {
    const startIndex = (filterState.page - 1) * filterState.pageSize;
    return sortedProducts.slice(startIndex, startIndex + filterState.pageSize);
  }, [sortedProducts, filterState]);

  const hasActiveFilters =
    filterState.searchQuery !== "" ||
    filterState.category !== "all" ||
    filterState.status !== "all" ||
    filterState.warehouse !== "all";

  // Filter setters
  const setSearchQuery = (query: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery: query, page: 1 }));
  };

  const setCategory = (category: string) => {
    setFilterState((prev) => ({ ...prev, category, page: 1 }));
  };

  const setStatus = (status: "all" | ProductStatus) => {
    setFilterState((prev) => ({ ...prev, status, page: 1 }));
  };

  const setWarehouse = (warehouse: string) => {
    setFilterState((prev) => ({ ...prev, warehouse, page: 1 }));
  };

  const setSorting = (field: ProductSortField) => {
    setFilterState((prev) => {
      if (prev.sortField === field) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
        };
      }
      return {
        ...prev,
        sortField: field,
        sortOrder: "asc",
      };
    });
  };

  const setPage = (page: number) => {
    setFilterState((prev) => ({ ...prev, page: Math.max(1, Math.min(page, totalPages)) }));
  };

  const resetFilters = () => {
    setFilterState((prev) => ({
      ...prev,
      searchQuery: "",
      category: "all",
      status: "all",
      warehouse: "all",
      page: 1,
    }));
  };

  // CRUD actions
  const addProduct = (productData: {
    name: string;
    sku: string;
    category: string;
    unit: string;
    unitPrice?: number;
    initialStock?: number;
    minStock: number;
    warehouse?: string;
    description?: string;
    supplier?: string;
  }): Product => {
    const stock = Number(productData.initialStock || 0);
    const minStock = Number(productData.minStock || 0);
    const status = calculateStatus(stock, minStock);

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: productData.sku.toUpperCase(),
      name: productData.name,
      category: productData.category,
      unit: productData.unit,
      unitPrice: productData.unitPrice || 0,
      currentStock: stock,
      minStock,
      warehouse: productData.warehouse || "Main Hub (WH-1)",
      status,
      description: productData.description || "",
      supplier: productData.supplier || "Internal Supplier",
      lastRestocked: "Just now",
      createdAt: new Date().toISOString().split("T")[0],
      movementLogs:
        stock > 0
          ? [
              {
                id: `log-${Date.now()}`,
                type: "in",
                quantity: stock,
                reference: "INIT-STOCK",
                timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                performedBy: "Alex Morgan",
                note: "Initial registered inventory.",
              },
            ]
          : [],
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.status = calculateStatus(updated.currentStock, updated.minStock);
        return updated;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    if (selectedProductId === id) {
      setSelectedProductId(null);
    }
  };

  const recordMovement = (
    productId: string,
    type: "in" | "out",
    quantity: number,
    reference: string,
    note?: string
  ) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;

        const delta = type === "in" ? quantity : -quantity;
        const newStock = Math.max(0, item.currentStock + delta);
        const newStatus = calculateStatus(newStock, item.minStock);

        const newLog = {
          id: `log-${Date.now()}`,
          type,
          quantity,
          reference,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          performedBy: "Alex Morgan",
          note,
        };

        return {
          ...item,
          currentStock: newStock,
          status: newStatus,
          lastRestocked: type === "in" ? "Just now" : item.lastRestocked,
          movementLogs: [newLog, ...(item.movementLogs || [])],
        };
      })
    );
  };

  return {
    products,
    filteredProducts,
    paginatedProducts,
    metrics,
    filterState,
    totalPages,
    totalFilteredCount,
    selectedProduct,
    productToEdit,
    productToDelete,
    hasActiveFilters,

    setSelectedProduct,
    setProductToEdit,
    setProductToDelete,
    setSearchQuery,
    setCategory,
    setStatus,
    setWarehouse,
    setSorting,
    setPage,
    resetFilters,

    addProduct,
    updateProduct,
    deleteProduct,
    recordMovement,
  };
}
