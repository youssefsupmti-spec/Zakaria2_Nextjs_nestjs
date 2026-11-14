'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import './solar-icons';

export interface PageTabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
  icon?: string;
  disabled?: boolean;
}

export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  rightSlot,
  className,
}: {
  tabs: ReadonlyArray<PageTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="Filtres de statut"
        className="flex items-center gap-1 overflow-x-auto py-0.5"
      >
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={tab.disabled}
              onClick={() => onChange(tab.key)}
              className={cn(
                'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B9DD9] disabled:pointer-events-none disabled:opacity-50',
                active
                  ? 'bg-[#1B9DD9]/12 text-[#0E86C2] ring-1 ring-[#1B9DD9]/30 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-700/60'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100',
              )}
            >
              {tab.icon && <Icon icon={tab.icon} className="size-4 shrink-0" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'tabular-nums rounded-md px-1.5 py-0.5 text-[11px] font-bold leading-none',
                    active
                      ? 'bg-[#1B9DD9] text-white dark:bg-sky-500 dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {rightSlot && <div className="flex shrink-0 items-center gap-2">{rightSlot}</div>}
    </div>
  );
}
