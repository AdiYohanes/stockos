# Minimal Mock Authentication State Spec

**Date:** 2026-08-10  
**Status:** Approved  

## Goal
Implement a minimal, server-friendly mock authentication state for development purposes to protect the root route (`/`) and redirect unauthenticated users to `/login`.

## Architecture & Implementation Plan

### 1. Types Definition (`src/features/auth/types.ts`)
Define TypeScript interfaces for mock user and auth state:
- `MockUser`: `{ id: string; name: string; email: string; role?: string; }`
- `MockAuthState`: `{ isAuthenticated: boolean; user: MockUser | null; }`

### 2. Mock Auth Helper (`src/features/auth/mock-auth.ts`)
Create a minimal mock authentication module:
- `MOCK_USER`: Mock user data object.
- `MOCK_IS_AUTHENTICATED`: Boolean toggle for simulating authenticated / unauthenticated states in development.
- `getMockAuthState()`: Async function returning `Promise<MockAuthState>`.

### 3. Route Guard on Home Page (`src/app/page.tsx`)
In `src/app/page.tsx` (Server Component):
- Call `getMockAuthState()`.
- If `!isAuthenticated`, trigger `redirect("/login")` via `next/navigation`.
- If `isAuthenticated`, render the home page.

## Migration Path to Real Authentication
Later, when a real auth solution is introduced:
1. Replace `getMockAuthState()` with a real session retrieval function (e.g. `getSession()` or `getCurrentUser()`) that reads HTTP-only cookies, JWTs, or session storage.
2. The Server Component redirect pattern (`if (!session) redirect("/login");`) in `src/app/page.tsx` remains identical, adhering to Next.js App Router best practices.

## Verification Plan
1. **Unauthenticated Check**: With `MOCK_IS_AUTHENTICATED = false`, visiting `/` redirects to `/login`.
2. **Authenticated Check**: With `MOCK_IS_AUTHENTICATED = true`, visiting `/` renders the Home page.
3. **Lint & TypeScript**: Run `npm run lint` and `npx tsc --noEmit`.
