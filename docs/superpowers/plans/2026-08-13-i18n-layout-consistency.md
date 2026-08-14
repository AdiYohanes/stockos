# i18n Layout Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardise component layouts and i18n text density to ensure zero visual distortion or layout shifts between English and Indonesian interfaces.

**Architecture:** Defensive CSS flex/grid layout rules + line-clamp-2 title tooltips + concise i18n microcopy tuning.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript.

## Global Constraints
- Responsive behavior must remain intact across `sm`, `md`, `lg` breakpoints.
- Icon dimensions, button heights, and grid card heights must remain symmetric regardless of language.
- Hover tooltips using native `title` attribute must be attached whenever text truncation or line clamping occurs.

---

### Task 1: Update QuickActions Component Layout with Defensive CSS

**Files:**
- Modify: `src/features/dashboard/components/quick-actions.tsx`

**Interfaces:**
- Consumes: `QuickActionItem` from `../types`
- Produces: Equal height card grid with `items-stretch`, `shrink-0` badges/icons, `line-clamp-2` descriptions, and native hover tooltips.

- [ ] **Step 1: Inspect quick-actions.tsx current implementation**

Verify current `truncate` and grid setup.

- [ ] **Step 2: Update quick-actions.tsx with Defensive CSS**

Update `src/features/dashboard/components/quick-actions.tsx` with:
```tsx
"use client";

import * as React from "react";
import {
  PackagePlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickActionItem } from "../types";
import { MOCK_QUICK_ACTIONS } from "../mock-data";

interface QuickActionsProps {
  actions?: QuickActionItem[];
}

export function QuickActions({ actions = MOCK_QUICK_ACTIONS }: QuickActionsProps) {
  const [activeNotification, setActiveNotification] = React.useState<string | null>(null);

  const handleActionClick = (title: string) => {
    setActiveNotification(`${title} dijalankan (Placeholder)`);
    setTimeout(() => {
      setActiveNotification(null);
    }, 2500);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 items-stretch">
        {actions.map((action) => {
          const iconConfig = getActionIcon(action.icon);
          const IconComponent = iconConfig.icon;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleActionClick(action.title)}
              className="group flex items-start gap-2.5 rounded-lg border border-border/70 bg-card p-2.5 text-left transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:shadow-xs active:scale-[0.99] cursor-pointer h-full"
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 transition-colors mt-0.5",
                  iconConfig.wrapperClass
                )}
              >
                <IconComponent className={cn("h-3.5 w-3.5", iconConfig.iconClass)} />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate"
                      title={action.title}
                    >
                      {action.title}
                    </span>
                    {action.badge && (
                      <span className="text-[9px] font-medium text-muted-foreground uppercase shrink-0">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5"
                    title={action.description}
                  >
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeNotification && (
        <div className="absolute right-2 -top-6 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-background/90 px-2 py-0.5 rounded-md border border-emerald-500/30 shadow-xs animate-in fade-in">
          {activeNotification}
        </div>
      )}
    </div>
  );
}

function getActionIcon(icon: QuickActionItem["icon"]) {
  switch (icon) {
    case "plus":
      return {
        icon: PackagePlus,
        wrapperClass: "bg-primary/10 text-primary ring-primary/20",
        iconClass: "text-primary",
      };
    case "arrow-down":
      return {
        icon: ArrowDownToLine,
        wrapperClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
        iconClass: "text-emerald-600 dark:text-emerald-400",
      };
    case "arrow-up":
      return {
        icon: ArrowUpFromLine,
        wrapperClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
        iconClass: "text-amber-600 dark:text-amber-400",
      };
    case "transfer":
      return {
        icon: ArrowLeftRight,
        wrapperClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
        iconClass: "text-blue-600 dark:text-blue-400",
      };
  }
}
```

- [ ] **Step 3: Verify TypeScript compilation & formatting**

Run `npx tsc --noEmit` or verify no lint errors in `quick-actions.tsx`.

- [ ] **Step 4: Commit changes**

```bash
git add src/features/dashboard/components/quick-actions.tsx
git commit -m "feat(dashboard): add defensive CSS and tooltips to QuickActions"
```

---

### Task 2: Standardise Microcopy for Mock Quick Actions

**Files:**
- Modify: `src/features/dashboard/mock-data.ts`

**Interfaces:**
- Consumes: `MOCK_QUICK_ACTIONS`
- Produces: Concise Indonesian microcopy density matching English structure.

- [ ] **Step 1: Tune MOCK_QUICK_ACTIONS descriptions in mock-data.ts**

Update `MOCK_QUICK_ACTIONS` array in `src/features/dashboard/mock-data.ts`:
```typescript
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
    description: "Terima barang & PO masuk",
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
  {
    id: "transfer-stock",
    title: "Transfer Stok",
    description: "Transfer barang antar gudang",
    icon: "transfer",
    badge: "Internal",
  },
];
```

- [ ] **Step 2: Commit changes**

```bash
git add src/features/dashboard/mock-data.ts
git commit -m "chore(dashboard): tune QuickActions microcopy for i18n balance"
```
