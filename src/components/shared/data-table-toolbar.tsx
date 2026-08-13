import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusOption {
  label: string;
  value: string;
  count?: number;
}

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusOptions?: StatusOption[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  filterDropdowns?: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  statusOptions,
  selectedStatus,
  onStatusChange,
  filterDropdowns,
  onReset,
  hasActiveFilters,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm focus-neo"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {statusOptions && onStatusChange && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                    isSelected
                      ? 'bg-black text-white shadow-neo-sm'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className={cn('ml-1.5 text-[11px]', isSelected ? 'text-white/80' : 'text-muted-foreground')}>
                      ({opt.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {filterDropdowns}

        {hasActiveFilters && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
