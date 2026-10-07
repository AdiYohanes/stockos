# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: Solo small business owners, retail shop operators, and compact operational teams (1–5 members) managing physical stock across 1–2 retail locations or backrooms.

Situation: Overgrown manual spreadsheets (Excel/Google Sheets) or overwhelmed by heavyweight enterprise ERP systems (NetSuite, SAP, Odoo). Need quick daily operational clarity without configuration friction.

Job to be done: Check inventory health, identify low/out-of-stock items, execute quick stock in/out/adjustment movements, track purchase orders and supplier receipts, and inspect warehouse levels in seconds.

## Product Purpose

StockOS is a lightweight web stock management system / mini ERP. It delivers immediate operational inventory visibility and fast, low-friction stock tracking.

Success means an operator can log in, assess low-stock alerts, record a stock movement, and receive incoming purchase order items in seconds without navigating multi-tiered enterprise menus or complex accounting configuration.

## Positioning

Anti-ERP operational speed: Sits intentionally between fragile spreadsheets and bloated enterprise ERPs. Zero complex accounting ledgers, zero multi-step approval hierarchies, zero setup friction. High-density scanning with tactile, instant operational response.

## Operating Context

- Daily routines: Morning inventory status scans, midday rapid stock intake and stock out logs, weekly supplier PO creations, periodic stock counts and audits.
- Physical setting: Desktop laptop at a retail counter or back-office desk; secondary use on tablet or mobile browser for floor checks.
- Artifacts: SKUs, purchase orders, supplier bills, packing slips, warehouse bin tags.

## Capabilities and Constraints

Capabilities (Frontend Foundation):
- Mock authentication (login, signup, password reset).
- Dashboard: inventory health overview, KPI cards, stock movement visualizer, urgent attention items, quick-action shortcuts.
- Products catalog: high-density table, multi-facet filtering, SKU tracking, detail slide-over sheet, CRUD modals.
- Inventory management: real-time stock balances, audit logs, quick stock in/out/adjust modals.
- Warehouses: dual view (grid/table), capacity gauges, inter-warehouse transfer modal, zone breakdown.
- Suppliers: performance tracking, tier badges, contact profiles, order history.
- Purchase Orders: lifecycle statuses (Draft, Ordered, Received, Cancelled), intake reception with auto stock-in.
- Settings: company profile, inventory alert thresholds, valuation rules (FIFO/LIFO/Average), team roles, safe mock reset.

Constraints:
- Current phase is strictly Frontend Foundation.
- In-memory mock data only; no real backend database, migrations, or live APIs.
- Production auth and persistence deferred to future backend phase.
- Explicitly out of scope: General ledger accounting, complex payroll, multi-company consolidation, advanced forecasting.

## Brand Commitments

- Name: StockOS
- Visual Identity: "Hybrid Neo-SaaS" (70% Clean SaaS + 30% Neobrutalism).
- Core Brand Tokens: Electric Purple (`#543AFD`), Ink Black borders (`#000000`), tactile micro-press interactions (`2px 2px 0px #000000` shadows), Space Grotesk for logo/brand headlines, Space Mono for SKUs/tags, Inter for UI.
- Voice: Precise, punchy, operational, confident, zero enterprise jargon.

## Evidence on Hand

- Committed source code: Next.js 16 App Router (`src/app`), React 19, Tailwind CSS v4, Base UI, Recharts.
- Complete mock datasets: `src/features/products/mock-data.ts`, `src/features/inventory/mock-data.ts`, `src/features/warehouses/mock-data.ts`, `src/features/suppliers/mock-data.ts`, `src/features/purchase-orders/mock-data.ts`.
- Established design tokens and rules: `design.md`.
- Absences: No live production backend, no user testimonials or external analytics. Future work must not fabricate customer claims or benchmark statistics.

## Product Principles

- Operational Velocity First: Fast scanning and rapid actions outrank decorative layout. Common actions take minimal clicks.
- Progressive Density: Provide high-density data on desktop with Space Mono tags and tactile controls; gracefully adapt to tablet/mobile without hiding critical inventory numbers.
- Zero ERP Bloat: Resist feature creep; keep workflows simple, direct, and focused on inventory realities.
- Tactile Clarity: Every interactive element gives instant visual and tactile feedback (clear hover states, micro-shadow presses, obvious focus rings).
- Graceful Isolation: Keep mock layers isolated so swapping in real APIs later requires zero UI refactoring.

## Accessibility & Inclusion

- Semantic HTML throughout tables, forms, and dialogs.
- Clear visible focus states with high-contrast outlines (`2px 2px 0px #543AFD`).
- Minimum contrast ratio 4.5:1 for body and data cell text against light canvas.
- Accessible keyboard navigation across slide-overs, dropdowns, and modal dialogs via accessible Base UI primitives.
