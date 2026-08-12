# Warehouse Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Warehouse Management feature in StockOS featuring dual-view layout (Interactive Neo-SaaS Grid Cards vs High-Density Operational Table), top interactive capacity metrics, unified multi-criteria toolbar, Inter-Warehouse Stock Transfer modal, full CRUD modals, and a 4-tab slide-over inspection sheet (Specs & PIC, Storage Zones/Aisles, Live Stored Inventory, and Transfer/Movement Logs).

**Architecture:** A feature-isolated modular architecture in `src/features/warehouses/` following React 19 rules (keyed form pattern, derived selection via `useMemo`, pure render handlers), headless state hook (`useWarehouses`), and StockOS Hybrid Neo-SaaS design tokens (Space Grotesk + Space Mono, tactile micro-shadows `shadow-neo-sm`, 1.5px black borders on active tags/buttons).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide React, shadcn/ui primitives.

## Global Constraints
- Follow StockOS Neo-SaaS Design System: 70% Clean SaaS + 30% Neobrutalism (Space Mono for facility codes/SKUs, micro-shadows `shadow-neo-sm`/`shadow-neo`, 1.5px black borders on active tags/buttons, electric purple `#543afd` accents).
- Adhere strictly to React 19 conventions: Keyed sub-components for modal forms (`key={warehouse?.id || 'new'}`), derived selection through `useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])`.
- Pure render handlers: No `Math.random()` during component render. Auto-generate reference numbers (e.g. `TRF-2026-008`, `WH-05`) inside event/state handlers.
- Zero external state management libraries: all state maintained in pure React hooks with isolated mock datasets.

---

### Task 1: Domain Types, Mock Dataset & Feature Barrel Export

**Files:**
- Create: `src/features/warehouses/types.ts`
- Create: `src/features/warehouses/mock-data.ts`
- Create: `src/features/warehouses/index.ts`

**Interfaces:**
- Consumes: None (domain primitives)
- Produces: `WarehouseItem`, `WarehouseZone`, `WarehouseType`, `WarehouseStatus`, `WarehouseAddress`, `WarehouseManager`, `StoredInventorySummary`, `InterWarehouseTransferPayload`, `WarehouseFilterState`, `WarehouseMetrics`, `MOCK_WAREHOUSES`, `MOCK_WAREHOUSE_INVENTORY`, `MOCK_WAREHOUSE_TRANSFERS`

- [ ] **Step 1: Create `src/features/warehouses/types.ts`**
Define complete types for warehouse items, storage zones, address, manager, stored inventory breakdown, transfer payload, filter state, and metrics.

- [ ] **Step 2: Create `src/features/warehouses/mock-data.ts`**
Provide rich mock dataset with 5 realistic facilities (WH-1 Main Hub, WH-2 East Annex, WH-3 Central Depot, WH-4 Cold Storage/Lab, WH-5 Transit Logistics), each with detailed storage zones (Racks, Shelves, Cold rooms), stored inventory items matching StockOS product SKUs, and historical transfer audit logs.

- [ ] **Step 3: Create `src/features/warehouses/index.ts`**
Export types, mock data, and feature components.

---

### Task 2: Warehouse State & Operations Hook (`useWarehouses`)

**Files:**
- Create: `src/features/warehouses/hooks/use-warehouses.ts`

**Interfaces:**
- Consumes: `types.ts`, `mock-data.ts`
- Produces: `useWarehouses()` hook returning:
  - `warehouses`: filtered & sorted warehouse list
  - `metrics`: calculated aggregate capacity & utilization stats
  - `filterState`: active filters (query, status, type, viewMode, sortField, sortOrder)
  - `selectedWarehouseId` & derived `selectedWarehouse`
  - Mutation handlers: `createWarehouse`, `updateWarehouse`, `deleteWarehouse`, `transferStock`, `setFilterState`, `resetFilters`

- [ ] **Step 1: Implement `useWarehouses` hook with filtering, sorting, and view mode**
Implement instant search (code, name, manager name, city), status filter (`active`, `maintenance`, `full`), type filter, and sorting.

- [ ] **Step 2: Implement CRUD and Stock Transfer mutation methods**
- `createWarehouse(data)`: adds new facility with auto-generated code and initial zones.
- `updateWarehouse(id, data)`: updates facility specs, contact, or capacity.
- `deleteWarehouse(id)`: removes facility from list.
- `transferStock(payload)`: updates source and destination warehouse used capacity, adjusts inventory distribution, and records transfer log.

---

### Task 3: Header & Interactive Capacity Metric Cards

**Files:**
- Create: `src/features/warehouses/components/warehouses-header.tsx`
- Create: `src/features/warehouses/components/warehouses-metrics.tsx`

**Interfaces:**
- Consumes: `types.ts`, `WarehouseMetrics`
- Produces: Header with Eyebrow, Title, action buttons (`Transfer Stock` and `+ Add Warehouse`), and 4 interactive summary cards.

- [ ] **Step 1: Build `warehouses-header.tsx`**
Includes eyebrow `LOGISTICS & STORAGE`, title `Warehouse Hubs & Facilities`, facility count badge, and top action CTAs with Neo-SaaS styling (`#543afd` primary button, 1.5px black borders).

- [ ] **Step 2: Build `warehouses-metrics.tsx`**
4 Neo-SaaS metric cards with click-to-filter triggers:
1. Total Facilities (Count + active ratio)
2. Active Hubs (Filtered on click)
3. Avg. Capacity Utilization (Percentage gauge + color badge: Green/Orange/Red)
4. Total Stock Units Stored (Aggregated volume across facilities)

---

### Task 4: Unified Toolbar & Dual View Components (Grid & High-Density Table)

**Files:**
- Create: `src/features/warehouses/components/warehouses-toolbar.tsx`
- Create: `src/features/warehouses/components/warehouse-grid-view.tsx`
- Create: `src/features/warehouses/components/warehouse-table-view.tsx`

**Interfaces:**
- Consumes: `WarehouseItem`, `WarehouseFilterState`, `useWarehouses`
- Produces: Search/filter toolbar, Grid View (interactive Neo-SaaS cards), and High-Density Table View.

- [ ] **Step 1: Build `warehouses-toolbar.tsx`**
Search bar, status pills with live counters, type dropdown, view mode toggle (`[Grid | Table]`), sort dropdown, and quick reset button.

- [ ] **Step 2: Build `warehouse-grid-view.tsx`**
Cards featuring Space Mono code badge, status tag, facility type, manager chip, visual capacity utilization bar with color grading, mini stats grid (SKUs, Units, Valuation), and quick action buttons (`Transfer Stock` & `Inspect Hub →`).

- [ ] **Step 3: Build `warehouse-table-view.tsx`**
High-density table with Space Mono code badges, facility & type, location, visual capacity meter bar with % badge, stored stock units/SKUs, valuation, manager avatar, status pill, and action menu.

---

### Task 5: 4-Tab Slide-Over Inspection Sheet (`warehouse-detail-sheet.tsx`)

**Files:**
- Create: `src/features/warehouses/components/warehouse-detail-sheet.tsx`

**Interfaces:**
- Consumes: `WarehouseItem`, `WarehouseZone`, `StoredInventorySummary`
- Produces: Slide-over drawer with 4 tabs:
  1. Overview & Facility Specs (Capacity gauge, address, manager contact, financial summary)
  2. Storage Zones & Aisles (Per-zone capacity cards with type badges)
  3. Stored Inventory (High-density sub-table of SKUs physically located in this warehouse)
  4. Movement & Transfer Logs (Audit trail of transfers and shipments)

- [ ] **Step 1: Build `warehouse-detail-sheet.tsx` shell and Tab 1 (Overview & Specs)**
Implement sheet drawer with header (Code, Title, Type, Status) and facility metrics/contact breakdown.

- [ ] **Step 2: Implement Tab 2 (Storage Zones) & Tab 3 (Stored Inventory)**
Storage zones visual list with rack/shelf capacities, and mini-table of active inventory items in this warehouse.

- [ ] **Step 3: Implement Tab 4 (Movement Logs) and Action Footer**
Movement audit timeline and footer buttons (`Transfer Stock From Here` & `Edit Facility`).

---

### Task 6: Action Modals (Add/Edit Warehouse, Stock Transfer & Delete)

**Files:**
- Create: `src/features/warehouses/components/warehouse-form-modal.tsx`
- Create: `src/features/warehouses/components/stock-transfer-modal.tsx`
- Create: `src/features/warehouses/components/delete-warehouse-dialog.tsx`

**Interfaces:**
- Consumes: `WarehouseItem`, `InterWarehouseTransferPayload`
- Produces: Add/Edit facility dialog, Inter-Warehouse Stock Transfer dialog with live balance preview, and safe delete confirmation dialog.

- [ ] **Step 1: Build `warehouse-form-modal.tsx`**
Keyed form sub-component for adding new or editing existing warehouse specs, location, capacity, and manager details.

- [ ] **Step 2: Build `stock-transfer-modal.tsx`**
Inter-warehouse transfer modal with source/destination warehouse selectors, product SKU picker, quantity balance validation, and live preview of before/after stock balance.

- [ ] **Step 3: Build `delete-warehouse-dialog.tsx`**
Destructive confirmation dialog warning about stored stock before deletion.

---

### Task 7: Container Orchestration & Route Page

**Files:**
- Create: `src/features/warehouses/components/warehouses-container.tsx`
- Create: `src/app/(dashboard)/warehouses/page.tsx`
- Modify: `PROGRESS.md`

**Interfaces:**
- Consumes: All warehouse components & hooks
- Produces: Complete working `/warehouses` page route connected to dashboard navigation.

- [ ] **Step 1: Build `warehouses-container.tsx`**
Assemble header, metrics, toolbar, grid/table view, detail sheet, and modals with unified state management.

- [ ] **Step 2: Create `src/app/(dashboard)/warehouses/page.tsx`**
Next.js page route rendering `<WarehousesContainer />` with metadata.

- [ ] **Step 3: Update `PROGRESS.md`**
Mark Warehouses feature as completed in progress tracker.

---

### Task 8: Verification & Quality Assurance

- [ ] **Step 1: Run TypeScript validation**
`npx tsc --noEmit` to ensure zero compilation or type errors.

- [ ] **Step 2: Browser testing & verification**
Verify `/warehouses` page in browser:
- Navigation from sidebar
- Grid view vs Table view toggle
- Metric cards click-to-filter
- Slide-over detail sheet (all 4 tabs)
- Stock transfer modal execution & balance update
- Add / Edit warehouse workflow
