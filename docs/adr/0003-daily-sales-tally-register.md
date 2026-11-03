# ADR 0003 — Daily Sales Tally Register (Kasir Harian)

## Status

Accepted 2026-11-03 (design only; implementation requires separate approval).

## Context

Small shops (warung) experience rapid waves of walk-in customers (e.g. school children, neighbors) buying small snack or beverage items. Requiring cashiers to process individual multi-step checkout orders, issue invoices, or wait for per-click database requests introduces unacceptable friction and does not match warung operational reality. 

At the same time, maintaining a full cash drawer ledger, customer accounts, or payment gateway infrastructure contradicts the core inventory-first and single-warung scope defined in `PRD.md` and `GLOSSARY.md`.

## Decision

Implement **Kasir Harian (Daily Sales Tally Register)** at `/kasir` as a high-speed, day-long tally sheet that reconciles and deducts stock in a single batch at the end of the day.

- **Route & Navigation**: Located at `/kasir`, labeled "Kasir" with calculator/receipt iconography in both desktop sidebar and mobile navigation.
- **Client-Side State**: Tap-to-increment tally counter stored in browser `localStorage`. Guarantees zero network latency during peak walk-in traffic and resilience against accidental browser refreshes.
- **Layout & Visual Design**: Hard Neobrutalist design (`design.md`):
  - Left area (65% on desktop): Product card grid displaying photo, product name, selling price, and real-time stock badge. Filterable by category pills and instant search. Out-of-stock items are visually disabled.
  - Right area (35% on desktop, sticky): Running tally slip displaying itemized quantities, inline increment/decrement/direct-input controls, subtotal per item, and grand total.
  - Mobile (< 1024px): Full-width product catalog with bottom sticky floating bar showing item count and total value, expanding into a bottom Drawer/Sheet.
- **Pre-Posting Discrepancy Correction**: Quantities can be adjusted or removed directly on the tally slip before final closing. If any tally quantity exceeds available system stock, closing is blocked with an explicit validation alert.
- **Closing & Reconciliation Workflow ("Tutup Hari")**:
  - Modal displays total units sold and expected cash revenue (`Σ qty × sellingPrice`).
  - Optional input for "Uang Tunai Fisik Diterima" calculates cash discrepancy (Cocok / Kurang / Lebih) on-screen for the owner's immediate visibility.
  - Executes stock reduction via standard `stockOutAction` calls with uniform reference format `KASIR-YYYYMMDD` and audit note capturing cash reconciliation numbers.
  - Clears `localStorage` tally upon confirmed success.

## Consequences

- No new database tables or schema migrations needed; reuses proven `stockos_record_stock_out` RPC and `sold` event ledger.
- High-speed operational ergonomics for warung owners without risk of network bottleneck during sales rushes.
- Financial discrepancy insights are preserved in movement audit notes without expanding into an accounting software suite.

## Alternatives Considered

- **Conventional POS (Per-Transaction Checkout)**: Rejected because processing individual checkouts for every small warung transaction creates unnecessary UI friction and violates the agreed product scope.
- **Server-Side Session Drafts**: Rejected because continuous API calls for every click add latency and fail if the internet connection is unstable during store hours.
- **Dedicated Cash Register / Ledger Tables**: Rejected per YAGNI; StockOS tracks physical stock and inventory valuation, not double-entry cash ledgers.
