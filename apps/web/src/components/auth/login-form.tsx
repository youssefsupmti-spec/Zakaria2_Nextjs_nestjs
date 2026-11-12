'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema, type LoginRequestDto } from '@zakaria/shared-contracts';

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
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginRequestDto) => {
    setAuthFeedback(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api/v1';
      const res = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      const apiOnline = Boolean(res?.ok);
      setAuthFeedback({
        type: 'info',
        message: apiOnline
          ? `Identifiants validés pour « ${values.email} » (API G4D connectée). L'authentification complète sera activée au Sprint 02.`
          : `Identifiants validés pour « ${values.email} ». L'authentification complète sera activée au Sprint 02.`,
      });
    } catch {
      setAuthFeedback({
        type: 'error',
        message: 'Une erreur est survenue lors de la tentative de connexion.',
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
        >
          <svg
            className={`w-5 h-5 shrink-0 mt-px ${
              authFeedback.type === 'error' ? 'text-[#EF4444]' : 'text-[#1B9DD9]'
            }`}
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]" noValidate>
        {/* Adresse e-mail */}
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-[#334155]">Adresse e-mail</span>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="vous@entreprise.com"
            className={`w-full h-[50px] px-4 text-[15px] font-medium text-[#0D263B] bg-[#F1F5F9] border-[1.5px] rounded-none outline-none transition-[border-color,background,box-shadow] duration-200 placeholder:text-[#94A3B8] focus:border-[#1B9DD9] focus:bg-white focus:[box-shadow:0_0_0_4px_rgba(27,157,217,0.12)] ${
              errors.email ? 'border-red-500' : 'border-[#E5E9F0]'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <span className="text-[12.5px] font-medium text-red-500">
              {errors.email.message}
            </span>
          )}
        </label>

        {/* Mot de passe */}
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#334155]">Mot de passe</span>
            <a
              href="mailto:Contact@g4d.ma?subject=R%C3%A9initialisation%20mot%20de%20passe%20G4D"
              className="text-[12.5px] font-bold text-[#1B9DD9] bg-transparent border-0 cursor-pointer p-0 hover:underline"
            >
              Mot de passe oublié ?
            </a>
          </span>
          <span className="relative block">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full h-[50px] pl-4 pr-12 text-[15px] font-medium text-[#0D263B] bg-[#F1F5F9] border-[1.5px] rounded-none outline-none transition-[border-color,background,box-shadow] duration-200 placeholder:text-[#94A3B8] focus:border-[#1B9DD9] focus:bg-white focus:[box-shadow:0_0_0_4px_rgba(27,157,217,0.12)] ${
                errors.password ? 'border-red-500' : 'border-[#E5E9F0]'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label="Afficher / masquer le mot de passe"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center w-9 h-9 p-0 bg-transparent border-0 rounded-[9px] cursor-pointer text-[#94A3B8] hover:text-[#1B9DD9]"
            >
              {!showPassword ? (
                <svg
                  className="w-5 h-5"
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
            <span className="text-[12.5px] font-medium text-red-500">
              {errors.password.message}
            </span>
          )}
        </label>

        {/* Rester connecté */}
        <label className="flex items-center gap-[10px] cursor-pointer select-none -mt-[2px]">
          <input
            type="checkbox"
            className="w-[19px] h-[19px] m-0 border-[1.5px] border-[#CBD5E1] rounded-none bg-white cursor-pointer shrink-0 accent-[#1B9DD9]"
            {...register('rememberMe')}
          />
          <span className="text-[14px] font-semibold text-[#475569]">Rester connecté</span>
        </label>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-[5px] h-[52px] flex items-center justify-center gap-[9px] text-[15.5px] font-extrabold tracking-[0.3px] text-white border-0 rounded-[13px] cursor-pointer [background:linear-gradient(135deg,#3FB4E8_0%,#1B9DD9_55%,#0E86C2_100%)] [box-shadow:0_12px_24px_-10px_rgba(27,157,217,0.55)] transition-[filter,box-shadow,transform] duration-150 hover:brightness-105 hover:-translate-y-px disabled:opacity-70 disabled:cursor-wait disabled:translate-y-0"
        >
          {!isSubmitting ? (
            <span className="inline-flex items-center gap-[9px]">
              Se connecter
              <span className="text-[18px] leading-none -translate-y-px">&rarr;</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="w-[18px] h-[18px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Connexion…
            </span>
          )}
        </button>
      </form>
    </>
  );
}
