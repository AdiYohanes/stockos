import { createStore } from "zustand/vanilla";
import { MOCK_GLOBAL_TRANSFER_LOGS, MOCK_WAREHOUSES } from "./mock-data";
import type {
  InterWarehouseTransferPayload,
  StoredInventorySummary,
  WarehouseItem,
  WarehouseStatus,
  WarehouseTransferLog,
  WarehouseType,
  WarehouseZone,
} from "./types";

export interface CreateWarehouseInput {
  name: string;
  code: string;
  type: WarehouseType;
  status: WarehouseStatus;
  street?: string;
  city: string;
  province?: string;
  postalCode?: string;
  managerName: string;
  managerEmail?: string;
  managerPhone?: string;
  totalCapacityUnits: number;
  zones?: WarehouseZone[];
}

export type UpdateWarehouseInput = CreateWarehouseInput;

export interface WarehousesState {
  warehouses: WarehouseItem[];
  transferLogs: WarehouseTransferLog[];
}

export interface WarehousesActions {
  createWarehouse: (data: CreateWarehouseInput) => WarehouseItem;
  updateWarehouse: (id: string, data: UpdateWarehouseInput) => WarehouseItem;
  deleteWarehouse: (id: string) => WarehouseItem;
  transferStock: (payload: InterWarehouseTransferPayload) => WarehouseTransferLog;
}

export type WarehousesStore = WarehousesState & WarehousesActions;

const VALID_TYPES: WarehouseType[] = [
  "central_hub",
  "regional_depot",
  "cold_storage",
  "fulfillment",
  "transit",
];

const VALID_STATUSES: WarehouseStatus[] = [
  "active",
  "maintenance",
  "full",
  "inactive",
];

function validateWarehouseFields(data: CreateWarehouseInput | UpdateWarehouseInput) {
  if (!data.name || !data.name.trim()) {
    throw new Error("Facility name is required");
  }
  if (!data.code || !data.code.trim()) {
    throw new Error("Hub code is required");
  }
  if (!VALID_TYPES.includes(data.type)) {
    throw new Error("Invalid facility type");
  }
  if (!VALID_STATUSES.includes(data.status)) {
    throw new Error("Invalid facility status");
  }
  if (!data.city || !data.city.trim()) {
    throw new Error("City is required");
  }
  if (!data.managerName || !data.managerName.trim()) {
    throw new Error("Manager name is required");
  }
  if (
    !Number.isSafeInteger(data.totalCapacityUnits) ||
    data.totalCapacityUnits <= 0
  ) {
    throw new Error("Total capacity units must be a positive integer");
  }
}

// ponytail: in-memory mock warehouse store; replace structuredClone seeds when backend integration lands.
export const createWarehousesStore = () => {
  return createStore<WarehousesStore>((set, get) => ({
    warehouses: structuredClone(MOCK_WAREHOUSES),
    transferLogs: structuredClone(MOCK_GLOBAL_TRANSFER_LOGS),

    createWarehouse: (data: CreateWarehouseInput) => {
      validateWarehouseFields(data);

      const normalizedCode = data.code.trim().toUpperCase();
      const normalizedName = data.name.trim();

      const exists = get().warehouses.some(
        (w) => w.code.toUpperCase() === normalizedCode
      );
      if (exists) {
        throw new Error(`Warehouse with code "${normalizedCode}" already exists`);
      }

      const newId = `wh-${crypto.randomUUID()}`;
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const defaultZones: WarehouseZone[] =
        data.zones && data.zones.length > 0
          ? structuredClone(data.zones)
          : [
              {
                id: `zn-${crypto.randomUUID()}`,
                code: "ZN-A",
                name: "Zone A - Primary Storage",
                type: "shelf",
                capacityUnits: Math.round(data.totalCapacityUnits * 0.5),
                usedUnits: 0,
              },
              {
                id: `zn-${crypto.randomUUID()}`,
                code: "ZN-B",
                name: "Zone B - Bulk Pallet Rack",
                type: "rack",
                capacityUnits: Math.round(data.totalCapacityUnits * 0.5),
                usedUnits: 0,
              },
            ];

      const newWarehouse: WarehouseItem = {
        id: newId,
        code: normalizedCode,
        name: normalizedName,
        type: data.type,
        status: data.status,
        address: {
          street: (data.street || "").trim() || "Industrial Zone",
          city: data.city.trim(),
          province: (data.province || "").trim() || "Indonesia",
          postalCode: (data.postalCode || "").trim() || "10000",
        },
        manager: {
          name: data.managerName.trim(),
          email: (data.managerEmail || "").trim() || "manager@stockos.internal",
          phone: (data.managerPhone || "").trim() || "+62 811-0000-0000",
        },
        totalCapacityUnits: data.totalCapacityUnits,
        usedCapacityUnits: 0,
        totalSkusCount: 0,
        totalValuation: 0,
        zones: defaultZones,
        storedInventory: [],
        transferLogs: [],
        createdAt: dateStr,
      };

      set((state) => ({ warehouses: [newWarehouse, ...state.warehouses] }));
      return newWarehouse;
    },

    updateWarehouse: (id: string, data: UpdateWarehouseInput) => {
      const existing = get().warehouses.find((w) => w.id === id);
      if (!existing) {
        throw new Error(`Warehouse with ID "${id}" not found`);
      }

      validateWarehouseFields(data);

      const normalizedCode = data.code.trim().toUpperCase();
      const normalizedName = data.name.trim();

      const duplicate = get().warehouses.some(
        (w) => w.id !== id && w.code.toUpperCase() === normalizedCode
      );
      if (duplicate) {
        throw new Error(`Warehouse with code "${normalizedCode}" already exists`);
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const updatedItem: WarehouseItem = {
        ...existing,
        code: normalizedCode,
        name: normalizedName,
        type: data.type,
        status: data.status,
        address: {
          street: data.street !== undefined ? data.street.trim() : existing.address.street,
          city: data.city.trim(),
          province: data.province !== undefined ? data.province.trim() : existing.address.province,
          postalCode: data.postalCode !== undefined ? data.postalCode.trim() : existing.address.postalCode,
        },
        manager: {
          name: data.managerName.trim(),
          email: data.managerEmail !== undefined ? data.managerEmail.trim() : existing.manager.email,
          phone: data.managerPhone !== undefined ? data.managerPhone.trim() : existing.manager.phone,
        },
        totalCapacityUnits: data.totalCapacityUnits,
        zones: data.zones && data.zones.length > 0 ? structuredClone(data.zones) : existing.zones,
        updatedAt: dateStr,
      };
      set((state) => ({
        warehouses: state.warehouses.map((item) => item.id === id ? updatedItem : item),
      }));

      return updatedItem;
    },

    deleteWarehouse: (id: string) => {
      const existing = get().warehouses.find((w) => w.id === id);
      if (!existing) {
        throw new Error(`Warehouse with ID "${id}" not found`);
      }

      set((state) => ({
        warehouses: state.warehouses.filter((w) => w.id !== id),
      }));

      return existing;
    },

    transferStock: (payload: InterWarehouseTransferPayload) => {
      if (!payload.sourceWarehouseId || !payload.sourceWarehouseId.trim()) {
        throw new Error("Source warehouse ID is required");
      }
      if (!payload.destinationWarehouseId || !payload.destinationWarehouseId.trim()) {
        throw new Error("Destination warehouse ID is required");
      }
      if (payload.sourceWarehouseId === payload.destinationWarehouseId) {
        throw new Error("Source and destination warehouses must be different");
      }
      if (
        !Number.isSafeInteger(payload.quantity) ||
        payload.quantity <= 0
      ) {
        throw new Error("Transfer quantity must be a positive integer");
      }
      if (!payload.sku || !payload.sku.trim()) {
        throw new Error("SKU is required");
      }
      if (!payload.itemName || !payload.itemName.trim()) {
        throw new Error("Item name is required");
      }
      if (!payload.reference || !payload.reference.trim()) {
        throw new Error("Transfer reference is required");
      }
      if (!payload.dispatchedBy || !payload.dispatchedBy.trim()) {
        throw new Error("Dispatched by is required");
      }

      const state = get();
      const source = state.warehouses.find((w) => w.id === payload.sourceWarehouseId);
        if (!source) {
          throw new Error(`Source warehouse with ID "${payload.sourceWarehouseId}" not found`);
        }

        const dest = state.warehouses.find((w) => w.id === payload.destinationWarehouseId);
        if (!dest) {
          throw new Error(`Destination warehouse with ID "${payload.destinationWarehouseId}" not found`);
        }

        const sourceItem = source.storedInventory?.find((i) => i.sku === payload.sku);
        if (!sourceItem) {
          throw new Error(
            `SKU "${payload.sku}" not found in source warehouse "${source.name}"`
          );
        }

        if (sourceItem.available < payload.quantity) {
          throw new Error(
            `Insufficient available stock for SKU "${payload.sku}" at source warehouse. Available: ${sourceItem.available}, requested: ${payload.quantity}`
          );
        }

        const unitCost = sourceItem.unitCost;
        const transferValuation = unitCost * payload.quantity;
        const now = new Date();
        const timestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
        const logId = `trf-${crypto.randomUUID()}`;

        const newTransferLog: WarehouseTransferLog = {
          id: logId,
          reference: payload.reference.trim().toUpperCase(),
          sourceWarehouseId: source.id,
          sourceWarehouseName: source.name,
          destinationWarehouseId: dest.id,
          destinationWarehouseName: dest.name,
          sku: payload.sku,
          itemName: payload.itemName.trim(),
          quantity: payload.quantity,
          dispatchedBy: payload.dispatchedBy.trim(),
          timestamp,
          notes: payload.notes?.trim() || undefined,
          status: "completed",
        };

        const updatedSourceInventory: StoredInventorySummary[] = (source.storedInventory || [])
          .map((inv) => {
            if (inv.sku === payload.sku) {
              const newQty = inv.quantity - payload.quantity;
              const newAvail = inv.available - payload.quantity;
              return { ...inv, quantity: newQty, available: newAvail };
            }
            return inv;
          })
          .filter((inv) => inv.quantity > 0);

        const newSourceUsed = Math.max(0, source.usedCapacityUnits - payload.quantity);
        const newSourceValuation = Math.max(0, source.totalValuation - transferValuation);

        const existingDestInv = dest.storedInventory?.find((i) => i.sku === payload.sku);
        let updatedDestInventory: StoredInventorySummary[];

        if (existingDestInv) {
          updatedDestInventory = (dest.storedInventory || []).map((inv) => {
            if (inv.sku === payload.sku) {
              return {
                ...inv,
                quantity: inv.quantity + payload.quantity,
                available: inv.available + payload.quantity,
              };
            }
            return inv;
          });
        } else {
          const newInvItem: StoredInventorySummary = {
            id: `inv-${crypto.randomUUID()}`,
            sku: payload.sku,
            name: payload.itemName.trim(),
            category: sourceItem.category || "General",
            quantity: payload.quantity,
            available: payload.quantity,
            unitCost,
            unit: sourceItem.unit || "pcs",
            locationBin: "A-01-01",
          };
          updatedDestInventory = [newInvItem, ...(dest.storedInventory || [])];
        }

        const newDestUsed = dest.usedCapacityUnits + payload.quantity;
        const newDestValuation = dest.totalValuation + transferValuation;
        if (!Number.isSafeInteger(newDestUsed) ||
            updatedDestInventory.some((item) => !Number.isSafeInteger(item.quantity) || !Number.isSafeInteger(item.available)) ||
            !Number.isFinite(newDestValuation)) {
          throw new Error("Transfer exceeds supported stock or valuation");
        }

        const nextWarehouses = state.warehouses.map((wh) => {
          if (wh.id === source.id) {
            return {
              ...wh,
              usedCapacityUnits: newSourceUsed,
              totalValuation: newSourceValuation,
              totalSkusCount: updatedSourceInventory.length,
              storedInventory: updatedSourceInventory,
              transferLogs: [newTransferLog, ...(wh.transferLogs || [])],
            };
          }
          if (wh.id === dest.id) {
            return {
              ...wh,
              usedCapacityUnits: newDestUsed,
              totalValuation: newDestValuation,
              totalSkusCount: updatedDestInventory.length,
              storedInventory: updatedDestInventory,
              transferLogs: [newTransferLog, ...(wh.transferLogs || [])],
            };
          }
          return wh;
        });

      set({
        warehouses: nextWarehouses,
        transferLogs: [newTransferLog, ...state.transferLogs],
      });
      return newTransferLog;
    },
  }));
};
