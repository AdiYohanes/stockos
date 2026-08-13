export type SupplierStatus = "active" | "on_hold" | "inactive";

export type SupplierTier = "platinum" | "gold" | "silver" | "bronze";

export type PaymentTerms =
  | "net_15"
  | "net_30"
  | "net_45"
  | "net_60"
  | "cod"
  | "prepaid";

export interface SupplierAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface SupplierOrderLog {
  id: string;
  reference: string;
  date: string;
  itemCount: number;
  totalAmount: number;
  status: "delivered" | "in_transit" | "processing" | "cancelled";
  deliveredDate?: string;
}

export interface SupplierItem {
  id: string;
  code: string;
  name: string;
  status: SupplierStatus;
  tier: SupplierTier;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: SupplierAddress;
  website?: string;
  paymentTerms: PaymentTerms;
  leadTimeDays: number;
  totalOrders: number;
  totalSpend: number;
  onTimeDeliveryRate: number;
  defectRate: number;
  categories: string[];
  notes?: string;
  lastOrderDate?: string;
  orderHistory?: SupplierOrderLog[];
  createdAt: string;
  updatedAt?: string;
}

export type SupplierSortField =
  | "name"
  | "code"
  | "status"
  | "tier"
  | "leadTime"
  | "orders"
  | "spend"
  | "onTime"
  | "createdAt";

export type SupplierSortOrder = "asc" | "desc";

export interface SupplierFilterState {
  searchQuery: string;
  status: "all" | SupplierStatus;
  tier: "all" | SupplierTier;
  category: string; // "all" or specific category
  sortField: SupplierSortField;
  sortOrder: SupplierSortOrder;
  page: number;
  pageSize: number;
}

export interface SupplierMetrics {
  totalSuppliers: number;
  activeCount: number;
  onHoldCount: number;
  inactiveCount: number;
  totalSpend: number;
  avgOnTimeDelivery: number;
  avgLeadTime: number;
}
