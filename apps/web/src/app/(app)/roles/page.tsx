'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { ROLE_SCOPE_VALUES, type RoleScope } from '@zakaria/shared-contracts';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface RoleRow {
  id: number;
  name: string;
  libelle: string | null;
  portee: RoleScope;
  systeme: boolean;
  rolePermissions: Array<{ permission: { id: number; name: string } }>;
  _count?: { userRoles: number };
}

interface PermissionOption {
  id: number;
  name: string;
}

export default function RolesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const defaultPortee: RoleScope = user.accessContext?.primaryScope ?? 'client';

  const [form, setForm] = useState({
    name: '',
    libelle: '',
    portee: defaultPortee,
    permissionIds: [] as number[],
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<RoleRow[]>('/roles'),
  });

  const permissionsQuery = useQuery({
    queryKey: ['role-permissions', form.portee],
    queryFn: () => apiFetch<PermissionOption[]>(`/roles/permissions?portee=${form.portee}`),
  });

  const createRoleMutation = useMutation({
    mutationFn: () =>
      apiFetch('/roles', {
        method: 'POST',
        body: {
          name: form.name,
          libelle: form.libelle,
          portee: form.portee,
          agenceId:
            form.portee === 'agence' ? (user.accessContext?.managedAgenceIds[0] ?? null) : null,
          partenaireId:
            form.portee === 'partenaire'
              ? (user.accessContext?.partenaireMemberships[0]?.partenaireId ?? null)
              : null,
          permissionIds: form.permissionIds,
        },
      }),
    onSuccess: () => {
      setForm((s) => ({ ...s, name: '', libelle: '', permissionIds: [] }));
      setErrorMsg(null);
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Erreur création rôle'),
  });

  const columns: LegacyColumnDef<RoleRow, unknown>[] = [
    {
      accessorKey: 'libelle',
      header: 'Libellé',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-slate-900">{row.original.libelle || row.original.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'portee',
      header: 'Portée',
      cell: ({ row }) => (
        <span className="rounded-md bg-sky-50 px-2.5 py-0.5 text-xs font-bold uppercase text-sky-700">
          {row.original.portee}
        </span>
      ),
    },
    {
      accessorKey: 'systeme',
      header: 'Type',
      cell: ({ row }) => (row.original.systeme ? 'Système G4D' : 'Personnalisé'),
    },
    {
      id: 'perms',
      header: 'Permissions',
      cell: ({ row }) => row.original.rolePermissions.length,
    },
    {
      id: 'users',
      header: 'Comptes liés',
      cell: ({ row }) => row.original._count?.userRoles ?? 0,
    },
  ];

  const togglePerm = (permId: number) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Rôles &amp; Permissions RBAC</h1>
        <p className="mt-1 text-sm text-slate-600">
          Création de rôles bornés par portée organisationnelle avec anti-escalade de privilèges.
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
        <h2 className="text-base font-bold text-slate-900">Créer un rôle personnalisé</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="r-name">Slug technique</Label>
            <Input
              id="r-name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value.toLowerCase() }))}
              placeholder="superviseur_quai"
              required
            />
          </div>
          <div>
            <Label htmlFor="r-libelle">Nom affiché</Label>
            <Input
              id="r-libelle"
              value={form.libelle}
              onChange={(e) => setForm((s) => ({ ...s, libelle: e.target.value }))}
              placeholder="Superviseur de Quai"
              required
            />
          </div>
          <div>
            <Label htmlFor="r-portee">Portée</Label>
            <select
              id="r-portee"
              value={form.portee}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  portee: e.target.value as RoleScope,
                  permissionIds: [],
                }))
              }
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {ROLE_SCOPE_VALUES.map((scope) => (
                <option key={scope} value={scope}>
                  {scope}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-500">
            Permissions attribuables ({permissionsQuery.data?.length ?? 0})
          </p>
          <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">
            {(permissionsQuery.data ?? []).map((perm) => (
              <label
                key={perm.id}
                className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={form.permissionIds.includes(perm.id)}
                  onChange={() => togglePerm(perm.id)}
                />
                <span className="truncate font-mono">{perm.name}</span>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={createRoleMutation.isPending}>
          {createRoleMutation.isPending ? 'Création…' : 'Enregistrer le rôle'}
        </Button>
      </form>

      <DataTable
        data={rolesQuery.data ?? []}
        columns={columns}
        searchPlaceholder="Rechercher un rôle par nom ou portée…"
        emptyMessage={rolesQuery.isLoading ? 'Chargement…' : 'Aucun rôle visible.'}
      />
    </div>
  );
}
