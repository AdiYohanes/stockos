# StockOS Progress

## Current Phase

Implementation: Backend Foundation ticket 1 — single-owner setup, invitation/email verification, initial password setup, login, resend, and logout. Explicit approval received 2026-10-09; isolated local Supabase only. Other features remain frontend mocks.

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

- Backend Foundation Ticket 1 completed and verified against local Supabase. Full recovery, Gate A stock transactions and persistence, external SMTP deliverability proof, cloud provisioning, and production deployment remain pending separate approval gates.
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

## Next

- [ ] Validate small-shop wording and sample catalog with users.
- [ ] Finish pending frontend verification before claiming the frontend is fully verified.
- [ ] Follow confirmed `docs/BACKEND_PLAN.md` after separate implementation approval; verify provider/operational gates without expanding scope.
- [ ] Start Backend Foundation only after explicit implementation approval and phase updates.
