# Inventory Page Feature Design Spec

**Date:** 2026-08-12  
**Status:** Approved  
**Phase:** Frontend Foundation  
**System:** StockOS Mini ERP  

---

## 1. Overview & Objectives

The Inventory Page in StockOS provides operational inventory visibility, warehouse allocation control, and full stock movement auditing. It bridges high-density inventory health tracking with quick stock adjustments and movement logging.

### Key Goals:
- **Dual Tab Architecture:** Switch effortlessly between **Stock Levels & Warehouse Health** (Tab 1) and **Stock Movement Audit Logs** (Tab 2).
- **High-Density Data Presentation:** Adhere to StockOS Hybrid Neo-SaaS (70% SaaS + 30% Neobrutalism) design with Space Mono badges, stock health progress bars, and clear status pill highlights.
- **Immediate Stock Actions:** Perform **Stock In**, **Stock Out**, and **Stock Adjustment** (with reason codes: cycle count, damaged, expired, theft, supplier return, correction).
- **Fast Search & Multi-Facet Filtering:** Filter by warehouse, status, movement type, category, and instant search queries.
- **Slide-Over Detail Sheet:** Deep inspection of individual stock breakdown (On Hand, Available, Reserved, Reorder Level) and item-specific movement timeline.

---

## 2. Architecture & File Structure

All domain logic, mock datasets, and UI components reside inside `src/features/inventory/`:

```text
src/
├── app/
│   └── (dashboard)/
│       └── inventory/
│           └── page.tsx                     # Route page (thin server/client component)
└── features/
    └── inventory/
        ├── components/
        │   ├── inventory-container.tsx      # Main stateful orchestrator
        │   ├── inventory-header.tsx         # Title, count badge, and Primary Action CTA
        │   ├── inventory-metrics.tsx        # 4 Click-to-filter metric cards
        │   ├── inventory-tabs.tsx           # Tab switcher (Stock Levels vs Movement Logs)
        │   ├── inventory-toolbar.tsx        # Unified filter bar (Search, Warehouse, Status, Sort)
        │   ├── inventory-stock-table.tsx    # Live stock table with health bars & actions
        │   ├── inventory-movements-table.tsx# Chronological stock movement audit logs table
        │   ├── inventory-detail-sheet.tsx   # Slide-over inspection drawer for selected item
        │   ├── stock-movement-modal.tsx     # Quick Stock In / Stock Out modal
        │   └── stock-adjustment-modal.tsx   # Stock Adjustment (Correction/Damaged/Audit) modal
        ├── hooks/
        │   └── use-inventory.ts             # State management, filtering, sorting, pagination, CRUD
        ├── mock-data.ts                     # Rich mock dataset (items + movements)
        ├── types.ts                         # Complete TypeScript interfaces
        └── index.ts                         # Barrel export
```

---

## 3. Data Models & TypeScript Types

```typescript
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "overstocked";

export type MovementType = "in" | "out" | "adjustment" | "transfer";

export type AdjustmentReason =
  | "cycle_count"
  | "damaged_goods"
  | "expired"
  | "theft_loss"
  | "supplier_return"
  | "correction";

export interface StockMovement {
  id: string;
  itemId: string;
  sku: string;
  itemName: string;
  type: MovementType;
  quantity: number;        // delta (+10, -5, etc.)
  previousStock: number;
  newStock: number;
  warehouse: string;
  reference: string;       // PO-1029, ADJ-2026-001, etc.
  reason?: AdjustmentReason;
  note?: string;
  performedBy: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  locationBin?: string;    // e.g. "A-02-14"
  currentStock: number;    // On hand
  reservedStock: number;   // Allocated
  availableStock: number;  // currentStock - reservedStock
  minStock: number;        // Low stock threshold
  maxStock: number;        // Capacity threshold
  unit: string;
  unitCost: number;        // Valuation cost
  status: StockStatus;
  lastMovementAt: string;
}

export type InventoryTab = "stock_levels" | "movements";

export interface InventoryFilterState {
  tab: InventoryTab;
  searchQuery: string;
  warehouse: string;
  status: "all" | StockStatus;
  movementType: "all" | MovementType;
  category: string;
  sortField: "name" | "sku" | "currentStock" | "availableStock" | "valuation" | "lastMovementAt" | "timestamp";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface InventoryMetrics {
  totalItems: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockedCount: number;
  totalValuation: number;
  todayMovementsCount: number;
}
```

---

## 4. UI & Interaction Design (70% SaaS + 30% Neobrutalism)

1. **Header & Top Bar:**
   - Space Grotesk title with Space Mono uppercase subtitle.
   - Primary action buttons:
     - `Adjust Stock` (Neobrutal secondary button with border & shadow-neo-sm)
     - `Record Movement` (Electric purple `#543afd` CTA with border & shadow-neo-sm)
2. **Metric Summary Cards:**
   - 4 Interactive Cards:
     1. **Total Inventory Valuation** (IDR / USD currency format, total SKUs)
     2. **Total Units on Hand** (with available vs reserved breakdown)
     3. **Stock Health Alert** (Low stock + Out of stock clickable filters)
     4. **Movement Activity** (Today's In vs Out transaction count)
3. **Dual Tab Selector:**
   - Tactile tab pills with count badges (`Stock Levels [24]`, `Movement History [42]`).
4. **Stock Levels Table:**
   - Monospace SKU tags with tactile borders.
   - Category and Location Bin pills (e.g. `BIN: A-04-12`).
   - Stock Health visual gauge/bar:
     - Green bar if `currentStock > minStock && currentStock <= maxStock`
     - Orange/Yellow bar if `currentStock <= minStock`
     - Red bar if `currentStock === 0`
     - Blue bar if `currentStock > maxStock`
   - On Hand vs Available numbers with unit label.
   - Row actions: *Adjust*, *Stock In/Out*, *Inspect*.
5. **Movements Table:**
   - Badge for movement type:
     - `IN`: Emerald badge (`+X units`)
     - `OUT`: Rose badge (`-X units`)
     - `ADJUSTMENT`: Amber badge (`ΔX units`)
     - `TRANSFER`: Indigo badge (`→ X units`)
   - Reference code (Space Mono), Reason pill, Performed by, and timestamp.
6. **Detail Slide-Over Sheet:**
   - Header with SKU badge and quick action buttons.
   - Visual inventory breakdown metrics (On Hand, Available, Reserved, Reorder Level, Max Cap).
   - Item movement log timeline.
7. **Modals:**
   - **Quick Movement Modal**: Fast In/Out with reference code, quantity, and notes.
   - **Adjustment Modal**: Sets exact new stock level, auto-calculates delta, selects reason code (*Cycle Count*, *Damaged Goods*, *Expired*, *Correction*), and logs who made the adjustment.

---

## 5. React 19 & Architecture Conventions
- Use `key={selectedItem.id}` for modal & drawer forms to avoid `useEffect` prop syncing.
- Derive selected item dynamically via `useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])`.
- Zero unnecessary dependencies.
