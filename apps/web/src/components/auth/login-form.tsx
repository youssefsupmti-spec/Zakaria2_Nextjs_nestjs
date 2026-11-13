'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, Clock, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import {
  LoginRequestSchema,
  type LoginRequestDto,
  type LoginResponseDto,
  type SessionDuration,
} from '@zakaria/shared-contracts';
import { ApiClientError, apiFetch } from '@/lib/api-client';

interface LoginFormProps {
  nextRedirect?: string;
}

const SESSION_PILL_OPTIONS: ReadonlyArray<{
  value: SessionDuration;
  pill: string;
  details: string;
}> = [
  { value: '30m', pill: '30m', details: '30 minutes' },
  { value: '2h', pill: '2h', details: '2 heures' },
  { value: '8h', pill: '8h', details: '8 heures (Par défaut)' },
  { value: '1d', pill: '24h', details: '24 heures' },
  { value: '7d', pill: '7j', details: '7 jours' },
  { value: '30d', pill: '30j', details: '30 jours' },
];

export function LoginForm({ nextRedirect }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'error' | 'info';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequestDto>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
      sessionDuration: '8h',
    },
  });

  const selectedDuration = watch('sessionDuration') ?? '8h';
  const activeOption =
    SESSION_PILL_OPTIONS.find((item) => item.value === selectedDuration) ?? SESSION_PILL_OPTIONS[2];

  const onSubmit = async (values: LoginRequestDto) => {
    setAuthFeedback(null);
    try {
      const body = await apiFetch<LoginResponseDto>('/auth/login', {
        method: 'POST',
        body: {
          email: values.email,
          password: values.password,
          sessionDuration: values.sessionDuration ?? '8h',
        },
      });

      const safeNext =
        nextRedirect && nextRedirect.startsWith('/') && !nextRedirect.startsWith('//')
          ? nextRedirect
          : null;
      const redirectTo = safeNext ?? (body?.redirectTo ? body.redirectTo : '/dashboard');
      window.location.assign(redirectTo);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setAuthFeedback({
          type: 'error',
          message: error.message || 'Identifiants invalides ou accès refusé.',
        });
        return;
      }
      setAuthFeedback({
        type: 'error',
        message: 'Impossible de joindre le serveur d’authentification G4D.',
      });
    }
  };

  return (
    <>
      {authFeedback && (
        <div
          role="alert"
          className={`mb-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-medium ${
            authFeedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-sky-200 bg-sky-50 text-sky-800'
          }`}
        >
          <AlertCircle
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              authFeedback.type === 'error' ? 'text-red-500' : 'text-sky-600'
            }`}
            aria-hidden="true"
          />
          <span>{authFeedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Adresse e-mail */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-[13px] font-semibold text-slate-800">
            Adresse e-mail
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="vous@entreprise.com"
              className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                errors.email
                  ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                  : 'border-slate-300 hover:border-slate-400 focus-visible:border-sky-600 focus-visible:ring-sky-500/20'
              }`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Mot de passe */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="login-password"
              className="block text-[13px] font-semibold text-slate-800"
            >
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                errors.password
                  ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                  : 'border-slate-300 hover:border-slate-400 focus-visible:border-sky-600 focus-visible:ring-sky-500/20'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Sélecteur de durée de session (Segmented Control 6 boutons) */}
        <div className="space-y-2">
          <input type="hidden" {...register('sessionDuration')} />
          <div className="flex items-center justify-between gap-2">
            <span
              id="session-duration-label"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-800"
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Durée de session
            </span>
            <span className="text-xs font-medium text-sky-700 tabular-nums">
              {activeOption.details}
            </span>
          </div>

          <div
            role="group"
            aria-labelledby="session-duration-label"
            className="grid grid-cols-6 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80"
          >
            {SESSION_PILL_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    setValue('sessionDuration', opt.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className={`h-8 rounded-lg text-xs font-semibold tabular-nums transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {opt.pill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-12 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B9DD9] via-[#0284C7] to-[#0369A1] px-4 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition-all hover:brightness-105 hover:-translate-y-px active:translate-y-0 disabled:opacity-65 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 cursor-pointer"
        >
          {!isSubmitting ? (
            <>
              <span>Se connecter</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          ) : (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              <span>Connexion en cours&hellip;</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}
