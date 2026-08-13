export type ReportTab = "valuation" | "velocity" | "reorder" | "performance";

export type ReportTimeframe = "7d" | "30d" | "90d" | "12m";

export interface CategoryValuation {
  categoryId: string;
  categoryName: string;
  itemCount: number;
  stockQty: number;
  totalCost: number;
  totalRetailValue: number;
  marginPercent: number;
  ratioPercent: number;
}

export interface ValuationSummary {
  totalValuation: number;
  totalCost: number;
  grossMargin: number;
  marginPercent: number;
  totalSKUs: number;
  categories: CategoryValuation[];
}

export type VelocityTier = "fast" | "moderate" | "slow" | "dead";

export interface MovementVelocityItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  stockInQty: number;
  stockOutQty: number;
  currentStock: number;
  turnoverRatio: number;
  velocityTier: VelocityTier;
  lastMovementDate: string;
}

export type RiskUrgency = "critical" | "warning" | "optimal";

export interface ReorderRiskItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  currentStock: number;
  minThreshold: number;
  daysRemaining: number;
  suggestedReorderQty: number;
  unitCost: number;
  totalReorderCost: number;
  urgency: RiskUrgency;
  leadTimeDays: number;
  supplierName: string;
}

export interface WarehousePerformance {
  warehouseId: string;
  name: string;
  code: string;
  location: string;
  capacityUsedPercent: number;
  totalValuation: number;
  stockCount: number;
  turnoverRate: number;
  status: "optimal" | "near_capacity" | "underutilized";
}

export interface SupplierPerformance {
  supplierId: string;
  name: string;
  code: string;
  fulfilledOrders: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
  totalSpend: number;
  status: "preferred" | "active" | "under_review";
}

export interface ReportFilter {
  search: string;
  timeframe: ReportTimeframe;
  warehouseId: string;
  categoryId: string;
  tab: ReportTab;
}

export interface MovementTrendPoint {
  date: string;
  stockIn: number;
  stockOut: number;
  netFlow: number;
}
