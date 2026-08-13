# Auth Pages Primary Color Redesign Spec

**Date:** 2026-08-10
**Status:** Approved

## Goal
Update the primary color across all authentication pages (`/auth/*`) to `#543afd` for primary buttons, focus rings, and link interactions.

## Architecture & Implementation Plan

### 1. Scoped Theme in `AuthLayout`
In `src/app/auth/layout.tsx`, apply inline CSS variables to the root container:
- `--primary: #543afd`
- `--primary-foreground: #ffffff`
- `--ring: #543afd`

This ensures that any component within `/auth/*` rendering `bg-primary`, `border-ring`, or `focus-visible:ring-ring` uses the brand color `#543afd`.

### 2. Auth Links Consistency
In all auth feature forms:
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/signup-form.tsx`
- `src/features/auth/components/reset-form.tsx`
- `src/features/auth/components/new-password-form.tsx`

Update secondary/footer link classes from `text-foreground` or `text-muted-foreground` to `text-primary hover:text-primary/80` or `hover:underline` as appropriate for visual consistency.

## Verification
- Navigate through `/auth/login`, `/auth/signup`, `/auth/reset`, and `/auth/newpassword`.
- Verify buttons, focus rings, and action links use `#543afd`.
