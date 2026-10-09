export * from "./schemas/product.schema";

export type ProductSortField = "name" | "sku" | "stock" | "price" | "category" | "createdAt";
export type ProductSortOrder = "asc" | "desc";

export interface ProductFilterState {
  searchQuery: string;
  category: string; // 'all' or specific category
  status: "all" | import("./schemas/product.schema").ProductStatus;
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
  totalValuation: number;
}
