export type POStatus = "DRAFT" | "ISSUED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export interface POLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
}

export interface POReceiptLog {
  id: string;
  poId: string;
  receivedAt: string;
  warehouseId: string;
  warehouseName: string;
  items: {
    sku: string;
    productName: string;
    quantityReceived: number;
  }[];
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierTier: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: POStatus;
  orderDate: string;
  expectedDeliveryDate: string;
  totalCost: number;
  lineItems: POLineItem[];
  receipts: POReceiptLog[];
  notes?: string;
}

export interface POSummaryMetrics {
  totalOrders: number;
  totalSpend: number;
  pendingCount: number;
  partialCount: number;
  receivedCount: number;
}
