@AGENTS.md

# StockOS — Claude Project Instructions

## Project Overview

StockOS is a lightweight web-based Stock Management System / Mini ERP.

---

## Project Documentation

Use the repository documentation as project context.

### Primary documents

- `AGENTS.md` — coding-agent behavior, engineering rules, scope control, and working conventions.
- `docs/PRD.md` — product goals, scope, requirements, and expected behavior.
- `docs/ARCHITECTURE.md` — technical structure, feature boundaries, dependency direction, and data flow.
- `docs/PROGRESS.md` — current implementation status and development progress.
- `design.md` — source of truth for UI, UX, visual language, interaction patterns, and design system.

Do not duplicate detailed documentation inside this file.

Use this file primarily as Claude's entry point into the project.

---

## Project Structure

Primary application directories:

```
src/
├── app/
├── components/
├── features/
└── lib/
```

### `src/app/`

Next.js App Router.

Contains:

- Routes
- Layouts
- Pages
- Route-level composition

Keep feature-specific business implementation outside `src/app/` when practical.

---

### `src/features/`

Feature-specific implementation.

Current features include:

- Dashboard
- Inventory
- Products
- Warehouses
- Suppliers
- Purchase Orders
- Reports
- Settings
- Authentication

Feature-specific:

- Components
- Types
- Mock data
- Helpers
- UI state
- Feature logic

should normally stay inside the owning feature.

---

### `src/components/`

Application-wide shared UI.

Includes:

- shadcn/ui primitives
- Shared layout components
- Reusable application components
- Cross-feature UI patterns

Prefer existing compatible shared components before creating new ones.

---

### `src/lib/`

Shared utilities and infrastructure.

Examples:

- Utilities
- Formatting helpers
- Internationalization
- Shared constants
- Cross-feature helpers

Avoid placing feature-specific logic here.

---

## Component Strategy

Prefer:

```
shared primitive
      ↓
shared application pattern
      ↓
feature-specific composition
      ↓
page composition
```

Before creating a new component:

1. Search for an existing component.
2. Determine whether it is compatible with the design system.
3. Adapt it when the change remains clean.
4. Replace it when the existing abstraction no longer fits.
5. Avoid maintaining duplicate equivalents.

---

## Session Workflow

At the beginning of a fresh coding session, use the bootstrap instructions defined in `AGENTS.md`.

Do not repeatedly reload all project documentation for every small task.

Re-read only the documents relevant to the current task.

---

## Agent Skills

### Issue Tracker

Issues are tracked in GitHub Issues.

See:

```
docs/agents/issue-tracker.md
```

---

### Triage Labels

Canonical issue labels are documented in:

```
docs/agents/triage-labels.md
```

---

### Domain Documentation

Domain context:

```
docs/agents/domain.md
```

---

## Claude Working Rule

> Understand existing behavior first, follow repository patterns, implement smallest complete change, and do not expand technical scope beyond current phase.
