"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createProductsStore, type ProductsStore } from "@/features/products/store";
import { createInventoryStore, type InventoryStore } from "@/features/inventory/store";
import { createWarehousesStore, type WarehousesStore } from "@/features/warehouses/store";
import { createSuppliersStore, type SuppliersStore } from "@/features/suppliers/store";
import { createPurchaseOrdersStore, type PurchaseOrdersStore } from "@/features/purchase-orders/store";

const FeatureStoresContext = createContext<{
  products: ReturnType<typeof createProductsStore>;
  inventory: ReturnType<typeof createInventoryStore>;
  warehouses: ReturnType<typeof createWarehousesStore>;
  suppliers: ReturnType<typeof createSuppliersStore>;
  purchaseOrders: ReturnType<typeof createPurchaseOrdersStore>;
} | null>(null);

export function FeatureStoresProvider({ children }: { children: React.ReactNode }) {
  const [stores] = useState(() => ({
    products: createProductsStore(),
    inventory: createInventoryStore(),
    warehouses: createWarehousesStore(),
    suppliers: createSuppliersStore(),
    purchaseOrders: createPurchaseOrdersStore(),
  }));

  return <FeatureStoresContext.Provider value={stores}>{children}</FeatureStoresContext.Provider>;
}

function useFeatureStores() {
  const stores = useContext(FeatureStoresContext);
  if (!stores) throw new Error("Feature store hooks require FeatureStoresProvider.");
  return stores;
}

export function useProductsStore<T>(selector: (state: ProductsStore) => T): T {
  return useStore(useFeatureStores().products, selector);
}

export function useInventoryStore<T>(selector: (state: InventoryStore) => T): T {
  return useStore(useFeatureStores().inventory, selector);
}

export function useWarehousesStore<T>(selector: (state: WarehousesStore) => T): T {
  return useStore(useFeatureStores().warehouses, selector);
}

export function useSuppliersStore<T>(selector: (state: SuppliersStore) => T): T {
  return useStore(useFeatureStores().suppliers, selector);
}

export function usePurchaseOrdersStore<T>(selector: (state: PurchaseOrdersStore) => T): T {
  return useStore(useFeatureStores().purchaseOrders, selector);
}
