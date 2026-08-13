export type CurrencyCode = "IDR" | "USD" | "EUR" | "SGD";
export type ValuationMethod = "FIFO" | "LIFO" | "WEIGHTED_AVERAGE";
export type DefaultUnit = "Pcs" | "Kg" | "Box" | "Liter" | "Pack" | "Roll";
export type TeamRole = "Admin" | "Warehouse Manager" | "Inventory Clerk" | "Viewer";
export type TeamMemberStatus = "Active" | "Invited" | "Suspended";

export type SettingsTab = "company" | "inventory" | "notifications" | "team" | "system";

export interface CompanySettings {
  companyName: string;
  taxId: string;
  officialEmail: string;
  phone: string;
  address: string;
  currency: CurrencyCode;
  currencySymbol: string;
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  operatingHours: string;
}

export interface InventorySettings {
  defaultLowStockThreshold: number;
  autoOutofStock: boolean;
  defaultUnit: DefaultUnit;
  valuationMethod: ValuationMethod;
  allowNegativeStock: boolean;
  defaultReorderQuantity: number;
  enableExpiryTracking: boolean;
}

export interface NotificationSettings {
  emailLowStockAlert: boolean;
  dailyDigest: boolean;
  supplierReorderReminder: boolean;
  systemAuditLogs: boolean;
  webhookUrl: string;
  alertRecipients: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar?: string;
  status: TeamMemberStatus;
  lastActive: string;
  joinedAt: string;
  permissions: string[];
}

export interface SystemSettings {
  company: CompanySettings;
  inventory: InventorySettings;
  notifications: NotificationSettings;
  team: TeamMember[];
  updatedAt: string;
}
