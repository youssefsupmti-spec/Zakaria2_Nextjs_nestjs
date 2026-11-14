import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="page-content" className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}
