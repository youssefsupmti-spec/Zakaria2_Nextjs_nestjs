'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  BusinessEditorModal,
  type BusinessItemDto,
  type BusinessOptionsDto,
} from '@/components/businesses/business-editor-modal';
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

interface BusinessesListResponse {
  isClientView: boolean;
  canDeleteBusiness: boolean;
  stats: {
    total: number;
    actifs: number;
    inactifs?: number;
    virement: number;
    espece: number;
    rattaches: number;
    couvertsParZone: number;
    orphelins: number;
    horsZone: number;
  };
  items: BusinessItemDto[];
  options: BusinessOptionsDto;
}

type BusinessTab = 'toutes' | 'actifs' | 'inactifs' | 'couvertes' | 'alertes';

export default function BusinessesPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<BusinessTab>('toutes');
  const [searchFilter, setSearchFilter] = useState('');
  const [agencyIdFilter, setAgencyIdFilter] = useState('');
  const [villeIdFilter, setVilleIdFilter] = useState('');
  const [modePaiementFilter, setModePaiementFilter] = useState('');
  const [couvertureFilter, setCouvertureFilter] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  const [feedback, setFeedback] = useState<OperationMessage | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItemDto | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<BusinessItemDto | null>(null);
  const [bulkArchiveSelection, setBulkArchiveSelection] = useState<{
    rows: BusinessItemDto[];
    clear: () => void;
  } | null>(null);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (searchFilter.trim()) p.set('search', searchFilter.trim());
    if (agencyIdFilter) p.set('agencyId', agencyIdFilter);
    if (villeIdFilter) p.set('villeId', villeIdFilter);
    if (modePaiementFilter) p.set('modePaiement', modePaiementFilter);
    if (couvertureFilter) p.set('couverture', couvertureFilter);
    return p.toString();
  }, [searchFilter, agencyIdFilter, villeIdFilter, modePaiementFilter, couvertureFilter]);

  const businessesQuery = useQuery({
    queryKey: ['businesses', queryParams],
    queryFn: () =>
      apiFetch<BusinessesListResponse>(queryParams ? `/businesses?${queryParams}` : '/businesses'),
  });

  const isClientView = businessesQuery.data?.isClientView ?? false;
  const canDeleteBusiness = businessesQuery.data?.canDeleteBusiness ?? false;
  const options = businessesQuery.data?.options ?? { agences: [], villes: [], banques: [] };
  const allItems = businessesQuery.data?.items ?? [];

  const stats = businessesQuery.data?.stats ?? {
    total: allItems.length,
    actifs: allItems.filter((b) => b.isActive).length,
    inactifs: allItems.filter((b) => !b.isActive).length,
    virement: allItems.filter((b) => b.modePaiement === 'virement_bancaire').length,
    espece: allItems.filter((b) => b.modePaiement === 'espece').length,
    rattaches: allItems.filter((b) => b.couverture.statut === 'rattache').length,
    couvertsParZone: allItems.filter((b) => b.couverture.statut === 'couvert_par_zone').length,
    orphelins: allItems.filter((b) => b.couverture.statut === 'orphelin_sans_ville').length,
    horsZone: allItems.filter((b) => b.couverture.statut === 'hors_zone').length,
  };

  const inactifsCount = stats.inactifs ?? Math.max(0, stats.total - stats.actifs);

  const displayedItems = useMemo(() => {
    let rows = allItems;
    if (tab === 'actifs') rows = rows.filter((b) => b.isActive);
    else if (tab === 'inactifs') rows = rows.filter((b) => !b.isActive);
    else if (tab === 'couvertes') {
      rows = rows.filter(
        (b) => b.couverture.statut === 'rattache' || b.couverture.statut === 'couvert_par_zone',
      );
    } else if (tab === 'alertes') {
      rows = rows.filter(
        (b) => b.couverture.statut === 'hors_zone' || b.couverture.statut === 'orphelin_sans_ville',
      );
    }

    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.user.nomComplet.toLowerCase().includes(q) ||
        (b.user.telephone ?? '').toLowerCase().includes(q) ||
        (b.ville?.nameFr ?? '').toLowerCase().includes(q) ||
        (b.activeCompte?.rib ?? '').toLowerCase().includes(q),
    );
  }, [allItems, tab, tableSearch]);

  const archiveMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message?: string }>(`/businesses/${id}`, { method: 'DELETE' }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      setFeedback({ type: 'ok', text: res.message ?? 'Enseigne archivée.' });
      setArchiveTarget(null);
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Archivage refusé.',
      });
      setArchiveTarget(null);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, isActive }: { ids: number[]; isActive: boolean }) =>
      apiFetch<{ message: string }>('/businesses/bulk-status', {
        method: 'POST',
        body: { ids, isActive },
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      setFeedback({ type: 'ok', text: res.message });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Mise à jour groupée impossible.',
      });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: (ids: number[]) =>
      apiFetch<{ message: string }>('/businesses/bulk-archive', {
        method: 'POST',
        body: { ids },
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      setFeedback({ type: 'ok', text: res.message });
      setBulkArchiveSelection(null);
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Archivage groupé refusé.',
      });
      setBulkArchiveSelection(null);
    },
  });

  const resetFilters = () => {
    setTab('toutes');
    setSearchFilter('');
    setAgencyIdFilter('');
    setVilleIdFilter('');
    setModePaiementFilter('');
    setCouvertureFilter('');
    setTableSearch('');
  };

  const activeFiltersCount =
    (tab !== 'toutes' ? 1 : 0) +
    (searchFilter.trim() ? 1 : 0) +
    (agencyIdFilter ? 1 : 0) +
    (villeIdFilter ? 1 : 0) +
    (modePaiementFilter ? 1 : 0) +
    (couvertureFilter ? 1 : 0);

  const tabs: PageTabItem<BusinessTab>[] = [
    { key: 'toutes', label: 'Toutes', count: stats.total, icon: 'solar:shop-2-bold-duotone' },
    {
      key: 'actifs',
      label: 'Actives',
      count: stats.actifs,
      icon: 'solar:check-circle-bold-duotone',
    },
    {
      key: 'inactifs',
      label: 'Inactives',
      count: inactifsCount,
      icon: 'solar:close-circle-bold-duotone',
    },
    {
      key: 'couvertes',
      label: 'Couvertes',
      count: stats.rattaches + stats.couvertsParZone,
      icon: 'solar:verified-check-bold-duotone',
    },
    {
      key: 'alertes',
      label: 'Hors zone / Orphelines',
      count: stats.horsZone + stats.orphelins,
      icon: 'solar:danger-triangle-bold-duotone',
    },
  ];

  const columns: DataTableColumnDef<BusinessItemDto>[] = [
    {
      accessorKey: 'name',
      header: 'Enseigne',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1B9DD9]/10 text-[#1B9DD9] dark:bg-sky-950/70">
              <Icon icon="solar:shop-2-bold-duotone" className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{b.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {b.type || 'Activité standard'}
                {b.ice ? ` · ICE ${b.ice}` : ''}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'vendeur',
      header: 'Vendeur / Client',
      accessorFn: (row) => `${row.user.nomComplet} ${row.user.telephone ?? ''}`,
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-slate-100">{u.nomComplet}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {u.telephone || u.email}
            </p>
          </div>
        );
      },
    },
    {
      id: 'ville',
      header: 'Ville & Couverture',
      accessorFn: (row) => `${row.ville?.nameFr ?? 'Sans ville'} ${row.couverture.label}`,
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {b.ville?.nameFr ?? 'Aucune ville'}
            </p>
            <StatusBadge status={b.couverture.statut} />
          </div>
        );
      },
    },
    {
      id: 'agency',
      header: 'Agence ramassage',
      accessorFn: (row) => row.agency?.nom ?? 'Auto zone',
      cell: ({ row }) => {
        const a = row.original.agency;
        if (!a) return <span className="text-xs text-slate-400">Par zone / Auto</span>;
        return (
          <div className="text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-200">{a.nom}</p>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{a.code}</p>
          </div>
        );
      },
    },
    {
      id: 'paiement',
      header: 'Paiement & RIB actif',
      accessorFn: (row) => row.activeCompte?.rib ?? row.modePaiement ?? '',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <Badge variant={b.modePaiement === 'virement_bancaire' ? 'default' : 'secondary'}>
                {b.modePaiement === 'virement_bancaire' ? 'Virement' : 'Espèce'}
              </Badge>
              <span className="tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                {b.comptesCount} RIB
              </span>
            </div>
            {b.activeCompte ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {b.activeCompte.resolvedBank.banqueNom}
                </span>
                {b.activeCompte.resolvedBank.estBanqueCustom && (
                  <StatusBadge status="custom" label="Custom" />
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Aucun compte actif</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setSelectedBusiness(b);
                setEditorOpen(true);
              }}
            >
              <Pencil className="size-3" />
              Gérer
            </Button>
            {!isClientView && canDeleteBusiness && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={() => setArchiveTarget(b)}
              >
                <Trash2 className="size-3" />
                Archiver
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const bulkActions: DataTableBulkAction<BusinessItemDto>[] = [
    {
      key: 'activate',
      label: bulkStatusMutation.isPending ? OPERATION_LABELS.updating : 'Activer',
      icon: <Power className="size-3.5" />,
      variant: 'outline',
      disabled: bulkStatusMutation.isPending,
      onClick: (rows, clear) => {
        bulkStatusMutation.mutate(
          { ids: rows.map((r) => r.id), isActive: true },
          { onSuccess: () => clear() },
        );
      },
    },
    {
      key: 'deactivate',
      label: bulkStatusMutation.isPending ? OPERATION_LABELS.updating : 'Désactiver',
      icon: <PowerOff className="size-3.5" />,
      variant: 'outline',
      disabled: bulkStatusMutation.isPending,
      onClick: (rows, clear) => {
        bulkStatusMutation.mutate(
          { ids: rows.map((r) => r.id), isActive: false },
          { onSuccess: () => clear() },
        );
      },
    },
  ];

  if (!isClientView && canDeleteBusiness) {
    bulkActions.push({
      key: 'archive',
      label: 'Archiver',
      icon: <Trash2 className="size-3.5" />,
      variant: 'destructive',
      disabled: bulkArchiveMutation.isPending,
      onClick: (rows, clear) => setBulkArchiveSelection({ rows, clear }),
    });
  }

  bulkActions.push({
    key: 'export',
    label: 'Exportation CSV',
    icon: <Download className="size-3.5" />,
    variant: 'outline',
    onClick: (rows) => {
      exportRowsToCsv(
        'g4d-enseignes-selection.csv',
        [
          'ID',
          'Enseigne',
          'Vendeur',
          'Téléphone',
          'Ville',
          'Agence',
          'Paiement',
          'Banque active',
          'RIB',
          'Statut',
        ],
        rows.map((r) => [
          r.id,
          r.name,
          r.user.nomComplet,
          r.user.telephone,
          r.ville?.nameFr ?? '',
          r.agency?.nom ?? '',
          r.modePaiement ?? '',
          r.activeCompte?.resolvedBank.banqueNom ?? '',
          r.activeCompte?.rib ?? '',
          r.isActive ? 'Active' : 'Inactive',
        ]),
      );
      setFeedback({ type: 'ok', text: `${rows.length} enseigne(s) exportée(s) en CSV.` });
    },
  });

  return (
    <PageContent>
      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* 1. Tabs statut & couverture */}
      <PageTabs tabs={tabs} value={tab} onChange={setTab} />

      {/* 2. Card de filtrage contextuelle */}
      <FilterCard
        columns={isClientView ? 3 : 5}
        activeCount={activeFiltersCount}
        onReset={resetFilters}
      >
        <FilterField label="Vendeur / Enseigne / Tél." htmlFor="filter-biz-search">
          <Input
            id="filter-biz-search"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Nom boutique, vendeur, ICE..."
          />
        </FilterField>

        <FilterField label="Ville de ramassage" htmlFor="filter-biz-ville">
          <select
            id="filter-biz-ville"
            value={villeIdFilter}
            onChange={(e) => setVilleIdFilter(e.target.value)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">Toutes les villes</option>
            {options.villes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nameFr}
              </option>
            ))}
          </select>
        </FilterField>

        {!isClientView && (
          <FilterField label="Agence" htmlFor="filter-biz-agency">
            <select
              id="filter-biz-agency"
              value={agencyIdFilter}
              onChange={(e) => setAgencyIdFilter(e.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Toutes les agences</option>
              {options.agences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom} ({a.code})
                </option>
              ))}
            </select>
          </FilterField>
        )}

        <FilterField label="Mode paiement" htmlFor="filter-biz-mode">
          <select
            id="filter-biz-mode"
            value={modePaiementFilter}
            onChange={(e) => setModePaiementFilter(e.target.value)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">Tous les modes</option>
            <option value="virement_bancaire">Virement bancaire</option>
            <option value="espece">Espèce</option>
          </select>
        </FilterField>

        {!isClientView && (
          <FilterField label="Couverture ramassage" htmlFor="filter-biz-couv">
            <select
              id="filter-biz-couv"
              value={couvertureFilter}
              onChange={(e) => setCouvertureFilter(e.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Toutes couvertures</option>
              <option value="rattache">Rattachée directement</option>
              <option value="couvert_par_zone">Couverte par zone</option>
              <option value="hors_zone">Hors zone</option>
              <option value="orphelin_sans_ville">Orpheline sans ville</option>
            </select>
          </FilterField>
        )}
      </FilterCard>

      {/* 3 & 4. DataTable unifiée avec checkbox gauche et bulk actions */}
      <DataTable
        data={displayedItems}
        columns={columns}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Filtrer rapidement dans le tableau (enseigne, vendeur, RIB)..."
        isLoading={businessesQuery.isLoading}
        isRefreshing={businessesQuery.isFetching && !businessesQuery.isLoading}
        enableSelection
        bulkActions={bulkActions}
        emptyMessage="Aucune enseigne commerciale trouvée."
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={displayedItems.length === 0}
              onClick={() => {
                exportRowsToCsv(
                  'g4d-enseignes.csv',
                  [
                    'ID',
                    'Enseigne',
                    'Vendeur',
                    'Téléphone',
                    'Ville',
                    'Agence',
                    'Paiement',
                    'RIB actif',
                    'Statut',
                  ],
                  displayedItems.map((r) => [
                    r.id,
                    r.name,
                    r.user.nomComplet,
                    r.user.telephone,
                    r.ville?.nameFr ?? '',
                    r.agency?.nom ?? '',
                    r.modePaiement ?? '',
                    r.activeCompte?.rib ?? '',
                    r.isActive ? 'Active' : 'Inactive',
                  ]),
                );
                setFeedback({
                  type: 'ok',
                  text: `${displayedItems.length} enseigne(s) exportée(s) en CSV.`,
                });
              }}
            >
              <Download className="size-3.5" />
              Exportation CSV
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSelectedBusiness(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              Nouvelle enseigne
            </Button>
          </>
        }
      />

      <BusinessEditorModal
        open={editorOpen}
        isClientView={isClientView}
        business={selectedBusiness}
        options={options}
        onClose={() => setEditorOpen(false)}
        onFeedback={(msg) => setFeedback(msg)}
      />

      <ConfirmActionDialog
        open={Boolean(archiveTarget)}
        title={`Archiver ${archiveTarget?.name ?? 'cette enseigne'} ?`}
        description="L'enseigne et ses comptes bancaires associés seront désactivés et archivés."
        confirmLabel="Archiver"
        variant="destructive"
        isPending={archiveMutation.isPending}
        pendingLabel={OPERATION_LABELS.deleting}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) archiveMutation.mutate(archiveTarget.id);
        }}
      />

      <ConfirmActionDialog
        open={Boolean(bulkArchiveSelection)}
        title={`Archiver ${bulkArchiveSelection?.rows.length ?? 0} enseigne(s) ?`}
        description="Toutes les enseignes sélectionnées et leurs comptes bancaires rattachés seront désactivés et archivés."
        confirmLabel="Confirmer l'archivage"
        variant="destructive"
        isPending={bulkArchiveMutation.isPending}
        pendingLabel={OPERATION_LABELS.deleting}
        onCancel={() => setBulkArchiveSelection(null)}
        onConfirm={() => {
          if (!bulkArchiveSelection) return;
          bulkArchiveMutation.mutate(
            bulkArchiveSelection.rows.map((r) => r.id),
            { onSuccess: () => bulkArchiveSelection.clear() },
          );
        }}
      />
    </PageContent>
  );
}
