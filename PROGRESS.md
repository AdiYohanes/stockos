# StockOS Progress

## Current Phase

Implementation: Backend Foundation ticket 3 — persistent local Products integration (catalog/detail/lifecycle, opening stock, receipts/restock, sold-only Stock Out), minimal catalog reads, and real server/browser proof. Explicit approval received 2026-10-10; isolated local Supabase only. Tickets 1/2 remain implemented. Inventory stays explicitly demo; Dashboard/Reports/Settings/recovery/cloud/deployment and real-shop use remain outside this slice.

Preparation: Backend Planning/specification — target confirmed 2026-10-09. Supabase PostgreSQL/Auth, Next.js server boundaries, Vercel, and single-owner inventory scope are approved design choices. Implementation, migrations, dependencies, provisioning, and deployment are not authorized by documentation/spec approval.

## Completed

- [x] Authentication UI, mock login, and protected dashboard.
- [x] Dashboard: mock product totals, revenue, estimated net profit, out-of-stock summary, movement chart, attention list, quick actions, and stock health. Financial cards share a month-to-date demo period; net profit subtracts cost of goods sold and operating expenses. Low-stock alerts remain in stock health and the attention list.
- [x] Products: catalog, search/category/status filters, metrics, detail sheet, add/edit/delete, and stock in/out.
- [x] Warung Flow: Added purchase/selling price margin logic, batch/nota recording in Stock In, and explicit Stok Opname reconciliations.
- [x] Add Product Flow: Support selecting existing products from datalist in the Add Product modal to update stock (restock) instead of creating a new entry.
- [x] Stock Opname UI: Simplified Stock Adjustment modal to focus explicitly on Stock Opname (physical count vs system), removing unused code/reason fields for a simpler workflow.
- [x] Product creation success animation, shown only after successful creation, with reduced-motion support.
- [x] Inventory: stock levels, movement audit logs, filters, in/out/adjustment dialogs, and detail sheet with simple shelf locations.
- [x] Reports: mock valuation, velocity, reorder, supplier performance, inspection, and CSV exports.
- [x] Settings: shop profile, inventory rules, notification simulation, team roles, and reset confirmation.
- [x] Session-scoped Zustand stores for Products and Inventory; local UI state remains in feature hooks.
- [x] Removed warehouse and purchase-order routes/modules/stores, warehouse selectors and fields, and inter-warehouse transfers.
- [x] Stock-in receipt references no longer require purchase orders. Shop roles replace warehouse roles; existing browser settings migrate without resetting preferences.
- [x] Product table scroll containment and status-filter scrolling fixed for mobile.
- [x] Product, architecture, agent, design, README, and migration documentation aligned with small-shop scope.

## Data Boundaries

- Products and Inventory use independent fixtures/stores; their balances are not synchronized across features.
- Dashboard and Reports use mock analytics, not live store aggregates.
- Settings persist in browser localStorage; Products and Inventory remain session-scoped.
- Supplier metadata and report summaries remain. No standalone supplier management screen is active.
- No production backend, database, authentication, or authorization has been added.

## Verification — 2026-10-08

- `node scripts/check-domain-stores.cjs` passes: isolated stores, product CRUD, stock actions, rejected-action atomicity, immutable seeds, schema validation, and warehouse-free entities.
- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes; warehouse and purchase-order routes are absent from the route manifest.
- `npx eslint src scripts/check-domain-stores.cjs scripts/test-schemas.ts --quiet` passes with no errors.
- `git diff --check` passes.
- `python -I scripts/test-shop-scope.py http://localhost:3002` passes in Edge headless: authenticated active routes, desktop (1440px) and mobile (390px) without horizontal page overflow, no warehouse/PO navigation links, removed routes returning 404, product creation and searchable result, success animation, reduced motion, and no page errors.
- Targeted lint for eight CommonJS maintenance/statusline scripts passes with 0 errors and 3 existing unused-variable warnings. A file-specific override allows `require()` there; the application rule remains enabled, verified through ESLint's resolved configuration.
- Full `npm run lint` initially reported 2 errors and 903 warnings after that fix; both errors came from a nested `.claude/worktrees` checkout. Nested worktrees are excluded from this checkout's lint scope.
- A subsequent zero-warning ESLint run reproduced 224 warnings: 188 in installed Impeccable tooling, 33 unused application bindings, and 3 unused maintenance imports. Installed skill tooling is now outside application lint scope; unused project bindings/imports have been removed without disabling those rules. Final zero-warning lint, TypeScript, domain checks, and build verification after cleanup remain pending because command execution is blocked by the permission service.
- Browser coverage does not constitute a full keyboard, contrast, or visual-regression audit. Other CRUD flows and saved-settings migration are not covered by this scope smoke test.

## Backend Preparation — 2026-10-09

- [x] Added `docs/BACKEND_PLAN.md`: documentation ownership, current integration gaps, proposed domain/logical schema, operation contracts, backend boundaries, authentication/authorization and middleware/proxy responsibilities, frontend integration, verification, operations, and approval gates.
- [x] Aligned `PRD.md`, `ARCHITECTURE.md`, and `AGENTS.md` with documentation-only preparation while retaining Frontend Foundation as the implementation phase.
- [x] Confirmed business scope through design interview: one owner, integer stock, sold-only stock out, weighted-average modal, stock-based Potensi Pendapatan/Potensi Laba Kotor, zero-stock archive, auditable corrections, and live inventory reports.
- [x] Selected Supabase PostgreSQL/Auth, session-scoped clients/native transactional RPCs, Next.js Server Components/Server Actions, and Vercel.
- [x] Added `GLOSSARY.md`, `docs/DATABASE.md`, `docs/API_CONTRACT.md`, and `docs/FULLSTACK_SPEC.md`; aligned entry points, PRD/architecture/rules, and delivery/test gates.
- [x] Owner approved the primary test seam: real PostgreSQL/Auth server operations plus browser smoke coverage.
- [x] Published `/to-spec` as [GitHub Issue #4](https://github.com/AdiYohanes/stockos/issues/4) with `ready-for-agent`. The label/spec is not implementation permission.
- [ ] Obtain separate implementation approval and perform provider bootstrap/email/session and transaction/security proof.

No backend code, executable schema, migration, dependency, infrastructure, or production authentication was added. Design documents describe the confirmed target, not delivered runtime behavior. Existing mock UI still needs the documented integration changes.

Documentation checks: local links, whitespace, and required `/to-spec` headings pass across the ten relevant documents; targeted `git diff --check` passes with LF/CRLF conversion warnings. GitHub Issue #4 and its readiness label were verified. Consistency review corrections cover bootstrap recovery/resend/password mode, live-session RPC checks, explicit table/function grants, revision defaults, found-stock purchase evidence, and archive replay semantics. The documented final-unit cost rounding example was checked with exact Decimal arithmetic. Application lint/type/build/domain/browser tests were not rerun for this documentation-only task.

## In Progress

- Backend Foundation tickets 1 and 2 are verified against isolated local Supabase. UI/Server Action integration, full recovery, reports/settings persistence, external SMTP deliverability, cloud provisioning, and production deployment remain pending separate approval gates.
- Final verification of ESLint warning cleanup on legacy frontend files remains pending.

## Backend Foundation — Ticket 1 Auth (2026-10-09)

- [x] Singleton owner setup protected by server-side secret (`STOCKOS_SETUP_SECRET`) with sliding-window throttle in PostgreSQL (`stockos_private.auth_throttle`).
- [x] Invitation email verification via local Mailpit without exposing tokens or passwords.
- [x] Initial password creation with OTP AMR verification; invitation session prohibited from accessing owner business operations.
- [x] Password login with password AMR verification and live `auth.sessions` checks in PostgreSQL RPC.
- [x] Server-side session revocation on logout (`admin.signOut` + `auth.signOut`); retained JWTs rejected by RPC immediately after server logout.
- [x] Mock authentication removed; session client uses HttpOnly/SameSite cookies.
- [x] Verified via isolated Supabase PostgreSQL RPCs (`node scripts/check-owner-auth.mjs` PASS) and Playwright browser smoke tests (`scripts/test-login.py` PASS, `scripts/test-shop-scope.py` PASS).
- [x] TypeScript check (`tsc --noEmit`) and Next.js build (`next build`) pass with 0 errors.

## Backend Foundation — Ticket 2 Stock RPC (2026-10-09)

- Private `products`, `inventory_events`, `administrative_events`, and durable successful `mutation_requests`; native bounds, references, RLS, restrictive table/helper grants, fixed-search-path owner RPCs.
- Product create/opening, metadata edit, archive/reactivation; exact receipt/sold/opname/modal costing, revision conflicts, linked evidence, canonical retry results, request-first locks, and atomic rollback. Product/history reads are bounded and return decimal/revision strings.
- `node scripts/check-stock-foundation.mjs <dedicated-status.json>` passes against disposable `stockos-stock-proof` (API 55541, DB 55542, Mailpit 55544). Coverage includes exact spec examples/final-unit residual, free goods/cartons, lifecycle, stale revisions/replays, concurrent oversell/same-request/SKU/archive-receipt races, strict inputs, pagination, OTP/unbound/expired/revoked access, grants, and injected evidence failure with successful retry. Captured fixture data cleared after tests; original `stockos-auth` resource untouched.
- Auth baseline GRANT typo corrected without adding an endpoint. Supabase reset to auth migration followed by `migration up` passes; full clean migration reset and subsequent RPC checks pass on empty dedicated fixture only.
- Existing `check-owner-auth.mjs` passes when its fixed fixture identity/ports are adapted in memory to the dedicated stock proof resource; provider signup remains disabled.
- `node scripts/check-domain-stores.cjs` (includes `test-schemas.ts`), `node scripts/check-dashboard-metrics.cjs`, `npx tsc --noEmit --pretty false`, `npm run build`, focused zero-warning script ESLint, and `git diff --check` pass.
- Full `npm run lint` fails on unrelated existing frontend: four unescaped quotes in dashboard `stock-in-modal.tsx:181,184`, effect state copies in `inventory-header.tsx:25` and `products-toolbar.tsx:41`; 10 existing warnings. These files remain outside ticket 2.
- Two-axis code review completed against ticket 2 scope. No confirmed standard/spec defects remain; spec suggestions for omitted unit/minStock conflict with the required-input contract, and settings evidence belongs to a later approved slice. Operation branching/replay duplication retained instead of adding speculative abstractions. Review follow-up tightened native success/count null checks and fixture ownership; affected checks pass again.
- Browser smoke not rerun: no UI integration or UI changes in this ticket. Reports/settings/recovery/cloud/real-shop readiness are not delivered.

## Backend Foundation — Ticket 3 Products Integration (2026-10-10)

- [x] Connected Products frontend to persistent local Supabase backend via signed Server Actions and owner-checked PostgreSQL RPCs (`stockos_list_products`, `stockos_get_product`, `stockos_create_product`, `stockos_update_product`, `stockos_archive_product`, `stockos_reactivate_product`, `stockos_record_stock_in`, `stockos_record_stock_out`, `stockos_product_metrics`, `stockos_text_suggestions`).
- [x] Server-authoritative catalog reading URL search parameters (`search`, `category`, `status`, `archive`, `sort`, `page`, `pageSize`) with default pageSize 25, maximum 100.
- [x] Product detail sheet fetching by ID, with separately paginated inventory history without unbound embedded arrays.
- [x] Product creation with optional opening stock and mandatory purchase total for positive stock (zero IDR allowed for free goods).
- [x] Restock by explicit ID/SKU selection using `stockos_record_stock_in`.
- [x] Carton mode calculating base quantity via `cartonCount * unitsPerCarton`.
- [x] Metadata edit guarded by `expectedMetadataVersion`; SKU and unit locked once inventory history exists; selling price changes do not alter inventory valuation.
- [x] Zero-stock archive and reactivation using `metadataVersion` and `stockVersion`.
- [x] Sold-only Stock Out using `stockos_record_stock_out`.
- [x] Native PostgreSQL read RPCs migration `20261010000000_product_reads.sql` providing catalog metrics and prefix suggestions with fixed search path and restrictive grants.
- [x] Strict Zod validation (`product-rpc.schema.ts`), exact 6-decimal money formatting (`formatProductMoney()`), and request-scoped signed Supabase client (`createSessionClient()`).
- [x] Mutation resilience: client-generated UUID, frozen request payload, exact requestId retry on uncertain network failures; conflicts preserve drafts and require review.
- [x] Verified via `scripts/test-products.py` against Edge headless: real pointer clicks, login, creation, opening valuation, page reload/new session persistence, carton restock, sold movements, price edit without valuation change, two-session conflict review, lost-response retry/replay, detail sheet focus trap/Escape, desktop (1440px) and mobile (390px) responsive layout with no horizontal overflow, and fixture cleanup.
- [x] Suite passes: `scripts/check-stock-foundation.mjs` PASS, `scripts/check-domain-stores.cjs` PASS, `scripts/check-dashboard-metrics.cjs` PASS, `scripts/test-schemas.ts` PASS, `npx tsc --noEmit --pretty false` PASS, `npm run build` PASS, focused ESLint on Products PASS (0 errors, 0 warnings), `git diff --check` PASS.
- [x] Inventory UI remains mock with an explicit demo banner; Dashboard/Reports/Settings remain mocked. Cloud provisioning, deployment, and real-shop use remain outside this slice.

## Next

- [ ] Validate small-shop wording and sample catalog with users.
- [ ] Finish pending frontend verification before claiming the frontend is fully verified.
- [ ] Follow confirmed `docs/BACKEND_PLAN.md` after separate implementation approval; verify provider/operational gates without expanding scope.
- [ ] Start Backend Foundation only after explicit implementation approval and phase updates.
