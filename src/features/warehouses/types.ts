export type WarehouseType =
  | "central_hub"
  | "regional_depot"
  | "cold_storage"
  | "fulfillment"
  | "transit";

export type WarehouseStatus = "active" | "maintenance" | "full" | "inactive";

export type WarehouseZoneType = "rack" | "shelf" | "bulk" | "cold_room";

export interface WarehouseZone {
  id: string;
  name: string; // e.g. "Zone A - Microcontrollers & MCUs"
  code: string; // e.g. "ZN-A"
  type: WarehouseZoneType;
  capacityUnits: number;
  usedUnits: number;
}

export interface WarehouseAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface WarehouseManager {
  name: string;
  email: string;
  phone: string;
}

export interface StoredInventorySummary {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number; // Physical on-hand
  available: number; // Ready for dispatch
  unitCost: number;
  unit: string;
  locationBin: string; // e.g. "A-01-02"
}

export interface WarehouseTransferLog {
  id: string;
  reference: string; // e.g. "TRF-2026-008"
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  sku: string;
  itemName: string;
  quantity: number;
  dispatchedBy: string;
  timestamp: string;
  notes?: string;
  status: "completed" | "in_transit" | "pending";
}

export interface WarehouseItem {
  id: string;
  code: string; // e.g. "WH-01"
  name: string; // e.g. "Main Hub (WH-1)"
  type: WarehouseType;
  status: WarehouseStatus;
  address: WarehouseAddress;
  manager: WarehouseManager;
  totalCapacityUnits: number;
  usedCapacityUnits: number;
  totalSkusCount: number;
  totalValuation: number;
  zones: WarehouseZone[];
  storedInventory?: StoredInventorySummary[];
  transferLogs?: WarehouseTransferLog[];
  createdAt: string;
  updatedAt?: string;
}

export interface InterWarehouseTransferPayload {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  sku: string;
  itemName: string;
  quantity: number;
  reference: string;
  notes?: string;
  dispatchedBy: string;
}

export type WarehouseViewMode = "grid" | "table";

export type WarehouseSortField =
  | "name"
  | "code"
  | "utilization"
  | "capacity"
  | "valuation"
  | "skus"
  | "createdAt";

export type WarehouseSortOrder = "asc" | "desc";

export interface WarehouseFilterState {
  searchQuery: string;
  status: "all" | WarehouseStatus;
  type: "all" | WarehouseType;
  viewMode: WarehouseViewMode;
  sortField: WarehouseSortField;
  sortOrder: WarehouseSortOrder;
  page: number;
  pageSize: number;
}

export interface WarehouseMetrics {
  totalWarehouses: number;
  activeCount: number;
  maintenanceCount: number;
  fullCount: number;
  avgUtilization: number;
  totalStockUnits: number;
  totalValuation: number;
}
