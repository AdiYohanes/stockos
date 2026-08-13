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
        'inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium bg-muted text-foreground border border-border/80 tracking-wider',
        className
      )}
    >
      {code}
    </code>
  );
}
