# AGENTS.md

## Project

Lightweight web-based Stock Management System / Mini ERP.

Priorities:

- Fast and responsive
- Simple user workflows
- Lightweight
- Maintainable

## Current Phase

Frontend development.

Backend and database architecture are not implemented yet.

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Do not add dependencies without a clear reason.

## Architecture

Use a feature-oriented structure:

- `src/app` — routes and page composition
- `src/components` — shared UI
- `src/features` — feature-specific code
- `src/lib` — shared utilities

## Design System

UI and UX follow the Hybrid Neo-SaaS specification (70% Clean SaaS + 30% Neobrutalism) defined in `design.md`:

- Clean neutral canvas background (`#f8f9fa`) with flat pure-white cards (`#ffffff`) and subtle `1px solid #e2e8f0` borders
- Modern rounded corners (`rounded-lg` 8px for cards, `rounded-md` 6px for buttons/inputs, `rounded-sm` 4px for tags)
- Primary electric purple accent (`#543AFD` / hover `#462ee0`) and high-contrast black ink (`#09090b` / `#000000`)
- Neobrutalist tactile micro-shadows (`2px 2px 0px #000000` / `3px 3px 0px #000000`) on primary CTAs and status pills
- Typography: Space Grotesk (headlines & body UI), Space Mono (uppercase badges, SKUs, metrics & code)
- Snappy tactile micro-press interactions (`translate(1px, 1px)`) and crisp offset focus shadows

Refer to `design.md` for full tokens, typography hierarchy, and interaction models before creating or modifying UI components.

## Authentication

### Source & Structure

Authentication logic and UI are organized in `src/features/auth`:

- `src/features/auth/mock-auth.ts` — mock auth helpers, mock user, and mock credentials.
- `src/features/auth/types.ts` — authentication types and interfaces.
- `src/features/auth/components/` — authentication UI components.
- `src/app/(auth)/` — public authentication routes.
- `src/app/(dashboard)/layout.tsx` — server-side route protection.

### Current Behavior

- Authentication currently uses a development cookie (`stockos_mock_auth=true`) to simulate session state.
- Mock credentials are `demo@stockos.com` / `demo123`.
- Unauthenticated requests to the dashboard area are redirected to `/login`.
- Successful mock login sets the mock authentication state and redirects to `/`.
- Sign out clears the mock authentication state and redirects to `/login`.

### Current Limitations

- There is no real backend authentication yet.
- There is no real session token/JWT verification.
- There is no database persistence.
- Signup, reset password, and new password currently provide frontend UI only.

### Guidelines for Future Auth Replacement

Keep mock authentication isolated and easy to replace with real authentication later.

Consume authentication state through central authentication helpers rather than accessing the mock implementation directly throughout the application.

Do not introduce real authentication infrastructure unless explicitly requested.

## Engineering Rules

- Use TypeScript. Avoid `any`.
- Reuse existing components and patterns.
- Prefer simple solutions over unnecessary abstractions.
- Keep components focused and composable.
- Do not modify unrelated code.
- Consider performance when introducing client-side code or dependencies.

Do not invent project conventions.

When a pattern becomes established and will be reused, document it in the appropriate project documentation and reference it from this file when necessary.

## Git Workflow

Use Git to keep changes small, traceable, and easy to review.

### Branches

- `main` — stable, production-ready code.
- `feat/<short-description>` — new features.
- `fix/<short-description>` — bug fixes.
- `refactor/<short-description>` — refactoring without behavior changes.
- `chore/<short-description>` — tooling, dependencies, configuration, or maintenance.

Do not work directly on `main` for feature or bug-fix changes.

### Commits

Keep commits small and focused.

Use Conventional Commits:

- `feat:` — new functionality
- `fix:` — bug fixes
- `refactor:` — code restructuring without behavior changes
- `chore:` — maintenance/configuration
- `docs:` — documentation
- `test:` — tests
- `style:` — formatting or styling

Examples:

```text
feat(auth): add mock login flow
feat(dashboard): add application shell
fix(auth): redirect unauthenticated users
refactor(auth): extract reusable form field
docs: document authentication architecture
chore: update dependencies
```
