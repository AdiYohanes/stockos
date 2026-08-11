# Hybrid Neo-SaaS Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform StockOS design into a 70% Clean SaaS + 30% Neobrutalism hybrid system across design tokens, UI components, dashboard widgets, layouts, and auth pages.

**Architecture:** Update foundational tokens in `globals.css` (neutral `#f8f9fa` canvas, 1px border defaults, `--radius: 0.5rem`, `shadow-neo` micro-shadows), adapt shared shadcn/ui components (`button`, `card`, `input`, `badge`), update shell components (`sidebar`, `navbar`, `app-shell`), and align feature components in `dashboard` and `auth`.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Space Grotesk / Space Mono fonts.

## Global Constraints

- 70% Clean SaaS baseline: `#f8f9fa` background, `#ffffff` cards, `1px solid #e2e8f0` default container borders, `rounded-lg` (8px) / `rounded-md` (6px) / `rounded-sm` (4px).
- 30% Neobrutalist accents: Electric purple (`#543AFD`) + ink black contrast, `shadow-neo-sm` (`2px 2px 0px #000000`), `shadow-neo` (`3px 3px 0px #000000`), uppercase Space Mono tags and metric tracking, tactile 1px active press.
- No heavy dot-grid background on main application canvas.
- Maintain mock authentication and feature behaviors without breaking imports or routes.

---

### Task 1: Update Design Documentation (`design.md` & `AGENTS.md`)

**Files:**
- Modify: `design.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-08-11-hybrid-neobrutalism-saas-design.md`
- Produces: Updated design system guidelines in `design.md` and `AGENTS.md`

- [ ] **Step 1: Rewrite `design.md` with Hybrid Neo-SaaS specification**

Write clean 70% SaaS + 30% Neobrutal tokens, radii, shadows, typography, and interaction patterns into `design.md`.

- [ ] **Step 2: Update `AGENTS.md` Design System section**

Update `AGENTS.md` to reference the Hybrid Neo-SaaS design system (`#f8f9fa` background, `1px` borders, `rounded-md`/`rounded-lg`, `shadow-neo-sm` accents).

- [ ] **Step 3: Commit documentation updates**

```bash
git add design.md AGENTS.md
git commit -m "docs: update design system specs to hybrid neobrutalism saas"
```

---

### Task 2: Update Global CSS Tokens & Utilities (`src/app/globals.css`)

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: Tailwind CSS theme configuration, `@theme inline` variables
- Produces: `.shadow-neo-sm`, `.shadow-neo`, `.shadow-neo-primary`, `.btn-neo`, `.input-neo`, updated `--radius` and color variables

- [ ] **Step 1: Update CSS variables and theme tokens in `src/app/globals.css`**

Set `--background: #f8f9fa;`, `--border: #e2e8f0;`, `--input: #cbd5e1;`, `--radius: 0.5rem;`.
Add utility classes:
```css
/* Neo-SaaS Micro-Shadows */
.shadow-neo-sm {
  box-shadow: 2px 2px 0px #000000;
}

.shadow-neo {
  box-shadow: 3px 3px 0px #000000;
}

.shadow-neo-primary {
  box-shadow: 2px 2px 0px #543afd, 2px 2px 0px 1px #000000;
}

/* Tactile Button Press */
.btn-neo-primary {
  background-color: #543afd;
  color: #ffffff;
  border: 1.5px solid #000000;
  box-shadow: 2px 2px 0px #000000;
  border-radius: 0.375rem;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease;
}
.btn-neo-primary:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0px #000000;
  background-color: #462ee0;
}
.btn-neo-primary:active {
  transform: translate(1px, 1px);
  box-shadow: 0px 0px 0px #000000;
}
```

- [ ] **Step 2: Verify CSS builds without errors**

Run: `npm run build` or inspect runtime.

- [ ] **Step 3: Commit global CSS updates**

```bash
git add src/app/globals.css
git commit -m "style: update globals.css with hybrid neo-saas tokens and shadows"
```

---

### Task 3: Update Core UI Components (`button`, `card`, `input`, `badge`, `stockos-logo`)

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/stockos-logo.tsx`

**Interfaces:**
- Consumes: `globals.css` utility classes and Tailwind tokens
- Produces: Refined Shadcn UI primitives matching 70% SaaS + 30% Neobrutalism

- [ ] **Step 1: Update `button.tsx` variants**

Support `default` (purple + black 1.5px border + `shadow-neo-sm`), `black`, `secondary`, `outline` (1px border), `ghost`, `destructive` with `rounded-md` and active micro-press.

- [ ] **Step 2: Update `card.tsx`**

Set base style to `rounded-lg border border-border bg-card text-card-foreground p-5` (clean 1px border, 8px radius, no heavy 8px shadow).

- [ ] **Step 3: Update `input.tsx`**

Set base style to `rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:shadow-[2px_2px_0px_#543afd]`.

- [ ] **Step 4: Update `badge.tsx`**

Set base style to `rounded-sm border border-black font-mono text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5`.

- [ ] **Step 5: Update `stockos-logo.tsx`**

Clean, punchy icon + Space Grotesk bold branding.

- [ ] **Step 6: Commit core UI components**

```bash
git add src/components/ui/ src/components/stockos-logo.tsx
git commit -m "style(ui): update button, card, input, badge to hybrid neo-saas"
```

---

### Task 4: Update Layout Shell Components (`sidebar`, `navbar`, `app-shell`, `user-menu`)

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/navbar.tsx`
- Modify: `src/components/layout/user-menu.tsx`

**Interfaces:**
- Consumes: Updated `stockos-logo`, `button`, `badge`, layout tokens
- Produces: Clean SaaS dashboard shell with 1px dividers, refined sidebar navigation pills, and header bar

- [ ] **Step 1: Update `app-shell.tsx`**

Ensure background is `bg-background` (`#f8f9fa`), clean layout padding, remove heavy full-screen dot-grid.

- [ ] **Step 2: Update `sidebar.tsx`**

Use clean white/light surface, `border-r border-border`, `rounded-md` navigation pills with purple accent for active route and Space Mono badge counters.

- [ ] **Step 3: Update `navbar.tsx` & `user-menu.tsx`**

Clean `1px border-b border-border` header bar, search trigger input with neo-focus, user profile button.

- [ ] **Step 4: Commit layout shell updates**

```bash
git add src/components/layout/
git commit -m "style(layout): refine sidebar, navbar, and app-shell for clean saas"
```

---

### Task 5: Update Dashboard Components & Analytics Grid

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/features/dashboard/components/dashboard-header.tsx`
- Modify: `src/features/dashboard/components/overview-cards.tsx`
- Modify: `src/features/dashboard/components/stock-movement-chart.tsx`
- Modify: `src/features/dashboard/components/need-attention-table.tsx`
- Modify: `src/features/dashboard/components/inventory-health.tsx`
- Modify: `src/features/dashboard/components/top-moving-products.tsx`
- Modify: `src/features/dashboard/components/quick-actions.tsx`

**Interfaces:**
- Consumes: `card`, `button`, `badge`, mock dashboard data
- Produces: High-density SaaS ERP dashboard with crisp Neobrutalist accents

- [ ] **Step 1: Update `dashboard-header.tsx` & `quick-actions.tsx`**

Clean Space Grotesk greeting, subtle subtitle, punchy Neo-SaaS action buttons.

- [ ] **Step 2: Update `overview-cards.tsx`**

Clean white `rounded-lg` KPI cards with 1px border, Space Grotesk value numbers, Space Mono percentage badges (`rounded-sm border border-black`).

- [ ] **Step 3: Update `stock-movement-chart.tsx`**

Refined clean chart container, Space Grotesk chart labels, purple/black bar fills.

- [ ] **Step 4: Update `need-attention-table.tsx`**

Clean SaaS tabular layout (`1px` dividers, `bg-slate-50/75` header), uppercase Space Mono status pills, action buttons with `shadow-neo-sm`.

- [ ] **Step 5: Update `inventory-health.tsx` & `top-moving-products.tsx`**

Refined progress bars, clean list items, mono quantity badges.

- [ ] **Step 6: Commit dashboard updates**

```bash
git add src/features/dashboard/ src/app/\(dashboard\)/page.tsx
git commit -m "style(dashboard): update dashboard components to hybrid neo-saas"
```

---

### Task 6: Update Auth Pages & Components

**Files:**
- Modify: `src/features/auth/components/login-form.tsx`
- Modify: `src/features/auth/components/signup-form.tsx`
- Modify: `src/features/auth/components/reset-form.tsx`
- Modify: `src/features/auth/components/new-password-form.tsx`
- Modify: `src/features/auth/components/form-field.tsx`
- Modify: `src/features/auth/components/password-field.tsx`
- Modify: `src/features/auth/components/sign-out-button.tsx`

**Interfaces:**
- Consumes: `input`, `button`, `card`, `stockos-logo`
- Produces: Clean centered SaaS authentication cards with punchy Neobrutal submit actions

- [ ] **Step 1: Update auth form card containers**

Centered white card with `rounded-xl`, `border border-border`, subtle `shadow-neo` (`3px 3px 0px #000000`).

- [ ] **Step 2: Update input fields and labels**

Clean Space Grotesk labels, refined inputs with 2px purple focus shadow.

- [ ] **Step 3: Update submit buttons and demo credential pills**

Punchy `btn-neo-primary` button, clean Space Mono demo credentials trigger.

- [ ] **Step 4: Commit auth updates**

```bash
git add src/features/auth/components/
git commit -m "style(auth): update auth pages and form components to hybrid neo-saas"
```

---

### Task 7: End-to-End Verification & Quality Check

**Files:**
- Test/Verify across all routes

- [ ] **Step 1: Run TypeScript & Next.js production build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Visual & functional check on Dashboard (`/`) and Auth (`/login`)**

Verify:
- Clean neutral `#f8f9fa` canvas background.
- Clean white cards with `1px` subtle borders and `rounded-lg` corners.
- Punchy electric purple / black CTA buttons with `shadow-neo-sm` and tactile press.
- Uppercase Space Mono badges and table tags.
- Responsive sidebar and navigation behavior.

- [ ] **Step 3: Commit any final polish**

```bash
git add -A
git commit -m "chore: final design polish for hybrid neo-saas"
```
