# Inventory Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Inventory page in StockOS featuring dual-tab views (Stock Levels & Warehouse Health vs. Stock Movement Audit Logs), rich interactive metric cards, multi-faceted filtering/search, quick stock operations (In, Out, Adjust), and detail slide-over sheet.

**Architecture:** A feature-isolated modular design in `src/features/inventory/` using React 19 best practices, headless hook state management (`useInventory`), and Neo-SaaS design system tokens (Space Grotesk + Space Mono, micro-shadows, tactile buttons).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide React, shadcn/ui primitives.

## Global Constraints
- Follow StockOS Neo-SaaS Design System: 70% Clean SaaS + 30% Neobrutalism (Space Mono for SKUs/tags, micro-shadows `shadow-neo-sm`, 1.5px black borders on active tags/buttons).
- Adhere strictly to React 19 conventions: Keyed sub-components for modal forms (no `useEffect` prop syncing), derived selection through `useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])`.
- Zero external state management libraries: all state maintained in pure React hooks.

---

### Task 1: Type Definitions & Mock Dataset

**Files:**
- Create: `src/features/inventory/types.ts`
- Create: `src/features/inventory/mock-data.ts`
- Create: `src/features/inventory/index.ts`

**Interfaces:**
- Consumes: None (domain primitives)
- Produces: `InventoryItem`, `StockMovement`, `StockStatus`, `MovementType`, `AdjustmentReason`, `InventoryFilterState`, `InventoryMetrics`, `MOCK_INVENTORY_ITEMS`, `MOCK_STOCK_MOVEMENTS`

- [ ] **Step 1: Create `src/features/inventory/types.ts`**
Define complete types for inventory items, stock movements, adjustment reasons, filter state, and metrics.

- [ ] **Step 2: Create `src/features/inventory/mock-data.ts`**
Provide rich mock dataset with 15+ inventory items across multiple warehouses (Main Hub WH-1, Secondary Depot WH-2, East Logistics WH-3) and initial movement logs.

- [ ] **Step 3: Create `src/features/inventory/index.ts`**
Export types, mock data, and components.

---

### Task 2: Inventory State & Actions Hook (`useInventory`)

**Files:**
- Create: `src/features/inventory/hooks/use-inventory.ts`

**Interfaces:**
- Consumes: `types.ts`, `mock-data.ts`
- Produces: `useInventory()` hook returning items, movements, filters, metrics, paginated items, and CRUD/mutation handlers (`recordMovement`, `adjustStock`).

- [ ] **Step 1: Implement `useInventory` hook with filtering, sorting, tab state, and pagination**
Implement live search (name, SKU, location bin, reference), multi-select warehouse filter, status filter, movement type filter, and sorting.

- [ ] **Step 2: Implement stock mutation methods (`recordMovement` & `adjustStock`)**
- `recordMovement(itemId, type, quantity, reference, note)`: updates item currentStock, availableStock, status, and appends to global movements list.
- `adjustStock(itemId, newStock, reason, reference, note)`: updates exact stock, recalculates available stock and status, and logs movement audit record.

---

### Task 3: Header, Interactive Metric Cards, and Tab Selector

**Files:**
- Create: `src/features/inventory/components/inventory-header.tsx`
- Create: `src/features/inventory/components/inventory-metrics.tsx`
- Create: `src/features/inventory/components/inventory-tabs.tsx`

**Interfaces:**
- Consumes: `types.ts`, `InventoryMetrics`, `InventoryTab`
- Produces: Top header with action CTAs, 4 interactive filter cards, and Dual Tab switcher (`Stock Levels` vs `Movement History`).

- [ ] **Step 1: Build `inventory-header.tsx`**
Includes title "Inventory Control", live item count pill, and top action buttons ("Adjust Stock" & "Record Movement").

- [ ] **Step 2: Build `inventory-metrics.tsx`**
4 Neo-SaaS metric cards:
1. Total Inventory Valuation (Currency formatted + active count)
2. Total Units on Hand (Available vs Reserved)
3. Stock Health Alerts (Low & Out of stock with quick filter click)
4. Movement Activity (Today's movements summary)

- [ ] **Step 3: Build `inventory-tabs.tsx`**
Tactile tab navigation between `Stock Levels` and `Movement History` with badge counters.

---

### Task 4: Unified Toolbar & High-Density Tables

**Files:**
- Create: `src/features/inventory/components/inventory-toolbar.tsx`
- Create: `src/features/inventory/components/inventory-stock-table.tsx`
- Create: `src/features/inventory/components/inventory-movements-table.tsx`

**Interfaces:**
- Consumes: `InventoryItem`, `StockMovement`, `InventoryFilterState`, `useInventory`
- Produces: Filter toolbar, Stock Levels Table (with health bars & row actions), and Movements Audit Table.

- [ ] **Step 1: Build `inventory-toolbar.tsx`**
Instant search input, warehouse filter dropdown, status/type filter pills, sorting options, and quick reset button.

- [ ] **Step 2: Build `inventory-stock-table.tsx`**
Table displaying SKU (Space Mono badge), Name, Category, Warehouse & Location Bin, Stock Health Bar (Current / Min / Max ratio), On Hand, Reserved, Available stock, Unit cost, and row action triggers.

- [ ] **Step 3: Build `inventory-movements-table.tsx`**
Audit log table displaying Timestamp, Movement Type Badge (In, Out, Adj, Transfer), Reference Code, SKU & Product, Quantity Delta, Previous vs New Stock, Reason, and Performed By.

---

### Task 5: Modals & Slide-Over Inspection Sheet

**Files:**
- Create: `src/features/inventory/components/inventory-detail-sheet.tsx`
- Create: `src/features/inventory/components/stock-movement-modal.tsx`
- Create: `src/features/inventory/components/stock-adjustment-modal.tsx`

**Interfaces:**
- Consumes: `InventoryItem`, `StockMovement`, mutation handlers
- Produces: Detail slide-over drawer and operation dialogs.

- [ ] **Step 1: Build `inventory-detail-sheet.tsx`**
Drawer showing comprehensive item info, stock ratio progress bars, warehouse location details, safety buffer metrics, and item-specific movement timeline.

- [ ] **Step 2: Build `stock-movement-modal.tsx`**
Modal for rapid Stock In / Stock Out transactions with product selection/lock, quantity, reference number, and notes.

- [ ] **Step 3: Build `stock-adjustment-modal.tsx`**
Modal for physical stock adjustment / audit with reason codes (*Cycle Count*, *Damaged Goods*, *Expired*, *Correction*, etc.), current vs new stock delta calculation, and audit notes.

---

### Task 6: Orchestrator Container & App Route Integration

**Files:**
- Create: `src/features/inventory/components/inventory-container.tsx`
- Create: `src/app/(dashboard)/inventory/page.tsx`
- Modify: `PROGRESS.md`

**Interfaces:**
- Consumes: All inventory feature components & hooks
- Produces: `/inventory` page route in StockOS

- [ ] **Step 1: Build `inventory-container.tsx`**
Stateful coordinator bringing together Header, Metrics, Tabs, Toolbar, Tables, Modals, and Slide-Over Sheet.

- [ ] **Step 2: Create `src/app/(dashboard)/inventory/page.tsx`**
Route page mounting `InventoryContainer` with proper metadata.

- [ ] **Step 3: Update `PROGRESS.md`**
Mark Inventory feature as completed.

---

### Task 7: Verification & Visual Validation

**Files:**
- Browser / Dev Server verification at `http://localhost:3001/inventory` or active dev port

- [ ] **Step 1: Verify Next.js build / TypeScript compilation**
Run `npm run build` or Next.js check to ensure zero type errors or broken imports.

- [ ] **Step 2: Verify interactive operations in browser**
Test tab switching, search/filters, Stock In/Out modal, Stock Adjustment modal, and slide-over detail drawer.
