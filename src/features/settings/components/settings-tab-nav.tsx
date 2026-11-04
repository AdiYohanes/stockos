"use client";

import * as React from "react";
import { Building2, Boxes, Tags, Truck } from "lucide-react";
import { SettingsTab } from "../types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

interface SettingsTabNavProps {
  activeTab: SettingsTab;
  disabled?: boolean;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsTabNav({
  activeTab,
  disabled = false,
  onTabChange,
}: SettingsTabNavProps) {
  const { t } = useI18n();

  const tabs: Array<{
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
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
      id: "categories",
      label: t.settings.tabCategories,
      icon: Tags,
    },
    {
      id: "suppliers",
      label: t.settings.tabSuppliers,
      icon: Truck,
    },
  ];

  return (
    <div className="flex border-b-[3px] border-ink bg-white overflow-x-auto no-scrollbar">
      <nav className="flex gap-1.5" aria-label="Settings Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-none px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid",
                isActive
                  ? "bg-acid text-ink -mb-[3px] border-[3px] border-b-0 border-black shadow-none"
                  : "text-ink/60 hover:bg-paper hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
