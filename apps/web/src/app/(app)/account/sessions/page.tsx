'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import type { ActiveSessionItemDto } from '@zakaria/shared-contracts';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api-client';

export default function ActiveSessionsPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => apiFetch<{ sessions: ActiveSessionItemDto[] }>('/auth/sessions'),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch(`/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),
    onSuccess: () => {
      setFeedback('Session révoquée avec succès.');
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
  });

  const columns: LegacyColumnDef<ActiveSessionItemDto, unknown>[] = [
    {
      accessorKey: 'isCurrent',
      header: 'Appareil / État',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
              row.original.isCurrent
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {row.original.isCurrent ? 'Session actuelle' : 'Autre appareil'}
          </span>
          <p className="max-w-xs truncate text-xs text-slate-500">
            {row.original.userAgent || 'Navigateur inconnu'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'Adresse IP',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.ipAddress || '—'}</span>,
    },
    {
      accessorKey: 'durationCode',
      header: 'Durée',
      cell: ({ row }) => (
        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">
          {row.original.durationCode}
        </span>
      ),
    },
    {
      accessorKey: 'lastActiveAt',
      header: 'Dernière activité',
      cell: ({ row }) =>
        new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
          new Date(row.original.lastActiveAt),
        ),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expiration',
      cell: ({ row }) =>
        new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
          new Date(row.original.expiresAt),
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={revokeMutation.isPending}
          onClick={() => revokeMutation.mutate(row.original.id)}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-600" />
          Révoquer
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Mes sessions actives</h1>
        <p className="mt-1 text-sm text-slate-600">
          Consultez et révoquez à distance vos connexions ouvertes sur la plateforme G4D.
        </p>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error instanceof Error ? error.message : 'Erreur de chargement.'}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Chargement des sessions…
        </div>
      ) : (
        <DataTable
          data={data?.sessions ?? []}
          columns={columns}
          searchPlaceholder="Filtrer par IP ou navigateur…"
          emptyMessage="Aucune session active."
        />
      )}
    </div>
  );
}
