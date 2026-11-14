'use client';

import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  OPERATION_LABELS,
  type OperationLabelKey,
  type OperationMessage,
} from './operation-feedback-utils';

export * from './operation-feedback-utils';

export function OperationFeedbackBanner({
  feedback,
  onDismiss,
  className,
}: {
  feedback: OperationMessage | null;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!feedback) return null;
  const isOk = feedback.type === 'ok';

  return (
    <div
      role={isOk ? 'status' : 'alert'}
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm shadow-2xs',
        isOk
          ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200'
          : 'border-red-200 bg-red-50/90 text-red-800 dark:border-red-800/80 dark:bg-red-950/60 dark:text-red-200',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {isOk ? (
          <CheckCircle2 className="size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertTriangle className="size-4.5 shrink-0 text-red-600 dark:text-red-400" />
        )}
        <span className="font-medium break-words">{feedback.text}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer la notification"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-current/70 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function InlineOperationStatus({
  operation,
  className,
}: {
  operation: OperationLabelKey | null;
  className?: string;
}) {
  if (!operation) return null;

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800/80 dark:bg-sky-950/60 dark:text-sky-300',
        className,
      )}
    >
      <Loader2 className="size-3.5 animate-spin" />
      <span>{OPERATION_LABELS[operation]}</span>
    </span>
  );
}
