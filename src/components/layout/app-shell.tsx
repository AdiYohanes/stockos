"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import type { MockUser } from "@/features/auth/types";

interface AppShellProps {
  children: React.ReactNode;
  user: MockUser | null;
}

export function AppShell({ children, user }: AppShellProps) {
  // Mobile drawer is removed in favor of MobileBottomNav
  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans flex grid-dots">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
        <Navbar user={user} onOpenMobileSidebar={() => {}} />
        <main className="flex-1 p-5 md:p-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

