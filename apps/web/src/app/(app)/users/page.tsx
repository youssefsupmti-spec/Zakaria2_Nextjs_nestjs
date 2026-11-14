'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateUserSchema } from '@zakaria/shared-contracts';
import { Download, Plus, Power, PowerOff, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
import {
  DataTable,
  type DataTableBulkAction,
  type DataTableColumnDef,
} from '@/components/ui/data-table';
import { FILTER_SELECT_CLASS, FilterCard, FilterField } from '@/components/ui/filter-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  OPERATION_LABELS,
  OperationFeedbackBanner,
  exportRowsToCsv,
  type OperationMessage,
} from '@/components/ui/operation-feedback';
import { PageContent } from '@/components/ui/page-content';
import { PageTabs, type PageTabItem } from '@/components/ui/page-tabs';
import '@/components/ui/solar-icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface UserRow {
  id: number;
  nomComplet: string;
  email: string;
  telephone: string;
  villeName?: string;
  active: boolean;
  parentId: number | null;
  userRoles: Array<{ role: { id: number; name: string; libelle: string | null; portee: string } }>;
  agenceMembres?: Array<{
    agence: { id: number; code: string; nom: string };
  }>;
  partenaireMembres?: Array<{
    partenaire: { id: number; code: string; raisonSociale: string };
  }>;
}

interface RoleOption {
  id: number;
  name: string;
  libelle: string | null;
  portee: string;
}

type UserTab = 'tous' | 'actifs' | 'desactives';

export default function UsersPage() {
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<UserTab>('tous');
  const [textFilter, setTextFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [feedback, setFeedback] = useState<OperationMessage | null>(null);

  // Confirmations désactivation unitaire / groupée (cascade D-06)
  const [disableTarget, setDisableTarget] = useState<UserRow | null>(null);
  const [bulkDisableSelection, setBulkDisableSelection] = useState<{
    ids: number[];
    clear: () => void;
  } | null>(null);

  // Modale création utilisateur
  const [modalOpen, setModalOpen] = useState(false);
  const [formNomComplet, setFormNomComplet] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStatut = params.get('statut');
    const urlQ = params.get('q');
    const urlRole = params.get('role');
    const urlAgence = params.get('agence');
    if (urlStatut === 'actifs' || urlStatut === 'desactives') setTab(urlStatut);
    if (urlQ) setTextFilter(urlQ);
    if (urlRole) setRoleFilter(urlRole);
    if (urlAgence) setAgenceFilter(urlAgence);
  }, []);

  const syncUrlParams = (nextTab: UserTab, nextQ: string, nextRole: string, nextAgence: string) => {
    const url = new URL(window.location.href);
    if (nextTab === 'tous') url.searchParams.delete('statut');
    else url.searchParams.set('statut', nextTab);
    if (nextQ.trim()) url.searchParams.set('q', nextQ.trim());
    else url.searchParams.delete('q');
    if (nextRole) url.searchParams.set('role', nextRole);
    else url.searchParams.delete('role');
    if (nextAgence) url.searchParams.set('agence', nextAgence);
    else url.searchParams.delete('agence');
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

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
        body: CreateUserSchema.parse({
          nomComplet: formNomComplet,
          email: formEmail,
          password: formPassword,
          telephone: formTelephone,
          roleId: Number(formRoleId),
          agenceId: actor.accessContext?.managedAgenceIds[0] ?? null,
        }),
      }),
    onSuccess: () => {
      setFormNomComplet('');
      setFormEmail('');
      setFormPassword('');
      setFormTelephone('');
      setFormRoleId('');
      setFormError(null);
      setModalOpen(false);
      setFeedback({ type: 'ok', text: 'Compte utilisateur créé avec succès.' });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création du compte.'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch(`/users/${id}/status`, { method: 'PATCH', body: { active } }),
    onSuccess: (_, vars) => {
      setDisableTarget(null);
      setFeedback({
        type: 'ok',
        text: vars.active
          ? 'Compte utilisateur réactivé avec succès.'
          : 'Compte utilisateur désactivé (cascade sous-comptes appliquée).',
      });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setDisableTarget(null);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut.',
      });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, active }: { ids: number[]; active: boolean }) =>
      apiFetch<{ message: string; updatedCount: number; skippedCount: number }>(
        '/users/bulk-status',
        {
          method: 'POST',
          body: { ids, active },
        },
      ),
    onSuccess: (res) => {
      setBulkDisableSelection(null);
      setFeedback({
        type: res.updatedCount === 0 && res.skippedCount > 0 ? 'err' : 'ok',
        text: res.message,
      });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setBulkDisableSelection(null);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Mise à jour groupée impossible.',
      });
    },
  });

  const allUsers = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const counts = useMemo(() => {
    const total = allUsers.length;
    const actifs = allUsers.filter((u) => u.active).length;
    return { total, actifs, desactives: total - actifs };
  }, [allUsers]);

  const roleOptions = useMemo(() => {
    const map = new Map<number, RoleOption>();
    for (const r of rolesQuery.data ?? []) {
      map.set(r.id, r);
    }
    for (const u of allUsers) {
      for (const ur of u.userRoles) {
        map.set(ur.role.id, ur.role);
      }
    }
    return [...map.values()].sort((a, b) =>
      (a.libelle || a.name).localeCompare(b.libelle || b.name, 'fr'),
    );
  }, [rolesQuery.data, allUsers]);

  const agenceOptions = useMemo(() => {
    const map = new Map<number, { id: number; code: string; nom: string }>();
    for (const u of allUsers) {
      for (const am of u.agenceMembres ?? []) {
        map.set(am.agence.id, am.agence);
      }
    }
    return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [allUsers]);

  const filteredUsers = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (tab === 'actifs' && !u.active) return false;
      if (tab === 'desactives' && u.active) return false;
      if (roleFilter) {
        const hasRole = u.userRoles.some((ur) => String(ur.role.id) === roleFilter);
        if (!hasRole) return false;
      }
      if (agenceFilter) {
        const hasAgence = (u.agenceMembres ?? []).some(
          (am) => String(am.agence.id) === agenceFilter,
        );
        if (!hasAgence) return false;
      }
      if (q) {
        const rolesStr = u.userRoles.map((ur) => ur.role.libelle || ur.role.name).join(' ');
        const hay = `${u.nomComplet} ${u.email} ${u.telephone} ${rolesStr}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allUsers, tab, textFilter, roleFilter, agenceFilter]);

  const activeFiltersCount =
    (tab !== 'tous' ? 1 : 0) +
    (textFilter.trim() ? 1 : 0) +
    (roleFilter ? 1 : 0) +
    (agenceFilter ? 1 : 0);

  const resetFilters = () => {
    setTab('tous');
    setTextFilter('');
    setRoleFilter('');
    setAgenceFilter('');
    setTableSearch('');
    syncUrlParams('tous', '', '', '');
  };

  const handleTabChange = (next: UserTab) => {
    setTab(next);
    syncUrlParams(next, textFilter, roleFilter, agenceFilter);
  };

  const handleExportCsv = (rows: UserRow[]) => {
    exportRowsToCsv(
      'utilisateurs-g4d',
      ['ID', 'Nom complet', 'E-mail', 'Téléphone', 'Rôles', 'Hiérarchie', 'Statut'],
      rows.map((u) => [
        u.id,
        u.nomComplet,
        u.email,
        u.telephone,
        u.userRoles.map((ur) => ur.role.libelle || ur.role.name).join(' | '),
        u.parentId ? `Sous-compte #${u.parentId}` : 'Titulaire',
        u.active ? 'Actif' : 'Désactivé',
      ]),
    );
    setFeedback({
      type: 'ok',
      text: `Export CSV généré (${rows.length} utilisateur${rows.length > 1 ? 's' : ''}).`,
    });
  };

  const tabs: PageTabItem<UserTab>[] = [
    {
      key: 'tous',
      label: 'Tous',
      count: counts.total,
      icon: 'solar:users-group-rounded-bold-duotone',
    },
    {
      key: 'actifs',
      label: 'Actifs',
      count: counts.actifs,
      icon: 'solar:check-circle-bold-duotone',
    },
    {
      key: 'desactives',
      label: 'Désactivés',
      count: counts.desactives,
      icon: 'solar:close-circle-bold-duotone',
    },
  ];

  const columns: DataTableColumnDef<UserRow>[] = [
    {
      accessorKey: 'nomComplet',
      header: 'Utilisateur',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {u.nomComplet}
              </span>
              <span className="font-mono text-[11px] text-slate-400">#{u.id}</span>
              {u.id === actor.id && (
                <Badge variant="default" className="text-[10px]">
                  Vous
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {u.parentId ? `Sous-compte de #${u.parentId}` : 'Compte titulaire'}
            </p>
          </div>
        );
      },
    },
    {
      id: 'contact',
      header: 'Coordonnées',
      accessorFn: (row) => `${row.email} ${row.telephone}`,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="space-y-0.5 text-xs">
            <p className="font-medium text-slate-800 dark:text-slate-200">{u.email}</p>
            <p className="tabular-nums text-slate-500 dark:text-slate-400">
              {u.telephone || '—'}
              {u.villeName ? ` · ${u.villeName}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      id: 'roles',
      header: 'Rôles',
      accessorFn: (row) => row.userRoles.map((ur) => ur.role.libelle || ur.role.name).join(', '),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.userRoles.length === 0 ? (
            <span className="text-xs text-slate-400">Aucun rôle</span>
          ) : (
            row.original.userRoles.map((ur) => (
              <Badge key={ur.role.id} variant="secondary" className="text-[11px]">
                {ur.role.libelle || ur.role.name}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: 'organisation',
      header: 'Agence / Portée',
      accessorFn: (row) =>
        (row.agenceMembres ?? []).map((am) => am.agence.nom).join(', ') ||
        row.userRoles[0]?.role.portee ||
        '',
      cell: ({ row }) => {
        const agences = row.original.agenceMembres ?? [];
        const partenaires = row.original.partenaireMembres ?? [];
        const scopes = [...new Set(row.original.userRoles.map((ur) => ur.role.portee))];

        return (
          <div className="flex flex-wrap gap-1">
            {agences.map((am) => (
              <Badge key={am.agence.id} variant="outline" className="text-[11px]">
                {am.agence.nom} ({am.agence.code})
              </Badge>
            ))}
            {partenaires.map((pm) => (
              <Badge key={pm.partenaire.id} variant="warning" className="text-[11px]">
                {pm.partenaire.code}
              </Badge>
            ))}
            {agences.length === 0 &&
              partenaires.length === 0 &&
              scopes.map((scope) => (
                <Badge key={scope} variant="outline" className="text-[11px] uppercase">
                  {scope}
                </Badge>
              ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.active ? 'actif' : 'desactive'} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        if (u.id === actor.id) {
          return <span className="text-xs text-slate-400">Session actuelle</span>;
        }
        if (u.active) {
          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
              disabled={toggleStatusMutation.isPending}
              onClick={() => setDisableTarget(u)}
            >
              <PowerOff className="size-3" />
              Désactiver
            </Button>
          );
        }
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            disabled={toggleStatusMutation.isPending}
            onClick={() => toggleStatusMutation.mutate({ id: u.id, active: true })}
          >
            <Power className="size-3" />
            Réactiver
          </Button>
        );
      },
    },
  ];

  const bulkActions: DataTableBulkAction<UserRow>[] = [
    {
      key: 'activate',
      label: bulkStatusMutation.isPending ? OPERATION_LABELS.updating : 'Activer',
      icon: <Power className="size-3.5" />,
      variant: 'outline',
      disabled: bulkStatusMutation.isPending,
      onClick: (rows, clear) => {
        bulkStatusMutation.mutate(
          { ids: rows.map((r) => r.id), active: true },
          { onSuccess: () => clear() },
        );
      },
    },
    {
      key: 'deactivate',
      label: bulkStatusMutation.isPending ? OPERATION_LABELS.updating : 'Désactiver',
      icon: <PowerOff className="size-3.5" />,
      variant: 'destructive',
      disabled: bulkStatusMutation.isPending,
      onClick: (rows, clear) => {
        setBulkDisableSelection({ ids: rows.map((r) => r.id), clear });
      },
    },
    {
      key: 'export',
      label: 'Exporter CSV',
      icon: <Download className="size-3.5" />,
      variant: 'outline',
      onClick: (rows) => handleExportCsv(rows),
    },
  ];

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = CreateUserSchema.safeParse({
      nomComplet: formNomComplet,
      email: formEmail,
      password: formPassword,
      telephone: formTelephone,
      roleId: Number(formRoleId),
      agenceId: actor.accessContext?.managedAgenceIds[0] ?? null,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Formulaire invalide.');
      return;
    }
    setFormError(null);
    createUserMutation.mutate();
  };

  return (
    <PageContent>
      <PageTabs tabs={tabs} value={tab} onChange={handleTabChange} />

      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      <FilterCard activeCount={activeFiltersCount} onReset={resetFilters} columns={4}>
        <FilterField label="Nom / Email / Téléphone" htmlFor="users-filter-q">
          <Input
            id="users-filter-q"
            value={textFilter}
            onChange={(e) => {
              const v = e.target.value;
              setTextFilter(v);
              syncUrlParams(tab, v, roleFilter, agenceFilter);
            }}
            placeholder="Nom, e-mail, téléphone..."
            className="h-9"
          />
        </FilterField>

        <FilterField label="Rôle" htmlFor="users-filter-role">
          <select
            id="users-filter-role"
            value={roleFilter}
            onChange={(e) => {
              const v = e.target.value;
              setRoleFilter(v);
              syncUrlParams(tab, textFilter, v, agenceFilter);
            }}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">Tous les rôles</option>
            {roleOptions.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.libelle || r.name} ({r.portee})
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Agence" htmlFor="users-filter-agence">
          <select
            id="users-filter-agence"
            value={agenceFilter}
            onChange={(e) => {
              const v = e.target.value;
              setAgenceFilter(v);
              syncUrlParams(tab, textFilter, roleFilter, v);
            }}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">Toutes les agences</option>
            {agenceOptions.map((ag) => (
              <option key={ag.id} value={String(ag.id)}>
                {ag.nom} ({ag.code})
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Statut" htmlFor="users-filter-statut">
          <select
            id="users-filter-statut"
            value={tab}
            onChange={(e) => handleTabChange(e.target.value as UserTab)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="tous">Tous</option>
            <option value="actifs">Actifs</option>
            <option value="desactives">Désactivés</option>
          </select>
        </FilterField>
      </FilterCard>

      <DataTable
        data={filteredUsers}
        columns={columns}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Rechercher par nom, e-mail, rôle ou téléphone..."
        isLoading={usersQuery.isLoading}
        isRefreshing={usersQuery.isFetching && !usersQuery.isLoading}
        enableSelection
        isRowSelectable={(u) => u.id !== actor.id}
        bulkActions={bulkActions}
        emptyMessage="Aucun utilisateur accessible."
        emptyDescription="Modifiez vos filtres ou créez un nouveau compte."
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredUsers.length === 0}
              onClick={() => handleExportCsv(filteredUsers)}
            >
              <Download className="size-3.5" />
              Exporter CSV
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setFormError(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              Nouvel utilisateur
            </Button>
          </>
        }
      />

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !createUserMutation.isPending) {
              setModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2
                id="user-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Nouvel utilisateur
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setModalOpen(false)}
                className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="m-u-nom">Nom complet *</Label>
                  <Input
                    id="m-u-nom"
                    value={formNomComplet}
                    onChange={(e) => setFormNomComplet(e.target.value)}
                    placeholder="Karim Alami"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-u-tel">Téléphone</Label>
                  <Input
                    id="m-u-tel"
                    value={formTelephone}
                    onChange={(e) => setFormTelephone(e.target.value)}
                    placeholder="0600000000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="m-u-email">E-mail *</Label>
                <Input
                  id="m-u-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="utilisateur@g4d.ma"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="m-u-pass">Mot de passe *</Label>
                  <Input
                    id="m-u-pass"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    minLength={8}
                    placeholder="Minimum 8 caractères"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-u-role">Rôle attribué *</Label>
                  <select
                    id="m-u-role"
                    value={formRoleId}
                    onChange={(e) => setFormRoleId(e.target.value)}
                    className={FILTER_SELECT_CLASS}
                    required
                  >
                    <option value="">Choisir un rôle...</option>
                    {(rolesQuery.data ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.libelle || r.name} ({r.portee})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={createUserMutation.isPending}
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? OPERATION_LABELS.saving : 'Créer le compte'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={Boolean(disableTarget)}
        title={`Désactiver ${disableTarget?.nomComplet ?? 'cet utilisateur'} ?`}
        description="Ses sessions actives seront révoquées immédiatement et, pour un compte titulaire, ses sous-comptes éventuels seront également suspendus (règle D-06)."
        confirmLabel="Désactiver"
        variant="destructive"
        isPending={toggleStatusMutation.isPending}
        pendingLabel={OPERATION_LABELS.updating}
        onCancel={() => setDisableTarget(null)}
        onConfirm={() => {
          if (!disableTarget) return;
          toggleStatusMutation.mutate({ id: disableTarget.id, active: false });
        }}
      />

      <ConfirmActionDialog
        open={Boolean(bulkDisableSelection)}
        title="Désactiver les utilisateurs sélectionnés ?"
        description={
          bulkDisableSelection
            ? `${bulkDisableSelection.ids.length} compte(s) seront désactivés avec révocation des sessions et cascade D-06 sur les sous-comptes.`
            : ''
        }
        confirmLabel="Désactiver la sélection"
        variant="destructive"
        isPending={bulkStatusMutation.isPending}
        pendingLabel={OPERATION_LABELS.updating}
        onCancel={() => setBulkDisableSelection(null)}
        onConfirm={() => {
          if (!bulkDisableSelection) return;
          bulkStatusMutation.mutate(
            { ids: bulkDisableSelection.ids, active: false },
            { onSuccess: () => bulkDisableSelection.clear() },
          );
        }}
      />
    </PageContent>
  );
}
