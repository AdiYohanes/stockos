"use client";

import * as React from "react";
import {
  PackagePlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickActionItem } from "../types";
import { MOCK_QUICK_ACTIONS } from "../mock-data";

interface QuickActionsProps {
  actions?: QuickActionItem[];
}

export function QuickActions({ actions = MOCK_QUICK_ACTIONS }: QuickActionsProps) {
  const [activeNotification, setActiveNotification] = React.useState<string | null>(null);

  const handleActionClick = (title: string) => {
    setActiveNotification(`${title} dijalankan (Placeholder)`);
    setTimeout(() => {
      setActiveNotification(null);
    }, 2500);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 items-stretch">
        {actions.map((action) => {
          const iconConfig = getActionIcon(action.icon);
          const IconComponent = iconConfig.icon;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleActionClick(action.title)}
              className="group flex items-start gap-2.5 rounded-lg border border-border/70 bg-card p-2.5 text-left transition-all duration-200 ease-in-out hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer h-full"
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 transition-transform duration-200 group-hover:scale-110 mt-0.5",
                  iconConfig.wrapperClass
                )}
              >
                <IconComponent className={cn("h-3.5 w-3.5", iconConfig.iconClass)} />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-between h-full cursor-pointer">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate cursor-pointer"
                      title={action.title}
                    >
                      {action.title}
                    </span>
                    {action.badge && (
                      <span className="text-[9px] font-medium text-muted-foreground uppercase shrink-0">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 cursor-pointer"
                    title={action.description}
                  >
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeNotification && (
        <div className="absolute right-2 -top-6 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-background/90 px-2 py-0.5 rounded-md border border-emerald-500/30 shadow-xs animate-in fade-in">
          {activeNotification}
        </div>
      )}
    </div>
  );
}

function getActionIcon(icon: QuickActionItem["icon"]) {
  switch (icon) {
    case "plus":
      return {
        icon: PackagePlus,
        wrapperClass: "bg-primary/10 text-primary ring-primary/20",
        iconClass: "text-primary",
      };
    case "arrow-down":
      return {
        icon: ArrowDownToLine,
        wrapperClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
        iconClass: "text-emerald-600 dark:text-emerald-400",
      };
    case "arrow-up":
      return {
        icon: ArrowUpFromLine,
        wrapperClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
        iconClass: "text-amber-600 dark:text-amber-400",
      };
    case "transfer":
      return {
        icon: ArrowLeftRight,
        wrapperClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
        iconClass: "text-blue-600 dark:text-blue-400",
      };
  }
}
