import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, variant = 'neutral', size = 'md', className }: StatusBadgeProps) {
  const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400',
    neutral: 'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-400',
  };

  const dotStyles: Record<StatusVariant, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-sm border uppercase tracking-wider font-mono',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        variantStyles[variant],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />
      {status}
    </span>
  );
}
