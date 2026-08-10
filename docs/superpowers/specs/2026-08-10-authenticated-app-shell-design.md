# Authenticated Application Shell Spec

**Date:** 2026-08-10  
**Status:** Approved  

## Goal

Create the responsive authenticated application shell for StockOS using a Next.js App Router Route Group (`(dashboard)`). The shell establishes the standard ERP layout (left sidebar, top navbar, main content area) and prepares navigation for future modules while integrating the existing mock authentication flow.

## Architecture & Layout Design

### 1. Route Group & Routing Structure
- **Route Group:** `src/app/(dashboard)/`
  - URL route mapping: Route groups wrapped in parentheses do not add path segments to the URL.
  - The root dashboard route is accessed at `/`.
- **Layout Server Component (`src/app/(dashboard)/layout.tsx`):**
  - Performs server-side authentication check using `await getMockAuthState()`.
  - Redirects unauthenticated users to `/login`.
  - Passes authenticated user data to the client application shell.
- **Root Page (`src/app/(dashboard)/page.tsx`):**
  - Moved from `src/app/page.tsx` to `src/app/(dashboard)/page.tsx`.
  - Serves as the landing view for `/`, rendered within the dashboard shell content area.

### 2. Component Hierarchy

```text
src/app/(dashboard)/layout.tsx (Server Component)
└── AppShell (Client Component: src/components/layout/app-shell.tsx)
    ├── Sidebar (Desktop: src/components/layout/sidebar.tsx)
    ├── MobileSidebar (Drawer + Overlay: src/components/layout/sidebar.tsx)
    ├── Navbar (Header: src/components/layout/navbar.tsx)
    │   ├── MobileSidebarTrigger (Hamburger menu button)
    │   ├── PageContext (Context title / breadcrumbs)
    │   └── UserMenu (src/components/layout/user-menu.tsx)
    │       └── SignOutAction (reusing mock sign-out flow)
    └── MainContent (<main className="..."> {children} </main>)
```

### 3. Module Navigation Items
The sidebar navigation prepares links for the core modules:
1. **Dashboard** — `/` (Icon: `LayoutDashboard`)
2. **Products** — `/products` (Icon: `Package`)
3. **Inventory** — `/inventory` (Icon: `Boxes`)
4. **Warehouses** — `/warehouses` (Icon: `Warehouse`)
5. **Suppliers** — `/suppliers` (Icon: `Truck`)
6. **Reports** — `/reports` (Icon: `BarChart3`)
7. **Settings** — `/settings` (Icon: `Settings`)

Active route detection is determined using `usePathname()`. Clicking an item navigates to the target route and automatically closes the mobile drawer if open.

### 4. Top Navbar & User Menu
- **Top Navbar (`src/components/layout/navbar.tsx`):**
  - Height: `h-16`, sticky top header with backdrop blur and border.
  - Contains mobile drawer toggle button (visible on `< md` screens).
  - Contextual heading displaying current page name or system identity.
  - Right-aligned User Menu.
- **User Menu (`src/components/layout/user-menu.tsx`):**
  - Displays user avatar initials, user name (`Demo User`), email (`demo@stockos.com`), and role badge (`admin`).
  - Contains sign-out action invoking `logoutMockUser()` and redirecting to `/login` via `router.push('/login')` and `router.refresh()`.

### 5. Responsiveness & Design System
- Uses Tailwind CSS theme variables from `globals.css` (`--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-border`, `--color-sidebar-accent`, `--color-sidebar-accent-foreground`).
- **Desktop (`>= md`):**
  - Fixed left sidebar with width `w-64`.
  - Main viewport offset with `md:pl-64`.
- **Mobile (`< md`):**
  - Desktop sidebar hidden.
  - Interactive slide-over drawer with backdrop overlay for accessibility and smooth user experience.

## Verification Plan

1. **Route Rendering:** Navigate to `/` as an authenticated user; confirm page renders inside the authenticated shell with sidebar, navbar, and main content area.
2. **Unauthenticated Redirect:** When unauthenticated (cookie cleared), navigate to `/`; confirm immediate server redirect to `/login`.
3. **Sign Out Flow:** Click the sign out action in the navbar user menu; confirm cookie is cleared and redirected to `/login`.
4. **Responsive Testing:** Verify sidebar transitions cleanly between desktop (fixed left column) and mobile (slide-over drawer toggled via navbar button).
5. **Type & Lint Checks:** Run `npm run lint` and `npx tsc --noEmit` to verify code quality and type safety.
