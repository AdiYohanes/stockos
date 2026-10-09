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
        'inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono tabular-nums font-bold bg-white text-ink border-[3px] border-ink uppercase select-all',
        className
      )}
    >
      {code}
    </code>
  );
}
