"use client";

import * as React from "react";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import type { TallyTotals } from "../types";
import {
  addToTally,
  incrementTally,
  decrementTally,
  setTallyQuantity,
  removeTallyItem,
  calculateTallyTotals,
} from "../tally";
import { tallyStore } from "../storage";

export function useKasir(products: ProductDto[]) {
  const rawTally = React.useSyncExternalStore(
    tallyStore.subscribe,
    tallyStore.getSnapshot,
    tallyStore.getServerSnapshot
  );

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  // Sync availableStock and price changes from fresh products
  const tally = React.useMemo(() => {
    if (rawTally.length === 0 || products.length === 0) return rawTally;
    const productMap = new Map(products.map((p) => [p.id, p]));
    return rawTally.map((item) => {
      const fresh = productMap.get(item.productId);
      if (fresh) {
        return {
          ...item,
          availableStock: fresh.currentStock,
          sellingPrice: Number(fresh.sellingPrice),
          stockVersion: fresh.stockVersion,
        };
      }
      return item;
    });
  }, [rawTally, products]);

  // Unique categories list
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [products]);

  // Filtered products
  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (p.archivedAt) return false;
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        return matchName || matchSku || matchBarcode;
      }
      return true;
    });
  }, [products, search, selectedCategory]);

  // Totals & validation
  const totals: TallyTotals = React.useMemo(() => {
    return calculateTallyTotals(tally);
  }, [tally]);

  // Tally mutations
  const handleAddProduct = React.useCallback(
    (product: ProductDto) => {
      if (product.currentStock <= 0) return;
      const next = addToTally(tallyStore.getSnapshot(), product);
      tallyStore.set(next);
    },
    []
  );

  const handleIncrement = React.useCallback((productId: string) => {
    const next = incrementTally(tallyStore.getSnapshot(), productId);
    tallyStore.set(next);
  }, []);

  const handleDecrement = React.useCallback((productId: string) => {
    const next = decrementTally(tallyStore.getSnapshot(), productId);
    tallyStore.set(next);
  }, []);

  const handleSetQuantity = React.useCallback((productId: string, quantity: number) => {
    const next = setTallyQuantity(tallyStore.getSnapshot(), productId, quantity);
    tallyStore.set(next);
  }, []);

  const handleRemove = React.useCallback((productId: string) => {
    const next = removeTallyItem(tallyStore.getSnapshot(), productId);
    tallyStore.set(next);
  }, []);

  const handleReset = React.useCallback(() => {
    tallyStore.clear();
  }, []);

  return {
    products: filteredProducts,
    allProductsCount: products.length,
    tally,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    categories,
    totals,
    handleAddProduct,
    handleIncrement,
    handleDecrement,
    handleSetQuantity,
    handleRemove,
    handleReset,
  };
}
