# StockOS Backend Plan

Updated: 2026-10-09. **Design confirmed; documentation/specification only. Backend not implemented.** The owner confirmed the interview design and approved server-operation integration testing plus browser smoke coverage. Published as [GitHub Issue #4](https://github.com/AdiYohanes/stockos/issues/4) with `ready-for-agent`; that label does not authorize implementation.

## 1. Sources of Truth

| Document | Responsibility |
| --- | --- |
| [PRD](../PRD.md) | Approved product behavior and scope |
| [Glossary](../GLOSSARY.md) | Canonical business vocabulary |
| [Architecture](../ARCHITECTURE.md) | Current frontend, target backend, security/data boundaries |
| [Database](DATABASE.md) | Entities, exact types/bounds, constraints, costing, atomic writes, grants, retry history |
| [Operation contract](API_CONTRACT.md) | Queries/Server Actions, inputs/results, validation/errors, retries/conflicts, exports/auth |
| [Fullstack spec](FULLSTACK_SPEC.md) | Issue-ready problem, solution, user stories, implementation/testing decisions |
| [Progress](../PROGRESS.md) | Actual delivery and verification status |
| [Agent rules](../AGENTS.md) | Scope and implementation approval gate |
| This plan | Integration order, verification/release gates, remaining operational setup |

No separate middleware document or empty architecture layers. Record ADRs only when a non-obvious, costly-to-reverse tradeoff needs durable rationale. No SQL, migrations, runtime code, dependency installation, infrastructure, or deployment in this task.

## 2. Confirmed Scope

- One warung, one owner, web only, online only. Owner signup requires a server setup secret and an unclaimed slot; email verification/login/recovery use Supabase Auth. No staff/team accounts or public multi-shop signup.
- Next.js Server Components read server-only data; Server Actions mutate. PostgreSQL/Supabase transactional RPCs own exact stock/cost arithmetic. Supabase Auth and Vercel hosting are selected; no ORM/separate backend/second REST API is required.
- Stock is whole base units. Cartons are per-receipt input conversion, not a second balance. Product selection for restock uses ID/SKU, not name merging.
- Receipts/opening stock require product purchase total in whole IDR; zero explicitly means free goods. No shipping or other charges. Modal uses exact weighted-average costing; selling-price changes never alter purchase cost.
- Stock Out records sold quantities manually, with no POS/payment/sale price. Opname handles physical discrepancies/corrections and never counts as sold volume. Counts without differences are retained; stale counts require review/recount.
- Append-only quantity/cost evidence, current-value modal correction with reason, atomic writes, no negative stock, durable idempotency, zero-stock archive/reactivation, immutable SKU/base unit after history.
- Potensi Pendapatan/Potensi Laba Kotor value current remaining stock at current selling prices minus its modal. No actual revenue, monthly sales income, net profit, or operating expenses.
- Reports: stock valuation/potentials, received/sold volumes by date interval, separate opname/modal evidence, threshold low/zero stock, and safe CSV. No supplier scores, unsupported velocity tiers, lead-time predictions, or days-to-empty.
- Settings: profile/timezone, creation defaults, browser-local display preferences. Fixed IDR/weighted costing/nonnegative stock/audit. No team, multi-currency/FIFO/LIFO, simulated email/webhook notifications, expiry-tracking switches, or factory wipe.

## 3. Current Implementation Gaps

Products/Inventory have independent session stores/fixtures and identities; Dashboard/Reports are fixtures. Settings use localStorage with controls unsupported by the agreed target. Auth/login/signup/reset are mocks. Carton inputs lack reliable conversion; stock-in entry points lack purchase-cost capture; zero-difference opname is currently rejected; metadata and deletion rules differ from the target.

Frontend final lint/type/build checks after warning cleanup remain pending; earlier smoke checks are not a full CRUD/keyboard/contrast/visual regression audit. No schema/provider provisioning/migrations exist. Documents describe a target, not delivered fullstack functionality.

## 4. Delivery Order After Explicit Implementation Approval

### Gate A — Auth and database foundation proof

- Read installed Next.js API guides; keep current feature boundaries and smallest client surface.
- In isolated test resources, prove provider admin provisioning with public signup disabled, email confirmation/password setup/recovery callbacks, owner binding, cookie/session refresh and revocation.
- Bootstrap uses durable singleton claim plus recoverable provider attempt; two initial requests cannot create two owners. Auth/provider calls cannot share a PostgreSQL transaction. Fail closed; never clear unresolved claims blindly.
- Establish versioned migrations for private business schema, singleton defaults, owner verification, exact native numeric calculations, RLS/restricted grants, and operation RPCs. No mock/demo products in production seeds.
- Prove transactional rollback, idempotency, and concurrency at the server-operation seam before wiring stock forms. If selected provider APIs cannot satisfy setup/security, report blocker instead of silently enabling public registration or introducing custom auth.

### Gate B — Products and shared inventory

- Implement documented product lifecycle and shared balance/modal/events, strict boundary schemas and decimal DTO mapping.
- Cover create/opening stock, metadata revisions, stock-in totals/cartons, sold quantities, stale opname, linked correction, cost adjustment, archive/reactivation, and replay identities.
- Replace independent mock stock mutation stores with server-authoritative reads. Keep local filters/drafts/modal state; do not mirror persistence into independently mutable Zustand balances.
- Reuse these operations from all forms/dashboard shortcuts. Adapt category/supplier suggestions, carton conversion, cost inputs, SKU locking, and zero-difference count flow.

### Gate C — Reports, dashboard, settings

- Replace fixtures with snapshot-consistent queries; financial cards use glossary labels and stock potentials with explanatory text, not demo month-to-date revenue/profit.
- Implement valuation, period volumes, and threshold alerts; remove unsupported supplier/forecast screens and controls.
- Generate bounded sanitized CSV from the same validated data. Apply IANA timezone filtering and UTC evidence.
- Persist shared profile/defaults; preserve browser-local presentation preferences without importing legacy operational settings. Remove team/notifications/multi-currency/costing/negative-stock/expiry promises. Reset never deletes operational data.

### Gate D — Private fullstack release

- Complete existing frontend verification and approved integration/browser coverage.
- Validate secrets, public-provider access denial, setup recovery, report accuracy, old-session denial, provider email delivery, deployment runtime compatibility, connection/service limits, and accessibility of affected flows.
- Deploy only after separate deployment permission and plan/cost confirmation. First release uses nonproduction/private-test data; no real-shop migration inferred from fixtures.
- Update PROGRESS with actual commands/results and still-open gaps; do not claim production readiness from a successful build alone.

## 5. Approved Test Seam and Acceptance Matrix

Primary seam: authenticated server queries/actions against isolated real PostgreSQL and Supabase Auth. Browser smoke supplements owner journeys; do not verify domain correctness solely through hook/store mocks or UI visibility. Existing assert/schema/store checks and shop-scope browser script are prior art, not production transaction proof.

| Case | Required observable outcome |
| --- | --- |
| Two owner setups | One durable claim/binding; other fails closed; no second authorized owner |
| Unconfirmed/unrelated/anonymous user | No business reads/writes/export; no resource existence leak |
| Provider setup timeout | Same recorded attempt recoverable; slot never blindly reassigned |
| Recovery/session expiry | Valid token/purpose required, allowlisted redirect, old access denied as configured/proven |
| Product/opening failure | No partial product/balance/audit/retry write |
| SKU normalization/race | One matching SKU identity across active/archive |
| Same request replay | One write; original result returned; changed payload gets conflict |
| Two sells of 4 from 5 | Only one succeeds; remaining stock 1; audit agrees |
| Receipt failure | Balance/modal/evidence unchanged |
| Mixed-price receipts/free goods | Exact current cost sum and weighted average; no hidden cost inference |
| Final sold unit | Quantity and cost both zero; no rounding residue |
| Stale count/cost edit | Conflict, no overwrite; draft retained and review required |
| Same physical count | Retained evidence, no quantity/cost change |
| Found goods after zero | Purchase total required; selling price/history not used to guess cost |
| Linked correction | Original retained; same-product reference validated; not sold volume |
| Archive/receipt race | Zero-stock/active checks hold under locks; identity/history preserved |
| Price edit/negative potential margin | Cost unchanged; potentials refresh and negative margin visible |
| Calendar boundaries | Shop timezone `[start,end)` periods; no midnight double-count/missing rows |
| Export | Same filters/data, quoting/formula defense, declared bounds, no silent truncation |
| Reset/settings | Defaults do not rewrite existing products; no account/history/data wipe |

Browser coverage: signup/verification/login/reset, create/restock/sold/opname/cost adjustment/archive/reactivation, reports/export, pending/error/conflict drafts, cross-route refresh, desktop/mobile and keyboard controls. Use disposable test records and isolation; no production tests that mutate real stock.

## 6. Operational Gate Before Real Shop Use

Hosting is Vercel and persistence/auth Supabase. Resource creation, domain setup, plan purchases, and deployment are not authorized by this specification. Before provisioning/deploying, confirm account/project ownership, region/latency, service tier/cost/limits, environment isolation, allowed callback URLs, email provider capability, and secret handling. Provider built-in email limits are not assumed sufficient.

Before operational use, document and verify backups, restore procedure (including ownership/Auth considerations), migrations/forward recovery, access controls, audit retention, monitoring/error response, and named recovery responsibility. Recommended operational targets: no more than 24 hours of recoverable-data loss and restoration within one business day; verify the chosen plan meets these or obtain approval of alternatives before production. These are proposed production gates, not promises of current service behavior.

No automatic expiry of retry/audit identity, factory reset, owner transfer/deletion, or mock-data import in the initial release. Unresolved email provisioning/cookie/provider behavior is an integration proof gate, not a new product interview.

Auth implementation references: [Supabase server-side advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [admin invitation](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), and [admin link generation](https://supabase.com/docs/reference/javascript/auth-admin-generatelink). These references are not evidence the particular setup has been tested. The installed Next.js authentication/proxy guides likewise require authorization near data and independent Server Action checks.

## 7. Completion and Authorization

Documentation is ready once sources above agree and the GitHub spec is published with `ready-for-agent`. Implementation phase stays Frontend Foundation until separately authorized backend work updates PRD/ARCHITECTURE/PROGRESS/AGENTS. This plan does not assert real persistence, production auth, tests, or deployments have been delivered.
