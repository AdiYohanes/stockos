"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createProductsStore, type ProductsStore } from "@/features/products/store";
import { createInventoryStore, type InventoryStore } from "@/features/inventory/store";

const FeatureStoresContext = createContext<{
  products: ReturnType<typeof createProductsStore>;
  inventory: ReturnType<typeof createInventoryStore>;
} | null>(null);

export function FeatureStoresProvider({ children }: { children: React.ReactNode }) {
  const [stores] = useState(() => ({
    products: createProductsStore(),
    inventory: createInventoryStore(),
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
