"use client";

import * as React from "react";
import { Building2, Boxes, Bell, Users, ShieldAlert } from "lucide-react";
import { SettingsTab } from "../types";
import { cn } from "@/lib/utils";

import { useI18n } from "@/lib/i18n/context";

interface SettingsTabNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  teamCount: number;
  activeAlertsCount: number;
}

export function SettingsTabNav({
  activeTab,
  onTabChange,
  teamCount,
  activeAlertsCount,
}: SettingsTabNavProps) {
  const { t } = useI18n();

  const tabs: Array<{
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }> = [
    {
      id: "company",
      label: t.settings.tabCompanyProfile,
      icon: Building2,
    },
    {
      id: "inventory",
      label: t.settings.tabStockRules,
      icon: Boxes,
    },
    {
      id: "notifications",
      label: t.settings.tabNotificationsAlerts,
      icon: Bell,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount} ${t.settings.activeStatus}` : undefined,
    },
    {
      id: "team",
      label: t.settings.tabTeamAccess,
      icon: Users,
      badge: `${teamCount} ${t.settings.membersCount}`,
    },
    {
      id: "system",
      label: t.settings.tabSystemMaintenance,
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="flex border-b border-slate-200 bg-white overflow-x-auto no-scrollbar">
      <nav className="flex gap-2 p-1" aria-label="Settings Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-none px-3.5 py-2 font-mono text-xs font-semibold transition-all whitespace-nowrap",
                isActive
                  ? "bg-[#543afd] text-white border-1.5 border-black shadow-neo-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500")} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    "ml-1 inline-flex items-center rounded-none px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold",
                    isActive
                      ? "bg-white text-[#543afd] border-[3px] border-ink"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
