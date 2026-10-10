# StockOS Architecture

## Architecture Status

Version: `0.x`

Current architecture phase:

**Backend Foundation ticket 8 active (local owner password recovery)**

Tickets 1–7 connect auth and feature screens to isolated local Supabase. Ticket 8 implementation approved 2026-10-10 for provider-verified recovery, private session-bound purpose evidence, independent Server Action authorization, and global owner-session revocation before fresh password login. Passwords and tokens remain provider-managed; completion evidence contains no credentials. Cloud, external SMTP, deployment, and real-shop use remain outside this slice.

Implementation approval received 2026-10-09 for isolated local Supabase auth/bootstrap only. Invitation-mode setup omits password until verified invitation landing; public provider signup stays disabled. Ticket 2 approval received 2026-10-09 for isolated private product/evidence/retry schema, owner-checked lifecycle and stock/modal RPCs, bounded reads, and real contract tests. Exact arithmetic and transactions remain PostgreSQL-owned. Full recovery, UI/Server Action integration, reports/settings persistence, external SMTP proof, cloud provisioning, and deployment remain outside this ticket.

Backend target confirmed 2026-10-09: Next.js Server Components/Server Actions, Supabase PostgreSQL/Auth, and Vercel. `docs/BACKEND_PLAN.md` defines delivery/proof gates; `docs/DATABASE.md` and `docs/API_CONTRACT.md` define schema and operation contracts. Local auth and ticket 2 database/RPC foundations are implemented and tested; remaining integration and deployment require separate approval.

This document describes the current frontend architecture and establishes boundaries that should make future backend integration easier.

It is intentionally lightweight.

Target backend design is specified below and in linked contracts. Auth and primary feature runtime use isolated local Supabase; ticket 8 recovery Auth/browser proof passes. External-provider/provisioning proof, deployment, and remaining frontend verification are pending.

---

# 1. Current System

Current StockOS architecture:

```text
Browser
   │
   ▼
Next.js App Router
   │
   ├── App Routes / Layouts
   │
   ├── Feature Modules
   │
   ├── Shared UI
   │
   └── Mock Data / Mock Services
```

There is currently no production backend or persistent database.

---

# 2. Application Structure

Recommended frontend structure:

```text
src/
├── app/
│   ├── (auth)/
│   └── (dashboard)/
│
├── components/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── inventory/
│   ├── reports/
│   └── settings/
│
└── lib/
```

---

# 3. Application Layer

`src/app` is responsible for:

- Routing
- Layouts
- Route-level composition
- Server boundaries
- Page composition

Page components should remain relatively thin.

Feature-specific business or interaction logic should live inside the relevant feature.

---

# 4. Feature Layer

Feature modules contain code belonging to a specific domain.

Example:

```text
src/features/products/
├── components/
├── mock-data.ts
├── types.ts
└── utils.ts
```

Possible later structure:

```text
src/features/products/
├── components/
├── actions/
├── services/
├── hooks/
├── schemas/
├── types.ts
└── utils.ts
```

Do not create these folders prematurely.

Add them only when actual complexity requires them.

---

# 5. Shared UI Layer

`src/components` contains reusable UI that is not owned by one specific domain.

Examples:

```text
DataTable
EmptyState
PageHeader
ConfirmDialog
SearchInput
```

Domain-specific components should remain inside the feature that owns them.

For example:

```text
ProductStockBadge
```

belongs in:

```text
src/features/products/components/
```

rather than global components.

---

# 6. Mock Data Strategy

During frontend development:

```text
UI
 ↓
Feature Interface
 ↓
Mock Implementation
```

Avoid designing components that directly depend on mock implementation details.

Example:

```ts
type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};
```

The UI should operate on stable domain types.

Mock data provides temporary values for those types.

### Schema & Centralized Domain Types (Zod)

Domain types and validation are centralized via Zod in `src/features/[feature]/schemas/`:

- **Single Source of Truth**: Base entity schema defines domain structure (`export const ProductSchema = z.object({...})`).
- **Inferred Domain Types**: Types are extracted directly via `export type Product = z.infer<typeof ProductSchema>`.
- **Unified Validation**: The same schemas validate mock data (`Schema.array().parse(MOCK_DATA)`) and form inputs (`react-hook-form` + `@hookform/resolvers/zod`).
- **Backward Compatibility**: `src/features/[feature]/types.ts` re-exports domain types from schemas, maintaining clean cross-feature imports.

Later:

```text
UI
 ↓
Feature Interface
 ↓
Real Data Service
 ↓
Backend
```

This allows backend integration without rewriting the UI.

---

# 7. Authentication Boundary

Current state:

```text
UI
 ↓
Next.js Server Actions / server-only owner queries
 ↓
Supabase Auth + session-scoped PostgreSQL authorization RPCs
```

Ticket 1 runs against isolated local Supabase. Provisioning credentials stay in a separate server-only admin client; normal owner authorization uses the signed user session plus live `auth.sessions` verification. Proxy refreshes cookies, not business authorization. Invitation OTP sessions can complete initial password setup and retry a failed logout but cannot obtain owner business access; fresh password login is required. Product/inventory/report stores remain mocked.

---

# 8. Server and Client Components

Default:

**Server Component**

Use Client Components only when the component requires:

- User interaction
- Browser-only APIs
- React client hooks
- Interactive local state

Preferred direction:

```text
Server page
   │
   ├── Server components
   │
   └── Small interactive client components
```

Avoid turning entire pages into Client Components simply because one small interaction requires client-side state.

---

# 9. State Management

Current ownership:

- Server state where possible; authentication is server-owned through session-scoped Supabase and live owner RPC checks. Products and Inventory are server-owned through Server Components and Server Actions calling PostgreSQL RPCs (`stockos_list_products`, `stockos_list_inventory_events`, lifecycle, and stock/opname RPCs).
- URL state for shareable filters/search when appropriate (`search`, `category`, `status`, `tab`, `sort`, `page`, etc.).
- Local React state for modal visibility, selected entity IDs, form drafts, and optimistic feedback.
- Zustand vanilla stores: retained in `store.ts` for isolated unit/regression test contracts; UI features Products and Inventory now read directly from server props.

Each feature owns its `store.ts`, state/actions, validation, and mock seeds. Existing feature hooks subscribe through narrow selectors and compose local UI state with derived metrics. Business mutations live in named store actions, not component setters. Related data and audit logs update atomically; rejected actions throw errors without modifying state, and forms display errors without closing.

`FeatureStoresProvider` in the authenticated dashboard layout creates independent store instances per provider mount. Context carries stable store references only. Navigating between dashboard routes preserves collections; leaving the dashboard or fully reloading resets them to mock seeds. Stores are not persisted and are never read or mutated from React Server Components. Module-level mutable store singletons are not used, so server requests cannot share session state.

Products and Inventory still use independent feature fixtures and identifiers. Their stock models are not unified, and Dashboard/Reports analytics remain mock fixtures. Future backend data belongs in the real data-access boundary rather than being copied into these client stores.

Stock belongs to one shop: product, inventory, movement, and report types have no warehouse field or warehouse filter. Current mock movement types are stock in, stock out, and adjustment (`in/out/adjustment`). The target contracts distinguish opening, receipt, sold, opname, and cost_adjustment; migrate deliberately rather than treat the mock enum as the persistent model. Warehouse/purchase-order routes, modules, provider stores, and transfer controls are removed; stock receipts need no purchase order.

Settings connect to persistent PostgreSQL singleton (`stockos_private.shop_settings`) via owner-checked RPCs (`stockos_get_shop_settings`, `stockos_update_shop_settings`), with monotonic optimistic concurrency control (`version`), idempotency via `mutation_requests`, administrative audit trails (`administrative_events`), and warung scope enforcement (removal of team/notification mock tabs, safe defaults reset without deleting operational data). The existing i18n context remains separate. Do not introduce more shared stores without demonstrated shared-client-state needs.

---

# 10. Styling Architecture

Styling uses:

- Tailwind CSS
- shadcn/ui
- StockOS design tokens and patterns defined in `design.md`

Do not create competing styling systems.

Reusable visual primitives should use established design tokens.

---

# 11. Data Model

Target database design is finalized for the agreed scope in `docs/DATABASE.md`. Local migrations implement singleton shop/owner setup plus private products, inventory/administrative evidence, and durable successful mutation retry results. Owner RPCs own exact costing, request-first locking, revisions, atomic evidence, and bounded reads. Real isolated PostgreSQL/Auth checks prove this boundary; feature UI still uses independent mocks. No cloud database is provisioned.

Frontend types represent UI requirements and should not automatically become database schemas.

For example:

```ts
type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};
```

does not mean the future database must use exactly the same structure.

Database constraints, native exact numeric arithmetic, transaction functions, and restrictive grants must be implemented and tested only after separate approval. Frontend mock fields are not copied wholesale into persistent models.

---

# 12. Future Backend Boundary

When backend development starts, frontend features should preferably interact through a clear data-access boundary.

Target direction:

```text
UI
 ↓
Feature Layer
 ↓
Data Access / Service Layer
 ↓
Backend
 ↓
Database
```

The approved target keeps Next.js as one application: server-only feature queries supply Server Components; Server Actions validate mutations; session-scoped Supabase clients call owner-checked PostgreSQL transactional RPCs. Supabase Auth manages verified identity/session/recovery; Vercel hosts the app. See `docs/BACKEND_PLAN.md` for sequencing and proof gates.

The proposed backend must provide a single authoritative stock source rather than preserve independent Products/Inventory balances. Server-side authentication, authorization, validation, and atomic stock/audit writes are required at every data boundary. Middleware/proxy redirects alone are not authorization.

Server Actions are the mutation transport, not a duplicated REST API. Route Handlers are permitted for required provider auth callbacks only. Use Supabase JS/SSR clients and native PostgreSQL transactions/numeric calculations; no ORM/repository framework or separate backend is needed. Do not scaffold hypothetical integration endpoints.

Do not implement repositories, service classes, API layers, or database abstractions prematurely.

---

# 13. Dependency Rules

Preferred dependency direction:

```text
app
 ↓
features
 ↓
shared utilities
```

Features should avoid unnecessary dependencies on other feature internals.

Shared code should only be extracted when genuinely reusable.

Avoid creating generic abstractions based on only one usage.

---

# 14. Error and Loading States

Frontend features should explicitly account for:

- Loading
- Empty
- Success
- Validation error
- Application error

Mock implementations should still simulate realistic UI states where useful.

This helps ensure the UI remains suitable once real network requests are introduced.

---

# 15. Architecture Principles

StockOS architecture prioritizes:

1. Simplicity
2. Clear ownership
3. Replaceable infrastructure
4. Type safety
5. Maintainability
6. Performance

Avoid:

- Premature abstraction
- Deep layering without benefit
- Feature coupling
- Large global components
- Large global state
- Backend assumptions based only on mock UI

---

# 16. Architecture Evolution

This architecture should evolve with the project.

### Phase 0 — Frontend Foundation

Current implementation phase. Final frontend verification remains tracked in `PROGRESS.md`.

Focus:

- UI
- UX
- Feature structure
- Mock flows

### Preparation — Backend Planning

Documentation only, currently authorized. Target design confirmed; `docs/BACKEND_PLAN.md`, `docs/DATABASE.md`, `docs/API_CONTRACT.md`, and `docs/FULLSTACK_SPEC.md` define the agreed behavior, technical contracts, verification, and delivery gates. No runtime changes or executable schemas/migrations.

### Phase 1 — Backend Foundation

Tickets 1 (local owner authentication) and 2 (local private stock database/RPC proof) are authorized and implemented. Domain UI integration and production readiness are not delivered; further slices require their own approval.

Will implement the approved design for:

- Production authentication
- Database
- Persistent domain model
- API/data access strategy
- Validation
- Authorization

### Phase 2 — Integration

Replace frontend mock implementations with real persistent services.

Architecture decisions should be updated before each major phase begins.

# 17. Confirmed Target Backend — Not Implemented

## Feature and Infrastructure Ownership

Keep existing feature-oriented structure. Products own metadata/lifecycle and inventory owns stock/modal/event operations; dashboard/reports consume shared authoritative queries rather than feature-store internals. Auth owns provider flows and owner verification. Shared server infrastructure in `src/lib` is limited to Supabase clients/session configuration and genuinely shared validation/formatting. Add focused server-only query/action modules when implementation starts; no speculative classes/layers/folder scaffolding.

Database migrations/transaction functions form the native persistence boundary; exact cost calculations live there, not duplicated in JavaScript. Constraints, function contracts, authorization, and DTO mapping must agree with `docs/DATABASE.md` and `docs/API_CONTRACT.md`.

## Security and Owner Bootstrap

One verified owner subject bound through singleton setup. Disable public provider signup; protect initial setup with a server-only secret. Persist/reconcile provisioning attempt because provider account creation and shop DB writes are not one distributed transaction. Do not reopen a slot on timeout or bypass email verification. Provider email and recovery/password-setup behavior with signup disabled require an early isolated proof.

Every server query/action checks verified session, email confirmation, and owner binding; refresh/auth logic follows current provider and installed Next.js APIs. Normal DB requests use the owner session; privileged provisioning keys never enter browser bundles or normal stock requests. Business schema is private with restrictive grants/RLS; narrowly scoped RPCs independently enforce owner identity.

Next.js proxy may refresh session/redirect using supported integration conventions, but cannot replace secure checks near data. Server Actions retain origin protection, allowlisted hosts, strict inputs, no GET writes, and safe error mapping. Auth callbacks accept only allowlisted redirects and verified provider code/token purpose. Session cookies are server-managed HttpOnly/Secure in production/SameSite-compatible with the provider flow; no browser Supabase auth client depends on reading refresh tokens. Each request creates its own session client and preserves refresh/cache headers; authenticated responses must not use shared caching/ISR. Prove refresh/revocation behavior: use provider-backed session validation and DB live-session checks, because an issued access JWT remains signature-valid until expiry after logout. Do not mistake a locally decoded cookie or cached user claim for provider validation.

## Data, Transactions, and Refresh

Products store authoritative quantity/current cost value. Append-only events record before/after values, source, actor/time, and optional correction link. Idempotency result commits with every business mutation. Row locks serialize stock changes; revisions reject stale metadata/count/cost edits. No negative quantities, historical rewrite, two independent stock stores, or transaction split across separate HTTP writes.

Server reads/aggregates return explicit DTOs with decimal strings and derived status/mean/potentials; no credential/history dump. Initially avoid cross-request caching of private mutable data; request-scoped memoization is sufficient. Mutations refresh/revalidate affected screens only after commit; client state owns drafts/navigation controls, never independent balances. Replayed results are old committed snapshots, so refresh current data.

## UI Alignment and Release

Replace fake Revenue/Net Profit with Potensi Pendapatan/Potensi Laba Kotor of stock on hand. Stock Out means manually recorded sold quantity only; opname/cost events remain separate. Remove unsupported team, forecasting, supplier score, multi-currency, FIFO/LIFO, negative-stock/expiry, and email/webhook controls while retaining the existing design language.

Primary tests execute real authenticated server operations against isolated PostgreSQL/Auth; browser smoke covers owner journeys. Existing mock-store tests remain frontend prior art, not transaction/security proof. First release is private/nonproduction testing. Deployment, paid plans, operational use, backups/restoration, and implementation each require their applicable approval gates; document status never implies delivery.
