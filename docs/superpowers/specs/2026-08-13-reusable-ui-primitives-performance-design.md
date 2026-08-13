# Reusable UI Primitives & Performance Architecture Design

## 1. Executive Summary

StockOS currently duplicates page headers, metric cards, table search/filter toolbars, status badges, and delete confirmation modals across 5 main feature domains (`products`, `inventory`, `warehouses`, `suppliers`, `purchase-orders`). Additionally, heavy slide-over inspection sheets (10-15KB each) are statically loaded on initial page renders, causing unnecessary DOM node creation and bundle bloat.

This design specification establishes a set of shared, highly composable UI primitives in `src/components/shared/` and defines performance guidelines (dynamic lazy imports, `useMemo` filter memoization, Keyed Form Pattern) to improve responsiveness, memory footprint, and code maintainability.

---

## 2. Shared UI Primitives (`src/components/shared/`)

### 2.1 Component Structure

```text
src/components/
├── shared/
│   ├── page-header.tsx         # Standardized page title + badge + description + action toolbar
│   ├── metric-card.tsx         # KPI card with trend indicator & click-to-filter active state
│   ├── data-table-toolbar.tsx  # Unified search bar + status pills + filter select dropdowns + reset
│   ├── status-badge.tsx        # Standardized status badge mapping variants to semantic colors
│   ├── sku-badge.tsx           # Space Mono SKU/code badge
│   └── confirm-modal.tsx       # Reusable modal confirmation for destructive actions
```

### 2.2 Component API Specs

#### `PageHeader` (`src/components/shared/page-header.tsx`)
```tsx
interface PageHeaderProps {
  title: string;
  badgeText?: string; // e.g. "24 PRODUCTS"
  description?: string;
  actions?: React.ReactNode;
}
```

#### `MetricCard` (`src/components/shared/metric-card.tsx`)
```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    positive: boolean;
  };
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}
```

#### `DataTableToolbar` (`src/components/shared/data-table-toolbar.tsx`)
```tsx
interface StatusOption {
  label: string;
  value: string;
  count?: number;
}

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusOptions?: StatusOption[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  filterDropdowns?: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}
```

#### `StatusBadge` (`src/components/shared/status-badge.tsx`)
```tsx
type StatusVariant = 
  | 'success'   // In Stock, Completed, Active, Low Risk
  | 'warning'   // Low Stock, Pending, Reorder Needed
  | 'danger'    // Out of Stock, Overdue, Critical
  | 'neutral';  // Draft, Archived, Inactive

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
}
```

#### `SkuBadge` (`src/components/shared/sku-badge.tsx`)
```tsx
interface SkuBadgeProps {
  code: string;
  className?: string;
}
```

#### `ConfirmModal` (`src/components/shared/confirm-modal.tsx`)
```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}
```

---

## 3. Performance & Optimization Architecture

### 3.1 Dynamic Lazy Imports for Heavy Drawers & Modals
Heavy slide-over inspector components (`product-detail-sheet.tsx`, `inventory-detail-sheet.tsx`, etc.) will be dynamically imported on demand:

```tsx
const ProductDetailSheet = dynamic(
  () => import('./product-detail-sheet').then((m) => m.ProductDetailSheet),
  { ssr: false }
);
```

Conditional rendering ensures the component chunk is requested only when `selectedId` is active:
```tsx
{selectedId && <ProductDetailSheet id={selectedId} open={!!selectedId} onClose={handleClose} />}
```

### 3.2 Memoized Search & Filter Pipelines
Feature container components will memoize filtered and sorted data pipelines with `useMemo`:

```tsx
const filteredProducts = useMemo(() => {
  return products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
}, [products, searchQuery, statusFilter, categoryFilter]);
```

### 3.3 Keyed Form Pattern for Modals
Modals containing forms will isolate the form inside a child component with `key={editingItem?.id || 'new'}`. This forces clean mount/unmount when switching targets, eliminating React 19 cascading re-renders caused by `useEffect` state synchronization.

---

## 4. Migration Plan Across Features

1. **`src/components/shared/` creation**: Implement the 6 shared primitive components.
2. **`src/features/products`**: Replace header, metrics, toolbar, badges, delete modal, apply dynamic sheet import.
3. **`src/features/inventory`**: Replace header, metrics, toolbar, badges, apply dynamic sheet import.
4. **`src/features/warehouses`**: Replace header, metrics, badges, delete modal, apply dynamic sheet import.
5. **`src/features/suppliers`**: Replace header, metrics, toolbar, badges, delete modal, apply dynamic sheet import.
6. **`src/features/purchase-orders`**: Replace header, metrics, toolbar, badges, apply dynamic sheet import.

---

## 5. Verification Plan

- `npm run build`: Verify TypeScript compliance and zero build errors.
- Visual & functional check: Verify UI layout matches `design.md` Neobrutal + Clean SaaS specifications.
- Performance check: Confirm dynamic chunks are properly code-split for detail sheets.
