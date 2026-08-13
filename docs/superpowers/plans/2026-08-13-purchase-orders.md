# Purchase Orders & Stock Receiving Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Purchase Orders (`/purchase-orders`) feature and Stock Receiving Flow for StockOS, enabling users to create purchase orders, track incoming shipments, process physical stock receipts, and automatically synchronize stock intake into destination warehouses.

**Architecture:** A feature-driven module in `src/features/purchase-orders/` with isolated state management (`usePurchaseOrders`), high-density data tables, Neobrutal-styled status indicators, interactive modals (`CreatePOModal`, `ReceiveGoodsModal`), and a slide-over inspection sheet (`PODetailSheet`), integrated into the dashboard layout via `src/app/(dashboard)/purchase-orders/page.tsx`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui primitives, Lucide Icons, StockOS Design System (70% Clean SaaS + 30% Neobrutalism).

## Global Constraints

- Use Neobrutal micro-shadows (`shadow-neo`, `shadow-neo-sm`) and monospace tags (`font-mono text-[13px] uppercase tracking-wider`) for status badges and PO codes.
- All page headers must follow the standard top header layout pattern in `design.md` section 7.
- Keyed Form Pattern for Modals: Isolate forms in sub-components keyed by entity ID or state key to initialize state directly on mount without `useEffect` prop-copying.
- React 19 safe mount & deterministic render handlers.

---

### Task 1: Type Definitions, Mock Data, i18n & Navigation Integration

**Files:**
- Create: `src/features/purchase-orders/types.ts`
- Create: `src/features/purchase-orders/mock-data.ts`
- Modify: `src/lib/i18n/types.ts:37-48`
- Modify: `src/lib/i18n/translations/id.ts`
- Modify: `src/lib/i18n/translations/en.ts`
- Modify: `src/components/layout/sidebar.tsx:6-36`

**Interfaces:**
- Consumes: None (Foundation layer)
- Produces: `PurchaseOrder`, `POLineItem`, `POReceiptLog`, `POStatus`, `MOCK_PURCHASE_ORDERS`, updated i18n `nav.purchaseOrders`, updated `NAV_ITEMS` in `sidebar.tsx`.

- [ ] **Step 1: Write type definitions for Purchase Orders**

Create `src/features/purchase-orders/types.ts`:
```ts
export type POStatus = "DRAFT" | "ISSUED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export interface POLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
}

export interface POReceiptLog {
  id: string;
  poId: string;
  receivedAt: string;
  warehouseId: string;
  warehouseName: string;
  items: {
    sku: string;
    productName: string;
    quantityReceived: number;
  }[];
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierTier: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: POStatus;
  orderDate: string;
  expectedDeliveryDate: string;
  totalCost: number;
  lineItems: POLineItem[];
  receipts: POReceiptLog[];
  notes?: string;
}

export interface POSummaryMetrics {
  totalOrders: number;
  totalSpend: number;
  pendingCount: number;
  partialCount: number;
  receivedCount: number;
}
```

- [ ] **Step 2: Create mock data for Purchase Orders**

Create `src/features/purchase-orders/mock-data.ts`:
```ts
import type { PurchaseOrder } from "./types";

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-101",
    poNumber: "PO-2026-001",
    supplierId: "sup-1",
    supplierName: "Nvidia Global Logistics",
    supplierTier: "Tier 1 Preferred",
    destinationWarehouseId: "wh-1",
    destinationWarehouseName: "Gudang Utama Jakarta",
    status: "PARTIALLY_RECEIVED",
    orderDate: "2026-08-01",
    expectedDeliveryDate: "2026-08-15",
    totalCost: 18500,
    lineItems: [
      {
        id: "li-1",
        productId: "prod-1",
        productName: "NVIDIA RTX 4090 GPU",
        sku: "GPU-NV-4090",
        orderedQuantity: 10,
        receivedQuantity: 6,
        unitCost: 1600,
      },
      {
        id: "li-2",
        productId: "prod-2",
        productName: "Intel i9 14900K Processor",
        sku: "CPU-INT-14900K",
        orderedQuantity: 5,
        receivedQuantity: 5,
        unitCost: 500,
      },
    ],
    receipts: [
      {
        id: "rc-1",
        poId: "po-101",
        receivedAt: "2026-08-08 10:30",
        warehouseId: "wh-1",
        warehouseName: "Gudang Utama Jakarta",
        items: [
          { sku: "GPU-NV-4090", productName: "NVIDIA RTX 4090 GPU", quantityReceived: 6 },
          { sku: "CPU-INT-14900K", productName: "Intel i9 14900K Processor", quantityReceived: 5 },
        ],
        notes: "Batch 1 arrived in good condition. Remaining 4 GPUs pending vendor backorder.",
      },
    ],
    notes: "Expedited shipping requested for GPU units.",
  },
  {
    id: "po-102",
    poNumber: "PO-2026-002",
    supplierId: "sup-2",
    supplierName: "Logitech Official Direct",
    supplierTier: "Tier 1 Preferred",
    destinationWarehouseId: "wh-2",
    destinationWarehouseName: "Hub Surabaya",
    status: "ISSUED",
    orderDate: "2026-08-05",
    expectedDeliveryDate: "2026-08-18",
    totalCost: 4200,
    lineItems: [
      {
        id: "li-3",
        productId: "prod-3",
        productName: "Logitech MX Master 3S",
        sku: "MOU-LOG-MX3S",
        orderedQuantity: 30,
        receivedQuantity: 0,
        unitCost: 90,
      },
      {
        id: "li-4",
        productId: "prod-4",
        productName: "Keychron K2 Mechanical Keyboard",
        sku: "KEY-KCH-K2",
        orderedQuantity: 15,
        receivedQuantity: 0,
        unitCost: 100,
      },
    ],
    receipts: [],
    notes: "Standard monthly restock for Surabaya hub.",
  },
  {
    id: "po-103",
    poNumber: "PO-2026-003",
    supplierId: "sup-3",
    supplierName: "Samsung Semiconductor Asia",
    supplierTier: "Tier 2 Standard",
    destinationWarehouseId: "wh-1",
    destinationWarehouseName: "Gudang Utama Jakarta",
    status: "RECEIVED",
    orderDate: "2026-07-20",
    expectedDeliveryDate: "2026-08-02",
    totalCost: 12000,
    lineItems: [
      {
        id: "li-5",
        productId: "prod-5",
        productName: "Samsung 990 Pro 2TB NVMe SSD",
        sku: "SSD-SAM-990P-2T",
        orderedQuantity: 60,
        receivedQuantity: 60,
        unitCost: 200,
      },
    ],
    receipts: [
      {
        id: "rc-2",
        poId: "po-103",
        receivedAt: "2026-08-01 14:15",
        warehouseId: "wh-1",
        warehouseName: "Gudang Utama Jakarta",
        items: [
          { sku: "SSD-SAM-990P-2T", productName: "Samsung 990 Pro 2TB NVMe SSD", quantityReceived: 60 },
        ],
        notes: "Full delivery inspected and stored in Zone A3.",
      },
    ],
    notes: "Quarterly flash storage batch.",
  },
  {
    id: "po-104",
    poNumber: "PO-2026-004",
    supplierId: "sup-4",
    supplierName: "ASUS Tek Procurement",
    supplierTier: "Tier 2 Standard",
    destinationWarehouseId: "wh-3",
    destinationWarehouseName: "Depot Medan",
    status: "DRAFT",
    orderDate: "2026-08-12",
    expectedDeliveryDate: "2026-08-25",
    totalCost: 6500,
    lineItems: [
      {
        id: "li-6",
        productId: "prod-6",
        productName: "ASUS ROG Swift 27-inch Monitor",
        sku: "MON-ASU-ROG27",
        orderedQuantity: 10,
        receivedQuantity: 0,
        unitCost: 650,
      },
    ],
    receipts: [],
    notes: "Draft order for Q3 gaming monitor restock.",
  },
];
```

- [ ] **Step 3: Update i18n translations & Sidebar Navigation**

Modify `src/lib/i18n/types.ts` to add `purchaseOrders: string;` in `Translations["nav"]`.
Modify `src/lib/i18n/translations/id.ts` and `src/lib/i18n/translations/en.ts` adding `"Purchase Orders"` / `"Order Pembelian"`.
Modify `src/components/layout/sidebar.tsx` importing `ShoppingBag` from `lucide-react` and adding `{ titleKey: "purchaseOrders", href: "/purchase-orders", icon: ShoppingBag }` to `NAV_ITEMS`.

- [ ] **Step 4: Verify build with TypeScript compiler**

Run: `npx tsc --noEmit`
Expected: PASS with 0 type errors.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/features/purchase-orders/types.ts src/features/purchase-orders/mock-data.ts src/lib/i18n/types.ts src/lib/i18n/translations/ src/components/layout/sidebar.tsx
git commit -m "feat(purchase-orders): add type definitions, mock data, and sidebar navigation link"
```

---

### Task 2: State Management Hook & Header & Metric Cards

**Files:**
- Create: `src/features/purchase-orders/hooks/use-purchase-orders.ts`
- Create: `src/features/purchase-orders/components/purchase-orders-header.tsx`
- Create: `src/features/purchase-orders/components/purchase-orders-metric-cards.tsx`

**Interfaces:**
- Consumes: `PurchaseOrder`, `POStatus`, `MOCK_PURCHASE_ORDERS` from Task 1.
- Produces: `usePurchaseOrders` hook, `PurchaseOrdersHeader` component, `PurchaseOrdersMetricCards` component.

- [ ] **Step 1: Implement `usePurchaseOrders` hook**

Create `src/features/purchase-orders/hooks/use-purchase-orders.ts`:
```ts
"use client";

import * as React from "react";
import { MOCK_PURCHASE_ORDERS } from "../mock-data";
import type { PurchaseOrder, POStatus, POSummaryMetrics } from "../types";

export function usePurchaseOrders() {
  const [orders, setOrders] = React.useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = React.useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<string>("all");
  const [selectedPoId, setSelectedPoId] = React.useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);
  const [receivingPoId, setReceivingPoId] = React.useState<string | null>(null);

  // Filter logic
  const filteredOrders = React.useMemo(() => {
    return orders.filter((po) => {
      // Tab filter
      if (activeTab !== "all") {
        if (activeTab === "pending" && po.status !== "ISSUED") return false;
        if (activeTab === "partial" && po.status !== "PARTIALLY_RECEIVED") return false;
        if (activeTab === "received" && po.status !== "RECEIVED") return false;
        if (activeTab === "draft" && po.status !== "DRAFT") return false;
        if (activeTab === "cancelled" && po.status !== "CANCELLED") return false;
      }

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesCode = po.poNumber.toLowerCase().includes(q);
        const matchesSupplier = po.supplierName.toLowerCase().includes(q);
        const matchesSku = po.lineItems.some((item) =>
          item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q)
        );
        if (!matchesCode && !matchesSupplier && !matchesSku) return false;
      }

      // Supplier filter
      if (selectedSupplier !== "all" && po.supplierId !== selectedSupplier) return false;

      // Warehouse filter
      if (selectedWarehouse !== "all" && po.destinationWarehouseId !== selectedWarehouse) return false;

      return true;
    });
  }, [orders, activeTab, searchQuery, selectedSupplier, selectedWarehouse]);

  // Derived Summary Metrics
  const metrics: POSummaryMetrics = React.useMemo(() => {
    const totalOrders = orders.length;
    const totalSpend = orders.reduce((sum, po) => sum + po.totalCost, 0);
    const pendingCount = orders.filter((po) => po.status === "ISSUED").length;
    const partialCount = orders.filter((po) => po.status === "PARTIALLY_RECEIVED").length;
    const receivedCount = orders.filter((po) => po.status === "RECEIVED").length;

    return { totalOrders, totalSpend, pendingCount, partialCount, receivedCount };
  }, [orders]);

  // Handlers
  const handleResetFilters = React.useCallback(() => {
    setActiveTab("all");
    setSearchQuery("");
    setSelectedSupplier("all");
    setSelectedWarehouse("all");
  }, []);

  const handleCreatePo = React.useCallback((newPo: PurchaseOrder) => {
    setOrders((prev) => [newPo, ...prev]);
    setIsCreateModalOpen(false);
  }, []);

  const handleReceiveGoods = React.useCallback(
    (poId: string, receivedItems: { lineItemId: string; quantityReceived: number }[], warehouseId: string, notes?: string) => {
      setOrders((prev) =>
        prev.map((po) => {
          if (po.id !== poId) return po;

          // Update line items received qty
          let totalOrdered = 0;
          let totalReceivedAfter = 0;

          const updatedLineItems = po.lineItems.map((item) => {
            const match = receivedItems.find((r) => r.lineItemId === item.id);
            const addedQty = match ? match.quantityReceived : 0;
            const newReceivedQty = item.receivedQuantity + addedQty;

            totalOrdered += item.orderedQuantity;
            totalReceivedAfter += newReceivedQty;

            return {
              ...item,
              receivedQuantity: newReceivedQty,
            };
          });

          // Determine new status
          let newStatus: POStatus = po.status;
          if (totalReceivedAfter >= totalOrdered) {
            newStatus = "RECEIVED";
          } else if (totalReceivedAfter > 0) {
            newStatus = "PARTIALLY_RECEIVED";
          }

          // Create new receipt log entry
          const newReceipt = {
            id: `rc-${Date.now()}`,
            poId,
            receivedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            warehouseId,
            warehouseName: po.destinationWarehouseName,
            items: updatedLineItems
              .filter((item) => {
                const match = receivedItems.find((r) => r.lineItemId === item.id);
                return match && match.quantityReceived > 0;
              })
              .map((item) => {
                const match = receivedItems.find((r) => r.lineItemId === item.id)!;
                return {
                  sku: item.sku,
                  productName: item.productName,
                  quantityReceived: match.quantityReceived,
                };
              }),
            notes,
          };

          return {
            ...po,
            status: newStatus,
            lineItems: updatedLineItems,
            receipts: [newReceipt, ...po.receipts],
          };
        })
      );
      setReceivingPoId(null);
    },
    []
  );

  return {
    orders: filteredOrders,
    rawOrders: orders,
    metrics,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedSupplier,
    setSelectedSupplier,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedPoId,
    setSelectedPoId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    receivingPoId,
    setReceivingPoId,
    handleResetFilters,
    handleCreatePo,
    handleReceiveGoods,
  };
}
```

- [ ] **Step 2: Implement `PurchaseOrdersHeader` component**

Create `src/features/purchase-orders/components/purchase-orders-header.tsx`:
```tsx
"use client";

import * as React from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PurchaseOrdersHeaderProps {
  onOpenCreateModal: () => void;
}

export function PurchaseOrdersHeader({ onOpenCreateModal }: PurchaseOrdersHeaderProps) {
  return (
    <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Purchase Orders
          </h1>
          <Badge className="border-black bg-purple-100 font-mono text-[13px] uppercase tracking-wider text-purple-900 shadow-neo-sm">
            PO-HUB
          </Badge>
        </div>
        <span className="hidden text-base text-muted-foreground/30 sm:inline">•</span>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage vendor procurements, track incoming shipments, and process stock receipts.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start max-w-full overflow-x-auto pb-0.5 sm:self-auto sm:pb-0">
        <Button
          onClick={onOpenCreateModal}
          className="border border-black bg-[#543afd] font-medium text-white shadow-neo hover:bg-[#462ee0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Purchase Order
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Implement `PurchaseOrdersMetricCards` component**

Create `src/features/purchase-orders/components/purchase-orders-metric-cards.tsx`:
```tsx
"use client";

import * as React from "react";
import { ShoppingBag, Clock, PackageCheck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { POSummaryMetrics } from "../types";

interface PurchaseOrdersMetricCardsProps {
  metrics: POSummaryMetrics;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PurchaseOrdersMetricCards({
  metrics,
  activeTab,
  onTabChange,
}: PurchaseOrdersMetricCardsProps) {
  const cards = [
    {
      id: "all",
      label: "Total Procurement",
      value: metrics.totalOrders,
      subValue: `$${metrics.totalSpend.toLocaleString()}`,
      icon: ShoppingBag,
      color: "border-slate-300 bg-white text-slate-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-[#543afd]/30",
    },
    {
      id: "pending",
      label: "Pending / Issued",
      value: metrics.pendingCount,
      subValue: "Awaiting shipment",
      icon: Clock,
      color: "border-blue-200 bg-blue-50/50 text-blue-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-blue-500/30",
    },
    {
      id: "partial",
      label: "Partially Received",
      value: metrics.partialCount,
      subValue: "In-progress intake",
      icon: PackageCheck,
      color: "border-amber-200 bg-amber-50/50 text-amber-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-amber-500/30",
    },
    {
      id: "received",
      label: "Fully Received",
      value: metrics.receivedCount,
      subValue: "100% completed",
      icon: CheckCircle2,
      color: "border-emerald-200 bg-emerald-50/50 text-emerald-900",
      activeBorder: "border-black shadow-neo-sm ring-2 ring-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTab === card.id;

        return (
          <Card
            key={card.id}
            onClick={() => onTabChange(card.id)}
            className={cn(
              "cursor-pointer border p-5 transition-all hover:-translate-y-0.5",
              card.color,
              isActive ? card.activeBorder : "hover:border-slate-400"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              <Icon className="h-5 w-5 opacity-70" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight">{card.value}</span>
              <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">
                {card.subValue}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Verify build with TypeScript compiler**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/features/purchase-orders/hooks/ src/features/purchase-orders/components/
git commit -m "feat(purchase-orders): add usePurchaseOrders hook, header, and metric cards"
```

---

### Task 3: Toolbar & High-Density Table

**Files:**
- Create: `src/features/purchase-orders/components/purchase-orders-toolbar.tsx`
- Create: `src/features/purchase-orders/components/purchase-orders-table.tsx`

**Interfaces:**
- Consumes: `PurchaseOrder`, `usePurchaseOrders` return props from Task 2.
- Produces: `PurchaseOrdersToolbar` component, `PurchaseOrdersTable` component.

- [ ] **Step 1: Implement `PurchaseOrdersToolbar` component**

Create `src/features/purchase-orders/components/purchase-orders-toolbar.tsx`:
```tsx
"use client";

import * as React from "react";
import { Search, RotateCcw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PurchaseOrder } from "../types";

interface PurchaseOrdersToolbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSupplier: string;
  onSupplierChange: (supplier: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (warehouse: string) => void;
  onResetFilters: () => void;
  orders: PurchaseOrder[];
}

export function PurchaseOrdersToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedSupplier,
  onSupplierChange,
  selectedWarehouse,
  onWarehouseChange,
  onResetFilters,
  orders,
}: PurchaseOrdersToolbarProps) {
  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "pending", label: "Issued", count: orders.filter((o) => o.status === "ISSUED").length },
    { id: "partial", label: "Partial", count: orders.filter((o) => o.status === "PARTIALLY_RECEIVED").length },
    { id: "received", label: "Received", count: orders.filter((o) => o.status === "RECEIVED").length },
    { id: "draft", label: "Draft", count: orders.filter((o) => o.status === "DRAFT").length },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {/* Search & Select Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search PO Code, Supplier, or SKU..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-base focus:border-black focus:ring-2 focus:ring-[#543afd]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Supplier Selector */}
          <select
            value={selectedSupplier}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-[#543afd]"
          >
            <option value="all">All Suppliers</option>
            <option value="sup-1">Nvidia Global Logistics</option>
            <option value="sup-2">Logitech Official Direct</option>
            <option value="sup-3">Samsung Semiconductor Asia</option>
            <option value="sup-4">ASUS Tek Procurement</option>
          </select>

          {/* Warehouse Selector */}
          <select
            value={selectedWarehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-[#543afd]"
          >
            <option value="all">All Warehouses</option>
            <option value="wh-1">Gudang Utama Jakarta</option>
            <option value="wh-2">Hub Surabaya</option>
            <option value="wh-3">Depot Medan</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-10 border-border px-3 hover:bg-slate-100"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Status Pills Row */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-semibold transition-all",
                isActive
                  ? "border border-black bg-black text-white shadow-neo-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <span>{tab.label}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "px-1 py-0 text-[10px]",
                  isActive ? "bg-white text-black" : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `PurchaseOrdersTable` component**

Create `src/features/purchase-orders/components/purchase-orders-table.tsx`:
```tsx
"use client";

import * as React from "react";
import { Eye, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PurchaseOrder, POStatus } from "../types";

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  onInspect: (poId: string) => void;
  onReceiveGoods: (poId: string) => void;
}

export function PurchaseOrdersTable({
  orders,
  onInspect,
  onReceiveGoods,
}: PurchaseOrdersTableProps) {
  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="border-slate-400 bg-slate-100 font-mono text-[11px] text-slate-800 shadow-neo-sm">DRAFT</Badge>;
      case "ISSUED":
        return <Badge className="border-blue-400 bg-blue-100 font-mono text-[11px] text-blue-900 shadow-neo-sm">ISSUED</Badge>;
      case "PARTIALLY_RECEIVED":
        return <Badge className="border-amber-400 bg-amber-100 font-mono text-[11px] text-amber-900 shadow-neo-sm">PARTIAL</Badge>;
      case "RECEIVED":
        return <Badge className="border-emerald-400 bg-emerald-100 font-mono text-[11px] text-emerald-900 shadow-neo-sm">RECEIVED</Badge>;
      case "CANCELLED":
        return <Badge className="border-rose-400 bg-rose-100 font-mono text-[11px] text-rose-900 shadow-neo-sm">CANCELLED</Badge>;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
        <Truck className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No Purchase Orders Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          No orders match your current filter criteria. Try resetting filters or create a new Purchase Order.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-[15px]">
        <thead className="border-b border-border bg-slate-50 font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">PO Code</th>
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3">Destination</th>
            <th className="px-4 py-3">Fulfillment</th>
            <th className="px-4 py-3">Expected Date</th>
            <th className="px-4 py-3 text-right">Total Cost</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((po) => {
            const totalOrdered = po.lineItems.reduce((sum, item) => sum + item.orderedQuantity, 0);
            const totalReceived = po.lineItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
            const percent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

            const canReceive = po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED";

            return (
              <tr key={po.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3.5 font-mono font-bold text-foreground">{po.poNumber}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{po.supplierName}</span>
                    <span className="text-xs text-muted-foreground">{po.supplierTier}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-700">{po.destinationWarehouseName}</td>
                <td className="px-4 py-3.5">
                  <div className="flex w-36 flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span>{totalReceived}/{totalOrdered}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={cn(
                          "h-full transition-all",
                          percent === 100 ? "bg-emerald-500" : percent > 0 ? "bg-amber-500" : "bg-slate-300"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-slate-700">{po.expectedDeliveryDate}</td>
                <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                  ${po.totalCost.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-center">{getStatusBadge(po.status)}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canReceive && (
                      <Button
                        size="sm"
                        onClick={() => onReceiveGoods(po.id)}
                        className="h-8 border border-black bg-emerald-600 font-medium text-white shadow-neo-sm hover:bg-emerald-700"
                      >
                        <PackageCheck className="mr-1 h-3.5 w-3.5" />
                        Receive
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInspect(po.id)}
                      className="h-8 border-border px-2.5 hover:bg-slate-100"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Inspect
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/features/purchase-orders/components/
git commit -m "feat(purchase-orders): add toolbar and high-density data table components"
```

---

### Task 4: Interactive Modals (`CreatePOModal` & `ReceiveGoodsModal`)

**Files:**
- Create: `src/features/purchase-orders/components/create-po-modal.tsx`
- Create: `src/features/purchase-orders/components/receive-goods-modal.tsx`

**Interfaces:**
- Consumes: `PurchaseOrder`, `POLineItem`, `handleCreatePo`, `handleReceiveGoods` from Task 2.
- Produces: `CreatePOModal` component, `ReceiveGoodsModal` component.

- [ ] **Step 1: Implement `CreatePOModal` component**

Create `src/features/purchase-orders/components/create-po-modal.tsx`:
```tsx
"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaseOrder, POLineItem } from "../types";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (po: PurchaseOrder) => void;
}

export function CreatePOModal({ isOpen, onClose, onCreate }: CreatePOModalProps) {
  const [supplierId, setSupplierId] = React.useState("sup-1");
  const [warehouseId, setWarehouseId] = React.useState("wh-1");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState("2026-08-25");
  const [notes, setNotes] = React.useState("");

  const [lineItems, setLineItems] = React.useState<POLineItem[]>([
    {
      id: `li-${Date.now()}-1`,
      productId: "prod-1",
      productName: "NVIDIA RTX 4090 GPU",
      sku: "GPU-NV-4090",
      orderedQuantity: 5,
      receivedQuantity: 0,
      unitCost: 1600,
    },
  ]);

  const totalCost = React.useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.orderedQuantity * item.unitCost, 0);
  }, [lineItems]);

  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}-${prev.length + 1}`,
        productId: "prod-2",
        productName: "Intel i9 14900K Processor",
        sku: "CPU-INT-14900K",
        orderedQuantity: 5,
        receivedQuantity: 0,
        unitCost: 500,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: "orderedQuantity" | "unitCost", value: number) => {
    setLineItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const suppliersMap: Record<string, { name: string; tier: string }> = {
      "sup-1": { name: "Nvidia Global Logistics", tier: "Tier 1 Preferred" },
      "sup-2": { name: "Logitech Official Direct", tier: "Tier 1 Preferred" },
      "sup-3": { name: "Samsung Semiconductor Asia", tier: "Tier 2 Standard" },
      "sup-4": { name: "ASUS Tek Procurement", tier: "Tier 2 Standard" },
    };

    const warehouseMap: Record<string, string> = {
      "wh-1": "Gudang Utama Jakarta",
      "wh-2": "Hub Surabaya",
      "wh-3": "Depot Medan",
    };

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-0${Math.floor(Math.random() * 90) + 10}`,
      supplierId,
      supplierName: suppliersMap[supplierId]?.name || "Vendor",
      supplierTier: suppliersMap[supplierId]?.tier || "Tier 1",
      destinationWarehouseId: warehouseId,
      destinationWarehouseName: warehouseMap[warehouseId] || "Main Warehouse",
      status: "ISSUED",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate,
      totalCost,
      lineItems,
      receipts: [],
      notes,
    };

    onCreate(newPo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-2 border-black p-6 shadow-neo">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
          <DialogTitle className="font-heading text-xl font-bold tracking-tight">
            Create Purchase Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-sm">Supplier Vendor</Label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm font-medium focus:border-black focus:ring-2 focus:ring-[#543afd]"
              >
                <option value="sup-1">Nvidia Global Logistics</option>
                <option value="sup-2">Logitech Official Direct</option>
                <option value="sup-3">Samsung Semiconductor Asia</option>
                <option value="sup-4">ASUS Tek Procurement</option>
              </select>
            </div>

            <div>
              <Label className="font-semibold text-sm">Destination Warehouse</Label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm font-medium focus:border-black focus:ring-2 focus:ring-[#543afd]"
              >
                <option value="wh-1">Gudang Utama Jakarta</option>
                <option value="wh-2">Hub Surabaya</option>
                <option value="wh-3">Depot Medan</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="font-semibold text-sm">Expected Delivery Date</Label>
            <Input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          {/* Line Items Section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm">Order Items List</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {lineItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border border-border p-2 bg-slate-50">
                  <div className="flex-1">
                    <span className="font-semibold text-xs text-foreground">{item.productName}</span>
                    <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">{item.sku}</span>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      value={item.orderedQuantity}
                      onChange={(e) => handleUpdateItem(item.id, "orderedQuantity", parseInt(e.target.value) || 1)}
                      className="h-8 text-xs text-center font-mono"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={0}
                      value={item.unitCost}
                      onChange={(e) => handleUpdateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs text-right font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Total Cost Display */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-semibold text-sm text-muted-foreground">Total Estimated Cost:</span>
            <span className="font-mono text-xl font-bold text-foreground">${totalCost.toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="border border-black bg-[#543afd] font-medium text-white shadow-neo hover:bg-[#462ee0]"
            >
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Implement `ReceiveGoodsModal` component**

Create `src/features/purchase-orders/components/receive-goods-modal.tsx`:
```tsx
"use client";

import * as React from "react";
import { PackageCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaseOrder } from "../types";

interface ReceiveGoodsModalProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReceive: (
    poId: string,
    receivedItems: { lineItemId: string; quantityReceived: number }[],
    warehouseId: string,
    notes?: string
  ) => void;
}

export function ReceiveGoodsModal({
  po,
  isOpen,
  onClose,
  onConfirmReceive,
}: ReceiveGoodsModalProps) {
  const [receivedQtyMap, setReceivedQtyMap] = React.useState<Record<string, number>>({});
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (po) {
      const initialMap: Record<string, number> = {};
      po.lineItems.forEach((item) => {
        const remaining = Math.max(0, item.orderedQuantity - item.receivedQuantity);
        initialMap[item.id] = remaining;
      });
      setReceivedQtyMap(initialMap);
    }
  }, [po]);

  if (!po) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const receivedItems = po.lineItems.map((item) => ({
      lineItemId: item.id,
      quantityReceived: receivedQtyMap[item.id] || 0,
    }));

    onConfirmReceive(po.id, receivedItems, po.destinationWarehouseId, notes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl border-2 border-black p-6 shadow-neo">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
            <PackageCheck className="h-5 w-5 text-emerald-600" />
            Receive Stock Items — <span className="font-mono text-base">{po.poNumber}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <span className="font-semibold">Target Warehouse:</span> {po.destinationWarehouseName}
            <br />
            Submitting this form will automatically inject <strong>Stock In</strong> records into your warehouse inventory.
          </div>

          {/* Line Items Receive Inputs */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Quantities Received Now</Label>

            {po.lineItems.map((item) => {
              const remaining = Math.max(0, item.orderedQuantity - item.receivedQuantity);
              const currentVal = receivedQtyMap[item.id] ?? remaining;

              return (
                <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3 bg-card">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{item.productName}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      SKU: {item.sku} | Ordered: {item.orderedQuantity} | Received: {item.receivedQuantity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Receiving:</span>
                    <Input
                      type="number"
                      min={0}
                      max={remaining}
                      value={currentVal}
                      onChange={(e) =>
                        setReceivedQtyMap((prev) => ({
                          ...prev,
                          [item.id]: Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)),
                        }))
                      }
                      className="w-20 font-mono text-center font-bold"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <Label className="font-semibold text-sm">Receipt Notes / Inspection Remarks</Label>
            <Input
              placeholder="e.g. Batch 1 inspected. Box condition intact."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="border border-black bg-emerald-600 font-medium text-white shadow-neo hover:bg-emerald-700"
            >
              Confirm Stock Receipt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Task 4**

```bash
git add src/features/purchase-orders/components/
git commit -m "feat(purchase-orders): add CreatePOModal and ReceiveGoodsModal components"
```

---

### Task 5: Detail Sheet Inspector & Main Route Composition

**Files:**
- Create: `src/features/purchase-orders/components/po-detail-sheet.tsx`
- Create: `src/features/purchase-orders/index.ts`
- Create: `src/app/(dashboard)/purchase-orders/page.tsx`

**Interfaces:**
- Consumes: All components & hook from Tasks 1-4.
- Produces: Complete Purchase Orders page at `/purchase-orders`.

- [ ] **Step 1: Implement `PODetailSheet` component**

Create `src/features/purchase-orders/components/po-detail-sheet.tsx`:
```tsx
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PurchaseOrder } from "../types";

interface PODetailSheetProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PODetailSheet({ po, isOpen, onClose }: PODetailSheetProps) {
  if (!po) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto border-l-2 border-black p-6 shadow-neo">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-mono text-xl font-bold">{po.poNumber}</SheetTitle>
            <Badge className="border-black bg-[#543afd] text-white shadow-neo-sm font-mono">
              {po.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Supplier: <strong className="text-foreground">{po.supplierName}</strong> ({po.supplierTier})
          </p>
        </SheetHeader>

        <Tabs defaultValue="items" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 border border-black bg-slate-100 font-mono text-xs">
            <TabsTrigger value="items">Items & Financials</TabsTrigger>
            <TabsTrigger value="receipts">Receipt Log ({po.receipts.length})</TabsTrigger>
            <TabsTrigger value="timeline">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Items & Financials Tab */}
          <TabsContent value="items" className="space-y-4 pt-4">
            <div className="rounded-lg border border-border bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination Warehouse:</span>
                <span className="font-semibold">{po.destinationWarehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-mono">{po.orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Delivery:</span>
                <span className="font-mono">{po.expectedDeliveryDate}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-muted-foreground">Total Value:</span>
                <span className="font-mono text-lg font-bold text-foreground">${po.totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Line Items Detail</h4>
              <div className="divide-y divide-border rounded-md border border-border">
                {po.lineItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{item.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold">{item.receivedQuantity} / {item.orderedQuantity} Received</p>
                      <p className="text-xs text-muted-foreground">${item.unitCost} / unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-3 pt-4">
            {po.receipts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No receiving records logged yet.</p>
            ) : (
              po.receipts.map((rc) => (
                <div key={rc.id} className="rounded-md border border-border p-3 space-y-2 text-sm bg-slate-50">
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>{rc.receivedAt}</span>
                    <span className="font-bold text-emerald-700">{rc.warehouseName}</span>
                  </div>
                  <div className="space-y-1">
                    {rc.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{item.productName} ({item.sku})</span>
                        <span className="font-mono font-bold text-emerald-600">+{item.quantityReceived} units</span>
                      </div>
                    ))}
                  </div>
                  {rc.notes && <p className="text-xs italic text-muted-foreground border-t border-border pt-1">"{rc.notes}"</p>}
                </div>
              ))
            )}
          </TabsContent>

          {/* Timeline Audit Tab */}
          <TabsContent value="timeline" className="space-y-3 pt-4 text-xs font-mono">
            <div className="border-l-2 border-black pl-3 space-y-3">
              <div>
                <p className="font-bold text-foreground">ORDER_CREATED</p>
                <p className="text-muted-foreground">{po.orderDate} — Issued to vendor</p>
              </div>
              {po.receipts.map((rc) => (
                <div key={rc.id}>
                  <p className="font-bold text-emerald-700">STOCK_RECEIVED</p>
                  <p className="text-muted-foreground">{rc.receivedAt} — Physical intake processed</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Create feature index exporter**

Create `src/features/purchase-orders/index.ts`:
```ts
export * from "./types";
export * from "./mock-data";
export * from "./hooks/use-purchase-orders";
export * from "./components/purchase-orders-header";
export * from "./components/purchase-orders-metric-cards";
export * from "./components/purchase-orders-toolbar";
export * from "./components/purchase-orders-table";
export * from "./components/create-po-modal";
export * from "./components/receive-goods-modal";
export * from "./components/po-detail-sheet";
```

- [ ] **Step 3: Implement main Purchase Orders page (`src/app/(dashboard)/purchase-orders/page.tsx`)**

Create `src/app/(dashboard)/purchase-orders/page.tsx`:
```tsx
"use client";

import * as React from "react";
import {
  usePurchaseOrders,
  PurchaseOrdersHeader,
  PurchaseOrdersMetricCards,
  PurchaseOrdersToolbar,
  PurchaseOrdersTable,
  CreatePOModal,
  ReceiveGoodsModal,
  PODetailSheet,
} from "@/features/purchase-orders";

export default function PurchaseOrdersPage() {
  const {
    orders,
    rawOrders,
    metrics,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedSupplier,
    setSelectedSupplier,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedPoId,
    setSelectedPoId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    receivingPoId,
    setReceivingPoId,
    handleResetFilters,
    handleCreatePo,
    handleReceiveGoods,
  } = usePurchaseOrders();

  const selectedPo = React.useMemo(() => {
    return rawOrders.find((o) => o.id === selectedPoId) || null;
  }, [rawOrders, selectedPoId]);

  const receivingPo = React.useMemo(() => {
    return rawOrders.find((o) => o.id === receivingPoId) || null;
  }, [rawOrders, receivingPoId]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <PurchaseOrdersHeader onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Metric Cards */}
      <PurchaseOrdersMetricCards
        metrics={metrics}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Toolbar */}
      <PurchaseOrdersToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSupplier={selectedSupplier}
        onSupplierChange={setSelectedSupplier}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        onResetFilters={handleResetFilters}
        orders={rawOrders}
      />

      {/* High-Density Data Table */}
      <PurchaseOrdersTable
        orders={orders}
        onInspect={(poId) => setSelectedPoId(poId)}
        onReceiveGoods={(poId) => setReceivingPoId(poId)}
      />

      {/* Modals & Inspection Sheet */}
      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePo}
      />

      <ReceiveGoodsModal
        po={receivingPo}
        isOpen={!!receivingPoId}
        onClose={() => setReceivingPoId(null)}
        onConfirmReceive={handleReceiveGoods}
      />

      <PODetailSheet
        po={selectedPo}
        isOpen={!!selectedPoId}
        onClose={() => setSelectedPoId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify full application build**

Run: `npm run build`
Expected: Build succeeds with 0 errors and generates `/purchase-orders` route cleanly.

- [ ] **Step 5: Commit Task 5**

```bash
git add src/features/purchase-orders/ src/app/\(dashboard\)/purchase-orders/
git commit -m "feat(purchase-orders): add detail sheet and complete /purchase-orders page route"
```

---

## Verification Plan

### Automated Build Verification
- Execute `npm run build` in PowerShell to ensure all Next.js routes, TypeScript definitions, and Server/Client Component boundaries compile without errors.

### Manual UI Verification
- Navigate to `http://localhost:3000/purchase-orders`.
- Verify top metric cards calculation and filter response.
- Verify status pills (`All`, `Issued`, `Partial`, `Received`, `Draft`) filtering.
- Test `+ Create Purchase Order` modal: add items, calculate totals, and submit to verify new PO creation.
- Test `Receive` button on an `ISSUED` or `PARTIALLY_RECEIVED` PO: adjust receiving quantity, submit, and confirm status change to `PARTIALLY_RECEIVED` or `RECEIVED`.
- Click `Inspect` to test the slide-over detail sheet tabs (`Items & Financials`, `Receipt Log`, `Audit Trail`).
