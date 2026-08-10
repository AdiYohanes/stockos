# Minimal Mock Sign-Out Flow Spec

**Date:** 2026-08-10  
**Status:** Approved  

## Goal
Implement a minimal mock sign-out flow for development in StockOS. When an authenticated user signs out, their mock authentication state is cleared, they are treated as unauthenticated, and they are redirected to `/login`.

## Architecture & Design

### 1. Mock Authentication State (`src/features/auth/mock-auth.ts`)
- Reuse existing `logoutMockUser()` function that clears `AUTH_COOKIE_NAME` (`stockos_mock_auth`).
- `getMockAuthState()` continues to return `{ isAuthenticated: false, user: null }` once the cookie is cleared.

### 2. Sign Out Button Component (`src/features/auth/components/sign-out-button.tsx`)
- Client Component (`"use client"`).
- Reusable UI component wrapping the design system `Button` (`src/components/ui/button.tsx`).
- Props:
  - `variant?: ButtonProps["variant"]` (default: `"outline"`)
  - `size?: ButtonProps["size"]` (default: `"default"`)
  - `className?: string`
  - `children?: React.ReactNode` (default: `"Sign out"`)
- Behavior on click:
  1. Calls `logoutMockUser()`.
  2. Calls `router.push("/login")`.
  3. Calls `router.refresh()` to refresh server component tree state.

### 3. Application Entry Point (`src/app/page.tsx`)
- Preserves Server Component architecture.
- Server-side guard: Checks `await getMockAuthState()`; if not authenticated, redirects to `/login`.
- Renders `<SignOutButton className="w-full" />` inside the dashboard welcome card.

## Verification Plan
1. Authenticated user clicks "Sign out" button on `/`.
2. Mock auth cookie (`stockos_mock_auth`) is cleared.
3. User is redirected to `/login`.
4. Subsequent navigation to `/` redirects back to `/login`.
5. Existing login flow still succeeds with `demo@stockos.com` / `demo123`.
6. Invalid login flow continues to show error messages.
7. Run `npm run lint` and `npx tsc --noEmit` to verify type and lint correctness.
