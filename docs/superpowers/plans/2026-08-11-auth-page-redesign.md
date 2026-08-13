# Minimalist Split-Studio Auth Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign StockOS authentication pages into a clean, minimalist Split-Studio layout using `login-background.png`, eliminating text clutter and adding subtle micro-animations.

**Architecture:** Next.js App Router with Server Component layout for structural composition and Client Components for form interactions. Left visual panel showcases the warehouse graphic with floating micro-badges; right panel houses the minimalist form with crisp typography.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Shadcn UI.

## Global Constraints
- Use existing assets: `/assets/login-background.png` and `/stockos-logo.png`.
- Minimal text, maximum clarity, no walls of marketing copy.
- Preserve all existing mock auth behavior and route navigations (`loginMockUser`, demo credentials autofill, redirects).
- Responsive: side-by-side on desktop (`lg:`), cleanly stacked on tablet/mobile.

---

### Task 1: Micro-Animation Keyframes in `globals.css`

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: CSS animation utility `@keyframes float-slow` and `animate-float-slow` for subtle badge movement.

- [ ] **Step 1: Add keyframes and animation utility to `src/app/globals.css`**
- [ ] **Step 2: Verify CSS compiles cleanly**

---

### Task 2: Minimalist Split Layout (`src/app/(auth)/layout.tsx`)

**Files:**
- Modify: `src/app/(auth)/layout.tsx`

**Interfaces:**
- Consumes: `/assets/login-background.png`, Lucide icons.
- Produces: Clean split screen layout: Left hero visual card with minimal floating badge + Right form column.

- [ ] **Step 1: Rewrite `src/app/(auth)/layout.tsx`**
  - Implement full-height split container (`min-h-screen lg:h-screen lg:grid lg:grid-cols-12 p-4 sm:p-6 lg:p-8 bg-slate-50/50`).
  - Left hero visual column (`lg:col-span-6 xl:col-span-7 hidden lg:flex flex-col relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl bg-slate-900`):
    - Background: `<Image src="/assets/login-background.png" alt="StockOS Warehouse" fill priority className="object-cover object-center" />`
    - Subtle dark-to-transparent gradient overlay for badge readability.
    - Top branding badge: Glass chip with StockOS logo/icon.
    - Floating micro-chip: "● Real-time Warehouse Sync" with `animate-float-slow`.
    - Bottom minimal tagline overlay: "Precision inventory tracking & warehouse intelligence."
  - Right form column (`lg:col-span-6 xl:col-span-5 flex flex-col justify-between`):
    - Mobile header with logo.
    - Centered children container (`max-w-[420px] w-full mx-auto my-auto`).
    - Clean footer with copyright and links.
- [ ] **Step 2: Verify layout structure in browser**

---

### Task 3: Polish `login-form.tsx`

**Files:**
- Modify: `src/features/auth/components/login-form.tsx`

**Interfaces:**
- Consumes: `MOCK_CREDENTIALS`, `loginMockUser`, `AuthFormState`.
- Produces: Minimalist login card with clean demo auto-fill pill and sleek inputs.

- [ ] **Step 1: Clean up card styling & demo credentials box**
  - Refine card to clean minimalist glass/border styling (`rounded-2xl border border-slate-200/80 bg-white/95 p-7 sm:p-8 shadow-xl shadow-slate-900/5`).
  - Streamline demo credentials box: compact single-line bar with 1-click "Auto-fill Demo" pill.
  - Simplify helper text and remove extra clutter.
  - Retain SSO / Demo buttons with clean minimalist styling.
- [ ] **Step 2: Test login flow and auto-fill functionality**

---

### Task 4: Polish `signup-form.tsx`, `reset-form.tsx`, and `new-password-form.tsx`

**Files:**
- Modify: `src/features/auth/components/signup-form.tsx`
- Modify: `src/features/auth/components/reset-form.tsx`
- Modify: `src/features/auth/components/new-password-form.tsx`

- [ ] **Step 1: Update SignupForm with matching minimalist card design and subtle micro-interactions**
- [ ] **Step 2: Update ResetForm with matching minimalist card design**
- [ ] **Step 3: Update NewPasswordForm with matching minimalist card design**
- [ ] **Step 4: Verify all auth pages render with consistent minimalist aesthetic**

---

### Task 5: End-to-End Verification

- [ ] **Step 1: Test `/login`, `/signup`, `/reset`, `/newpassword` in browser**
- [ ] **Step 2: Test responsiveness across mobile (375px), tablet (768px), desktop (1280px)**
- [ ] **Step 3: Run `npm run build` or type check to ensure zero errors**
