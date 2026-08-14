# Unused Files Removal & Performance Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete unused static image assets (~3.7 MB saved), remove unused runtime `shadcn` CLI dependency from `package.json`, and lazy-load `StockMovementChart` (Recharts) on Dashboard with `next/dynamic`.

**Architecture:** Asset deletion from `public/`, manifest cleanup in `package.json`, and Next.js dynamic client import wrapper with skeleton loading state for heavy Recharts components.

**Tech Stack:** Next.js App Router (v16), React 19, TypeScript, Recharts.

## Global Constraints

- Do not break existing UI components or routes.
- Preserve SVG component branding (`StockOSLogo` in `src/components/stockos-logo.tsx`).
- Run `npm run build` to verify clean build without missing imports or assets.

---

### Task 1: Delete Unused Static Image & SVG Assets in `public/`

**Files:**
- Delete: `public/assets/login-background.png`
- Delete: `public/auth-bg.png`
- Delete: `public/stockos-logo.png`
- Delete: `public/stockos-icon.png`
- Delete: `public/file.svg`
- Delete: `public/globe.svg`
- Delete: `public/next.svg`
- Delete: `public/vercel.svg`
- Delete: `public/window.svg`

**Interfaces:**
- Consumes: None
- Produces: Cleaned `public/` directory without unreferenced assets

- [ ] **Step 1: Check git status of target files**

Run command to verify target files exist in `public/`:
```bash
ls public/assets/login-background.png public/auth-bg.png public/stockos-logo.png public/stockos-icon.png public/*.svg
```

- [ ] **Step 2: Remove target unused files**

Run powershell / bash removal command:
```bash
rm public/assets/login-background.png public/auth-bg.png public/stockos-logo.png public/stockos-icon.png public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 3: Verify public directory contents**

Run:
```bash
ls public/
```
Expected: Only `assets/` (if any active subfolder) or remaining active files.

- [ ] **Step 4: Commit asset deletion**

```bash
git add public
git commit -m "chore(assets): remove unused png and starter svg assets (~3.7MB)"
```

---

### Task 2: Remove `shadcn` CLI Dependency from `package.json`

**Files:**
- Modify: `package.json:11-23`

**Interfaces:**
- Consumes: `package.json`
- Produces: Clean `dependencies` block without CLI dependency `"shadcn"`

- [ ] **Step 1: Inspect `package.json` dependencies block**

Check line containing `"shadcn"` in `package.json`.

- [ ] **Step 2: Remove `"shadcn": "^4.16.2"` line**

Edit `package.json` to remove `"shadcn": "^4.16.2",` from `dependencies`.

- [ ] **Step 3: Verify package validity**

Run: `npm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit package manifest change**

```bash
git add package.json
git commit -m "chore(deps): remove unused shadcn runtime dependency"
```

---

### Task 3: Dynamic Import Optimization for Dashboard `StockMovementChart`

**Files:**
- Modify: `src/app/(dashboard)/page.tsx:1-49`

**Interfaces:**
- Consumes: `@/features/dashboard/components/stock-movement-chart`
- Produces: Client-side dynamically loaded chart component with fallback skeleton UI

- [ ] **Step 1: Inspect current `src/app/(dashboard)/page.tsx`**

Verify line 5 static import of `StockMovementChart`.

- [ ] **Step 2: Implement `next/dynamic` lazy loading for `StockMovementChart`**

Modify `src/app/(dashboard)/page.tsx` to dynamically import `StockMovementChart`:

```tsx
import dynamic from "next/dynamic";
import { getMockAuthState } from "@/features/auth/mock-auth";
import {
  DashboardHeader,
  OverviewCards,
  InventoryHealth,
  NeedAttentionTable,
  TopMovingProducts,
  MOCK_OVERVIEW_METRICS,
} from "@/features/dashboard";

const StockMovementChart = dynamic(
  () =>
    import("@/features/dashboard/components/stock-movement-chart").then(
      (mod) => mod.StockMovementChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] w-full flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm animate-pulse">
        <div className="h-6 w-40 rounded bg-muted"></div>
        <div className="h-[260px] w-full rounded bg-muted/40"></div>
        <div className="h-4 w-56 rounded bg-muted/60"></div>
      </div>
    ),
  }
);

export const metadata = {
  title: "Dashboard | StockOS",
  description: "Ringkasan manajemen stok dan ikhtisar inventaris.",
};

export default async function DashboardPage() {
  const { user } = await getMockAuthState();

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-[1600px] mx-auto">
      {/* 1. Header with integrated Quick Actions */}
      <DashboardHeader userName={user?.name} />

      {/* 2. Overview Metrics Cards (4 cards) */}
      <OverviewCards metrics={MOCK_OVERVIEW_METRICS} />

      {/* 3. Main Analytics 3-Column Desktop Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 items-stretch">
        {/* Col 1: Stock Movement (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <StockMovementChart />
        </div>

        {/* Col 2: Need Attention (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <NeedAttentionTable />
        </div>

        {/* Col 3: Inventory Health & Top Moving Products (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-5">
          <InventoryHealth />
          <TopMovingProducts />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build and linting**

Run: `npm run build`
Expected: Successful Next.js build output with zero errors.

- [ ] **Step 4: Commit dynamic import optimization**

```bash
git add src/app/\(dashboard\)/page.tsx
git commit -m "perf(dashboard): dynamic import StockMovementChart to reduce initial bundle"
```

---

## Verification Plan

### Automated Verification
- Run `npm run build` to confirm production bundle compiles clean.
- Run `npm run lint` to confirm TypeScript & ESLint pass.

### Manual Verification
- Launch dev server (`npm run dev`) and visit `http://localhost:3000`.
- Verify Dashboard renders cleanly and `StockMovementChart` loads with skeleton fallback without layout shift.
