'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ResetPasswordRequestSchema,
  type ResetPasswordRequestDto,
} from '@zakaria/shared-contracts';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/api-client';

interface ResetPasswordFormProps {
  initialEmail?: string;
  initialToken?: string;
}

export function ResetPasswordForm({
  initialEmail = '',
  initialToken = '',
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequestDto>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    defaultValues: {
      email: initialEmail,
      token: initialToken,
      password: '',
      passwordConfirmation: '',
    },
  });

  const missingToken = initialToken.trim().length < 32;

  const onSubmit = async (values: ResetPasswordRequestDto) => {
    setFeedback(null);
    try {
      const body = await apiFetch<{ message?: string }>('/auth/reset-password', {
        method: 'POST',
        body: values,
      });

      const message = body?.message || 'Votre mot de passe a été réinitialisé.';
      setFeedback({ type: 'success', message });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }
      setFeedback({
        type: 'error',
        message: 'Impossible de contacter le serveur G4D pour réinitialiser le mot de passe.',
      });
    }
  };

  if (missingToken) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700"
      >
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
        <p className="m-0">
          Lien de réinitialisation incomplet ou invalide. Veuillez effectuer une nouvelle demande
          depuis la page{' '}
          <a
            href="/forgot-password"
            className="font-bold text-[#0284c7] hover:text-[#ea580c] underline"
          >
            Mot de passe oublié
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={
            feedback.type === 'error'
              ? 'flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
              : 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 space-y-2'
          }
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
            ) : (
              <CheckCircle2
                className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600"
                aria-hidden="true"
              />
            )}
            <p className="m-0">{feedback.message}</p>
          </div>
          {feedback.type === 'success' && (
            <p className="m-0 pl-6.5">
              <a
                href="/login"
                className="font-bold text-[#0284c7] hover:text-[#ea580c] transition-colors"
              >
                Aller à la page de connexion &rarr;
              </a>
            </p>
          )}
        </div>
      )}

      {feedback?.type !== 'success' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register('token')} />

          <div className="space-y-1.5">
            <label
              htmlFor="reset-email"
              className="block text-[13px] font-semibold tracking-tight text-slate-700"
            >
              Adresse e-mail
            </label>
            <input
              id="reset-email"
              type="email"
              readOnly={Boolean(initialEmail)}
              aria-invalid={Boolean(errors.email)}
              className={`w-full h-12 rounded-xl border bg-slate-50/70 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-4 read-only:bg-slate-100 read-only:text-slate-600 ${
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

          <div className="space-y-1.5">
            <label
              htmlFor="reset-password"
              className="block text-[13px] font-semibold tracking-tight text-slate-700"
            >
              Nouveau mot de passe (min. 8 caractères)
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                className={`w-full h-12 rounded-xl border bg-slate-50/70 pl-4 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-4 ${
                  errors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-300 focus:border-[#0284c7] focus:ring-[#0284c7]/15'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reset-password-confirm"
              className="block text-[13px] font-semibold tracking-tight text-slate-700"
            >
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="reset-password-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.passwordConfirmation)}
              className={`w-full h-12 rounded-xl border bg-slate-50/70 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-4 ${
                errors.passwordConfirmation
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-300 focus:border-[#0284c7] focus:ring-[#0284c7]/15'
              }`}
              {...register('passwordConfirmation')}
            />
            {errors.passwordConfirmation && (
              <p className="text-xs font-medium text-red-600 mt-1">
                {errors.passwordConfirmation.message}
              </p>
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
                <span>Mise à jour…</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                <span>Enregistrer le nouveau mot de passe</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
