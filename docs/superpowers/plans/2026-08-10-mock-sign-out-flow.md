# Mock Sign-Out Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a minimal mock sign-out flow for frontend development, clearing mock auth state, treating the user as unauthenticated, and redirecting them to `/login`.

**Architecture:** A reusable client component `<SignOutButton />` invokes the existing `logoutMockUser()` in `@/features/auth/mock-auth`, clearing the `stockos_mock_auth` cookie and navigating to `/login` with router refresh. The server-rendered dashboard entry point in `src/app/page.tsx` integrates this button.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui.

## Global Constraints
- Reuse existing mock authentication state in `src/features/auth/mock-auth.ts`.
- Keep sign-out logic inside `src/features/auth/mock-auth.ts`.
- Do not add real session management, cookies, JWT, OAuth, backend, or database logic.
- Do not create a new authentication system.
- Maintain Server Component pattern for `src/app/page.tsx`.

---

### Task 1: Create `SignOutButton` Component

**Files:**
- Create: `src/features/auth/components/sign-out-button.tsx`

**Interfaces:**
- Consumes:
  - `logoutMockUser()` from `@/features/auth/mock-auth`
  - `Button`, `ButtonProps` from `@/components/ui/button`
  - `useRouter` from `next/navigation`
- Produces:
  - `SignOutButton: React.FC<SignOutButtonProps>`

- [ ] **Step 1: Create `SignOutButton` client component**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { logoutMockUser } from "@/features/auth/mock-auth";

export interface SignOutButtonProps extends ButtonProps {
  redirectTo?: string;
}

export function SignOutButton({
  children = "Sign out",
  variant = "outline",
  redirectTo = "/login",
  onClick,
  ...props
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  async function handleSignOut(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;

    setIsSigningOut(true);
    logoutMockUser();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      variant={variant}
      onClick={handleSignOut}
      disabled={isSigningOut || props.disabled}
      {...props}
    >
      {isSigningOut ? "Signing out..." : children}
    </Button>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`  
Expected: PASS

---

### Task 2: Integrate `SignOutButton` in Dashboard Entry Point

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes:
  - `SignOutButton` from `@/features/auth/components/sign-out-button`
  - `getMockAuthState()` from `@/features/auth/mock-auth`

- [ ] **Step 1: Add `SignOutButton` to `src/app/page.tsx`**

Update `src/app/page.tsx` to include `<SignOutButton className="w-full" />` within the dashboard card.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`  
Expected: PASS

---

### Task 3: Verification & Flow Testing

**Files:**
- Test / Verify: `src/app/page.tsx`, `src/features/auth/components/sign-out-button.tsx`, `src/features/auth/components/login-form.tsx`

- [ ] **Step 1: Verify authenticated mock user can sign out**
- [ ] **Step 2: Verify visiting `/` unauthenticated redirects to `/login`**
- [ ] **Step 3: Verify mock authentication cookie is cleared**
- [ ] **Step 4: Verify existing login flow succeeds with valid credentials**
- [ ] **Step 5: Verify invalid login behavior still displays error**
- [ ] **Step 6: Run lint and TypeScript checks**

Run: `npm run lint; npx tsc --noEmit`  
Expected: PASS
