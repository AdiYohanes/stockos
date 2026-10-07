import React from 'react';
import { cn } from '@/lib/utils';

interface SkuBadgeProps {
  code: string;
  className?: string;
}

export function SkuBadge({ code, className }: SkuBadgeProps) {
  return (
    <code
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-mono tabular-nums font-medium bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 select-all',
        className
      )}
    >
      {code}
    </code>
  );
}
