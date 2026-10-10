# StockOS Progress

## Current Phase

Implementation: Backend Foundation ticket 8 — local password recovery, approved 2026-10-10. Provider-verified recovery and session-purpose enforcement must revoke all owner sessions before fresh login; real Auth/browser proof is required. Tickets 1–7 implemented. Cloud, external SMTP, deployment, and real-shop use remain outside this slice.

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
- [x] Products UI connected to persistent backend; Inventory UI moved to persistent backend in Ticket 4.

## Backend Foundation — Ticket 4 Inventory Integration (2026-10-10)

- [x] Connected Inventory frontend (`/inventory`) to persistent local Supabase backend via signed Server Actions and owner-checked PostgreSQL RPCs (`stockos_list_products`, `stockos_list_inventory_events`, `stockos_record_stock_in`, `stockos_record_stock_out`, `stockos_record_opname`, `stockos_adjust_inventory_cost`, `stockos_product_metrics`, `stockos_text_suggestions`).
- [x] Server-authoritative reads using URL search parameters (`tab`, `q`, `category`, `status`, `type`, `sort`, `order`, `page`, `pageSize`) via Next.js App Router Server Component (`src/app/(dashboard)/inventory/page.tsx`).
- [x] Removed demo notice banner (`inventoryDemo`) from inventory header.
- [x] Physical Stok Opname (`stockos_record_opname`) in `stock-adjustment-modal.tsx` with physical count verification, calculated delta feedback, zero-diff evidence retention, whole-IDR `foundPurchaseTotal` requirement when prior stock was zero, and `expectedStockVersion` concurrency checks.
- [x] Stock In (`stockos_record_stock_in`) in `stock-movement-modal.tsx` supporting carton mode (`cartonCount * unitsPerCarton`), whole-IDR `purchaseTotal`, free goods handling (0 IDR), and note/reference tracking.
- [x] Sold-only Stock Out (`stockos_record_stock_out`) in `stock-movement-modal.tsx` with positive integer quantity and reference.
- [x] Movement audit trail tab (`inventory-movements-table.tsx`) reading server-paginated `stockos_list_inventory_events` with type/date filters and pagination.
- [x] Item detail sheet (`inventory-detail-sheet.tsx`) fetching live item-specific event logs via `listInventoryEventsAction({ productId })`.
- [x] Preserved `store.ts` and `mock-data.ts` to satisfy regression check scripts (`check-domain-stores.cjs`).
- [x] Verified via `scripts/test-inventory.py` against Edge headless: real pointer clicks, login, persistent catalog balances, physical count opname discrepancy (+2 Pcs), carton stock in (+10 Pcs), sold stock out (-5 Pcs), movements audit trail with live transaction references, detail sheet live history, mobile (390px) and desktop (1440px) responsive layout with no horizontal overflow, and clean fixture cleanup.
- [x] Suite passes: `scripts/check-stock-foundation.mjs` PASS, `scripts/check-domain-stores.cjs` PASS, `scripts/test-schemas.ts` PASS, `npx tsc --noEmit` PASS, `npm run build` PASS (dynamic server-rendered `/inventory`).
- [x] Dashboard/Reports/Settings remain mocked. Cloud provisioning, deployment, and real-shop use remain outside this slice.

## Backend Foundation — Ticket 5 Reports Integration (2026-10-10)

- [x] Connected Reports frontend (`/reports`) to persistent local Supabase backend via signed Server Actions and owner-checked PostgreSQL RPCs (`stockos_get_valuation_report`, `stockos_get_movement_report`, `stockos_get_low_stock_report`).
- [x] Removed unsupported supplier performance tab from UI and Server navigation, retaining stock-based Valuation, Movement Velocity, and Low-Stock Reorder Risk views.
- [x] Server-authoritative reads using URL search parameters (`tab`, `timeframe`, `q`, `category`) with parallel data fetching via Next.js App Router Server Component (`src/app/(dashboard)/reports/page.tsx`).
- [x] RFC 4180 CSV export (`exportReportAction`) with formula injection neutralization (`='`, `+'`, `-'`, `@'`), 10,000-row limit, and 5 MiB size cap.
- [x] Migration `20261010010000_reports_reads.sql`: owner-checked, security-definer, restricted search path, strict JSON validation (`allowed_keys`), and granular grants to `authenticated`.
- [x] Slide-over inspection sheet wired to live entity selections with reactive derived state.
- [x] Verified via `scripts/test-reports.py` against Edge headless: owner setup, product creation, movements/opname recordings, RPC output validation, browser navigation across all tabs, search/category filtering, and RFC 4180 export modal confirmation.
- [x] Suite passes: `scripts/check-stock-foundation.mjs` PASS, `scripts/check-domain-stores.cjs` PASS, `scripts/check-dashboard-metrics.cjs` PASS, `scripts/test-schemas.ts` PASS, `npx tsc --noEmit` PASS, `npm run build` PASS (dynamic server-rendered `/reports`).
- [x] Dashboard remains mocked; Settings connected to persistent backend in Ticket 6. Cloud provisioning, deployment, and real-shop use remain outside this slice.

## Backend Foundation — Ticket 6 Settings Integration (2026-10-10)

- [x] Connected Settings frontend (`/settings`) to persistent local Supabase backend via signed Server Actions and owner-checked PostgreSQL RPCs (`stockos_get_shop_settings`, `stockos_update_shop_settings`).
- [x] Server-authoritative reads via Next.js App Router Server Component (`src/app/(dashboard)/settings/page.tsx`) with verified owner session enforcement.
- [x] Migration `20261010020000_settings_persistence.sql`: alters `mutation_requests` to support `update_shop_settings`, alters `administrative_events` to make `product_id` nullable and support `settings_updated`, creates singleton DTO and RPC functions with optimistic concurrency control (`expectedVersion`) and SHA-256 idempotency caching.
- [x] Optimistic Concurrency Control (OCC): Monotonic `version` checking prevents lost updates across tabs/sessions, surfacing clear conflict warnings while preserving the owner's modified form draft.
- [x] Client UUID idempotency: Client-generated UUID `requestId` returns cached results on replay without duplicate administrative audit logging.
- [x] Administrative audit trail: State transitions logged in `stockos_private.administrative_events` capturing before/after snapshots.
- [x] Warung scope enforcement (Stories 38–39): Removed unsupported mock team management and notification simulation tabs, removed fake accounting toggles (FIFO/LIFO, multi-currency, negative stock, batch expiry), and ensured system reset returns creation defaults without wiping operational product or stock data.
- [x] Suite passes: `scripts/test-schemas.ts` PASS, `npx tsc --noEmit` PASS, `npm run build` PASS (dynamic server-rendered `/settings`), focused ESLint on Settings PASS (0 errors, 0 warnings).
- [x] Dashboard UI data remains mocked. Cloud provisioning, deployment, and real-shop use remain outside this slice.

## Backend Foundation — Ticket 7 Dashboard Integration (2026-10-10)

- [x] Connected Dashboard frontend (`/`) to persistent local Supabase backend via Server Component data fetching and owner-checked PostgreSQL RPC `stockos_get_dashboard`.
- [x] Replaced demo month-to-date financial cards with glossary-defined Potensi Pendapatan (`current_stock * selling_price`) and Potensi Laba Kotor (Potensi Pendapatan minus weighted-average inventory cost value).
- [x] Migration `20261010030000_dashboard_reads.sql`: owner-checked, security-definer, restricted search path, strict JSON validation (`allowed_keys`), timezone-aware intervals (`stockos_private.shop_settings.timezone`), aggregating active products, stock health, attention list, recent events, and 7d/30d movements in the shop timezone.
- [x] Strict Zod validation (`dashboard-rpc.schema.ts`), decimal string parsing, and server-only query helper `getDashboard()`.
- [x] Live Inventory Health distribution (healthy, low stock, out of stock) with Rupiah formatting.
- [x] Bounded Need Attention table populated from live `current_stock <= min_stock` active products.
- [x] Stock Movement Chart accepting live 7d and 30d inbound/outbound volume with net flow calculations.
- [x] Wired Dashboard quick actions (`ProductAddModal` and `StockMovementModal`) with optimistic router refresh on commit.
- [x] Suite passes: `scripts/test-schemas.ts` PASS, `scripts/check-domain-stores.cjs` PASS, `scripts/check-dashboard-metrics.cjs` PASS, `npx tsc --noEmit` PASS, `npm run build` PASS (dynamic server-rendered `/`), focused ESLint on Dashboard PASS (0 errors, 0 warnings).

## Backend Foundation — Ticket 8 Password Recovery (2026-10-10)

- Implementation approved for isolated local recovery and all-owner-session revocation; cloud/external SMTP/deployment remain excluded.
- Public TDD seam: real Auth/PostgreSQL RPC and browser. Browser RED confirmed: `/reset` had no `#email` input and displayed recovery unavailable.
- [x] Real reset/new-password/login actions and translated invite/recovery UI; private purpose evidence binds live OTP session, confirmed owner, expiry, and completion phase. Concurrent writes fail closed; confirmed completion retries revocation only. Global sign-out precedes login success; recovery OTP cannot access business RPCs.
- [x] `node scripts/check-owner-recovery.mjs <recovery-status.json>` PASS: invitation/recovery isolation, expired/private evidence, concurrent completion, native password update, all old JWT/refresh token denial, fresh login. `node scripts/check-owner-auth.mjs <recovery-status.json>` PASS: invitation/auth regression.
- [x] `python -I scripts/test-recovery.py http://localhost:3004 <recovery-status.json>` PASS against real Auth/PostgreSQL and Edge: generic owner/unknown acknowledgement; Auth outage errors/draft retry; healthy-Auth SMTP failure without enumeration; same-password rejection; global revocation failure and revoke-only retry with changed draft; direct anonymous/password-session/unbound action denial and live recovery-to-invitation action denial; invitation-to-recovery action uses a stale invitation session (live cross-purpose isolation proved at RPC seam, not that action path); ambiguous password-write/evidence failure, fail-closed retry, and successful fresh recovery with different password; callback malformed/duplicate/unsafe redirect/replay denial; old browser-session denial; keyboard password toggle; 1440/390/320px without overflow.
- [x] `node scripts/check-domain-stores.cjs`, `node scripts/check-dashboard-metrics.cjs`, `npx tsc --noEmit --pretty false`, focused auth/scripts ESLint `--max-warnings 0`, `npm run build`, and `git diff --check` PASS. Two-axis code review fixes include unexpected-error trace IDs, feature-owned callback logic, and explicit partial-outcome warning. Tiny existing auth getter duplication retained without new abstraction.
- Full repository verification is **not green**: `npm run lint` reports 6 unrelated errors (Dashboard unescaped entities; Inventory cascading effects) and 4 unused-binding warnings. `scripts/check-stock-foundation.mjs` fails its broad private-function grant assertion because existing `stockos_private.shop_settings_dto` remains callable; recovery private helper/table grants pass. No unrelated code/grant fix included. Other feature browser suites retain existing fixture/port assumptions and were not rerun against recovery fixture.
- Next.js 16.3 development logging exposed fixture action arguments before configuration fix. `next.config.ts` now disables Server Function/incoming-request logging to avoid password/callback-token output; earlier disposable fixture credentials were revoked/deleted, never production credentials. Existing Auth/stock proof resources and `.env.local` unchanged. Shared infrastructure health failures return retryable errors; account-specific delivery failures remain generic acknowledgement, which does not confirm delivery.
- Isolated local proof only; external SMTP deliverability, cloud provisioning, deployment, and real-shop use remain unverified/outside scope.

## Next

- [ ] Validate small-shop wording and sample catalog with users.
- [ ] Finish pending frontend verification before claiming the frontend is fully verified.
- [ ] Follow confirmed `docs/BACKEND_PLAN.md` after separate implementation approval; verify provider/operational gates without expanding scope.
- [ ] Start Backend Foundation only after explicit implementation approval and phase updates.
