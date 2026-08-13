# Minimal Mock Login Flow Spec

**Date:** 2026-08-10  
**Status:** Approved  

## Goal
Implement a minimal, cookie-based mock login flow for frontend development purposes. Submitting valid mock credentials authenticates the user, redirects them to the root entry point (`/`), and grants access to the home route.

## Architecture & Implementation Plan

### 1. Mock Authentication Configuration (`src/features/auth/mock-auth.ts`)
- **Constants**:
  - `MOCK_CREDENTIALS`: `{ email: "demo@stockos.com", password: "demo123" }`
  - `MOCK_USER`: `{ id: "usr_mock_01", name: "Demo User", email: "demo@stockos.com", role: "admin" }`
  - `AUTH_COOKIE_NAME`: `"stockos_mock_auth"`
- **Server Function**:
  - `getMockAuthState()`: Reads cookies using `await cookies()` from `next/headers`. Returns `{ isAuthenticated: true, user: MOCK_USER }` if the cookie exists with expected value, else `{ isAuthenticated: false, user: null }`.
- **Client Helper**:
  - `loginMockUser(credentials: { email: string; password: string })`: Validates against `MOCK_CREDENTIALS`. If valid, sets `document.cookie` with appropriate path and expiry and returns `{ success: true }`; otherwise returns `{ success: false, message: "Invalid email or password" }`.
  - `logoutMockUser()`: Clears the auth cookie.

### 2. Login Form Component (`src/features/auth/components/login-form.tsx`)
- On form submission:
  - Validates format (required email & password).
  - Calls `loginMockUser({ email, password })`.
  - On error: Sets form state to `{ status: "error", message: "Invalid email or password" }`.
  - On success: Sets form state to `{ status: "success", message: "Logged in successfully" }`, then navigates via `router.push("/")` and `router.refresh()`.
- Bottom Section:
  - Displays a clean demo credentials box at the bottom showing:
    - **Email**: `demo@stockos.com`
    - **Password**: `demo123`

### 3. Application Entry Point (`src/app/page.tsx`)
- Server Component that calls `await getMockAuthState()`.
- If `!isAuthenticated`, calls `redirect("/login")`.
- If `isAuthenticated`, renders the entry point welcome page with mock user details.

## Verification
1. Unauthenticated request to `/` redirects to `/login`.
2. Login with incorrect credentials displays "Invalid email or password" error alert.
3. Login with `demo@stockos.com` / `demo123` sets state to success and redirects to `/`.
4. Visiting `/` renders the authenticated welcome card.
5. `npm run lint` and `npx tsc --noEmit` pass without errors.
