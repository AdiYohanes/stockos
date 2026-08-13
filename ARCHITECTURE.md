# StockOS Architecture

## Architecture Status

Version: `0.x`

Current architecture phase:

**Frontend Foundation**

This document describes the current frontend architecture and establishes boundaries that should make future backend integration easier.

It is intentionally lightweight.

Backend and database architecture are not finalized yet.

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
│   └── inventory/
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
Auth Helpers
 ↓
Mock Authentication
```

Future state may become:

```text
UI
 ↓
Auth Boundary
 ↓
Production Authentication Provider
```

UI components should not depend directly on mock authentication internals.

This keeps authentication replaceable.

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

Current default:

- Server state where possible
- URL state for filters/search when appropriate
- Local React state for small UI interactions

Do not introduce a global state library without a demonstrated need.

Examples that normally do not require global state:

- Modal visibility
- Form interaction
- Table sorting
- Simple filters

A global store should only be introduced when multiple unrelated parts of the application genuinely need synchronized client state.

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

The backend data model is intentionally **not finalized yet**.

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

Database modeling will be performed before backend implementation.

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

Exact implementation will be decided during the backend architecture phase.

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

Current phase.

Focus:

- UI
- UX
- Feature structure
- Mock flows

### Phase 1 — Backend Foundation

Will define:

- Production authentication
- Database
- Persistent domain model
- API/data access strategy
- Validation
- Authorization

### Phase 2 — Integration

Replace frontend mock implementations with real persistent services.

Architecture decisions should be updated before each major phase begins.
