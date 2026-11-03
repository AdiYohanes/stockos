"use client";

import * as React from "react";
import type { ProductDto } from "@/features/products/schemas/product-rpc.schema";
import { KasirContainer } from "@/features/kasir";
import type { CloseDailyRegisterServerInput } from "@/features/kasir/actions";
import type { CloseDailyRegisterResult } from "@/features/kasir/types";
import { INITIAL_DEMO_PRODUCTS, type DemoClosingHistoryItem } from "../demo-data";
import { DemoBanner } from "./demo-banner";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  Calculator,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Receipt,
} from "lucide-react";

export function DemoContainer() {
  const [products, setProducts] = React.useState<ProductDto[]>(INITIAL_DEMO_PRODUCTS);
  const [closingHistory, setClosingHistory] = React.useState<DemoClosingHistoryItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<"kasir" | "stok" | "ringkasan">("kasir");

  // Stock table search and filter
  const [stockSearch, setStockSearch] = React.useState("");
  const [selectedStockCategory, setSelectedStockCategory] = React.useState<string>("ALL");

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [products]);

  const filteredStockProducts = React.useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedStockCategory !== "ALL" && p.category !== selectedStockCategory) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q))
      );
    });
  }, [products, stockSearch, selectedStockCategory]);

  // Overall financial summary derived from current in-memory products
  const summary = React.useMemo(() => {
    let totalCost = 0;
    let totalSelling = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalCost += Number(p.inventoryCostValue || 0);
      totalSelling += Number(p.potentialSellingValue || 0);
      if (p.stockStatus === "low_stock") lowStockCount++;
      if (p.stockStatus === "out_of_stock") outOfStockCount++;
    }

    const potentialProfit = totalSelling - totalCost;
    return {
      totalCost,
      totalSelling,
      potentialProfit,
      lowStockCount,
      outOfStockCount,
      totalSkus: products.length,
    };
  }, [products]);

  // Today's tally summary from completed demo sales
  const todaySales = React.useMemo(() => {
    const totalRevenue = closingHistory.reduce((acc, curr) => acc + curr.expectedRevenue, 0);
    const totalUnits = closingHistory.reduce((acc, curr) => acc + curr.totalUnits, 0);
    return { totalRevenue, totalUnits, count: closingHistory.length };
  }, [closingHistory]);

  const handleReset = React.useCallback(() => {
    // ponytail: in-memory reset; add localStorage sync when persistent guest sandbox is requested
    setProducts(INITIAL_DEMO_PRODUCTS);
    setClosingHistory([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("stockos_kasir_tally_v1");
      } catch {
        // Safe ignore
      }
    }
  }, []);

  const handleCloseRegister = React.useCallback(
    async (input: CloseDailyRegisterServerInput): Promise<CloseDailyRegisterResult> => {
      const validItems = input.items.filter((i) => i.quantity > 0);
      if (validItems.length === 0) {
        return {
          ok: false,
          totalProductsDeducted: 0,
          totalUnitsDeducted: 0,
          expectedRevenue: 0,
          reference: "",
          error: "Tidak ada barang untuk ditutup.",
        };
      }

      const itemMap = new Map(validItems.map((item) => [item.productId, item.quantity]));
      let totalUnits = 0;

      // Deduct from in-memory products
      setProducts((prev) =>
        prev.map((prod) => {
          const qtyToDeduct = itemMap.get(prod.id);
          if (!qtyToDeduct) return prod;

          totalUnits += qtyToDeduct;
          const newStock = Math.max(0, prod.currentStock - qtyToDeduct);
          const unitCost = Number(prod.averagePurchaseCost || 0);
          const newCostValue = (newStock * unitCost).toFixed(2);
          const newSellingValue = (newStock * Number(prod.sellingPrice)).toFixed(2);
          const newProfit = (Number(newSellingValue) - Number(newCostValue)).toFixed(2);

          let newStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
          if (newStock === 0) {
            newStatus = "out_of_stock";
          } else if (newStock <= prod.minStock) {
            newStatus = "low_stock";
          }

          return {
            ...prod,
            currentStock: newStock,
            stockStatus: newStatus,
            inventoryCostValue: newCostValue,
            potentialSellingValue: newSellingValue,
            potentialGrossProfit: newProfit,
            stockVersion: String(Number(prod.stockVersion) + 1),
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const refNum = Math.floor(1000 + Math.random() * 9000);
      const reference = `DEMO-REG-${refNum}`;

      setClosingHistory((prev) => [
        {
          id: `hist-${Date.now()}`,
          reference,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          totalUnits,
          expectedRevenue: input.expectedRevenue,
          items: validItems.map((v) => ({ name: v.name || "Barang", quantity: v.quantity })),
        },
        ...prev,
      ]);

      return {
        ok: true,
        totalProductsDeducted: validItems.length,
        totalUnitsDeducted: totalUnits,
        expectedRevenue: input.expectedRevenue,
        reference,
      };
    },
    []
  );

  // Quick Restock in demo (+10 pcs)
  const handleRestock = React.useCallback((productId: string, amount: number = 10) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        const newStock = prod.currentStock + amount;
        const unitCost = Number(prod.averagePurchaseCost || 0);
        const newCostValue = (newStock * unitCost).toFixed(2);
        const newSellingValue = (newStock * Number(prod.sellingPrice)).toFixed(2);
        const newProfit = (Number(newSellingValue) - Number(newCostValue)).toFixed(2);

        let newStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
        if (newStock === 0) {
          newStatus = "out_of_stock";
        } else if (newStock <= prod.minStock) {
          newStatus = "low_stock";
        }

        return {
          ...prod,
          currentStock: newStock,
          stockStatus: newStatus,
          inventoryCostValue: newCostValue,
          potentialSellingValue: newSellingValue,
          potentialGrossProfit: newProfit,
        };
      })
    );
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Demo Persistent Banner */}
      <DemoBanner onReset={handleReset} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b-[3px] border-ink pb-3 mb-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("kasir")}
          className={`press inline-flex items-center gap-2 border-[3px] border-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
            activeTab === "kasir"
              ? "bg-primary text-white shadow-hard-sm"
              : "bg-white text-ink hover:bg-neutral-50 shadow-sm"
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>1. Kasir Harian</span>
          {todaySales.count > 0 && (
            <span className="ml-1 bg-white text-primary px-1.5 py-0.2 text-[10px] font-black rounded-sm">
              {todaySales.count}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stok")}
          className={`press inline-flex items-center gap-2 border-[3px] border-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
            activeTab === "stok"
              ? "bg-primary text-white shadow-hard-sm"
              : "bg-white text-ink hover:bg-neutral-50 shadow-sm"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>2. Buku Stok Warung</span>
          {(summary.lowStockCount > 0 || summary.outOfStockCount > 0) && (
            <span className="ml-1 bg-[#ff1744] text-white px-1.5 py-0.2 text-[10px] font-black rounded-sm">
              {summary.lowStockCount + summary.outOfStockCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ringkasan")}
          className={`press inline-flex items-center gap-2 border-[3px] border-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
            activeTab === "ringkasan"
              ? "bg-primary text-white shadow-hard-sm"
              : "bg-white text-ink hover:bg-neutral-50 shadow-sm"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>3. Ringkasan Finansial</span>
        </button>
      </div>

      {/* Tab 1: Kasir Harian */}
      {activeTab === "kasir" && (
        <div>
          <KasirContainer products={products} onCloseRegister={handleCloseRegister} />
        </div>
      )}

      {/* Tab 2: Buku Stok */}
      {activeTab === "stok" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[2px] border-ink/20 pb-4">
            <div>
              <h2 className="font-heading font-black text-xl uppercase tracking-tight text-ink">
                Buku Kendali Stok Fisik
              </h2>
              <p className="font-sans text-xs text-ink/75 mt-0.5">
                Stok otomatis berkurang setelah rekonsiliasi kasir. Uji kulakan cepat dengan tombol restock.
              </p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Cari SKU atau nama barang..."
                className="w-full h-10 border-[2px] border-ink bg-white pl-9 pr-3 font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary shadow-hard-sm"
              />
            </div>
            <select
              value={selectedStockCategory}
              onChange={(e) => setSelectedStockCategory(e.target.value)}
              className="h-10 border-[2px] border-ink bg-white px-3 font-mono text-xs font-bold uppercase text-ink focus:outline-none shadow-hard-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "SEMUA KATEGORI" : c}
                </option>
              ))}
            </select>
          </div>

          {/* High Density Stock Table */}
          <div className="overflow-x-auto border-[3px] border-ink bg-white shadow-hard">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b-[3px] border-ink bg-neutral-100 font-mono text-[11px] font-bold uppercase text-ink">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Stok Fisik</th>
                  <th className="p-3 text-right">Harga Jual</th>
                  <th className="p-3 text-right">Nilai Modal (HPP)</th>
                  <th className="p-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-ink/10 font-sans">
                {filteredStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold text-ink">{p.sku}</td>
                    <td className="p-3 font-bold text-ink">
                      <div>{p.name}</div>
                      <div className="font-mono text-[10px] text-ink/60 font-normal">
                        Batas minimum: {p.minStock} {p.unit}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-ink/80">{p.category}</td>
                    <td className="p-3">
                      {p.stockStatus === "in_stock" && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-500">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Aman
                        </span>
                      )}
                      {p.stockStatus === "low_stock" && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-500">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Menipis
                        </span>
                      )}
                      {p.stockStatus === "out_of_stock" && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-900 border border-red-500">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          Habis
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-ink">
                      {formatNumber(Number(p.sellingPrice))}
                    </td>
                    <td className="p-3 text-right font-mono text-ink">
                      {formatCurrency(Number(p.inventoryCostValue))}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRestock(p.id, 10)}
                        title="Simulasi kulakan +10 unit"
                        className="press inline-flex items-center gap-1 border-[2px] border-ink bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-hard-sm hover:bg-neutral-50"
                      >
                        <Plus className="h-3 w-3 text-emerald-600" />
                        <span>+10 Kulakan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Ringkasan Finansial */}
      {activeTab === "ringkasan" && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-heading font-black text-xl uppercase tracking-tight text-ink">
              Ikhtisar Modal & Potensi Margin Warung
            </h2>
            <p className="font-sans text-xs text-ink/75 mt-0.5">
              Nilai modal aktual dan estimasi keuntungan bersih dihitung otomatis berdasarkan stok di rak.
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border-[3px] border-ink bg-white p-4 shadow-hard">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/70 block">
                Total Modal Tertahan (HPP)
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-ink mt-1">
                {formatCurrency(summary.totalCost)}
              </div>
              <span className="font-sans text-[11px] text-ink/60 mt-1 block">
                Modal pembelian dari {summary.totalSkus} item di rak.
              </span>
            </div>

            <div className="border-[3px] border-ink bg-white p-4 shadow-hard">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/70 block">
                Potensi Nilai Jual
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-ink mt-1">
                {formatCurrency(summary.totalSelling)}
              </div>
              <span className="font-sans text-[11px] text-ink/60 mt-1 block">
                Total omzet jika seluruh stok terjual habis.
              </span>
            </div>

            <div className="border-[3px] border-ink bg-[#00e676]/20 p-4 shadow-hard">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                Potensi Laba Kotor
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                {formatCurrency(summary.potentialProfit)}
              </div>
              <span className="font-sans text-[11px] text-emerald-900/80 mt-1 block">
                Selisih harga jual dan harga modal kulakan.
              </span>
            </div>

            <div className="border-[3px] border-ink bg-white p-4 shadow-hard">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/70 block">
                Perlu Perhatian Kulakan
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-ink mt-1">
                {summary.lowStockCount + summary.outOfStockCount}{" "}
                <span className="text-sm font-bold text-ink/60">Produk</span>
              </div>
              <span className="font-sans text-[11px] text-[#ff1744] font-bold mt-1 block">
                {summary.outOfStockCount} habis • {summary.lowStockCount} menipis
              </span>
            </div>
          </div>

          {/* Sales History Log (Struk-struk kasir demo) */}
          <div className="border-[3px] border-ink bg-white p-5 shadow-hard">
            <div className="flex items-center justify-between border-b-[2px] border-ink/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-ink" />
                <h3 className="font-heading font-black text-base uppercase text-ink">
                  Riwayat Sesi Kasir Demo Hari Ini
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-ink bg-neutral-100 px-2 py-1 border border-ink">
                Total Omzet Demo: {formatCurrency(todaySales.totalRevenue)}
              </span>
            </div>

            {closingHistory.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-ink/60">
                Belum ada sesi kasir yang ditutup. Buka tab <strong>Kasir Harian</strong>, tambahkan barang ke
                struk, lalu klik <strong>Tutup Kasir & Rekonsiliasi</strong> untuk melihat rekapan di sini.
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-mono text-xs">
                {closingHistory.map((hist) => (
                  <div
                    key={hist.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-[2px] border-ink bg-neutral-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{hist.reference}</span>
                        <span className="text-[10px] text-ink/60">• {hist.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-ink/80 mt-1 font-sans">
                        Terjual: {hist.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-ink">{formatCurrency(hist.expectedRevenue)}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        {hist.totalUnits} unit dipotong dari stok
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
