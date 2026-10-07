import { createStore } from "zustand/vanilla";
import { MOCK_SUPPLIERS } from "./mock-data";
import type {
  PaymentTerms,
  SupplierItem,
  SupplierStatus,
  SupplierTier,
} from "./types";

export interface SupplierFormData {
  name: string;
  code: string;
  status: SupplierStatus;
  tier: SupplierTier;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  website?: string;
  paymentTerms: PaymentTerms;
  leadTimeDays: number;
  categories: string[];
  notes?: string;
}

export interface SuppliersState {
  suppliers: SupplierItem[];
}

export interface SuppliersActions {
  createSupplier: (data: SupplierFormData) => SupplierItem;
  updateSupplier: (id: string, data: SupplierFormData) => SupplierItem;
  deleteSupplier: (id: string) => SupplierItem;
}

export type SuppliersStore = SuppliersState & SuppliersActions;

const VALID_STATUSES: SupplierStatus[] = ["active", "on_hold", "inactive"];
const VALID_TIERS: SupplierTier[] = ["platinum", "gold", "silver", "bronze"];
const VALID_PAYMENT_TERMS: PaymentTerms[] = [
  "net_15",
  "net_30",
  "net_45",
  "net_60",
  "cod",
  "prepaid",
];

function validateSupplierFields(data: SupplierFormData) {
  if (!data.name || !data.name.trim()) {
    throw new Error("Company name is required");
  }
  if (!data.code || !data.code.trim()) {
    throw new Error("Supplier code is required");
  }
  if (!VALID_STATUSES.includes(data.status)) {
    throw new Error("Invalid supplier status");
  }
  if (!VALID_TIERS.includes(data.tier)) {
    throw new Error("Invalid supplier tier");
  }
  if (!VALID_PAYMENT_TERMS.includes(data.paymentTerms)) {
    throw new Error("Invalid payment terms");
  }
  if (!data.contactName || !data.contactName.trim()) {
    throw new Error("Contact name is required");
  }
  if (!data.contactEmail || !data.contactEmail.trim()) {
    throw new Error("Contact email is required");
  }
  if (!data.contactPhone || !data.contactPhone.trim()) {
    throw new Error("Contact phone is required");
  }
  if (!data.street || !data.street.trim()) {
    throw new Error("Street address is required");
  }
  if (!data.city || !data.city.trim()) {
    throw new Error("City is required");
  }
  if (!data.province || !data.province.trim()) {
    throw new Error("Province is required");
  }
  if (!data.postalCode || !data.postalCode.trim()) {
    throw new Error("Postal code is required");
  }
  if (
    !Number.isInteger(data.leadTimeDays) ||
    data.leadTimeDays < 1
  ) {
    throw new Error("Lead time must be at least 1 day");
  }
  if (!Array.isArray(data.categories) || data.categories.length === 0) {
    throw new Error("Select at least one category");
  }
}

// ponytail: in-memory mock supplier store; replace structuredClone seeds when backend integration lands.
export const createSuppliersStore = () => {
  return createStore<SuppliersStore>((set, get) => ({
    suppliers: structuredClone(MOCK_SUPPLIERS),

    createSupplier: (data: SupplierFormData) => {
      validateSupplierFields(data);

      const normalizedCode = data.code.trim().toUpperCase();
      const normalizedName = data.name.trim();

      const exists = get().suppliers.some(
        (s) => s.code.toUpperCase() === normalizedCode
      );
      if (exists) {
        throw new Error(`Supplier with code "${normalizedCode}" already exists`);
      }

      const newId = `sup-${crypto.randomUUID()}`;
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const newSupplier: SupplierItem = {
        id: newId,
        code: normalizedCode,
        name: normalizedName,
        status: data.status,
        tier: data.tier,
        contactName: data.contactName.trim(),
        contactEmail: data.contactEmail.trim(),
        contactPhone: data.contactPhone.trim(),
        address: {
          street: data.street.trim(),
          city: data.city.trim(),
          province: data.province.trim(),
          postalCode: data.postalCode.trim(),
        },
        website: data.website?.trim() || undefined,
        paymentTerms: data.paymentTerms,
        leadTimeDays: data.leadTimeDays,
        totalOrders: 0,
        totalSpend: 0,
        onTimeDeliveryRate: 0,
        defectRate: 0,
        categories: [...data.categories],
        notes: data.notes?.trim() || undefined,
        orderHistory: [],
        createdAt: dateStr,
      };

      set((state) => ({ suppliers: [newSupplier, ...state.suppliers] }));
      return newSupplier;
    },

    updateSupplier: (id: string, data: SupplierFormData) => {
      const existing = get().suppliers.find((s) => s.id === id);
      if (!existing) {
        throw new Error(`Supplier with ID "${id}" not found`);
      }

      validateSupplierFields(data);

      const normalizedCode = data.code.trim().toUpperCase();
      const normalizedName = data.name.trim();

      const duplicate = get().suppliers.some(
        (s) => s.id !== id && s.code.toUpperCase() === normalizedCode
      );
      if (duplicate) {
        throw new Error(`Supplier with code "${normalizedCode}" already exists`);
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const updatedItem: SupplierItem = {
        ...existing,
        code: normalizedCode,
        name: normalizedName,
        status: data.status,
        tier: data.tier,
        contactName: data.contactName.trim(),
        contactEmail: data.contactEmail.trim(),
        contactPhone: data.contactPhone.trim(),
        address: {
          street: data.street.trim(),
          city: data.city.trim(),
          province: data.province.trim(),
          postalCode: data.postalCode.trim(),
        },
        website: data.website?.trim() || undefined,
        paymentTerms: data.paymentTerms,
        leadTimeDays: data.leadTimeDays,
        categories: [...data.categories],
        notes: data.notes?.trim() || undefined,
        updatedAt: dateStr,
      };
      set((state) => ({
        suppliers: state.suppliers.map((item) => item.id === id ? updatedItem : item),
      }));

      return updatedItem;
    },

    deleteSupplier: (id: string) => {
      const existing = get().suppliers.find((s) => s.id === id);
      if (!existing) {
        throw new Error(`Supplier with ID "${id}" not found`);
      }

      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
      }));

      return existing;
    },
  }));
};
