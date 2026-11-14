'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateRoleSchema, ROLE_SCOPE_VALUES, type RoleScope } from '@zakaria/shared-contracts';
import { Building2, Download, Plus, Shield, ShieldCheck, Trash2, X } from 'lucide-react';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface RoleRow {
  id: number;
  name: string;
  libelle: string | null;
  portee: RoleScope;
  systeme: boolean;
  agence?: { id: number; code: string; nom: string } | null;
  partenaire?: { id: number; code: string; raisonSociale: string } | null;
  rolePermissions: Array<{ permission: { id: number; name: string } }>;
  _count?: { userRoles: number };
}

interface PermissionOption {
  id: number;
  name: string;
}

type RoleTab = 'tous' | 'plateforme' | 'agence';

export default function RolesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const defaultPortee: RoleScope = user.accessContext?.primaryScope ?? 'client';

  const [tab, setTab] = useState<RoleTab>('tous');
  const [textFilter, setTextFilter] = useState('');
  const [porteeFilter, setPorteeFilter] = useState<'' | RoleScope>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'systeme' | 'custom'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [feedback, setFeedback] = useState<OperationMessage | null>(null);

  // Modale création rôle
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLibelle, setFormLibelle] = useState('');
  const [formPortee, setFormPortee] = useState<RoleScope>(defaultPortee);
  const [formPermIds, setFormPermIds] = useState<number[]>([]);
  const [permSearch, setPermSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmation suppression d'un rôle personnalisé non utilisé
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    const urlQ = params.get('q');
    const urlPortee = params.get('portee');
    const urlType = params.get('type');
    if (urlTab === 'plateforme' || urlTab === 'agence') setTab(urlTab);
    if (urlQ) setTextFilter(urlQ);
    if (urlPortee && ROLE_SCOPE_VALUES.includes(urlPortee as RoleScope)) {
      setPorteeFilter(urlPortee as RoleScope);
    }
    if (urlType === 'systeme' || urlType === 'custom') setTypeFilter(urlType);
  }, []);

  const syncUrlParams = (
    nextTab: RoleTab,
    nextQ: string,
    nextPortee: '' | RoleScope,
    nextType: 'all' | 'systeme' | 'custom',
  ) => {
    const url = new URL(window.location.href);
    if (nextTab === 'tous') url.searchParams.delete('tab');
    else url.searchParams.set('tab', nextTab);
    if (nextQ.trim()) url.searchParams.set('q', nextQ.trim());
    else url.searchParams.delete('q');
    if (nextPortee) url.searchParams.set('portee', nextPortee);
    else url.searchParams.delete('portee');
    if (nextType === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', nextType);
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

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiFetch<RoleRow[]>('/roles'),
  });

  const permissionsQuery = useQuery({
    queryKey: ['role-permissions', formPortee],
    queryFn: () => apiFetch<PermissionOption[]>(`/roles/permissions?portee=${formPortee}`),
    enabled: modalOpen,
  });

  const createRoleMutation = useMutation({
    mutationFn: () =>
      apiFetch('/roles', {
        method: 'POST',
        body: CreateRoleSchema.parse({
          name: formName,
          libelle: formLibelle,
          portee: formPortee,
          agenceId:
            formPortee === 'agence' ? (user.accessContext?.managedAgenceIds[0] ?? null) : null,
          partenaireId:
            formPortee === 'partenaire'
              ? (user.accessContext?.partenaireMemberships[0]?.partenaireId ?? null)
              : null,
          permissionIds: formPermIds,
        }),
      }),
    onSuccess: () => {
      setFormName('');
      setFormLibelle('');
      setFormPermIds([]);
      setPermSearch('');
      setFormError(null);
      setModalOpen(false);
      setFeedback({ type: 'ok', text: 'Rôle personnalisé enregistré avec succès.' });
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création du rôle.'),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setDeleteTarget(null);
      setFeedback({ type: 'ok', text: 'Rôle supprimé avec succès.' });
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => {
      setDeleteTarget(null);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Suppression du rôle impossible.',
      });
    },
  });

  const allRoles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  const counts = useMemo(() => {
    const total = allRoles.length;
    const plateforme = allRoles.filter((r) => r.portee === 'plateforme').length;
    const agence = allRoles.filter((r) => r.portee === 'agence').length;
    return { total, plateforme, agence };
  }, [allRoles]);

  const filteredRoles = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    return allRoles.filter((role) => {
      if (tab === 'plateforme' && role.portee !== 'plateforme') return false;
      if (tab === 'agence' && role.portee !== 'agence') return false;
      if (porteeFilter && role.portee !== porteeFilter) return false;
      if (typeFilter === 'systeme' && !role.systeme) return false;
      if (typeFilter === 'custom' && role.systeme) return false;
      if (q) {
        const permsStr = role.rolePermissions.map((rp) => rp.permission.name).join(' ');
        const hay =
          `${role.libelle ?? ''} ${role.name} ${role.agence?.nom ?? ''} ${permsStr}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allRoles, tab, textFilter, porteeFilter, typeFilter]);

  const filteredPerms = useMemo(() => {
    const list = permissionsQuery.data ?? [];
    const q = permSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [permissionsQuery.data, permSearch]);

  const activeFiltersCount =
    (tab !== 'tous' ? 1 : 0) +
    (textFilter.trim() ? 1 : 0) +
    (porteeFilter ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setTab('tous');
    setTextFilter('');
    setPorteeFilter('');
    setTypeFilter('all');
    setTableSearch('');
    syncUrlParams('tous', '', '', 'all');
  };

  const handleTabChange = (next: RoleTab) => {
    setTab(next);
    const nextPortee: '' | RoleScope = next === 'tous' ? '' : next;
    setPorteeFilter(nextPortee);
    syncUrlParams(next, textFilter, nextPortee, typeFilter);
  };

  const handleExportCsv = (rows: RoleRow[]) => {
    exportRowsToCsv(
      'roles-rbac-g4d',
      ['Slug', 'Libellé', 'Portée', 'Rattachement', 'Permissions', 'Comptes liés', 'Type'],
      rows.map((r) => [
        r.name,
        r.libelle || r.name,
        r.portee,
        r.agence?.nom ?? r.partenaire?.raisonSociale ?? 'Globale',
        r.rolePermissions.length,
        r._count?.userRoles ?? 0,
        r.systeme ? 'Système' : 'Personnalisé',
      ]),
    );
    setFeedback({
      type: 'ok',
      text: `Export CSV généré (${rows.length} rôle${rows.length > 1 ? 's' : ''}).`,
    });
  };

  const tabs: PageTabItem<RoleTab>[] = [
    {
      key: 'tous',
      label: 'Tous',
      count: counts.total,
      icon: Shield,
    },
    {
      key: 'plateforme',
      label: 'Plateforme',
      count: counts.plateforme,
      icon: ShieldCheck,
    },
    {
      key: 'agence',
      label: 'Agence',
      count: counts.agence,
      icon: Building2,
    },
  ];

  const columns: DataTableColumnDef<RoleRow>[] = [
    {
      accessorKey: 'libelle',
      header: 'Rôle & Libellé',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {r.libelle || r.name}
            </p>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{r.name}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'portee',
      header: 'Portée',
      cell: ({ row }) => {
        const portee = row.original.portee;
        if (portee === 'plateforme') return <StatusBadge status="plateforme" />;
        if (portee === 'agence') return <StatusBadge status="agence" />;
        if (portee === 'partenaire') return <StatusBadge status="custom" label="Partenaire" />;
        return <StatusBadge status="rattache" label="Client" />;
      },
    },
    {
      id: 'rattachement',
      header: 'Agence',
      accessorFn: (row) => row.agence?.nom ?? row.partenaire?.raisonSociale ?? 'Globale',
      cell: ({ row }) => {
        const r = row.original;
        if (r.agence) {
          return (
            <Badge variant="outline" className="text-xs">
              {r.agence.nom} ({r.agence.code})
            </Badge>
          );
        }
        if (r.partenaire) {
          return (
            <Badge variant="warning" className="text-xs">
              {r.partenaire.raisonSociale}
            </Badge>
          );
        }
        return <span className="text-xs text-slate-500 dark:text-slate-400">Globale</span>;
      },
    },
    {
      id: 'permissions',
      header: 'Permissions',
      accessorFn: (row) => row.rolePermissions.length,
      cell: ({ row }) => {
        const perms = row.original.rolePermissions;
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="default" className="tabular-nums text-[11px]">
                {perms.length} perm.
              </Badge>
              {perms.slice(0, 2).map((rp) => (
                <Badge key={rp.permission.id} variant="secondary" className="font-mono text-[10px]">
                  {rp.permission.name}
                </Badge>
              ))}
              {perms.length > 2 && (
                <span className="text-[11px] text-slate-400">+{perms.length - 2}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'usersCount',
      header: 'Comptes liés',
      accessorFn: (row) => row._count?.userRoles ?? 0,
      cell: ({ row }) => (
        <span className="tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original._count?.userRoles ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'systeme',
      header: 'Type',
      cell: ({ row }) =>
        row.original.systeme ? (
          <StatusBadge status="plateforme" label="Système" />
        ) : (
          <StatusBadge status="custom" label="Personnalisé" />
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const usedCount = r._count?.userRoles ?? 0;
        if (r.systeme) {
          return <span className="text-xs text-slate-400">Protégé</span>;
        }
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            disabled={usedCount > 0 || deleteRoleMutation.isPending}
            title={
              usedCount > 0
                ? `${usedCount} compte(s) utilisent encore ce rôle`
                : 'Supprimer ce rôle personnalisé'
            }
            onClick={() => setDeleteTarget(r)}
          >
            <Trash2 className="size-3" />
            Supprimer
          </Button>
        );
      },
    },
  ];

  const bulkActions: DataTableBulkAction<RoleRow>[] = [
    {
      key: 'export',
      label: 'Exporter CSV',
      icon: <Download className="size-3.5" />,
      variant: 'outline',
      onClick: (rows) => handleExportCsv(rows),
    },
  ];

  const togglePerm = (permId: number) => {
    setFormPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = CreateRoleSchema.safeParse({
      name: formName,
      libelle: formLibelle,
      portee: formPortee,
      agenceId: formPortee === 'agence' ? (user.accessContext?.managedAgenceIds[0] ?? null) : null,
      partenaireId:
        formPortee === 'partenaire'
          ? (user.accessContext?.partenaireMemberships[0]?.partenaireId ?? null)
          : null,
      permissionIds: formPermIds,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Formulaire invalide.');
      return;
    }
    setFormError(null);
    createRoleMutation.mutate();
  };

  return (
    <PageContent>
      <PageTabs tabs={tabs} value={tab} onChange={handleTabChange} />

      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      <FilterCard activeCount={activeFiltersCount} onReset={resetFilters} columns={3}>
        <FilterField label="Nom / Libellé" htmlFor="roles-filter-q">
          <Input
            id="roles-filter-q"
            value={textFilter}
            onChange={(e) => {
              const v = e.target.value;
              setTextFilter(v);
              syncUrlParams(tab, v, porteeFilter, typeFilter);
            }}
            placeholder="Nom technique, libellé ou permission..."
            className="h-9"
          />
        </FilterField>

        <FilterField label="Portée" htmlFor="roles-filter-portee">
          <select
            id="roles-filter-portee"
            value={porteeFilter}
            onChange={(e) => {
              const v = e.target.value as '' | RoleScope;
              setPorteeFilter(v);
              const nextTab: RoleTab = v === 'plateforme' || v === 'agence' ? v : 'tous';
              setTab(nextTab);
              syncUrlParams(nextTab, textFilter, v, typeFilter);
            }}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">Toutes les portées</option>
            {ROLE_SCOPE_VALUES.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Type" htmlFor="roles-filter-type">
          <select
            id="roles-filter-type"
            value={typeFilter}
            onChange={(e) => {
              const v = e.target.value as 'all' | 'systeme' | 'custom';
              setTypeFilter(v);
              syncUrlParams(tab, textFilter, porteeFilter, v);
            }}
            className={FILTER_SELECT_CLASS}
          >
            <option value="all">Tous</option>
            <option value="systeme">Système</option>
            <option value="custom">Personnalisés</option>
          </select>
        </FilterField>
      </FilterCard>

      <DataTable
        data={filteredRoles}
        columns={columns}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Rechercher un rôle par nom, libellé, portée ou permission..."
        isLoading={rolesQuery.isLoading}
        isRefreshing={rolesQuery.isFetching && !rolesQuery.isLoading}
        enableSelection
        bulkActions={bulkActions}
        emptyMessage="Aucun rôle visible."
        emptyDescription="Ajustez vos filtres ou créez un nouveau rôle personnalisé."
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredRoles.length === 0}
              onClick={() => handleExportCsv(filteredRoles)}
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
              Nouveau rôle
            </Button>
          </>
        }
      />

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !createRoleMutation.isPending) {
              setModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2
                id="role-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Nouveau rôle personnalisé
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

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="m-r-name">Slug technique *</Label>
                  <Input
                    id="m-r-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.toLowerCase())}
                    placeholder="superviseur_quai"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-r-libelle">Libellé affiché *</Label>
                  <Input
                    id="m-r-libelle"
                    value={formLibelle}
                    onChange={(e) => setFormLibelle(e.target.value)}
                    placeholder="Superviseur de Quai"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-r-portee">Portée *</Label>
                  <select
                    id="m-r-portee"
                    value={formPortee}
                    onChange={(e) => {
                      setFormPortee(e.target.value as RoleScope);
                      setFormPermIds([]);
                    }}
                    className={FILTER_SELECT_CLASS}
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Permissions attribuables ({formPermIds.length} /{' '}
                    {permissionsQuery.data?.length ?? 0})
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      placeholder="Filtrer les permissions..."
                      className="h-8 w-52 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setFormPermIds(filteredPerms.map((p) => p.id))}
                    >
                      Tout cocher
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setFormPermIds([])}
                    >
                      Vider
                    </Button>
                  </div>
                </div>

                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-800/60">
                  {permissionsQuery.isLoading ? (
                    <p className="col-span-full text-xs text-slate-500">
                      {OPERATION_LABELS.loading}
                    </p>
                  ) : filteredPerms.length === 0 ? (
                    <p className="col-span-full text-xs text-slate-500">
                      Aucune permission pour ce filtre.
                    </p>
                  ) : (
                    filteredPerms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 rounded border-slate-300 accent-[#1B9DD9]"
                          checked={formPermIds.includes(perm.id)}
                          onChange={() => togglePerm(perm.id)}
                        />
                        <span className="truncate font-mono" title={perm.name}>
                          {perm.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={createRoleMutation.isPending}
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={createRoleMutation.isPending}>
                  {createRoleMutation.isPending ? OPERATION_LABELS.saving : 'Enregistrer le rôle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        title={`Supprimer le rôle « ${deleteTarget?.libelle || deleteTarget?.name || ''} » ?`}
        description="Cette action est définitive pour ce rôle personnalisé non attribué."
        confirmLabel="Supprimer"
        variant="destructive"
        isPending={deleteRoleMutation.isPending}
        pendingLabel={OPERATION_LABELS.deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteRoleMutation.mutate(deleteTarget.id);
        }}
      />
    </PageContent>
  );
}
