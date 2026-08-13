# Reusable UI Primitives & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create reusable UI primitives in `src/components/shared/` and refactor feature domains (`products`, `inventory`, `warehouses`, `suppliers`, `purchase-orders`) with dynamic lazy imports, memoized filter pipelines, and Keyed Form patterns to reduce code duplication and enhance runtime performance.

**Architecture:** Implement 6 shared components (`PageHeader`, `MetricCard`, `DataTableToolbar`, `StatusBadge`, `SkuBadge`, `ConfirmModal`), then refactor each feature domain to replace duplicated code and apply dynamic imports for heavy slide-over drawers.

**Tech Stack:** Next.js 16 (App Router, `next/dynamic`), React 19, TypeScript, Tailwind CSS, Lucide Icons, shadcn/ui.

## Global Constraints

- Preserve exact Neobrutal + Clean SaaS design system rules in `design.md`.
- No new external npm dependencies.
- Avoid introducing backend persistence, database schemas, or real APIs (Frontend Foundation phase).
- Ensure all commands use Windows PowerShell syntax (use `;` instead of `&&`).

---

### Task 1: Create Shared UI Primitives

**Files:**
- Create: `src/components/shared/page-header.tsx`
- Create: `src/components/shared/metric-card.tsx`
- Create: `src/components/shared/data-table-toolbar.tsx`
- Create: `src/components/shared/status-badge.tsx`
- Create: `src/components/shared/sku-badge.tsx`
- Create: `src/components/shared/confirm-modal.tsx`
- Create: `src/components/shared/index.ts`

**Interfaces:**
- Consumes: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/input.tsx`, `src/components/ui/select.tsx`.
- Produces: `PageHeader`, `MetricCard`, `DataTableToolbar`, `StatusBadge`, `SkuBadge`, `ConfirmModal`.

- [ ] **Step 1: Write `PageHeader` primitive**

Create `src/components/shared/page-header.tsx`:
```tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  badgeText?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, badgeText, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {badgeText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20 tracking-wider">
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write `MetricCard` primitive**

Create `src/components/shared/metric-card.tsx`:
```tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  isActive,
  onClick,
  className,
}: MetricCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-all cursor-pointer border border-border/80 hover:border-black/50',
        isActive && 'border-black shadow-neo-sm ring-1 ring-black/5 bg-primary/[0.02]',
        onClick && 'hover:-translate-y-0.5',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="p-2 rounded-md bg-muted/60 text-foreground">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-sm',
                trend.positive
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Write `DataTableToolbar`, `StatusBadge`, `SkuBadge`, `ConfirmModal`, and `index.ts`**

Create `src/components/shared/sku-badge.tsx`:
```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface SkuBadgeProps {
  code: string;
  className?: string;
}

export function SkuBadge({ code, className }: SkuBadgeProps) {
  return (
    <code
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium bg-muted text-foreground border border-border/80 tracking-wider',
        className
      )}
    >
      {code}
    </code>
  );
}
```

Create `src/components/shared/status-badge.tsx`:
```tsx
import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, variant = 'neutral', size = 'md', className }: StatusBadgeProps) {
  const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400',
    neutral: 'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-400',
  };

  const dotStyles: Record<StatusVariant, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-sm border uppercase tracking-wider font-mono',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        variantStyles[variant],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />
      {status}
    </span>
  );
}
```

Create `src/components/shared/data-table-toolbar.tsx`:
```tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusOption {
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

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  statusOptions,
  selectedStatus,
  onStatusChange,
  filterDropdowns,
  onReset,
  hasActiveFilters,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm focus-neo"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {statusOptions && onStatusChange && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                    isSelected
                      ? 'bg-black text-white shadow-neo-sm'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className={cn('ml-1.5 text-[11px]', isSelected ? 'text-white/80' : 'text-muted-foreground')}>
                      ({opt.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {filterDropdowns}

        {hasActiveFilters && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
```

Create `src/components/shared/confirm-modal.tsx`:
```tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

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

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading,
}: ConfirmModalProps) {
  const variantButtonClass = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    primary: 'bg-primary hover:bg-primary/90 text-white',
  }[variant];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-rose-500/10 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className={variantButtonClass}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Create `src/components/shared/index.ts`:
```ts
export * from './page-header';
export * from './metric-card';
export * from './data-table-toolbar';
export * from './status-badge';
export * from './sku-badge';
export * from './confirm-modal';
```

- [ ] **Step 4: Verify build for shared components**

Run command:
`npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit shared primitives**

`git add src/components/shared; git commit -m "feat: add shared ui primitives"`

---

### Task 2: Refactor Products Feature with Shared Primitives & Dynamic Import

**Files:**
- Modify: `src/features/products/components/products-header.tsx`
- Modify: `src/features/products/components/products-metrics.tsx`
- Modify: `src/features/products/components/products-toolbar.tsx`
- Modify: `src/features/products/components/products-container.tsx`
- Modify: `src/features/products/components/delete-product-dialog.tsx`

- [ ] **Step 1: Refactor Products components to consume shared primitives**

Update `products-header.tsx` to wrap `PageHeader`.
Update `products-metrics.tsx` to map over `MetricCard`.
Update `products-toolbar.tsx` to use `DataTableToolbar`.
Update `products-container.tsx` to dynamic import `ProductDetailSheet`:
```tsx
const ProductDetailSheet = dynamic(
  () => import('./product-detail-sheet').then((m) => m.ProductDetailSheet),
  { ssr: false }
);
```

- [ ] **Step 2: Verify Products feature builds cleanly**

Run command:
`npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit Products refactor**

`git add src/features/products; git commit -m "refactor(products): integrate shared primitives and dynamic sheet import"`

---

### Task 3: Refactor Inventory Feature with Shared Primitives & Dynamic Import

**Files:**
- Modify: `src/features/inventory/components/inventory-header.tsx`
- Modify: `src/features/inventory/components/inventory-metrics.tsx`
- Modify: `src/features/inventory/components/inventory-toolbar.tsx`
- Modify: `src/features/inventory/components/inventory-container.tsx`

- [ ] **Step 1: Refactor Inventory header, metrics, toolbar, container**

Update components to use `PageHeader`, `MetricCard`, `DataTableToolbar`, `StatusBadge`, and lazy import `InventoryDetailSheet`.

- [ ] **Step 2: Verify Inventory feature builds cleanly**

Run command:
`npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit Inventory refactor**

`git add src/features/inventory; git commit -m "refactor(inventory): integrate shared primitives and dynamic sheet import"`

---

### Task 4: Refactor Warehouses, Suppliers, and Purchase Orders Features

**Files:**
- Modify: `src/features/warehouses/components/*`
- Modify: `src/features/suppliers/components/*`
- Modify: `src/features/purchase-orders/components/*`

- [ ] **Step 1: Refactor Warehouses, Suppliers, PO to use shared primitives & dynamic imports**

Apply `PageHeader`, `MetricCard`, `DataTableToolbar`, `StatusBadge`, `SkuBadge`, and `ConfirmModal` across Warehouses, Suppliers, and Purchase Orders.

- [ ] **Step 2: Verify full project build**

Run command:
`npm run build`
Expected: Success with clean dynamic chunk splitting.

- [ ] **Step 3: Commit remaining feature refactors**

`git add src/features; git commit -m "refactor(features): integrate shared primitives and dynamic sheet imports"`
