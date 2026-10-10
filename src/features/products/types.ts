export * from "./schemas/product.schema";

export type ProductSortField = "name" | "sku" | "currentStock" | "sellingPrice" | "createdAt";
export type ProductSortOrder = "asc" | "desc";

export interface ProductFilterState {
  searchQuery: string;
  category: string;
  status: "all" | "in_stock" | "low_stock" | "out_of_stock";
  archive: "active" | "archived" | "all";
  sortField: ProductSortField;
  sortOrder: ProductSortOrder;
  page: number;
  pageSize: number;
}

export interface ProductMetrics {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValuation: string;
}
