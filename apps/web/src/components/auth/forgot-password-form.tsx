'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ForgotPasswordRequestSchema,
  type ForgotPasswordRequestDto,
} from '@zakaria/shared-contracts';
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
    <>
      {feedback && (
        <div
          style={{
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            border: `1.5px solid ${feedback.type === 'error' ? '#FECACA' : '#BAE6FD'}`,
            background: feedback.type === 'error' ? '#FEF2F2' : '#F0F9FF',
            color: feedback.type === 'error' ? '#B91C1C' : '#0E86C2',
          }}
        >
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="g4d-auth-form" noValidate>
        <label className="g4d-auth-field">
          <span className="g4d-auth-label-text">Adresse e-mail du compte</span>
          <input
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="vous@entreprise.com"
            className={`g4d-auth-input ${errors.email ? 'g4d-auth-input--error' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#EF4444' }}>
              {errors.email.message}
            </span>
          )}
        </label>

        <button type="submit" disabled={isSubmitting} className="g4d-auth-submit">
          {!isSubmitting ? 'Envoyer le lien de réinitialisation' : 'Envoi en cours…'}
        </button>
      </form>
    </>
  );
}
