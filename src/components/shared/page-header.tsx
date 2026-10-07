import React from 'react';

interface PageHeaderProps {
  title: string;
  badgeText?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, badgeText, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {badgeText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono tabular-nums font-medium bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800">
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
