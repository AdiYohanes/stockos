import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  isActive,
  onClick,
  className,
}: MetricCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-colors cursor-pointer border border-border bg-card hover:border-slate-400',
        isActive && 'border-primary ring-1 ring-primary bg-slate-50/50 dark:bg-slate-900/50',
        className
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <p className="text-xl sm:text-2xl font-semibold tracking-tight font-mono tabular-nums text-foreground">{value}</p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded-sm border font-mono tabular-nums',
                trend.positive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
