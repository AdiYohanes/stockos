export type MetricTrend = "up" | "down" | "neutral";

export interface OverviewMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  change?: string;
  trend?: MetricTrend;
  supportingText?: string;
  iconName: "products" | "value" | "low_stock" | "out_of_stock";
  variant?: "default" | "warning" | "destructive" | "success";
}

export interface StockMovementItem {
  period: string;
  stockIn: number;
  stockOut: number;
}

export interface StockMovementData {
  timeframe: "7d" | "30d";
  totalIn: number;
  totalOut: number;
  netChange: number;
  data: StockMovementItem[];
}

export interface HealthDistribution {
  count: number;
  percentage: number;
  value: number;
}

export interface InventoryHealthData {
  totalProducts: number;
  healthScore: number;
  healthy: HealthDistribution;
  lowStock: HealthDistribution;
  outOfStock: HealthDistribution;
}

export type AttentionStatus = "out_of_stock" | "low_stock";

export interface AttentionItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  status: AttentionStatus;
  lastRestocked: string;
}


export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: "plus" | "arrow-down" | "arrow-up";
  badge?: string;
}
