# Warehouse Management Feature Design Spec

**Date:** 2026-08-12  
**Status:** Approved  
**Phase:** Frontend Foundation  
**System:** StockOS Mini ERP  

---

## 1. Overview & Objectives

The Warehouse Management feature in StockOS provides full visibility and control over all storage facilities, distribution hubs, storage zones, capacity utilization, and inter-facility stock transfers.

### Key Goals:
- **Dual View Layout (Grid & High-Density Table):** Effortless switching between visual Neo-SaaS facility cards (with live capacity utilization gauges) and high-density operational data tables.
- **Capacity & Utilization Monitoring:** Real-time visibility into warehouse usage (% capacity occupied, available space, unit counts, and valuation).
- **Inter-Warehouse Stock Transfer:** Rapid stock transfer modal moving inventory units from a source warehouse to a destination warehouse with balance validation and reference tracking.
- **Storage Zones & Aisles Hierarchy:** Breakdown of warehouse internal spaces (e.g., *Zone A - Electronics Shelving*, *Zone B - Heavy Parts*, *Zone C - Cold Room*).
- **Slide-Over Detail Inspection Sheet:** High-performance inspection drawer detailing facility specs, capacity health, zone allocation, live stored inventory items, and recent movement audit trails.
- **React 19 & Neo-SaaS Strict Compliance:** Uses keyed form modals (`key={id}`), pure render handlers, derived entity selection, Space Mono SKU/code tags, and tactile button presses.

---

## 2. Architecture & File Structure

All domain logic, mock datasets, hooks, and UI components reside inside `src/features/warehouses/`:

```text
src/
├── app/
│   └── (dashboard)/
│       └── warehouses/
│           └── page.tsx                      # Thin Server Component page route
└── features/
    └── warehouses/
        ├── components/
        │   ├── warehouses-container.tsx      # Main stateful feature orchestrator
        │   ├── warehouses-header.tsx         # Title, eyebrow tag, Transfer Stock & Add Warehouse CTAs
        │   ├── warehouses-metrics.tsx        # 4 Interactive click-to-filter summary metric cards
        │   ├── warehouses-toolbar.tsx        # Unified filter bar (Search, Status, Type, View Switcher, Sort)
        │   ├── warehouse-grid-view.tsx       # Neo-SaaS facility cards with capacity gauge & quick actions
        │   ├── warehouse-table-view.tsx      # High-density operational data table
        │   ├── warehouse-detail-sheet.tsx    # Slide-over inspection drawer (Specs, Zones, Inventory, Logs)
        │   ├── warehouse-form-modal.tsx      # Add & Edit Facility Dialog (Keyed Form Pattern)
        │   ├── stock-transfer-modal.tsx      # Inter-Warehouse Stock Transfer Dialog
        │   └── delete-warehouse-dialog.tsx   # Destructive confirmation modal
        ├── hooks/
        │   └── use-warehouses.ts             # State management, filter/sort, CRUD & stock transfer logic
        ├── mock-data.ts                      # Rich realistic warehouse, zones & item allocation datasets
        ├── types.ts                          # Comprehensive TypeScript interfaces & domain types
        └── index.ts                          # Barrel export
```

---

## 3. Data Models & TypeScript Types

```typescript
export type WarehouseType =
  | "central_hub"
  | "regional_depot"
  | "cold_storage"
  | "fulfillment"
  | "transit";

export type WarehouseStatus = "active" | "maintenance" | "full" | "inactive";

export interface WarehouseZone {
  id: string;
  name: string;
  code: string;
  type: "rack" | "shelf" | "bulk" | "cold_room";
  capacityUnits: number;
  usedUnits: number;
}

export interface WarehouseAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface WarehouseManager {
  name: string;
  email: string;
  phone: string;
}

export interface StoredInventorySummary {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  unitCost: number;
  unit: string;
}

export interface WarehouseItem {
  id: string;
  code: string; // e.g. "WH-01"
  name: string; // e.g. "Main Hub (WH-1)"
  type: WarehouseType;
  status: WarehouseStatus;
  address: WarehouseAddress;
  manager: WarehouseManager;
  totalCapacityUnits: number;
  usedCapacityUnits: number;
  totalSkusCount: number;
  totalValuation: number;
  zones: WarehouseZone[];
  createdAt: string;
}

export interface InterWarehouseTransferPayload {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  sku: string;
  itemName: string;
  quantity: number;
  reference: string;
  notes?: string;
  dispatchedBy: string;
}

export type WarehouseViewMode = "grid" | "table";

export type WarehouseSortField =
  | "name"
  | "code"
  | "utilization"
  | "capacity"
  | "valuation"
  | "skus";

export type WarehouseSortOrder = "asc" | "desc";

export interface WarehouseFilterState {
  searchQuery: string;
  status: "all" | WarehouseStatus;
  type: "all" | WarehouseType;
  viewMode: WarehouseViewMode;
  sortField: WarehouseSortField;
  sortOrder: WarehouseSortOrder;
}

export interface WarehouseMetrics {
  totalWarehouses: number;
  activeCount: number;
  maintenanceCount: number;
  avgUtilization: number;
  totalStockUnits: number;
  totalValuation: number;
}
```

---

## 4. Component Design & Interactions

### 4.1 Header & Quick Actions (`warehouses-header.tsx`)
- **Eyebrow Tag:** `LOGISTICS & STORAGE`
- **Title:** `Warehouse Hubs & Facilities`
- **Sub-headline:** *"Monitor storage capacity, zones allocation, and inter-facility stock movements."*
- **Action CTAs:**
  - `Transfer Stock` (Secondary button with `ArrowLeftRight` icon, border 1.5px black, shadow-neo-sm)
  - `+ Add Warehouse` (Primary button with `Plus` icon, bg `#543afd`, text white, shadow-neo)

### 4.2 Metric Summary Cards (`warehouses-metrics.tsx`)
4 Click-to-filter metric cards with hover feedback:
1. **Total Warehouses:** Count of all registered sites (e.g. `5 Facilities`).
2. **Active Hubs:** Operational sites (e.g. `4 Active`, click filters to `active`).
3. **Avg. Capacity Utilization:** Overall storage usage (e.g. `68.5%` with color indicator: Green `<75%`, Orange `75-90%`, Red `>90%`).
4. **Total Stock Stored:** Aggregated units across all facilities (e.g. `14,850 Units`).

### 4.3 Unified Toolbar (`warehouses-toolbar.tsx`)
- Instant search input (matches code, name, manager, city).
- Status pill tabs with live counters (`All`, `Active`, `Maintenance`, `Full`).
- Facility Type dropdown selector (`All Types`, `Central Hub`, `Regional Depot`, `Cold Storage`, `Fulfillment`, `Transit`).
- View Mode Toggle Switcher (`[Grid View | Table View]`).
- Sort dropdown with direction toggle (`asc` / `desc`).
- Reset button when any filter is active.

### 4.4 Grid View (`warehouse-grid-view.tsx`)
- Neo-SaaS interactive cards:
  - Header: Space Mono Code badge (`WH-01`), status pill (`ACTIVE` green / `MAINTENANCE` yellow / `FULL` red), and kebab action menu.
  - Facility Name, type badge, manager chip, and city location.
  - Visual capacity utilization gauge (colored progress bar with % label and used/total units).
  - Quick stats row: Total Units, Unique SKUs, Asset Valuation.
  - Footer actions: `Transfer Stock` and `Inspect Hub →`.

### 4.5 High-Density Table View (`warehouse-table-view.tsx`)
- Table columns:
  1. `CODE` (Space Mono badge)
  2. `FACILITY & TYPE` (Name & sub-badge)
  3. `LOCATION` (City, Address)
  4. `CAPACITY UTILIZATION` (Visual progress bar + % badge + units)
  5. `STORED STOCK` (Units & SKUs count)
  6. `VALUATION` (Formatted IDR)
  7. `MANAGER` (Avatar + name)
  8. `STATUS` (Neo status pill)
  9. `ACTIONS` (Dropdown: Inspect, Transfer, Edit, Delete)

### 4.6 Slide-Over Detail Sheet (`warehouse-detail-sheet.tsx`)
- Multi-tab inspection drawer:
  - **Tab 1 (Overview & Specs):** Capacity meter breakdown, full address with map placeholder, manager contact details, financial metrics.
  - **Tab 2 (Storage Zones):** Interactive cards for each zone with per-zone capacity meters and zone types (`Rack`, `Shelf`, `Bulk`, `Cold Room`).
  - **Tab 3 (Stored Inventory):** Live sub-table of SKUs physically stored at this facility (SKU, Name, Category, Quantity, Available, Valuation).
  - **Tab 4 (Movement & Transfer Logs):** Audit trail of movements and transfers originating or terminating at this warehouse.
- Sheet footer actions: `Transfer Stock From Here` & `Edit Facility`.

### 4.7 Modals & Dialogs
- **`WarehouseFormModal`:** Add / Edit dialog using keyed form pattern for instant initial value binding without `useEffect`.
- **`StockTransferModal`:** Select source and destination hubs, pick SKU, input quantity with instant balance validation, and preview updated warehouse balances.
- **`DeleteWarehouseDialog`:** Safe deletion confirmation with active stock warning.

---

## 5. Verification Plan
- **Type Checking:** Run `npx tsc --noEmit` to verify zero TypeScript errors across the workspace.
- **Next.js Build Check:** Run `npm run build` or inspect runtime dev server for clean compilation.
- **Interactive Browser Verification:**
  - Navigation to `/warehouses` from sidebar.
  - Metric summary cards filter correctly on click.
  - Toggle between Grid View and Table View seamlessly.
  - Open and inspect Warehouse Detail Sheet with all 4 tabs working.
  - Add a new warehouse and verify live update in metrics, grid, and table.
  - Perform an Inter-Warehouse Stock Transfer and verify quantity adjustments.
  - Delete / Edit warehouse workflows.
