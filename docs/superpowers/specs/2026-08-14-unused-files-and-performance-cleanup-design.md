# Unused Files Removal & Performance Cleanup Design

## 1. Executive Summary

StockOS frontend has built up unused static image assets in `public/` totaling ~3.7 MB, an unnecessary CLI dependency (`shadcn`) in runtime `dependencies` in `package.json`, and statically loaded heavy client charts on the main Dashboard view.

This design specification details the removal of dead static assets and unneeded dependencies, along with introducing Next.js dynamic lazy loading (`next/dynamic`) for heavy client components (such as Recharts in `StockMovementChart`) to reduce initial bundle size and speed up page renders.

---

## 2. Proposed Cleanup & Performance Changes

### 2.1 Static Assets Cleanup (`public/`)

The following files are not referenced anywhere in `src/` or configuration files:

- **Unused Large PNG Images (~3.7 MB)**:
  - [DELETE] `public/assets/login-background.png` (2.2 MB)
  - [DELETE] `public/auth-bg.png` (906 KB)
  - [DELETE] `public/stockos-logo.png` (339 KB - StockOS uses React SVG component `StockOSLogo`)
  - [DELETE] `public/stockos-icon.png` (240 KB)
- **Unused Default Next.js Template SVGs**:
  - [DELETE] `public/file.svg`
  - [DELETE] `public/globe.svg`
  - [DELETE] `public/next.svg`
  - [DELETE] `public/vercel.svg`
  - [DELETE] `public/window.svg`

### 2.2 Runtime Dependency Optimization (`package.json`)

- **Remove `shadcn` CLI from runtime `dependencies`**:
  - `"shadcn": "^4.16.2"` is a CLI utility for code generation. Removing it from `dependencies` reduces unnecessary package declarations and node module bloat.

### 2.3 Dynamic Import Strategy (`next/dynamic`)

- **Dashboard Chart Component (`StockMovementChart`)**:
  - Convert static import of `StockMovementChart` in `src/app/(dashboard)/page.tsx` (or parent layout) to a dynamic client-only import with a lightweight loading fallback skeleton:
    ```tsx
    const StockMovementChart = dynamic(
      () => import('@/features/dashboard/components/stock-movement-chart').then(mod => mod.StockMovementChart),
      {
        ssr: false,
        loading: () => <ChartSkeleton />,
      }
    );
    ```
  - This ensures the heavy `Recharts` library bundle is only downloaded asynchronously when rendering the Dashboard on the browser, preventing initial render blocking.

---

## 3. Verification Plan

### Automated Checks
- Run `npm run build` to verify there are no missing asset references or broken imports.
- Run `npm run lint` to ensure code quality.

### Manual Verification
- Verify Dashboard loads smoothly and `StockMovementChart` renders correctly with dynamic loading fallback.
- Verify authentication pages function without relying on removed background PNGs.
