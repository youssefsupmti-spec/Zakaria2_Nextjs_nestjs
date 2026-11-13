import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B9DD9] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#1B9DD9] to-[#0E86C2] text-white shadow-xs hover:from-[#0E86C2] hover:to-[#0A6DA0]',
        accent: 'bg-[#F9A03F] text-white shadow-xs hover:bg-[#E08A2B]',
        outline:
          'border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:border-[#1B9DD9]/40 hover:text-[#1B9DD9] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-[#3fb4e8]/50 dark:hover:bg-slate-800 dark:hover:text-[#3fb4e8]',
        ghost:
          'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        dark: 'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-xs dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
        destructive: 'bg-red-600 text-white shadow-xs hover:bg-red-700',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-sm',
        icon: 'size-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
