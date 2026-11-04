export interface TallyItem {
  productId: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: number;
  quantity: number;
  availableStock: number;
  stockVersion?: string;
  photoUrl: string | null;
}

export interface TallyTotals {
  totalQuantity: number;
  expectedRevenue: number;
  hasOverflow: boolean;
  overflowItems: TallyItem[];
}

export type DiscrepancyStatus = "balanced" | "shortage" | "surplus" | "unrecorded";

export interface CashDiscrepancy {
  expectedRevenue: number;
  actualCash: number | null;
  discrepancy: number | null;
  status: DiscrepancyStatus;
}

export interface CloseDailyRegisterInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  actualCash?: number | null;
  note?: string | null;
}

export interface CloseDailyRegisterResult {
  ok: boolean;
  totalProductsDeducted: number;
  totalUnitsDeducted: number;
  expectedRevenue: number;
  reference: string;
  error?: string;
}
