import type { ShopSettingsDto, UpdateShopSettingsInput } from "./schemas/settings-rpc.schema";

export type SettingsTab = "company" | "inventory" | "system";

export type TimezoneCode = "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";

export interface CompanySettings {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  timezone: TimezoneCode;
}

export interface InventorySettings {
  defaultUnit: string;
  defaultMinStock: number;
}

export interface DisplayPreferences {
  language: "id" | "en";
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
}

export type { ShopSettingsDto, UpdateShopSettingsInput };
