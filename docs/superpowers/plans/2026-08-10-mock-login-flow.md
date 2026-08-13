# Mock Login Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a minimal mock login flow using cookie-based mock authentication state for frontend development.

**Architecture:** A lightweight cookie (`stockos_mock_auth`) bridges the client-side `LoginForm` with the server-side route guard in `src/app/page.tsx`. Mock credentials are fully isolated in `src/features/auth/mock-auth.ts`, and a demo credentials display is added at the bottom of the login form.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui.

## Global Constraints
- Do not implement real authentication (no backend, database, session store, JWT, OAuth).
- Do not create a dashboard page or extra application features.
- Keep credentials isolated and easy to replace.
- Maintain Next.js Server Component pattern for route protection.

---

### Task 1: Update Mock Authentication Module

**Files:**
- Modify: `src/features/auth/mock-auth.ts`
- Modify: `src/features/auth/types.ts`

**Interfaces:**
- Produces:
  - `MOCK_CREDENTIALS: { email: string; password: string }`
  - `MOCK_USER: MockUser`
  - `AUTH_COOKIE_NAME: string`
  - `getMockAuthState(): Promise<MockAuthState>`
  - `loginMockUser(credentials: { email: string; password: string }): { success: boolean; message?: string }`
  - `logoutMockUser(): void`

- [ ] **Step 1: Update types if needed**
Add any necessary helper types in `src/features/auth/types.ts`.

- [ ] **Step 2: Implement cookie-based mock auth and login helper in `mock-auth.ts`**
  - Read `cookies()` from `next/headers` inside `getMockAuthState()` for server components.
  - Export `MOCK_CREDENTIALS = { email: "demo@stockos.com", password: "demo123" }`.
  - Export `MOCK_USER = { id: "usr_mock_01", name: "Demo User", email: "demo@stockos.com", role: "admin" }`.
  - Provide client-side `loginMockUser` function that validates credentials and sets `document.cookie`.

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 2: Update Login Form with Mock Auth Flow and Demo Credentials UI

**Files:**
- Modify: `src/features/auth/components/login-form.tsx`

**Interfaces:**
- Consumes:
  - `loginMockUser`, `MOCK_CREDENTIALS` from `@/features/auth/mock-auth`
  - `useRouter` from `next/navigation`

- [ ] **Step 1: Implement submission handler in `login-form.tsx`**
  - Use `useRouter` for redirecting to `/` on success.
  - Validate credentials using `loginMockUser`.
  - If invalid, set `state` to `{ status: "error", message: "Invalid email or password" }`.
  - If valid, set `state` to `{ status: "success", message: "Logged in successfully" }`, then push to `/` and refresh.

- [ ] **Step 2: Add Demo Credentials display at the bottom of the card**
  - Render an isolated developer hint container showing the mock email (`demo@stockos.com`) and password (`demo123`).
  - Add convenient click-to-fill or clean readable badge styling.

- [ ] **Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: Verify Flow & Root Entry Guard

**Files:**
- Test / Verify: `src/app/page.tsx`, `src/features/auth/components/login-form.tsx`

- [ ] **Step 1: Verify unauthenticated state redirects `/` to `/login`**
- [ ] **Step 2: Verify invalid credentials show error alert on `/login`**
- [ ] **Step 3: Verify valid credentials authenticate and redirect to `/`**
- [ ] **Step 4: Verify root page renders authenticated state**
- [ ] **Step 5: Run linter and type check**
Run: `npm run lint` and `npx tsc --noEmit`
Expected: PASS
