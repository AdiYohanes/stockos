# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: Owners and staff of one small shop (warung), managing daily physical stock at a single location.

Situation: Manual spreadsheets are hard to keep current; enterprise ERP workflows add unnecessary setup and steps.

Job to be done: Check stock health, identify low/out-of-stock items, record stock in/out/adjustments, and inspect movement history quickly.

## Product Purpose

StockOS is a lightweight stock management web application for small shops. It provides clear stock visibility and direct daily stock tracking.

Success means an operator can log in, assess stock alerts, add a product, and record received or sold goods without warehouse selection or a purchase-order lifecycle.

## Positioning

Simple stock operations, not an ERP. High-density scanning and direct actions without accounting ledgers, purchasing approvals, or multi-location administration.

## Operating Context

- Daily routines: Morning stock checks, incoming goods, sales-related stock out, periodic physical counts.
- Physical setting: Desktop or laptop at a shop counter; tablet/mobile for shelf checks.
- Artifacts: Product names, SKUs, supplier receipts, sales references, shelf labels.

## Capabilities and Constraints

Capabilities (Frontend Foundation):
- Mock authentication (login, signup, password reset).
- Dashboard: stock health, summary cards, movement chart, urgent attention items, quick actions.
- Products: catalog, search/filter, details, add/edit/delete, stock in/out, brief successful-creation animation.
- Inventory: stock levels, movement history, stock in/out/adjustments, optional shelf location.
- Reports: mock valuation, movement velocity, restock risk, and supplier-delivery summaries.
- Settings: shop profile, thresholds, valuation preferences, mock team roles, browser-local preferences.

Constraints:
- Current phase is strictly Frontend Foundation.
- Product and inventory collections are independent session-scoped mocks; dashboard/report analytics are fixtures, not live aggregates.
- Settings preferences use localStorage. No production database, migrations, live APIs, or production authentication.
- Warehouses, multiple locations, transfers, and purchase orders are outside scope, not implicit future modules.
- No standalone supplier-management module; supplier metadata and mock report summaries remain.
- General ledger, payroll, multi-company consolidation, and advanced forecasting remain outside scope.

## Brand Commitments

- Name: StockOS
- Visual identity and tokens: `design.md` is authoritative; preserve Hard Neobrutalism.
- Core tokens: Electric Purple (`#543AFD`), heavy black borders, square geometry, hard offset shadows.
- Typography: Archivo headings, Space Grotesk UI, Space Mono data.
- Voice: Precise, operational, understandable to shop staff; no enterprise jargon.

## Evidence on Hand

- Source code: Next.js App Router, React 19, Tailwind CSS, Base UI, Recharts.
- Mock datasets: `src/features/products/mock-data.ts`, `src/features/inventory/mock-data.ts`, `src/features/dashboard/mock-data.ts`, `src/features/reports/mock-data.ts`.
- Design rules: `design.md`.
- No production backend, user testimonials, or external analytics. Do not fabricate customer claims or benchmarks.

## Product Principles

- Fast daily operations outrank decoration.
- Keep important stock numbers visible on desktop, tablet, and mobile.
- Reuse established components; avoid ERP feature creep.
- Give clear success, validation, and error feedback.
- Keep mock implementations isolated and replaceable.

## Accessibility & Inclusion

- Semantic tables, forms, and dialogs.
- Visible keyboard focus and meaningful control labels.
- At least 4.5:1 contrast for body/data text.
- Accessible keyboard interaction through existing UI primitives.
- Respect reduced-motion preferences for success animations.
