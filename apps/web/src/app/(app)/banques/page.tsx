'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateBanqueSchema } from '@zakaria/shared-contracts';
import {
  CheckCircle2,
  Download,
  Landmark,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
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

interface BanqueItemDto {
  id: number;
  name: string;
  swiftCode: string | null;
  logo: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  codes: string[];
  comptesCount: number;
}

interface BanquesListResponse {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  counts?: {
    total: number;
    active: number;
    inactive: number;
  };
  items: BanqueItemDto[];
}

type BanqueTab = 'toutes' | 'active' | 'inactive';

export default function BanquesPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<BanqueTab>('toutes');
  const [nameFilter, setNameFilter] = useState('');
  const [codePrefixFilter, setCodePrefixFilter] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [feedback, setFeedback] = useState<OperationMessage | null>(null);

  // État modale création / édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanque, setEditingBanque] = useState<BanqueItemDto | null>(null);
  const [name, setName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [codesInput, setCodesInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmations suppression / lot
  const [archiveTarget, setArchiveTarget] = useState<BanqueItemDto | null>(null);
  const [bulkArchiveSelection, setBulkArchiveSelection] = useState<{
    rows: BanqueItemDto[];
    clear: () => void;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStatus = params.get('status');
    const urlCode = params.get('codePrefix');
    const urlQ = params.get('q');
    if (urlStatus === 'active' || urlStatus === 'inactive') setTab(urlStatus);
    if (urlCode) setCodePrefixFilter(urlCode);
    if (urlQ) setNameFilter(urlQ);
  }, []);

  const updateUrlParams = (nextTab: BanqueTab, nextQ: string, nextCode: string) => {
    const url = new URL(window.location.href);
    if (nextTab === 'toutes') url.searchParams.delete('status');
    else url.searchParams.set('status', nextTab);
    if (nextQ.trim()) url.searchParams.set('q', nextQ.trim());
    else url.searchParams.delete('q');
    if (nextCode.trim()) url.searchParams.set('codePrefix', nextCode.trim());
    else url.searchParams.delete('codePrefix');
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

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (tab !== 'toutes') p.set('status', tab);
    if (nameFilter.trim()) p.set('search', nameFilter.trim());
    if (codePrefixFilter.trim()) p.set('codePrefix', codePrefixFilter.trim());
    return p.toString();
  }, [tab, nameFilter, codePrefixFilter]);

  const banquesQuery = useQuery({
    queryKey: ['banques', queryParams],
    queryFn: () =>
      apiFetch<BanquesListResponse>(queryParams ? `/banques?${queryParams}` : '/banques'),
  });

  const allItems = banquesQuery.data?.items ?? [];
  const counts = banquesQuery.data?.counts ?? {
    total: allItems.length,
    active: allItems.filter((b) => b.status === 'active').length,
    inactive: allItems.filter((b) => b.status === 'inactive').length,
  };

  const displayedItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.swiftCode ?? '').toLowerCase().includes(q) ||
        b.codes.some((c) => c.includes(q)),
    );
  }, [allItems, tableSearch]);

  const canCreate = banquesQuery.data?.canCreate ?? false;
  const canUpdate = banquesQuery.data?.canUpdate ?? false;
  const canDelete = banquesQuery.data?.canDelete ?? false;

  const openCreateModal = () => {
    setEditingBanque(null);
    setName('');
    setSwiftCode('');
    setStatus('active');
    setCodesInput('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (banque: BanqueItemDto) => {
    setEditingBanque(banque);
    setName(banque.name);
    setSwiftCode(banque.swiftCode ?? '');
    setStatus(banque.status);
    setCodesInput(banque.codes.join(', '));
    setFormError(null);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const codes = codesInput
        .split(/[\s,;]+/)
        .map((c) => c.trim())
        .filter(Boolean);

      const parsed = CreateBanqueSchema.safeParse({
        name: name.trim(),
        swiftCode: swiftCode.trim() || null,
        status,
        codes,
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Données bancaires invalides.');
      }

      if (editingBanque) {
        return apiFetch(`/banques/${editingBanque.id}`, {
          method: 'PATCH',
          body: parsed.data,
        });
      }
      return apiFetch('/banques', {
        method: 'POST',
        body: parsed.data,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['banques'] });
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      setFeedback({
        type: 'ok',
        text: editingBanque ? `Banque « ${name} » mise à jour.` : `Banque « ${name} » créée.`,
      });
      setModalOpen(false);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/banques/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['banques'] });
      setFeedback({ type: 'ok', text: 'Banque archivée avec succès.' });
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
    mutationFn: ({ ids, nextStatus }: { ids: number[]; nextStatus: 'active' | 'inactive' }) =>
      apiFetch<{ message: string }>('/banques/bulk-status', {
        method: 'POST',
        body: { ids, status: nextStatus },
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['banques'] });
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
      apiFetch<{ message: string; archivedCount?: number; skippedCount?: number }>(
        '/banques/bulk-archive',
        {
          method: 'POST',
          body: { ids },
        },
      ),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['banques'] });
      setFeedback({
        type: res.skippedCount && res.archivedCount === 0 ? 'err' : 'ok',
        text: res.message,
      });
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

  const handleTabChange = (next: BanqueTab) => {
    setTab(next);
    updateUrlParams(next, nameFilter, codePrefixFilter);
  };

  const resetFilters = () => {
    setTab('toutes');
    setNameFilter('');
    setCodePrefixFilter('');
    setTableSearch('');
    updateUrlParams('toutes', '', '');
  };

  const activeFiltersCount =
    (tab !== 'toutes' ? 1 : 0) + (nameFilter.trim() ? 1 : 0) + (codePrefixFilter.trim() ? 1 : 0);

  const tabs: PageTabItem<BanqueTab>[] = [
    {
      key: 'toutes',
      label: 'Toutes',
      count: counts.total,
      icon: Landmark,
    },
    {
      key: 'active',
      label: 'Actives',
      count: counts.active,
      icon: CheckCircle2,
    },
    {
      key: 'inactive',
      label: 'Inactives',
      count: counts.inactive,
      icon: XCircle,
    },
  ];

  const columns: DataTableColumnDef<BanqueItemDto>[] = [
    {
      accessorKey: 'name',
      header: 'Banque',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1B9DD9]/10 text-[#1B9DD9] dark:bg-sky-950/70">
              <Landmark className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{b.name}</p>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {b.swiftCode ? `SWIFT : ${b.swiftCode}` : 'Code SWIFT non renseigné'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'codes',
      header: 'Préfixes RIB (3 chiffres)',
      accessorFn: (row) => row.codes.join(', '),
      cell: ({ row }) => {
        const codes = row.original.codes;
        if (codes.length === 0) {
          return <span className="text-xs text-slate-400">Aucun préfixe</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {codes.map((c) => (
              <Badge key={c} variant="secondary" className="font-mono text-xs">
                {c}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'comptesCount',
      header: 'Comptes liés',
      cell: ({ row }) => (
        <span className="tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.comptesCount} compte{row.original.comptesCount > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status === 'active' ? 'active' : 'inactive'} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const b = row.original;
        if (!canUpdate && !canDelete) {
          return <span className="text-xs text-slate-400">Lecture seule</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            {canUpdate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => openEditModal(b)}
              >
                <Pencil className="size-3" />
                Modifier
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                disabled={b.comptesCount > 0}
                title={
                  b.comptesCount > 0
                    ? `${b.comptesCount} compte(s) actif(s) rattaché(s)`
                    : 'Archiver cette banque'
                }
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

  const bulkActions: DataTableBulkAction<BanqueItemDto>[] = [];
  if (canUpdate) {
    bulkActions.push(
      {
        key: 'activate',
        label: bulkStatusMutation.isPending ? OPERATION_LABELS.updating : 'Activer',
        icon: <Power className="size-3.5" />,
        variant: 'outline',
        disabled: bulkStatusMutation.isPending,
        onClick: (rows, clear) => {
          bulkStatusMutation.mutate(
            { ids: rows.map((r) => r.id), nextStatus: 'active' },
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
            { ids: rows.map((r) => r.id), nextStatus: 'inactive' },
            { onSuccess: () => clear() },
          );
        },
      },
    );
  }
  if (canDelete) {
    bulkActions.push({
      key: 'archive',
      label: 'Archiver',
      icon: <Trash2 className="size-3.5" />,
      variant: 'destructive',
      disabled: bulkArchiveMutation.isPending,
      onClick: (rows, clear) => {
        setBulkArchiveSelection({ rows, clear });
      },
    });
  }
  bulkActions.push({
    key: 'export',
    label: 'Exportation CSV',
    icon: <Download className="size-3.5" />,
    variant: 'outline',
    onClick: (rows) => {
      exportRowsToCsv(
        'g4d-banques-selection.csv',
        ['ID', 'Banque', 'Code SWIFT', 'Préfixes RIB', 'Comptes liés', 'Statut'],
        rows.map((r) => [
          r.id,
          r.name,
          r.swiftCode ?? '',
          r.codes.join(' | '),
          r.comptesCount,
          r.status === 'active' ? 'Active' : 'Inactive',
        ]),
      );
      setFeedback({ type: 'ok', text: `${rows.length} banque(s) exportée(s) en CSV.` });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    saveMutation.mutate();
  };

  return (
    <PageContent>
      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* 1. Tabs de navigation et statut */}
      <PageTabs tabs={tabs} value={tab} onChange={handleTabChange} />

      {/* 2. Card de filtrage contextuelle */}
      <FilterCard columns={3} activeCount={activeFiltersCount} onReset={resetFilters}>
        <FilterField label="Banque / Code SWIFT" htmlFor="filter-banque-name">
          <Input
            id="filter-banque-name"
            value={nameFilter}
            onChange={(e) => {
              const v = e.target.value;
              setNameFilter(v);
              updateUrlParams(tab, v, codePrefixFilter);
            }}
            placeholder="Attijariwafa, CIH, BCP..."
          />
        </FilterField>

        <FilterField label="Préfixe RIB (3 chiffres)" htmlFor="filter-banque-rib">
          <Input
            id="filter-banque-rib"
            maxLength={3}
            value={codePrefixFilter}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '');
              setCodePrefixFilter(v);
              updateUrlParams(tab, nameFilter, v);
            }}
            placeholder="Ex: 007, 011, 230..."
          />
        </FilterField>

        <FilterField label="Statut" htmlFor="filter-banque-status">
          <select
            id="filter-banque-status"
            value={tab}
            onChange={(e) => handleTabChange(e.target.value as BanqueTab)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="toutes">Toutes les banques</option>
            <option value="active">Actives uniquement</option>
            <option value="inactive">Inactives uniquement</option>
          </select>
        </FilterField>
      </FilterCard>

      {/* 3 & 4. DataTable unifiée (recherche intégrée + checkbox gauche + pagination) */}
      <DataTable
        data={displayedItems}
        columns={columns}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Rechercher rapidement dans les résultats..."
        isLoading={banquesQuery.isLoading}
        isRefreshing={banquesQuery.isFetching && !banquesQuery.isLoading}
        enableSelection
        bulkActions={bulkActions}
        emptyMessage="Aucune banque ne correspond à ces critères."
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={displayedItems.length === 0}
              onClick={() => {
                exportRowsToCsv(
                  'g4d-banques.csv',
                  ['ID', 'Banque', 'Code SWIFT', 'Préfixes RIB', 'Comptes liés', 'Statut'],
                  displayedItems.map((r) => [
                    r.id,
                    r.name,
                    r.swiftCode ?? '',
                    r.codes.join(' | '),
                    r.comptesCount,
                    r.status === 'active' ? 'Active' : 'Inactive',
                  ]),
                );
                setFeedback({
                  type: 'ok',
                  text: `${displayedItems.length} banque(s) exportée(s) en CSV.`,
                });
              }}
            >
              <Download className="size-3.5" />
              Exportation CSV
            </Button>
            {canCreate && (
              <Button type="button" size="sm" onClick={openCreateModal}>
                <Plus className="size-3.5" />
                Ajouter une banque
              </Button>
            )}
          </>
        }
      />

      {/* Modale Création / Modification */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saveMutation.isPending) setModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingBanque ? `Modifier ${editingBanque.name}` : 'Nouvelle banque & codes RIB'}
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="banque-name">Nom officiel de la banque</Label>
                <Input
                  id="banque-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Attijariwafa Bank"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="banque-swift">Code SWIFT / BIC</Label>
                  <Input
                    id="banque-swift"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="BCMAMAMC"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banque-status">Statut</Label>
                  <select
                    id="banque-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className={FILTER_SELECT_CLASS}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="banque-codes">
                  Préfixes RIB à 3 chiffres (séparés par virgule ou espace)
                </Label>
                <Input
                  id="banque-codes"
                  value={codesInput}
                  onChange={(e) => setCodesInput(e.target.value)}
                  placeholder="Ex: 007, 011, 230"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saveMutation.isPending}
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? OPERATION_LABELS.saving
                    : editingBanque
                      ? 'Enregistrer'
                      : 'Créer la banque'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation archivage unitaire */}
      <ConfirmActionDialog
        open={Boolean(archiveTarget)}
        title={`Archiver ${archiveTarget?.name ?? 'cette banque'} ?`}
        description="Cette action archive la banque et libère ses préfixes RIB à 3 chiffres. Les banques associées à au moins un compte bancaire actif restent protégées."
        confirmLabel="Archiver"
        variant="destructive"
        isPending={archiveMutation.isPending}
        pendingLabel={OPERATION_LABELS.deleting}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) archiveMutation.mutate(archiveTarget.id);
        }}
      />

      {/* Confirmation archivage groupé */}
      <ConfirmActionDialog
        open={Boolean(bulkArchiveSelection)}
        title={`Archiver ${bulkArchiveSelection?.rows.length ?? 0} banque(s) ?`}
        description="Les banques sans compte bancaire lié seront archivées. Celles possédant encore des comptes actifs seront automatiquement ignorées."
        confirmLabel="Confirmer l'archivage"
        variant="destructive"
        isPending={bulkArchiveMutation.isPending}
        pendingLabel={OPERATION_LABELS.deleting}
        onCancel={() => setBulkArchiveSelection(null)}
        onConfirm={() => {
          if (!bulkArchiveSelection) return;
          bulkArchiveMutation.mutate(
            bulkArchiveSelection.rows.map((r) => r.id),
            {
              onSuccess: () => bulkArchiveSelection.clear(),
            },
          );
        }}
      />
    </PageContent>
  );
}
