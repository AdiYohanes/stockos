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
        'transition-all cursor-pointer border border-border/80 hover:border-black/50',
        isActive && 'border-black shadow-neo-sm ring-1 ring-black/5 bg-primary/[0.02]',
        onClick && 'hover:-translate-y-0.5',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="p-2 rounded-md bg-muted/60 text-foreground">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-sm',
                trend.positive
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
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
