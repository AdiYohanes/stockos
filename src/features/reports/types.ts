export type ReportTab = "valuation" | "velocity" | "reorder";

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
  openingQty?: number;
  stockInQty: number;
  stockOutQty: number;
  opnameDelta?: number;
  currentStock: number;
  turnoverRatio?: number;
  velocityTier?: VelocityTier;
  lastMovementDate: string;
}

export type RiskUrgency = "critical" | "warning" | "optimal";

export interface ReorderRiskItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  suggestedReorderQty: number;
  unitCost: number;
  totalReorderCost: number;
  urgency: RiskUrgency;
  supplierName: string;
  daysRemaining?: number;
  leadTimeDays?: number;
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
  categoryId: string;
  tab: ReportTab;
}

export interface MovementTrendPoint {
  date: string;
  stockIn: number;
  stockOut: number;
  netFlow: number;
}
