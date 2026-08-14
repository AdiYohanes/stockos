# Design Spec: i18n Layout Consistency & Defensive CSS

## Problem Statement
Differences in text length between English (EN) and Indonesian (ID) cause UI layout breakage, uneven grid cards, broken button heights, and unwanted layout shifts across StockOS screens (specifically visible in Quick Actions and Toolbar components).

## Proposed Solution: Hybrid Approach
A combination of Defensive CSS architecture, native hover tooltips, and concise microcopy standardisation.

### 1. Component Defensive CSS (`src/features/dashboard/components/quick-actions.tsx`)
- **Equal Height Cards**: Apply `grid items-stretch` on parent container so all cards match height.
- **Fixed Dimension Icon & Badge**: Add `shrink-0` on icon container and badge pill to prevent squishing when text expands.
- **Flex Text Boundaries**: Add `min-w-0 flex-1` to text flex column to safely handle text overflow without pushing siblings.
- **Controlled Line Clamping & Tooltip**: Replace standard `truncate` with `line-clamp-2` for descriptions + set HTML `title` attributes on title and description tags for hover access.

### 2. Microcopy Tuning (`src/features/dashboard/mock-data.ts` & `src/lib/i18n/translations/id.ts`)
Standardise Indonesian text to match English character length density while retaining operational clarity:
- `add-product`: "Tambah Produk" | "Daftarkan produk baru dengan SKU & barcode" -> "Daftar produk baru SKU & barcode"
- `stock-in`: "Stok Masuk" | "Terima pengiriman pembelian masuk" -> "Terima barang & PO masuk"
- `stock-out`: "Stok Keluar" | "Catat pengeluaran, penjualan atau penggunaan" -> "Catat pengeluaran / penjualan"
- `transfer-stock`: "Transfer Stok" | "Pindahkan inventaris antar gudang" -> "Transfer barang antar gudang"

### 3. Global Defensive CSS Guidelines for i18n
- All buttons with icons + text: `whitespace-nowrap shrink-0` on text/badge elements.
- All dynamic text elements: `min-w-0` on parent container to enable clean truncation/clamping.
- Hover feedback: Set `title={text}` whenever truncation or clamping is applied.

## Verification Plan
1. Toggle language between EN and ID on Dashboard Quick Actions.
2. Verify card height, spacing, alignment, and visual symmetry are 100% identical in both languages.
3. Test hover states to ensure truncated/clamped text remains readable.
