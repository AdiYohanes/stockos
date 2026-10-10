import type {
  OverviewMetric,
  StockMovementData,
  InventoryHealthData,
  AttentionItem,
  QuickActionItem,
} from "./types";

import { formatCurrency } from "../../lib/format";

// ponytail: demo monthly totals only; replace with sales and expense aggregates when available.
export const MOCK_FINANCIAL_SUMMARY = {
  revenue: 8450000,
  costOfGoodsSold: 6000000,
  operatingExpenses: 625000,
};
const estimatedNetProfit = MOCK_FINANCIAL_SUMMARY.revenue
  - MOCK_FINANCIAL_SUMMARY.costOfGoodsSold
  - MOCK_FINANCIAL_SUMMARY.operatingExpenses;

export const MOCK_OVERVIEW_METRICS: OverviewMetric[] = [
  {
    id: "products",
    label: "Total Produk",
    value: "1.428",
    rawValue: 1428,
    change: "+24 bulan ini",
    trend: "up",
    supportingText: "Di 8 kategori",
    iconName: "products",
    variant: "default",
  },
  {
    id: "revenue",
    label: "Revenue",
    value: formatCurrency(MOCK_FINANCIAL_SUMMARY.revenue),
    rawValue: MOCK_FINANCIAL_SUMMARY.revenue,
    iconName: "revenue",
    variant: "default",
  },
  {
    id: "net_profit",
    label: "Estimasi Untung Bersih",
    value: formatCurrency(estimatedNetProfit),
    rawValue: estimatedNetProfit,
    iconName: "net_profit",
    variant: "default",
  },
  {
    id: "out_of_stock",
    label: "Stok Habis",
    value: "3",
    rawValue: 3,
    change: "Perlu restok segera",
    trend: "down",
    supportingText: "Nol unit tersedia",
    iconName: "out_of_stock",
    variant: "destructive",
  },
];

export const MOCK_STOCK_MOVEMENT_7D: StockMovementData = {
  timeframe: "7d",
  totalIn: 1240,
  totalOut: 985,
  netChange: 255,
  data: [
    { period: "Sen", stockIn: 180, stockOut: 120 },
    { period: "Sel", stockIn: 95, stockOut: 140 },
    { period: "Rab", stockIn: 240, stockOut: 190 },
    { period: "Kam", stockIn: 130, stockOut: 110 },
    { period: "Jum", stockIn: 320, stockOut: 215 },
    { period: "Sab", stockIn: 165, stockOut: 130 },
    { period: "Min", stockIn: 110, stockOut: 80 },
  ],
};

export const MOCK_STOCK_MOVEMENT_30D: StockMovementData = {
  timeframe: "30d",
  totalIn: 5420,
  totalOut: 4680,
  netChange: 740,
  data: [
    { period: "Minggu 1", stockIn: 1180, stockOut: 980 },
    { period: "Minggu 2", stockIn: 1450, stockOut: 1240 },
    { period: "Minggu 3", stockIn: 1390, stockOut: 1180 },
    { period: "Minggu 4", stockIn: 1400, stockOut: 1280 },
  ],
};

export const MOCK_INVENTORY_HEALTH: InventoryHealthData = {
  totalProducts: 1428,
  healthScore: 88,
  healthy: {
    count: 1248,
    percentage: 87.4,
    value: 221800,
  },
  lowStock: {
    count: 154,
    percentage: 10.8,
    value: 24350,
  },
  outOfStock: {
    count: 26,
    percentage: 1.8,
    value: 2500,
  },
};

export const MOCK_ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-1",
    sku: "ELEC-ESP-32",
    name: "ESP32-WROOM-32D Microcontroller Module",
    category: "Elektronik",
    currentStock: 0,
    minStock: 50,
    unit: "pcs",
    status: "out_of_stock",
    lastRestocked: "14 hari lalu",
  },
  {
    id: "att-2",
    sku: "MECH-BRG-608",
    name: "Industrial Ball Bearing 608RS (8x22x7mm)",
    category: "Mekanikal",
    currentStock: 0,
    minStock: 100,
    unit: "pcs",
    status: "out_of_stock",
    lastRestocked: "21 hari lalu",
  },
  {
    id: "att-3",
    sku: "ALUM-EXT-2020",
    name: "T-Slot Aluminum Extrusion 2020 (1000mm)",
    category: "Struktural",
    currentStock: 0,
    minStock: 30,
    unit: "batang",
    status: "out_of_stock",
    lastRestocked: "18 hari lalu",
  },
  {
    id: "att-4",
    sku: "MOTR-STP-17",
    name: "NEMA 17 Stepper Motor 42BYGH",
    category: "Motor",
    currentStock: 4,
    minStock: 25,
    unit: "unit",
    status: "low_stock",
    lastRestocked: "8 hari lalu",
  },
  {
    id: "att-5",
    sku: "BATT-LION-1865",
    name: "Rechargeable Li-ion Cell 18650 3.7V 3000mAh",
    category: "Daya",
    currentStock: 12,
    minStock: 80,
    unit: "sel",
    status: "low_stock",
    lastRestocked: "5 hari lalu",
  },
  {
    id: "att-6",
    sku: "THRM-PST-5G",
    name: "High-Performance Thermal Paste 5g Syringe",
    category: "Kebutuhan",
    currentStock: 8,
    minStock: 40,
    unit: "tabung",
    status: "low_stock",
    lastRestocked: "3 hari lalu",
  },
];


export const MOCK_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "add-product",
    title: "Tambah Produk",
    description: "Daftar produk baru SKU & barcode",
    icon: "plus",
    badge: "Cepat",
  },
  {
    id: "stock-in",
    title: "Stok Masuk",
    description: "Catat barang masuk ke warung",
    icon: "arrow-down",
    badge: "Masuk",
  },
  {
    id: "stock-out",
    title: "Stok Keluar",
    description: "Catat pengeluaran / penjualan",
    icon: "arrow-up",
    badge: "Keluar",
  },
];
