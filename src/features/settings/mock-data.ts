import type { CompanySettings, InventorySettings } from "./types";

export const DEFAULT_WARUNG_SETTINGS: {
  company: CompanySettings;
  inventory: InventorySettings;
} = {
  company: {
    name: "Warung Berkah",
    ownerName: "Pemilik Warung",
    phone: "",
    address: "",
    timezone: "Asia/Jakarta",
  },
  inventory: {
    defaultUnit: "Pcs",
    defaultMinStock: 15,
  },
};
