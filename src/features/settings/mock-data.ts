import { SystemSettings } from "./types";

export const DEFAULT_SETTINGS: SystemSettings = {
  company: {
    companyName: "PT Logistik Nusantara Jaya",
    taxId: "01.234.567.8-012.000",
    officialEmail: "ops@logistiknusantara.co.id",
    phone: "+62 21 5558 9012",
    address: "Jl. Industri Raya No. 45, Kawasan Logistik Cikarang, Jawa Barat 17530",
    currency: "IDR",
    currencySymbol: "Rp",
    timezone: "Asia/Jakarta (WIB)",
    dateFormat: "DD/MM/YYYY",
    operatingHours: "08:00 - 17:00 WIB",
  },
  inventory: {
    defaultLowStockThreshold: 15,
    autoOutofStock: true,
    defaultUnit: "Pcs",
    valuationMethod: "FIFO",
    allowNegativeStock: false,
    defaultReorderQuantity: 50,
    enableExpiryTracking: true,
  },
  notifications: {
    emailLowStockAlert: true,
    dailyDigest: true,
    supplierReorderReminder: true,
    systemAuditLogs: true,
    webhookUrl: "https://api.logistiknusantara.co.id/webhooks/stockos-events",
    alertRecipients: "ops@logistiknusantara.co.id, warehouse.lead@logistiknusantara.co.id",
  },
  team: [
    {
      id: "usr-001",
      name: "Budi Santoso",
      email: "budi.santoso@logistiknusantara.co.id",
      role: "Admin",
      avatar: "BS",
      status: "Active",
      lastActive: "Active Now",
      joinedAt: "2025-01-10",
      permissions: ["Full Access", "Settings Management", "User Access Control"],
    },
    {
      id: "usr-002",
      name: "Siti Rahma",
      email: "siti.rahma@logistiknusantara.co.id",
      role: "Warehouse Manager",
      avatar: "SR",
      status: "Active",
      lastActive: "15 mins ago",
      joinedAt: "2025-02-01",
      permissions: ["Warehouse Control", "Stock Transfer", "Stock Adjustment"],
    },
    {
      id: "usr-003",
      name: "Agus Pratama",
      email: "agus.pratama@logistiknusantara.co.id",
      role: "Inventory Clerk",
      avatar: "AP",
      status: "Active",
      lastActive: "2 hours ago",
      joinedAt: "2025-03-15",
      permissions: ["Stock Receiving", "Audit Logging"],
    },
    {
      id: "usr-004",
      name: "Dewi Lestari",
      email: "dewi.lestari@logistiknusantara.co.id",
      role: "Viewer",
      avatar: "DL",
      status: "Invited",
      lastActive: "Pending Invitation",
      joinedAt: "2026-08-10",
      permissions: ["Read Only Reports", "Catalog View"],
    },
  ],
  updatedAt: new Date().toISOString(),
};

const SETTINGS_STORAGE_KEY = "stockos_settings_v1";

export function loadSettingsFromStorage(): SystemSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      company: { ...DEFAULT_SETTINGS.company, ...(parsed.company || {}) },
      inventory: { ...DEFAULT_SETTINGS.inventory, ...(parsed.inventory || {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      team: Array.isArray(parsed.team) ? parsed.team : DEFAULT_SETTINGS.team,
    };
  } catch (err) {
    console.error("Failed to load settings from localStorage:", err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: SystemSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
  }
}

export function resetSettingsStorage(): SystemSettings {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to reset settings in localStorage:", err);
    }
  }
  return { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
}
