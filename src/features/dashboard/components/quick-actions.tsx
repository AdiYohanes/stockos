"use client";

import * as React from "react";
import {
  PackagePlus,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickActionItem } from "../types";
import { MOCK_QUICK_ACTIONS } from "../mock-data";
import { useI18n } from "@/lib/i18n/context";

interface QuickActionsProps {
  actions?: QuickActionItem[];
}

export function QuickActions({ actions = MOCK_QUICK_ACTIONS }: QuickActionsProps) {
  const [activeNotification, setActiveNotification] = React.useState<string | null>(null);
  const { language } = useI18n();

  const handleActionClick = (title: string) => {
    const executedText = language === "id" ? "dijalankan (Placeholder)" : "executed (Placeholder)";
    setActiveNotification(`${title} ${executedText}`);
    setTimeout(() => {
      setActiveNotification(null);
    }, 2500);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 items-stretch">
        {actions.map((action) => {
          const iconConfig = getActionIcon(action.icon);
          const IconComponent = iconConfig.icon;

          // quick translation for mock data
          let localizedTitle = action.title;
          let localizedDesc = action.description;
          if (language === "en") {
            if (action.id === "qa-1") { localizedTitle = "Add Product"; localizedDesc = "Register a new product to master data"; }
            if (action.id === "qa-2") { localizedTitle = "Stock In"; localizedDesc = "Record stock receiving from supplier"; }
            if (action.id === "qa-3") { localizedTitle = "Stock Out"; localizedDesc = "Record sales or manual deduction"; }
          }

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleActionClick(localizedTitle)}
              className="press group flex flex-col items-start gap-3 border-[3px] border-ink bg-white dark:bg-black p-3 text-left transition-all duration-150 shadow-hard-sm hover:bg-paper cursor-pointer h-full"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center border-[3px] border-ink bg-white group-hover:bg-paper",
                  iconConfig.wrapperClass
                )}
              >
                <IconComponent className={cn("h-4 w-4", iconConfig.iconClass)} />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-between h-full cursor-pointer w-full">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-bold uppercase tracking-widest text-ink group-hover:text-acid transition-colors duration-200 truncate cursor-pointer"
                      title={localizedTitle}
                    >
                      {localizedTitle}
                    </span>
                  </div>
                  <p
                    className="text-[10px] text-ink/60 font-mono uppercase tracking-widest line-clamp-2 mt-1 cursor-pointer"
                    title={localizedDesc}
                  >
                    {localizedDesc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeNotification && (
        <div className="absolute right-2 -top-6 text-[10px] font-bold uppercase tracking-widest text-ink bg-emerald-100 px-2 py-1 border-[3px] border-ink shadow-hard-sm animate-in fade-in">
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
        wrapperClass: "text-ink",
        iconClass: "text-acid",
      };
    case "arrow-down":
      return {
        icon: ArrowDownToLine,
        wrapperClass: "text-ink",
        iconClass: "text-emerald-600 dark:text-emerald-400",
      };
    case "arrow-up":
      return {
        icon: ArrowUpFromLine,
        wrapperClass: "text-ink",
        iconClass: "text-amber-600 dark:text-amber-400",
      };
  }
}
