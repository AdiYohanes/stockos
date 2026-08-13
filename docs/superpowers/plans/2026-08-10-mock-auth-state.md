# Minimal Mock Authentication State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a minimal mock authentication state for development to redirect unauthenticated visits from `/` to `/login` and permit authenticated visits.

**Architecture:** Encapsulate mock authentication state and helper functions inside `src/features/auth/mock-auth.ts`, define clean TypeScript types in `src/features/auth/types.ts`, and guard the root page in `src/app/page.tsx` using Server Component logic and `redirect("/login")`.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS

## Global Constraints
- Keep implementation minimal; do not implement real auth, sessions, cookies, JWT, or OAuth.
- Do not introduce new dependencies.
- Prefer Server Components by default.

---

### Task 1: Define Mock Auth Types

**Files:**
- Modify: `src/features/auth/types.ts`

**Interfaces:**
- Produces: `MockUser`, `MockAuthState`

- [ ] **Step 1: Update `src/features/auth/types.ts` with Mock User and State types**

```typescript
/**
 * Shared types for the authentication feature.
 */

export type AuthFormStatus = "idle" | "loading" | "error" | "success";

export interface AuthFormState {
  status: AuthFormStatus;
  message?: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface MockAuthState {
  isAuthenticated: boolean;
  user: MockUser | null;
}
```

---

### Task 2: Create Mock Auth Helper

**Files:**
- Create: `src/features/auth/mock-auth.ts`

**Interfaces:**
- Consumes: `MockUser`, `MockAuthState` from `src/features/auth/types.ts`
- Produces: `MOCK_USER`, `MOCK_IS_AUTHENTICATED`, `getMockAuthState()`

- [ ] **Step 1: Write `src/features/auth/mock-auth.ts`**

```typescript
import type { MockAuthState, MockUser } from "./types";

export const MOCK_USER: MockUser = {
  id: "usr_mock_01",
  name: "Jane Doe",
  email: "jane.doe@stockos.local",
  role: "admin",
};

/**
 * Flag to simulate authentication state during frontend development.
 * Set to `false` to simulate unauthenticated state (redirects to /login).
 * Set to `true` to simulate authenticated state (grants access to home route).
 */
export const MOCK_IS_AUTHENTICATED: boolean = false;

/**
 * Returns the current mock authentication state.
 *
 * NOTE: Strictly for frontend development. Not a security mechanism.
 * Can be replaced by real auth session resolution in the future.
 */
export async function getMockAuthState(): Promise<MockAuthState> {
  if (!MOCK_IS_AUTHENTICATED) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  return {
    isAuthenticated: true,
    user: MOCK_USER,
  };
}
```

---

### Task 3: Protect Root Route in `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getMockAuthState()` from `src/features/auth/mock-auth`

- [ ] **Step 1: Update `src/app/page.tsx` to check mock auth state and redirect to `/login` if unauthenticated**

```typescript
import { redirect } from "next/navigation";
import { getMockAuthState } from "@/features/auth/mock-auth";

export default async function Home() {
  const { isAuthenticated, user } = await getMockAuthState();

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">StockOS Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "User"} ({user?.email})
        </p>
        <span className="inline-flex items-center rounded-md bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
          Authenticated (Mock State)
        </span>
      </div>
    </div>
  );
}
```

---

### Task 4: Verification

- [ ] **Step 1: Test unauthenticated state (`MOCK_IS_AUTHENTICATED = false`)**
  - Verify that navigating to `/` redirects to `/login`.
- [ ] **Step 2: Test authenticated state (`MOCK_IS_AUTHENTICATED = true`)**
  - Temporarily set `MOCK_IS_AUTHENTICATED = true` in `src/features/auth/mock-auth.ts`.
  - Verify that navigating to `/` renders the dashboard and shows the user greeting.
  - Reset `MOCK_IS_AUTHENTICATED` to default (`false` or user preference).
- [ ] **Step 3: Run TypeScript checks and lint**
  - Run `npx tsc --noEmit`
  - Run `npm run lint`
