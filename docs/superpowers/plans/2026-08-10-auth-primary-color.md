# Auth Pages Primary Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the primary color across all authentication pages under `/auth/*` to `#543afd` for buttons, focus rings, and link interactions.

**Architecture:** Apply `--primary: #543afd`, `--primary-foreground: #ffffff`, and `--ring: #543afd` inline CSS variables to the root wrapper in `AuthLayout` (`src/app/auth/layout.tsx`), and update auth form components to use `text-primary` and `hover:text-primary/80` for links.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, shadcn/ui.

## Global Constraints

- Primary color for auth pages must be `#543afd`.
- Primary foreground color must be `#ffffff`.
- Ring color must be `#543afd`.

---

### Task 1: Update AuthLayout CSS Variables

**Files:**
- Modify: `src/app/auth/layout.tsx:18-38`

**Interfaces:**
- Consumes: Global CSS tokens and `AuthLayout` component.
- Produces: Scoped CSS variables `--primary: #543afd`, `--primary-foreground: #ffffff`, and `--ring: #543afd` for all child components of `AuthLayout`.

- [ ] **Step 1: Update `AuthLayout` with inline CSS variables**

Add `style={{ '--primary': '#543afd', '--primary-foreground': '#ffffff', '--ring': '#543afd' } as React.CSSProperties}` to the outermost container element in `src/app/auth/layout.tsx`.

- [ ] **Step 2: Verify build & styling**

Check `http://localhost:3000/auth/login` and `http://localhost:3000/auth/newpassword` to verify buttons and input focus rings use `#543afd`.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/layout.tsx
git commit -m "style(auth): scope primary and ring CSS variables to #543afd in AuthLayout"
```

---

### Task 2: Update Link Colors in Auth Forms

**Files:**
- Modify: `src/features/auth/components/login-form.tsx:55-93`
- Modify: `src/features/auth/components/signup-form.tsx:64-74`
- Modify: `src/features/auth/components/reset-form.tsx:53-63`
- Modify: `src/features/auth/components/new-password-form.tsx:59-66`

**Interfaces:**
- Consumes: `Link` component from `next/link` and `--primary` CSS variable.
- Produces: Styled auth action/navigation links consistent with `#543afd` theme.

- [ ] **Step 1: Update links in `login-form.tsx`**

Change link styling for "Sign up" and "Forgot password?" from `text-foreground` / `text-muted-foreground` to `text-primary underline underline-offset-4 hover:text-primary/80`.

- [ ] **Step 2: Update links in `signup-form.tsx`**

Change link styling for "Log in" to `text-primary underline underline-offset-4 hover:text-primary/80`.

- [ ] **Step 3: Update links in `reset-form.tsx`**

Change link styling for "Log in" to `text-primary underline underline-offset-4 hover:text-primary/80`.

- [ ] **Step 4: Update links in `new-password-form.tsx`**

Change link styling for "Back to log in" to `text-primary underline underline-offset-4 hover:text-primary/80`.

- [ ] **Step 5: Verify auth pages visually**

Check links on `/auth/login`, `/auth/signup`, `/auth/reset`, `/auth/newpassword`.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/components/*.tsx
git commit -m "style(auth): update auth form links to use text-primary theme color"
```
