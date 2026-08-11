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
        <main className="flex-1 p-3 sm:p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
