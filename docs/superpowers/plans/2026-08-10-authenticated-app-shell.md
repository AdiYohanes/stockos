# Authenticated Application Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a responsive authenticated application shell for StockOS using a Next.js App Router Route Group (`(dashboard)`), establishing a left sidebar, top navbar, responsive mobile drawer, user menu with mock sign-out, and module navigation placeholders.

**Architecture:** Server Component auth guard in `src/app/(dashboard)/layout.tsx` verifies authentication via `getMockAuthState()`. Passes authenticated user data to a modular client `AppShell` with modular `Sidebar`, `Navbar`, and `UserMenu` components. Root page moved to `src/app/(dashboard)/page.tsx` accessible at `/`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React icons.

## Global Constraints

- Use TypeScript. Avoid `any`.
- Keep the `(dashboard)` route group out of the URL (root route is `/`).
- Prefer Server Components by default; use Client Components only where interactivity is required.
- Reuse existing mock authentication flow (`getMockAuthState`, `logoutMockUser`, `MOCK_USER`).
- Do not implement product/inventory widgets or database logic.
- Ensure full desktop ($\ge$ 768px) and mobile (< 768px) responsive behavior.

---

### Task 1: Create Modular Layout Components

**Files:**
- Create: `src/components/layout/user-menu.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/navbar.tsx`
- Create: `src/components/layout/app-shell.tsx`

**Interfaces:**
- Consumes: `MockUser` from `@/features/auth/types`, `logoutMockUser` from `@/features/auth/mock-auth`
- Produces: `AppShell` component accepting `{ children: React.ReactNode, user: MockUser | null }`

- [ ] **Step 1: Create User Menu Component (`src/components/layout/user-menu.tsx`)**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutMockUser } from "@/features/auth/mock-auth";
import type { MockUser } from "@/features/auth/types";

interface UserMenuProps {
  user: MockUser | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSignOut = () => {
    setIsLoggingOut(true);
    logoutMockUser();
    router.push("/login");
    router.refresh();
  };

  const displayName = user?.name || "Demo User";
  const displayEmail = user?.email || "demo@stockos.com";
  const displayRole = user?.role || "admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials || <UserIcon className="h-4 w-4" />}
        </div>
        <div className="hidden flex-col text-left sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground">{displayName}</span>
            <span className="rounded bg-muted px-1 py-0.2 text-[10px] font-mono capitalize text-muted-foreground">
              {displayRole}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">{displayEmail}</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoggingOut}
        className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">{isLoggingOut ? "Signing out..." : "Sign out"}</span>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create Sidebar Component (`src/components/layout/sidebar.tsx`)**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Warehouse,
  Truck,
  BarChart3,
  Settings,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Products", href: "/products", icon: Package },
  { title: "Inventory", href: "/inventory", icon: Boxes },
  { title: "Warehouses", href: "/warehouses", icon: Warehouse },
  { title: "Suppliers", href: "/suppliers", icon: Truck },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ className, onNavigate, isMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 font-semibold text-sidebar-foreground transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">StockOS</span>
            <span className="text-[10px] font-normal text-muted-foreground">Stock Management</span>
          </div>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseMobile}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Platform
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="border-t border-sidebar-border p-4 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>StockOS v0.1.0</span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Dev Mode
          </span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create Navbar Component (`src/components/layout/navbar.tsx`)**

```tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { NAV_ITEMS } from "@/components/layout/sidebar";
import type { MockUser } from "@/features/auth/types";

interface NavbarProps {
  user: MockUser | null;
  onOpenMobileSidebar: () => void;
}

export function Navbar({ user, onOpenMobileSidebar }: NavbarProps) {
  const pathname = usePathname();

  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const title = currentNav ? currentNav.title : "StockOS";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenMobileSidebar}
          className="h-9 w-9 p-0 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create AppShell Wrapper (`src/components/layout/app-shell.tsx`)**

```tsx
"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import type { MockUser } from "@/features/auth/types";

interface AppShellProps {
  children: React.ReactNode;
  user: MockUser | null;
}

export function AppShell({ children, user }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Close mobile drawer on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop and Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-sidebar shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              isMobile
              onNavigate={() => setIsMobileOpen(false)}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 flex-col md:pl-64">
        <Navbar user={user} onOpenMobileSidebar={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify components compile**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit layout components**

```bash
git add src/components/layout/
git commit -m "feat(layout): add sidebar, navbar, user-menu and app-shell components"
```

---

### Task 2: Implement `src/app/(dashboard)/layout.tsx` & Move `src/app/page.tsx`

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`
- Delete: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getMockAuthState()` from `@/features/auth/mock-auth`, `AppShell` from `@/components/layout/app-shell`
- Produces: Authenticated server layout for `(dashboard)` route group

- [ ] **Step 1: Create Dashboard Layout Server Component (`src/app/(dashboard)/layout.tsx`)**

```tsx
import { redirect } from "next/navigation";
import { getMockAuthState } from "@/features/auth/mock-auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = await getMockAuthState();

  if (!isAuthenticated) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
```

- [ ] **Step 2: Create `src/app/(dashboard)/page.tsx` and remove `src/app/page.tsx`**

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockAuthState } from "@/features/auth/mock-auth";

export default async function DashboardHomePage() {
  const { user } = await getMockAuthState();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Welcome to StockOS Stock Management System.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Authentication State</CardDescription>
            <CardTitle className="text-lg">Mock Session Active</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User:</span>
              <span className="font-medium text-foreground">{user?.name || "Demo User"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-foreground">{user?.email || "demo@stockos.com"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-mono uppercase text-foreground">{user?.role || "admin"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Remove root `src/app/page.tsx`**

Delete `src/app/page.tsx` so Next.js resolves `/` through `(dashboard)/page.tsx`.

- [ ] **Step 4: Verify typecheck & lint**

Run: `npm run lint` and `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit route group layout and root page**

```bash
git add src/app/
git commit -m "feat(routes): create (dashboard) route group layout and move root page"
```

---

### Task 3: Comprehensive Verification & UI Testing

**Files:**
- Test existing flows and responsive shell

- [ ] **Step 1: Run type checking and linter**

Run: `npm run lint; npx tsc --noEmit`
Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 2: Verify authenticated access at `/`**
- [ ] **Step 3: Verify mock sign-out from user menu redirects to `/login`**
- [ ] **Step 4: Verify unauthenticated `/` redirects to `/login`**
- [ ] **Step 5: Verify login flow restores access to `/` inside AppShell**
- [ ] **Step 6: Verify mobile responsiveness (hamburger button triggers drawer)**
- [ ] **Step 7: Final commit & Walkthrough documentation**
