export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "overstocked";

export type MovementType = "in" | "out" | "adjustment" | "transfer";

export type AdjustmentReason =
  | "cycle_count"
  | "damaged_goods"
  | "expired"
  | "theft_loss"
  | "supplier_return"
  | "correction";

export interface StockMovement {
  id: string;
  itemId: string;
  sku: string;
  itemName: string;
  type: MovementType;
  quantity: number; // Positive for IN, negative for OUT, delta (+/-) for ADJ
  previousStock: number;
  newStock: number;
  warehouse: string;
  reference: string;
  reason?: AdjustmentReason;
  note?: string;
  performedBy: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  locationBin: string; // e.g. "A-02-14" (Aisle, Shelf, Bin)
  currentStock: number; // Physical On-Hand
  reservedStock: number; // Allocated to pending orders
  availableStock: number; // currentStock - reservedStock
  minStock: number; // Safety/reorder threshold
  maxStock: number; // Optimal capacity ceiling
  unit: string;
  unitCost: number; // Valuation unit cost
  status: StockStatus;
  lastMovementAt: string;
  movementLogs?: StockMovement[];
}

export type InventoryTab = "stock_levels" | "movements";

export type InventorySortField =
  | "name"
  | "sku"
  | "currentStock"
  | "availableStock"
  | "valuation"
  | "lastMovementAt"
  | "timestamp";

export type InventorySortOrder = "asc" | "desc";

export interface InventoryFilterState {
  tab: InventoryTab;
  searchQuery: string;
  warehouse: string;
  status: "all" | StockStatus;
  movementType: "all" | MovementType;
  category: string;
  sortField: InventorySortField;
  sortOrder: InventorySortOrder;
  page: number;
  pageSize: number;
}

export interface InventoryMetrics {
  totalItems: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockedCount: number;
  totalValuation: number;
  todayMovementsCount: number;
}
