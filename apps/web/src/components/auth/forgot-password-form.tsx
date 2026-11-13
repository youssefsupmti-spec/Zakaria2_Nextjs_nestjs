'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ForgotPasswordRequestSchema,
  type ForgotPasswordRequestDto,
} from '@zakaria/shared-contracts';
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/api-client';

export function ForgotPasswordForm() {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordRequestDto>({
    resolver: zodResolver(ForgotPasswordRequestSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordRequestDto) => {
    setFeedback(null);
    try {
      const body = await apiFetch<{ message?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email: values.email },
      });

      const message =
        body?.message ||
        "Si cette adresse e-mail correspond à un compte actif, un lien de réinitialisation vient d'être envoyé.";
      setFeedback({ type: 'success', message });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }
      setFeedback({
        type: 'error',
        message: 'Impossible de contacter le serveur G4D pour le moment.',
      });
    }
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={
            feedback.type === 'error'
              ? 'flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
              : 'flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800'
          }
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-sky-600" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="forgot-email"
            className="block text-[13px] font-semibold tracking-tight text-slate-700"
          >
            Adresse e-mail du compte
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="vous@entreprise.com"
            aria-invalid={Boolean(errors.email)}
            className={`w-full h-12 rounded-xl border bg-slate-50/70 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-4 ${
              errors.email
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-300 focus:border-[#0284c7] focus:ring-[#0284c7]/15'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs font-medium text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#0c4a6e] px-6 text-sm font-bold tracking-wide text-white shadow-[0_8px_20px_-6px_rgba(2,132,199,0.45)] transition-all hover:brightness-105 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-6px_rgba(2,132,199,0.55)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Envoi en cours…</span>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>Envoyer le lien de réinitialisation</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
