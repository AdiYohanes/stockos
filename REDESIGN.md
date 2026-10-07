# StockOS Frontend Redesign

## Overview

StockOS is undergoing an incremental frontend redesign.

The purpose of the redesign is to improve:

- Visual consistency
- Information hierarchy
- Operational usability
- Navigation clarity
- Component consistency
- Responsive behavior
- Accessibility
- Maintainability of presentation code

The redesign should preserve existing product functionality unless a requirement explicitly changes.

This document describes the migration from the current frontend presentation to the target design system.

It does not replace:

- `docs/[PRD.md](http://PRD.md)`
- [`design.md`](http://design.md)
- `docs/[ARCHITECTURE.md](http://ARCHITECTURE.md)`
- `docs/[PROGRESS.md](http://PROGRESS.md)`

---

## Document Responsibility

Use:

```
docs/PRD.md
```

for product behavior and requirements.

Use:

```
design.md
```

for the target UI, UX, visual language, design tokens, components, and interaction patterns.

Use:

```
docs/REDESIGN.md
```

for migration strategy and redesign status.

Use:

```
docs/ARCHITECTURE.md
```

for technical architecture.

Use:

```
docs/PROGRESS.md
```

for overall implementation progress.

---

## Redesign Goal

Create a coherent operational interface for StockOS that feels:

- Clear
- Fast
- Structured
- Modern
- Consistent
- Focused
- Professional
- Lightweight

The interface should support inventory and ERP-style operational work without introducing unnecessary visual or workflow complexity.

StockOS should remain a lightweight Mini ERP rather than attempting to imitate a large enterprise ERP.

---

## Product Principles

### Operational First

StockOS is primarily an operational tool.

The interface should prioritize:

- Fast scanning
- Clear status
- Fast actions
- Efficient navigation
- Easy comparison
- Low interaction friction

Visual decoration should not interfere with operational clarity.

---

### Information Hierarchy

Important information should be immediately distinguishable from secondary information.

Use hierarchy intentionally through:

- Typography
- Spacing
- Grouping
- Alignment
- Surface treatment
- Status presentation
- Visual density

Avoid making all content visually equal.

---

### Consistency

Similar actions should look and behave similarly.

Reusable patterns should remain consistent across features.

Examples include:

- Primary actions
- Secondary actions
- Search
- Filters
- Tables
- Form controls
- Status badges
- Confirmation dialogs
- Drawers
- Empty states
- Feedback messages

---

### Lightweight UI

Avoid unnecessary decoration.

Prefer intentional hierarchy over excessive:

- Borders
- Shadows
- Gradients
- Containers
- Cards
- Badges
- Accent colors

Do not turn every piece of information into a separate card.

---

### Progressive Density

Desktop may support relatively dense operational information.

Smaller screens should progressively simplify composition rather than merely shrinking the desktop interface.

Important actions and information must remain accessible.

---

### Reusability

Establish reusable primitives and patterns where they genuinely repeat.

Do not over-generalize feature-specific UI.

A shared component should represent a stable reusable concept rather than superficial visual similarity.

---

## Redesign Constraints

The redesign must not automatically change:

- Product scope
- Business rules
- Routing
- Domain models
- Data flow
- Authentication architecture
- Backend architecture
- State-management architecture

unless explicitly required.

Production backend work remains out of scope during the current phase.

---

## Existing UI Policy

Existing UI is valuable as a reference for:

- Feature behavior
- Current workflows
- Information requirements
- Existing actions
- State requirements
- Edge cases

Existing visual styling is not automatically part of the target design.

When existing presentation conflicts with [`design.md`](http://design.md), the new design system takes precedence.

---

## Existing Component Policy

Existing components should be evaluated before redesign implementation.

Each existing component may be:

```
KEEP
```

Use unchanged because it already fits the target system.

```
RESTYLE
```

Keep behavior and component structure while updating presentation.

```
REFACTOR
```

Change composition or component boundaries to support the target design.

```
REPLACE
```

Replace when the existing component no longer fits the desired interaction or design system.

```
LEGACY
```

Keep temporarily until its owning screen is migrated.

Do not replace components automatically.

---

## Migration Strategy

The redesign should proceed incrementally.

Recommended sequence:

```
Design foundations
        ↓
Application shell
        ↓
Shared navigation
        ↓
Shared page patterns
        ↓
Reference feature
        ↓
Remaining operational features
        ↓
Secondary features
        ↓
Consistency pass
        ↓
Accessibility pass
        ↓
Responsive polish
```

Avoid attempting to redesign the entire project in a single implementation task.

---

## Phase 1 — Design Foundation

Goal:

Establish the target visual language before broad screen migration.

Areas to define in [`design.md`](http://design.md):

- Typography
- Color roles
- Background and surfaces
- Border treatment
- Radius
- Shadow usage
- Spacing
- Control sizing
- Icon sizing
- Interactive states
- Status colors
- Content width
- Layout spacing
- Responsive behavior

Also define core primitives where necessary.

Potential components include:

- Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Badge
- Tabs
- Dropdown
- Dialog
- Sheet
- Tooltip
- Table primitives

Prefer existing shadcn/ui primitives where suitable.

---

## Phase 2 — Application Shell

Redesign the application-level structure.

Potential scope:

- Sidebar
- Header
- Navigation
- Main content container
- Mobile navigation
- Page padding
- Content width
- Global feedback placement

The application shell should establish the visual baseline for migrated screens.

Avoid migrating all feature pages during this phase.

---

## Phase 3 — Shared Page Patterns

After the application shell is stable, establish reusable page-level patterns.

Potential examples:

- Page header
- Action toolbar
- Search control
- Filter group
- Metric presentation
- Data table composition
- Empty state
- Loading state
- Error state
- Pagination
- Detail sheet
- Confirmation dialog

Not every feature must use every pattern.

Patterns should be composable rather than mandatory page templates.

---

## Phase 4 — Reference Feature

Choose one representative operational feature as the first complete migration.

Recommended characteristics:

- Contains common UI patterns
- Has meaningful user interaction
- Includes realistic states
- Is important enough to expose design weaknesses
- Is not unusually complex

Possible candidates:

- Products
- Inventory

The first migrated feature should validate:

- Page hierarchy
- Search
- Filtering
- Data presentation
- Actions
- Status UI
- Detail inspection
- Responsive behavior
- Empty/loading/error patterns

Lessons from the reference feature should be incorporated into [`design.md`](http://design.md).

---

## Phase 5 — Core Feature Migration

After the reference implementation is stable, migrate remaining core features incrementally.

Suggested order:

```
Dashboard
Products
Inventory
Warehouses
Suppliers
Purchase Orders
Reports
Settings
```

The actual order may change based on development priority.

Do not migrate a feature simply because another feature imports one of its legacy components.

---

## Phase 6 — Consistency Pass

After major features are migrated, inspect the application as one system.

Look for inconsistency in:

- Page spacing
- Header hierarchy
- Button usage
- Form control sizing
- Table density
- Status treatment
- Empty states
- Drawer behavior
- Dialog behavior
- Icon usage
- Mobile behavior
- Typography
- Border treatment
- Surface hierarchy

Fix systematic issues at the shared-pattern level where practical.

Avoid page-specific patches for system-level problems.

---

## Phase 7 — Accessibility Pass

Review migrated interfaces for:

- Keyboard navigation
- Focus visibility
- Semantic controls
- Form labels
- Icon-only button labels
- Status meaning
- Color contrast
- Touch targets
- Dialog focus behavior
- Drawer accessibility
- Error communication

Prefer fixing shared accessibility issues in shared primitives.

---

## Phase 8 — Responsive Polish

Review migrated screens across relevant widths.

Primary operational experience remains desktop.

Ensure tablet and mobile remain usable.

Pay special attention to:

- Tables
- Toolbars
- Filters
- Primary actions
- Navigation
- Sheets
- Dialogs
- Forms
- Metrics
- Dense information areas

Do not simply shrink desktop layouts.

Adapt composition intentionally.

---

## Proposed Migration Status

Use the following statuses:

```
Pending
Planning
In Progress
Review
Migrated
Polish
Blocked
```

Current initial state:


| Area                   | Status      | Notes                                      |
| ---------------------- | ----------- | ------------------------------------------ |
| Design foundation      | Migrated    | Precision Ledger tokens, typography, radius|
| Application shell      | Migrated    | 240px rail, hairline navbar, flat drawer   |
| Shared page patterns   | In Progress | Headers, toolbars, metrics, badges updated |
| Dashboard              | Pending     |                                            |
| Products               | Migrated    | Reference screen: Single-surface containment, metric ribbon, 48px ledger table, slide-over inspection |
| Inventory              | Migrated    | Single-surface containment, metric ribbon, 48px ledger tables, stock health gauge, slide-over inspection |
| Warehouses             | Pending     |                                            |
| Suppliers              | Pending  |                                            |
| Purchase Orders        | Pending  |                                            |
| Reports                | Pending  |                                            |
| Settings               | Pending  |                                            |
| Accessibility pass     | Pending  |                                            |
| Responsive polish      | Pending  |                                            |
| Final consistency pass | Pending  |                                            |


Update this table as meaningful migration milestones occur.

Do not update it for every small component edit.

---

## Definition of Migrated

A screen should only be marked:

```
Migrated
```

when:

- The target design system has been applied.
- Primary functionality still works.
- Relevant existing interactions still work.
- Legacy presentation is no longer required for that screen.
- Relevant UI states are handled.
- Desktop layout is complete.
- Mobile/tablet behavior is reasonably handled.
- No obvious competing visual pattern remains.

A screen may still receive later polish after being marked migrated.

---

## Definition of Done for a Redesign Task

A scoped redesign task is complete when:

1. The requested visual/UX change is implemented.
2. Existing required behavior remains functional.
3. Relevant shared design conventions are followed.
4. The task does not introduce unnecessary dependencies.
5. The task does not introduce unrelated architecture changes.
6. Relevant interaction states work.
7. Responsive behavior has been considered.
8. Obvious accessibility regressions are avoided.
9. Legacy implementation is removed only when safe.
10. Documentation is updated when a reusable convention or migration milestone changes.

---

## Redesign Issue Structure

Prefer small, focused redesign issues.

Good examples:

```
Redesign application shell
```

```
Establish shared page header
```

```
Redesign Products list
```

```
Redesign Product detail sheet
```

```
Migrate Inventory toolbar
```

```
Standardize empty states
```

Avoid broad issues such as:

```
Redesign entire StockOS
```

unless they are umbrella tracking issues rather than implementation tasks.

---

## Suggested Initial Issues

### Issue 1 — Design Foundation

Scope:

- Audit existing design tokens
- Define target typography
- Define colors
- Define surfaces
- Define spacing
- Define radius
- Define control sizing
- Define interaction states
- Update [`design.md`](http://design.md)

Do not migrate feature pages yet.

---

### Issue 2 — Application Shell

Scope:

- Sidebar
- Header
- Main page container
- Navigation states
- Responsive shell

Preserve current routes.

---

### Issue 3 — Shared Page Header

Create or migrate the reusable page-heading composition.

Determine:

- Title hierarchy
- Description
- Optional metadata
- Primary actions
- Secondary actions
- Mobile wrapping

Only create shared abstraction when the pattern is stable.

---

### Issue 4 — Reference Feature

Choose:

```
Products
```

or:

```
Inventory
```

Migrate the full screen using the new design system.

Use the result to validate shared patterns.

---

### Issue 5 — Shared Operational Patterns

After the reference feature, consolidate repeated patterns that have proven useful.

Potential scope:

- Search
- Filters
- Table framing
- Empty states
- Status
- Detail inspection

Do not abstract speculative future requirements.

---

## Design Decision Rules

When making a new visual decision:

If it applies only to a single local case:

```
Implement locally.
```

If it is likely reusable:

```
Evaluate as a shared pattern.
```

If it becomes project-wide:

```
Document it in design.md.
```

If it changes migration strategy:

```
Update docs/REDESIGN.md.
```

Do not put all local implementation decisions into documentation.

---

## Shared Pattern Promotion

A pattern should generally be promoted to shared UI when:

- Multiple features use it.
- Behavior is materially the same.
- Visual treatment is materially the same.
- The abstraction reduces duplication without hiding important feature behavior.

Do not promote based only on visual resemblance.

---

## Legacy Pattern Deprecation

When a legacy project-wide pattern is replaced, document its status.

Example:

```
Legacy pattern:
Old metric card

Replacement:
Metric component defined in design.md

Status:
Deprecated

Migration:
Use replacement for newly migrated screens.
Do not automatically migrate unrelated screens.
```

Remove deprecated components only after usage has safely disappeared.

---

## No Big-Bang Rewrite

Do not execute a complete frontend rewrite for the redesign.

Reasons:

- Existing feature behavior already contains useful product knowledge.
- Smaller migrations are easier to review.
- Regression risk is lower.
- Design decisions can improve as screens are migrated.
- Shared abstractions can emerge from real usage.

Prefer:

```
migrate → validate → learn → standardize → continue
```

over:

```
rewrite everything → fix regressions later
```

---

## Architecture Boundary

The redesign should normally stay within presentation and frontend interaction concerns.

It may modify:

- Component composition
- Presentation components
- Shared UI primitives
- Page layout
- Responsive behavior
- Interaction presentation
- Local UI state when needed for the redesigned interaction

It should not automatically modify:

- Domain models
- API contracts
- Future persistence design
- Authentication architecture
- Backend infrastructure
- Feature ownership boundaries

If a redesign exposes an architectural problem, handle the architectural change as a separate explicit decision when practical.

---

## Dependency Policy

The existing stack is:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

The redesign should primarily use this stack.

Do not introduce another UI system without a strong reason.

Potential new dependencies must solve a meaningful requirement that existing tools cannot reasonably solve.

---

## Responsive Philosophy

StockOS is desktop-first because it is an operational management application.

Desktop should optimize for:

- Scannability
- Information density
- Fast workflows
- Comparison
- Multi-step operations

Mobile should optimize for:

- Accessibility to important information
- Essential actions
- Readable structure
- Reduced layout complexity

Mobile does not need to reproduce desktop density.

---

## Accessibility Philosophy

Accessibility should be part of the design system rather than an afterthought.

Reusable components should establish good defaults for:

- Focus
- Labels
- Keyboard access
- Contrast
- Interactive states
- Disabled state
- Destructive action clarity

Avoid solving the same accessibility problem independently on every page.

---

## Design Review Questions

When reviewing a redesigned screen, consider:

### Hierarchy

- Is the primary purpose of the screen obvious?
- Are primary actions identifiable?
- Is important information easier to find than secondary information?

### Workflow

- Does the redesign preserve the existing workflow?
- Did any common action become slower?
- Is interaction friction lower or higher?

### Consistency

- Does it follow established design patterns?
- Did the implementation introduce a new pattern unnecessarily?

### Density

- Is information grouped appropriately?
- Is the screen too sparse for an operational tool?
- Is the screen too visually noisy?

### Responsive Behavior

- Does the screen adapt rather than simply shrink?
- Are primary actions still available?

### Accessibility

- Can interactive elements be understood and operated?
- Are state and status communicated clearly?

---

## Migration Decision Log

Use this section only for meaningful redesign decisions that affect multiple screens.

Do not record every implementation detail.

### Decision 001 — Incremental Migration

**Decision**

StockOS will use incremental screen migration instead of a complete frontend rewrite.

**Reason**

Existing frontend behavior should remain stable while the visual system evolves.

**Impact**

Legacy and redesigned screens may temporarily coexist.

---

### Decision 002 — Existing UI Is Not the Visual Source of Truth

**Decision**

Existing screens are references for functionality and workflow, but [`design.md`](http://design.md) defines the target visual system.

**Reason**

Requiring new screens to visually follow legacy screens would prevent meaningful redesign.

**Impact**

Legacy components may be restyled, refactored, or replaced during their migration.

---

### Decision 003 — Existing Stack Remains

**Decision**

Continue using:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

unless a future requirement clearly justifies a change.

**Reason**

The current stack is sufficient for the redesign and avoids unnecessary migration cost.

---

## Current Priorities

Initial priority:

```
1. Finalize design direction
2. Update design.md
3. Establish core design tokens
4. Redesign application shell
5. Establish shared page patterns
6. Migrate one reference feature
7. Validate and refine design system
8. Continue feature-by-feature migration
```

---

## Core Redesign Rule

> Preserve what StockOS does while improving how clearly, consistently, and efficiently the interface helps users do it.
