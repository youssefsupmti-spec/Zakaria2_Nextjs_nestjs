import * as React from 'react';
import { cn } from '@/lib/utils';

export function Alert({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'destructive' | 'success' | 'info';
}) {
  const variantClasses = {
    default: 'border-slate-200 bg-slate-50 text-slate-800',
    destructive: 'border-red-200 bg-red-50/90 text-red-800',
    success: 'border-emerald-200 bg-emerald-50/90 text-emerald-800',
    info: 'border-[#1B9DD9]/30 bg-[#1B9DD9]/8 text-[#0E86C2]',
  }[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 text-sm font-medium transition-all',
        variantClasses,
        className,
      )}
      {...props}
    />
  );
}

