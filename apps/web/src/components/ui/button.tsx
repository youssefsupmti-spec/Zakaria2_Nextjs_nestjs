import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B9DD9] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#1B9DD9] to-[#0E86C2] text-white shadow-xs hover:from-[#0E86C2] hover:to-[#0A6DA0]',
        accent: 'bg-[#F9A03F] text-white shadow-xs hover:bg-[#E08A2B]',
        outline:
          'border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:border-[#1B9DD9]/40 hover:text-[#1B9DD9]',
        ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        dark: 'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-xs',
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
