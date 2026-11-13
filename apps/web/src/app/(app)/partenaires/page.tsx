'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface PartenaireRow {
  id: number;
  code: string;
  raisonSociale: string;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  coursiers: Array<{ id: number; nom: string }>;
  apiIdentifiants: Array<{ id: number; libelle: string; clePublique: string }>;
}

export default function PartenairesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPlatformAdmin = Boolean(user.accessContext?.isPlatformAdmin || user.isSuperAdmin);

  const [form, setForm] = useState({ code: '', raisonSociale: '', email: '', telephone: '' });
  const [issuedSecret, setIssuedSecret] = useState<{
    clePublique: string;
    secretClairUnique: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const partenairesQuery = useQuery({
    queryKey: ['partenaires'],
    queryFn: () => apiFetch<PartenaireRow[]>('/partenaires'),
  });

  const createPartenaireMutation = useMutation({
    mutationFn: () =>
      apiFetch('/partenaires', {
        method: 'POST',
        body: {
          code: form.code,
          raisonSociale: form.raisonSociale,
          email: form.email || null,
          telephone: form.telephone || null,
        },
      }),
    onSuccess: () => {
      setForm({ code: '', raisonSociale: '', email: '', telephone: '' });
      setErrorMsg(null);
      void queryClient.invalidateQueries({ queryKey: ['partenaires'] });
    },
    onError: (err) =>
      setErrorMsg(err instanceof Error ? err.message : 'Erreur création partenaire'),
  });

  const issueKeyMutation = useMutation({
    mutationFn: (partenaire: PartenaireRow) =>
      apiFetch<{ clePublique: string; secretClairUnique: string }>('/partenaires/api-keys', {
        method: 'POST',
        body: {
          libelle: `Clé B2B ${partenaire.code}`,
          partenaireId: partenaire.id,
        },
      }),
    onSuccess: (res) => {
      setIssuedSecret({
        clePublique: res.clePublique,
        secretClairUnique: res.secretClairUnique,
      });
      setErrorMsg(null);
      void queryClient.invalidateQueries({ queryKey: ['partenaires'] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Erreur génération clé API'),
  });

  const columns: LegacyColumnDef<PartenaireRow, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="rounded-md bg-amber-50 px-2.5 py-1 font-mono text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          {row.original.code}
        </span>
      ),
    },
    { accessorKey: 'raisonSociale', header: 'Raison sociale' },
    {
      accessorKey: 'email',
      header: 'E-mail',
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      id: 'coursiers',
      header: 'Coursiers',
      cell: ({ row }) => row.original.coursiers.length,
    },
    {
      id: 'keys',
      header: 'Clés API actives',
      cell: ({ row }) => row.original.apiIdentifiants.length,
    },
    {
      id: 'actions',
      header: 'Clé API B2B',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={issueKeyMutation.isPending}
          onClick={() => issueKeyMutation.mutate(row.original)}
        >
          <KeyRound className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          Émettre clé API
        </Button>
      ),
    },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createPartenaireMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Partenaires B2B &amp; Clés API
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sociétés de transport externes, coursiers et identifiants API HMAC-SHA256 (règle D-09).
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {issuedSecret && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200">
          <p className="font-bold">
            Clé API générée — copiez le secret ci-dessous maintenant (affiché une seule fois) :
          </p>
          <p className="mt-2 font-mono text-xs">Clé publique : {issuedSecret.clePublique}</p>
          <p className="mt-1 font-mono text-xs break-all">
            Secret HMAC : {issuedSecret.secretClairUnique}
          </p>
        </div>
      )}

      {isPlatformAdmin && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Déclarer un Partenaire B2B
          </h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="part-code">Code</Label>
              <Input
                id="part-code"
                value={form.code}
                onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                placeholder="COLIV"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="part-rs">Raison sociale</Label>
              <Input
                id="part-rs"
                value={form.raisonSociale}
                onChange={(e) => setForm((s) => ({ ...s, raisonSociale: e.target.value }))}
                placeholder="Colivraison Express SARL"
                required
              />
            </div>
            <div>
              <Label htmlFor="part-email">E-mail</Label>
              <Input
                id="part-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="ops@partenaire.ma"
              />
            </div>
          </div>
          <Button type="submit" disabled={createPartenaireMutation.isPending}>
            {createPartenaireMutation.isPending ? 'Enregistrement…' : 'Créer le partenaire'}
          </Button>
        </form>
      )}

      <DataTable
        data={partenairesQuery.data ?? []}
        columns={columns}
        searchPlaceholder="Rechercher un partenaire par code ou raison sociale…"
        emptyMessage={partenairesQuery.isLoading ? 'Chargement…' : 'Aucun partenaire visible.'}
      />
    </div>
  );
}
