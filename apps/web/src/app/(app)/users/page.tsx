'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface UserRow {
  id: number;
  nomComplet: string;
  email: string;
  telephone: string;
  active: boolean;
  parentId: number | null;
  userRoles: Array<{ role: { id: number; name: string; libelle: string | null; portee: string } }>;
}

interface RoleOption {
  id: number;
  name: string;
  libelle: string | null;
  portee: string;
}

export default function UsersPage() {
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    nomComplet: '',
    email: '',
    password: '',
    telephone: '',
    roleId: '',
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<UserRow[]>('/users'),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<RoleOption[]>('/roles'),
  });

  const createUserMutation = useMutation({
    mutationFn: () =>
      apiFetch('/users', {
        method: 'POST',
        body: {
          nomComplet: form.nomComplet,
          email: form.email,
          password: form.password,
          telephone: form.telephone,
          roleId: Number(form.roleId),
          agenceId: actor.accessContext?.managedAgenceIds[0] ?? null,
        },
      }),
    onSuccess: () => {
      setForm({ nomComplet: '', email: '', password: '', telephone: '', roleId: '' });
      setErrorMsg(null);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Erreur création compte'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch(`/users/${id}/status`, { method: 'PATCH', body: { active } }),
    onSuccess: () => {
      setErrorMsg(null);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Erreur mise à jour statut'),
  });

  const columns: LegacyColumnDef<UserRow, unknown>[] = [
    { accessorKey: 'id', header: '#' },
    { accessorKey: 'nomComplet', header: 'Nom complet' },
    { accessorKey: 'email', header: 'E-mail' },
    {
      id: 'roles',
      header: 'Rôle(s)',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.userRoles.map((ur) => (
            <span
              key={ur.role.id}
              className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700"
            >
              {ur.role.libelle || ur.role.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'parentId',
      header: 'Hiérarchie',
      cell: ({ row }) =>
        row.original.parentId ? `Sous-compte #${row.original.parentId}` : 'Titulaire',
    },
    {
      accessorKey: 'active',
      header: 'Statut',
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.original.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {row.original.active ? 'Actif' : 'Désactivé'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions (D-06)',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.id !== actor.id ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={toggleStatusMutation.isPending}
            onClick={() =>
              toggleStatusMutation.mutate({ id: row.original.id, active: !row.original.active })
            }
          >
            {row.original.active ? 'Désactiver' : 'Réactiver'}
          </Button>
        ) : (
          <span className="text-xs text-slate-400">Vous</span>
        ),
    },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Utilisateurs &amp; Équipes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gestion cloisonnée par organisation (règles D-06 cascade sous-comptes &amp; D-08 flotte
          agence).
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <h2 className="text-base font-bold text-slate-900">Créer un compte dans votre périmètre</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="u-nom">Nom complet</Label>
            <Input
              id="u-nom"
              value={form.nomComplet}
              onChange={(e) => setForm((s) => ({ ...s, nomComplet: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="u-email">E-mail</Label>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="u-pass">Mot de passe</Label>
            <Input
              id="u-pass"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              minLength={8}
              required
            />
          </div>
          <div>
            <Label htmlFor="u-tel">Téléphone</Label>
            <Input
              id="u-tel"
              value={form.telephone}
              onChange={(e) => setForm((s) => ({ ...s, telephone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="u-role">Rôle attribué</Label>
            <select
              id="u-role"
              value={form.roleId}
              onChange={(e) => setForm((s) => ({ ...s, roleId: e.target.value }))}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              required
            >
              <option value="">Choisir un rôle…</option>
              {(rolesQuery.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.libelle || r.name} ({r.portee})
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={createUserMutation.isPending}>
          {createUserMutation.isPending ? 'Création…' : 'Créer le compte'}
        </Button>
      </form>

      <DataTable
        data={usersQuery.data ?? []}
        columns={columns}
        searchPlaceholder="Rechercher par nom ou e-mail…"
        emptyMessage={usersQuery.isLoading ? 'Chargement…' : 'Aucun utilisateur accessible.'}
      />
    </div>
  );
}
