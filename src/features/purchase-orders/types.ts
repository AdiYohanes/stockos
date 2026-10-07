export * from "./schemas/po.schema";

export interface POSummaryMetrics {
  totalOrders: number;
  totalSpend: number;
  pendingCount: number;
  partialCount: number;
  receivedCount: number;
}
