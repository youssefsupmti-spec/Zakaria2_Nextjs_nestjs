'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ResetPasswordRequestSchema,
  type ResetPasswordRequestDto,
} from '@zakaria/shared-contracts';
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
        style={{
          padding: '16px',
          border: '1.5px solid #FECACA',
          background: '#FEF2F2',
          color: '#B91C1C',
          fontSize: '13.5px',
          fontWeight: 600,
        }}
      >
        Lien de réinitialisation incomplet ou invalide. Veuillez effectuer une nouvelle demande
        depuis la page{' '}
        <a href="/forgot-password" className="g4d-auth-link">
          Mot de passe oublié
        </a>
        .
      </div>
    );
  }

  return (
    <>
      {feedback && (
        <div
          style={{
            marginBottom: '22px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            border: `1.5px solid ${feedback.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
            background: feedback.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: feedback.type === 'error' ? '#B91C1C' : '#166534',
          }}
        >
          <p style={{ margin: 0 }}>{feedback.message}</p>
          {feedback.type === 'success' && (
            <p style={{ margin: '10px 0 0' }}>
              <a href="/login" className="g4d-auth-link">
                Aller à la page de connexion &rarr;
              </a>
            </p>
          )}
        </div>
      )}

      {feedback?.type !== 'success' && (
        <form onSubmit={handleSubmit(onSubmit)} className="g4d-auth-form" noValidate>
          <input type="hidden" {...register('token')} />

          <label className="g4d-auth-field">
            <span className="g4d-auth-label-text">Adresse e-mail</span>
            <input
              type="email"
              readOnly={Boolean(initialEmail)}
              className={`g4d-auth-input ${errors.email ? 'g4d-auth-input--error' : ''}`}
              {...register('email')}
            />
            {errors.email && (
              <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#EF4444' }}>
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="g4d-auth-field">
            <span className="g4d-auth-label-text">Nouveau mot de passe (min. 8 caractères)</span>
            <span className="g4d-auth-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`g4d-auth-input g4d-auth-input--pw ${errors.password ? 'g4d-auth-input--error' : ''}`}
                {...register('password')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="g4d-auth-pw-toggle"
              >
                {showPassword ? 'Masquer' : 'Voir'}
              </button>
            </span>
            {errors.password && (
              <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#EF4444' }}>
                {errors.password.message}
              </span>
            )}
          </label>

          <label className="g4d-auth-field">
            <span className="g4d-auth-label-text">Confirmer le nouveau mot de passe</span>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`g4d-auth-input ${errors.passwordConfirmation ? 'g4d-auth-input--error' : ''}`}
              {...register('passwordConfirmation')}
            />
            {errors.passwordConfirmation && (
              <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#EF4444' }}>
                {errors.passwordConfirmation.message}
              </span>
            )}
          </label>

          <button type="submit" disabled={isSubmitting} className="g4d-auth-submit">
            {!isSubmitting ? 'Enregistrer le nouveau mot de passe' : 'Mise à jour…'}
          </button>
        </form>
      )}
    </>
  );
}
