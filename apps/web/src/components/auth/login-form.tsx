'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LoginRequestSchema,
  SESSION_DURATION_OPTIONS,
  type LoginRequestDto,
  type LoginResponseDto,
} from '@zakaria/shared-contracts';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'error' | 'info';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequestDto>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
      sessionDuration: '8h',
    },
  });

  const onSubmit = async (values: LoginRequestDto) => {
    setAuthFeedback(null);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          sessionDuration: values.sessionDuration ?? '8h',
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | LoginResponseDto
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        const rawMsg = body && 'message' in body ? body.message : undefined;
        const message = Array.isArray(rawMsg)
          ? rawMsg[0]
          : rawMsg || 'Identifiants invalides ou accès refusé.';
        setAuthFeedback({
          type: 'error',
          message,
        });
        return;
      }

      const redirectTo =
        body && 'redirectTo' in body && body.redirectTo ? body.redirectTo : '/dashboard';
      window.location.assign(redirectTo);
    } catch {
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
          className={`mb-[22px] flex items-start gap-2.5 rounded-none border-[1.5px] px-4 py-3 text-[13px] font-semibold ${
            authFeedback.type === 'error'
              ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
              : 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0E86C2]'
          }`}
          style={{
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            border: `1.5px solid ${authFeedback.type === 'error' ? '#FECACA' : '#BAE6FD'}`,
            background: authFeedback.type === 'error' ? '#FEF2F2' : '#F0F9FF',
            color: authFeedback.type === 'error' ? '#B91C1C' : '#0E86C2',
          }}
        >
          <svg
            className={`w-5 h-5 shrink-0 mt-px ${
              authFeedback.type === 'error' ? 'text-[#EF4444]' : 'text-[#1B9DD9]'
            }`}
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{authFeedback.message}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="g4d-auth-form flex flex-col gap-[18px]"
        noValidate
      >
        <label className="g4d-auth-field flex flex-col gap-2">
          <span className="g4d-auth-label-text text-[13px] font-bold text-[#334155]">
            Adresse e-mail
          </span>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="vous@entreprise.com"
            className={`g4d-auth-input ${
              errors.email ? 'g4d-auth-input--error border-red-500' : 'border-[#E5E9F0]'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <span
              className="text-[12.5px] font-medium text-red-500"
              style={{ fontSize: '12.5px', fontWeight: 500, color: '#EF4444' }}
            >
              {errors.email.message}
            </span>
          )}
        </label>

        <label className="g4d-auth-field flex flex-col gap-2">
          <span className="g4d-auth-label-row flex items-center justify-between">
            <span className="g4d-auth-label-text text-[13px] font-bold text-[#334155]">
              Mot de passe
            </span>
            <a
              href="/forgot-password"
              className="g4d-auth-forgot text-[12.5px] font-bold text-[#1B9DD9] bg-transparent border-0 cursor-pointer p-0 hover:underline"
            >
              Mot de passe oublié ?
            </a>
          </span>
          <span className="g4d-auth-input-wrap relative block">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`g4d-auth-input g4d-auth-input--pw ${
                errors.password ? 'g4d-auth-input--error border-red-500' : 'border-[#E5E9F0]'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label="Afficher / masquer le mot de passe"
              onClick={() => setShowPassword((prev) => !prev)}
              className="g4d-auth-pw-toggle"
            >
              {!showPassword ? (
                <svg
                  className="w-5 h-5"
                  width="20"
                  height="20"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path
                    fillRule="evenodd"
                    d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  width="20"
                  height="20"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113Z" />
                  <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0 1 15.75 12ZM12.53 15.713l-4.243-4.244a3.75 3.75 0 0 0 4.244 4.243Z" />
                  <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 0 0-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 0 1 6.75 12Z" />
                </svg>
              )}
            </button>
          </span>
          {errors.password && (
            <span
              className="text-[12.5px] font-medium text-red-500"
              style={{ fontSize: '12.5px', fontWeight: 500, color: '#EF4444' }}
            >
              {errors.password.message}
            </span>
          )}
        </label>

        {/* Sélecteur de durée de session ("Rester connecté") */}
        <label className="g4d-auth-field flex flex-col gap-2">
          <span className="g4d-auth-label-text text-[13px] font-bold text-[#334155]">
            Garder ma session active
          </span>
          <select
            aria-label="Durée de la session"
            className="g4d-auth-select"
            {...register('sessionDuration')}
          >
            {SESSION_DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="g4d-auth-submit"
        >
          {!isSubmitting ? (
            <span
              className="inline-flex items-center gap-[9px]"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}
            >
              Se connecter
              <span className="text-[18px] leading-none -translate-y-px">&rarr;</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span className="w-[18px] h-[18px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Connexion…
            </span>
          )}
        </button>
      </form>
    </>
  );
}
