'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActiveSessionItemDto } from '@zakaria/shared-contracts';
import Link from 'next/link';
import { useState } from 'react';
import { ProfileSessionsTab } from '@/components/profile/profile-sessions-tab';
import { buttonVariants } from '@/components/ui/button';
import '@/components/ui/solar-icons';
import { apiFetch } from '@/lib/api-client';

export default function ActiveSessionsPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => apiFetch<{ sessions: ActiveSessionItemDto[] }>('/auth/sessions'),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch(`/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),
    onSuccess: () => {
      setFeedback({ type: 'ok', text: 'Session révoquée avec succès.' });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la révocation.',
      });
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean; message: string }>('/auth/sessions/revoke-others', {
        method: 'POST',
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la déconnexion globale.',
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Mes sessions actives
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Consultez et révoquez à distance vos connexions ouvertes sur la plateforme G4D.
          </p>
        </div>

        <Link
          href="/profil?tab=sessions"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <Icon icon="solar:user-id-bold-duotone" className="size-4 text-primary" />
          Ouvrir dans Mon Profil &amp; Sécurité
        </Link>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {sessionsQuery.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">
          {sessionsQuery.error instanceof Error
            ? sessionsQuery.error.message
            : 'Erreur de chargement des sessions.'}
        </div>
      )}

      <ProfileSessionsTab
        sessions={sessionsQuery.data?.sessions ?? []}
        isLoading={sessionsQuery.isLoading}
        isRevokingOne={revokeMutation.isPending}
        isRevokingOthers={revokeOthersMutation.isPending}
        onRevokeSession={(id) => revokeMutation.mutate(id)}
        onRevokeOtherSessions={() => revokeOthersMutation.mutate()}
      />
    </div>
  );
}
