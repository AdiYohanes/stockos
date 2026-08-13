export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock" | "draft";

export type ProductCategory =
  | "Electronics"
  | "Mechanical"
  | "Structural"
  | "Motors"
  | "Power"
  | "Consumables"
  | "Cables & Adapters"
  | "3D Printing"
  | "Fasteners"
  | "Tools"
  | "Sensors";

export interface ProductMovementLog {
  id: string;
  type: "in" | "out" | "adjustment" | "transfer";
  quantity: number;
  reference: string;
  timestamp: string;
  performedBy: string;
  note?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  unitPrice: number;
  warehouse: string;
  status: ProductStatus;
  barcode?: string;
  supplier?: string;
  description?: string;
  lastRestocked?: string;
  createdAt: string;
  movementLogs?: ProductMovementLog[];
}

export type ProductSortField = "name" | "sku" | "stock" | "price" | "category" | "createdAt";
export type ProductSortOrder = "asc" | "desc";

export interface ProductFilterState {
  searchQuery: string;
  category: string; // 'all' or specific category
  status: "all" | ProductStatus;
  warehouse: string; // 'all' or specific warehouse
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
