'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FILTER_SELECT_CLASS =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 shadow-2xs transition-colors focus-visible:outline-none focus-visible:border-[#1B9DD9] focus-visible:ring-2 focus-visible:ring-[#1B9DD9]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:border-[#3fb4e8]';

export function FilterField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterCard({
  activeCount = 0,
  onReset,
  onApply,
  applyLabel = 'Appliquer',
  columns = 4,
  rightExtra,
  className,
  children,
}: {
  activeCount?: number;
  onReset?: () => void;
  onApply?: () => void;
  applyLabel?: string;
  columns?: 2 | 3 | 4 | 5;
  rightExtra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const gridClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : columns === 5
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section
      aria-label="Filtres de recherche"
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-[#1B9DD9]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Filtres
          </span>
          {activeCount > 0 && (
            <span className="tabular-nums rounded-full bg-[#1B9DD9]/12 px-2 py-0.5 text-[11px] font-bold text-[#0E86C2] dark:bg-sky-950 dark:text-sky-300">
              {activeCount} actif{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightExtra}
          {onReset && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeCount === 0}
              onClick={onReset}
              className="h-7 px-2.5 text-xs text-slate-600 dark:text-slate-300"
            >
              <RotateCcw className="size-3.5" />
              Réinitialiser
            </Button>
          )}
          {onApply && (
            <Button type="button" size="sm" onClick={onApply} className="h-7 px-3 text-xs">
              {applyLabel}
            </Button>
          )}
        </div>
      </div>

      <div className={cn('grid gap-3', gridClass)}>{children}</div>
    </section>
  );
}
