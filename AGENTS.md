# AGENTS.md

## Project

StockOS is a lightweight web-based Stock Management System / Mini ERP.

Primary goals:

- Simple operational workflows
- Fast and responsive UI
- Clear information hierarchy
- Maintainable code
- Lightweight architecture
- Easy future backend integration

Avoid introducing enterprise ERP complexity unless it is explicitly required by the product scope.

---

## Current Development Phase

**Phase: Frontend Foundation**

Current focus:

- Frontend screens
- UI/UX
- Feature flows
- Responsive behavior
- Mock data
- Mock authentication

Production backend, database persistence, and production authentication are not implemented yet.

Do not move into backend implementation unless explicitly requested.

---

## Session Bootstrap

At the beginning of a new coding session, initialize project context by reading:

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/PROGRESS.md`
5. `design.md`

Use these documents as project context for the current session.

Do not summarize them unless requested.

After the initial bootstrap, do not repeatedly read every document before every small task.

Re-read only the documentation relevant to the task when needed.

If session context is lost, reset, compacted, or uncertain, reload the relevant project documentation.

---

## Source of Truth

Use each document for its intended responsibility.

### `docs/PRD.md`

Source of truth for:

- Product goals
- Product scope
- Feature requirements
- Expected behavior
- Out-of-scope functionality

### `design.md`

Source of truth for:

- UI
- UX
- Visual system
- Typography
- Colors
- Spacing
- Component styling
- Interaction patterns

### `docs/ARCHITECTURE.md`

Source of truth for:

- Technical structure
- Feature boundaries
- Dependency direction
- Data flow
- Architectural decisions

### `docs/PROGRESS.md`

Source of truth for:

- Completed work
- Current implementation
- In-progress work
- Upcoming work
- Current development phase

### `AGENTS.md`

Source of truth for:

- AI coding-agent behavior
- Development constraints
- Engineering rules
- Scope control
- Working conventions

Do not duplicate detailed product, design, architecture, or progress documentation here.

---

## Frontend Phase Rules

During the current Frontend Foundation phase:

- Focus on frontend implementation.
- Use mock data when backend data is required.
- Keep mock implementations isolated and replaceable.
- Keep UI independent from mock implementation details.
- Build realistic frontend flows without pretending they are production backend behavior.
- Do not create database schemas or migrations.
- Do not introduce backend infrastructure.
- Do not implement production APIs.
- Do not introduce production authentication.
- Do not select backend technologies unless explicitly requested.
- Do not make database design decisions based only on temporary frontend types.
- Do not introduce infrastructure for hypothetical future requirements.

The frontend should be structured so mock implementations can later be replaced with real data sources without major UI rewrites.

---

## Technology Stack

Current stack:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Prefer the existing stack.

Do not add dependencies without a clear reason.

Before adding a dependency:

1. Check whether the existing stack already solves the problem.
2. Prefer framework or platform capabilities.
3. Add a dependency only when it provides meaningful value.
4. Avoid unnecessary architectural or bundle complexity.

---

## Project Structure

Follow the feature-oriented structure defined in `docs/ARCHITECTURE.md`.

Primary structure:

```text
src/
├── app/
├── components/
├── features/
└── lib/
```

General ownership:

- `src/app` — routes, layouts, page composition
- `src/components` — shared application-wide UI
- `src/features` — feature-specific implementation
- `src/lib` — shared utilities and infrastructure

Keep feature-specific code inside its owning feature whenever practical.

Do not create architectural folders or layers before they are needed.

---

## Engineering Rules

Use TypeScript consistently.

General rules:

- Avoid `any`.
- Reuse existing types and components.
- Prefer simple solutions.
- Keep components focused and composable.
- Avoid unnecessary abstractions.
- Avoid duplicated logic when a clear reusable pattern already exists.
- Do not refactor unrelated code while implementing a feature.
- Do not introduce new project-wide conventions silently.
- Follow existing naming and folder conventions.
- Keep changes focused on the requested task.

Prioritize:

1. Correctness
2. Simplicity
3. Readability
4. Maintainability
5. Security
6. Performance
7. Extensibility

Do not optimize or abstract prematurely.

---

## Next.js and React

Follow the architectural guidance in `docs/ARCHITECTURE.md`.

General rules:

- Prefer Server Components by default.
- Use Client Components only when required.
- Keep client boundaries as small as practical.
- Avoid unnecessary `"use client"`.
- Avoid large monolithic page components.
- Prefer composition over deeply abstract component systems.
- Use local state for local UI concerns.
- Do not introduce global state management without a demonstrated need.
- Prefer URL state for filters, search, sorting, and pagination when appropriate.

React 19 & Feature State Patterns:

- **Keyed Form Pattern for Modals/Drawers**: Do not use `useEffect` to copy entity props into local form state (this triggers React 19 cascading render lint errors). Instead, isolate the form in a sub-component with a `key={entity.id}` so it initializes state directly on mount.
- **Derived Entity Selection**: For detail slide-overs or sheets, store `selectedId: string | null` in state and derive the selected entity via `useMemo(() => items.find(i => i.id === selectedId), [items, selectedId])`. This guarantees immediate reactivity when an item is edited or updated.
- **Hydration-Safe Mount Detection**: When needing client-only mount checks (e.g. chart rendering), use `React.useSyncExternalStore` rather than `useState(false)` + `useEffect(setMounted(true))`.
- **Pure Render Handlers**: Do not call impure functions like `Math.random()` during component render. Generate unique IDs or deterministic references inside event handlers or form submissions.

Standard Feature UI Structure (Products, Inventory, Warehouses, Suppliers, Dashboard, Reports, Settings):

- **Standard Page Header**: Top title header with h1 + monospace status/category badge + bullet separator + description text on left, and responsive action buttons toolbar on right (see Section 6 of `design.md`).
- **Metric Summary Cards**: 3-4 top cards summarizing volume/health that also act as quick click-to-filter triggers.
- **Unified Toolbar**: Instant search bar + status pills with live counts + category/warehouse select dropdowns + sort toggle + reset button.
- **High-Density Table**: Space Mono badges for SKUs/codes, visual ratio/progress bars, currency formatting, status pills, and contextual row actions.
- **Slide-Over Detail Sheet**: Inspection panel for specifications, health gauges, and movement/history logs without leaving the table view.

Inspect existing implementation before creating a new pattern.

---

## Design and UI

Follow `design.md` as the source of truth for UI and UX.

Before creating or significantly changing UI:

1. Inspect existing StockOS screens.
2. Reuse existing components and patterns.
3. Check the relevant rules in `design.md`.
4. Extend established patterns instead of introducing a competing design style.

Maintain consistency across:

- Layout
- Typography
- Spacing
- Forms
- Tables
- Cards
- Buttons
- Status indicators
- Feedback states
- Responsive behavior

Do not independently introduce a new visual language.

---

## Frontend Data

Use mock data during the current development phase.

Prefer feature-owned mock data, for example:

```text
src/features/products/mock-data.ts
src/features/inventory/mock-data.ts
```

Avoid placing large mock datasets directly inside page components.

Frontend components should preferably depend on clear feature types or interfaces rather than mock implementation details.

Do not treat temporary frontend types as final database models.

---

## Authentication

Authentication is currently development-only and mocked.

Keep authentication logic isolated inside the established authentication feature.

Rules:

- Keep mock authentication replaceable.
- Use centralized auth helpers.
- Do not spread mock implementation details across unrelated components.
- Do not introduce production auth infrastructure unless explicitly requested.
- Do not treat frontend route protection as production authorization.

Implementation details such as mock credentials and cookie names should remain in code rather than being duplicated in documentation.

---

## UI States

When relevant, frontend features should consider:

- Default
- Loading
- Empty
- Error
- Success
- Disabled
- Validation

Use realistic mock behavior where useful.

Do not add unnecessary complexity only to simulate edge cases that are not relevant to the current feature.

---

## Responsive and Accessibility Rules

Desktop is the primary operational experience, but the application should remain usable on tablet and mobile.

For responsive layouts:

- Preserve primary actions.
- Preserve important inventory information.
- Avoid accidental horizontal overflow.
- Adapt layouts rather than only shrinking them.

For accessibility:

- Prefer semantic HTML.
- Use keyboard-accessible controls.
- Maintain visible focus states.
- Use meaningful labels.
- Maintain sufficient contrast.
- Prefer accessible shadcn/ui primitives where available.

---

## Scope Control

Implement the smallest complete solution required by the task.

Do not automatically add:

- Backend endpoints
- Database tables
- Database migrations
- Authentication providers
- Global state libraries
- Analytics
- New modules
- New dependencies
- Complex abstractions
- Unrequested features

Example:

```text
create product list
```

during the current phase means:

- Implement the Product List frontend.
- Follow `design.md`.
- Follow the existing architecture.
- Use mock data.
- Reuse existing components.
- Handle reasonable frontend states.

It does **not** automatically mean:

- Create a product API.
- Create database tables.
- Add Supabase.
- Add real authentication.
- Build backend CRUD.

Stay within the current development phase.

---

## Task Execution

After session bootstrap, user requests may be concise.

Examples:

```text
create product list
```

```text
add product search and filters
```

```text
make dashboard responsive
```

```text
create product detail page
```

For each task:

1. Understand the requested outcome.
2. Inspect relevant existing code.
3. Use the loaded project context.
4. Re-read specific documentation only when needed.
5. Reuse existing patterns and components.
6. Implement the smallest complete change.
7. Check relevant UI states and responsive behavior.
8. Avoid unrelated changes.
9. Keep the implementation inside the current phase.

Do not require the user to repeatedly restate context already documented in the repository.

---

## Documentation Updates

Do not update every document after every small code change.

### Update `docs/PROGRESS.md` when:

- A significant screen or feature is completed.
- A feature moves into active development.
- A meaningful milestone is reached.
- The current development phase changes.

### Update `docs/ARCHITECTURE.md` when:

- Technical boundaries change.
- Data flow changes significantly.
- A new architectural pattern is adopted.
- Shared infrastructure is introduced.
- Backend development begins.

### Update `docs/PRD.md` when:

- Product scope changes.
- Feature requirements change.
- Important product behavior changes.
- A feature is added or removed from scope.

### Update `design.md` when:

- A reusable design pattern changes.
- A design token changes.
- A new project-wide UI convention becomes established.

### Update `AGENTS.md` when:

- The way coding agents should work changes.
- Development phase rules change.
- Engineering rules change.
- Project conventions change.

Do not use `AGENTS.md` as a progress tracker.

---

## Git Workflow

Use Git to keep changes focused and traceable.

Branches:

```text
main
feat/<short-description>
fix/<short-description>
refactor/<short-description>
chore/<short-description>
```

Avoid normal feature development directly on `main`.

Use Conventional Commits:

```text
feat:
fix:
refactor:
chore:
docs:
test:
style:
```

Examples:

```text
feat(products): add product list
feat(dashboard): add inventory summary
fix(auth): correct login redirect
fix(products): fix mobile table overflow
refactor(auth): simplify auth helpers
docs: update frontend progress
```

Keep commits small and focused.

Do not mix unrelated changes in the same commit.

---

## Phase Transition

Do not automatically move the project from frontend development into backend development.

Before starting Backend Foundation, review and update:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/PROGRESS.md`
- `AGENTS.md`

Backend decisions should then define:

- Database technology
- Production authentication
- Domain data model
- Validation
- Authorization
- Data-access strategy
- Server-side operations
- Persistence

These decisions are intentionally deferred during the current Frontend Foundation phase.

---

## Core Rule

Before making changes:

> Understand the existing project, follow its documentation and established patterns, implement the smallest complete solution, and do not expand technical scope beyond the current development phase.
