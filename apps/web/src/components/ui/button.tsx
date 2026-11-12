import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B9DD9] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#1B9DD9] to-[#0E86C2] text-white shadow-md shadow-[#1B9DD9]/25 hover:from-[#0E86C2] hover:to-[#0A6DA0] hover:shadow-lg hover:shadow-[#1B9DD9]/35',
        accent:
          'bg-[#F9A03F] text-white shadow-md shadow-[#F9A03F]/25 hover:bg-[#E08A2B] hover:shadow-lg hover:shadow-[#F9A03F]/35',
        outline:
          'border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:border-[#1B9DD9]/40 hover:text-[#1B9DD9]',
        ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        dark: 'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-md',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-lg px-3.5 text-xs',
        lg: 'h-12 rounded-xl px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };

