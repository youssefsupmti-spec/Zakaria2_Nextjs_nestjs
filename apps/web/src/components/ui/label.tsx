import * as React from 'react';
import { cn } from '@/lib/utils';

export type LabelProps = React.ComponentProps<'label'>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        'text-sm font-semibold leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
