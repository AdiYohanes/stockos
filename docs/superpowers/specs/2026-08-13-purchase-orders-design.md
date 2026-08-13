# Purchase Orders & Stock Receiving Flow — Design Spec

**Date**: 2026-08-13  
**Status**: Approved  
**Phase**: Frontend Foundation  

---

## 1. Overview

The Purchase Orders (PO) & Stock Receiving Flow module expands StockOS's procurement capabilities by giving businesses a structured workflow to create purchase orders for suppliers, track incoming shipments, and process physical stock receipts directly into destination warehouses with automatic stock movement synchronization.

---

## 2. Information Architecture & Navigation

- **Route**: `/purchase-orders` (New top-level protected route under `(dashboard)`)
- **Navigation item**: Added to main Sidebar layout with an `FileText` or `ShoppingBag` icon between *Suppliers* and *Reports*.

---

## 3. UI Component Architecture

The module will be located in `src/features/purchase-orders/` following the established StockOS feature structure:

```text
src/features/purchase-orders/
├── components/
│   ├── purchase-orders-header.tsx
│   ├── purchase-orders-metric-cards.tsx
│   ├── purchase-orders-toolbar.tsx
│   ├── purchase-orders-table.tsx
│   ├── create-po-modal.tsx
│   ├── receive-goods-modal.tsx
│   └── po-detail-sheet.tsx
├── hooks/
│   └── use-purchase-orders.ts
├── mock-data.ts
├── types.ts
└── index.ts
```

### 3.1 Page Layout (`src/app/(dashboard)/purchase-orders/page.tsx`)
1. **Header Component**:
   - H1: `Purchase Orders`
   - Monospace Badge: `PO-HUB`
   - Description: *"Manage vendor procurements, track incoming shipments, and process stock receipts."*
   - Primary Action Button: `+ Create Purchase Order` (`#543afd` background with Neobrutal shadow `shadow-neo`).
2. **Metric Summary Cards**:
   - `Total Orders`: Total count and total monetary value ($) across all POs.
   - `Pending / Issued`: Orders issued to suppliers awaiting delivery.
   - `Partially Received`: Orders partially fulfilled.
   - `Fully Received`: Orders fully fulfilled (100%).
   - *Behavior*: Clicking a card filters the table by the corresponding status.
3. **Toolbar**:
   - Search bar (by PO Code, Supplier Name, SKU).
   - Status Pills (`All`, `Draft`, `Issued`, `Partial`, `Received`, `Cancelled`) with live item counts.
   - Supplier Filter Dropdown & Destination Warehouse Filter Dropdown.
   - Reset Filters Button.
4. **Data Table**:
   - High-density table with Neobrutal status tags, progress ratio bar for received vs ordered items, unit costs, and row contextual actions.
5. **Slide-Over Detail Inspector (`PODetailSheet`)**:
   - 3-tab inspector sheet (`Items & Financials`, `Receipt Log`, `Audit Timeline`).
6. **Modals**:
   - `CreatePOModal` for constructing new draft orders.
   - `ReceiveGoodsModal` for recording physical stock intake into destination warehouses.

---

## 4. Status Lifecycle & Business Rules

```text
  [ DRAFT ] ────────► [ ISSUED ] ──────┬───► [ PARTIALLY_RECEIVED ] ───► [ RECEIVED ]
      │                    │           │             │
      ▼                    ▼           └─────────────┴───────────────► [ CANCELLED ]
 [ CANCELLED ]       [ CANCELLED ]
```

### Status Rules:
- **DRAFT**: Created locally, can be edited or deleted. Not yet sent to supplier.
- **ISSUED**: Formally sent to supplier. Awaiting shipment. Editable line items locked.
- **PARTIALLY_RECEIVED**: Physical items have been partially received in one or more batches into the target warehouse.
- **RECEIVED**: All ordered line items are 100% fulfilled.
- **CANCELLED**: Order cancelled before completion.

---

## 5. Stock Movement Synchronization

When a user submits a physical stock receipt via `ReceiveGoodsModal`:
1. The receiving quantity per item is validated against `(Ordered Qty - Already Received Qty)`.
2. The PO item's `receivedQuantity` is updated.
3. The overall PO status automatically transitions to `PARTIALLY_RECEIVED` or `RECEIVED`.
4. A corresponding **Stock In** event is triggered, updating product inventory balance in the target warehouse and appending a receipt log.

---

## 6. Type Definitions (`types.ts`)

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
  poNumber: string; // e.g. PO-2026-001
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
```

---

## 7. Visual & Styling Specifications

Following `design.md`:
- **PO Badges**: Monospace `Space Mono` font, uppercase tracking `0.1em`, 1px black border, Neobrutal micro-shadow (`shadow-neo-sm`).
- **Status Pills Color Scheme**:
  - `DRAFT`: Gray / Slate background (`bg-slate-100 text-slate-800 border-slate-300`)
  - `ISSUED`: Blue background (`bg-blue-100 text-blue-900 border-blue-400`)
  - `PARTIALLY_RECEIVED`: Amber / Orange background (`bg-amber-100 text-amber-900 border-amber-400`)
  - `RECEIVED`: Emerald background (`bg-emerald-100 text-emerald-900 border-emerald-400`)
  - `CANCELLED`: Rose / Red background (`bg-rose-100 text-rose-900 border-rose-400`)
- **Press Interactions**: Button click effects (`translate(1px, 1px)`).
