import React from 'react';

interface PageHeaderProps {
  title: string;
  badgeText?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, badgeText, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {badgeText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20 tracking-wider">
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
