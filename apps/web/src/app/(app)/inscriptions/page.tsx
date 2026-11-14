'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

type StatutTab = 'toutes' | 'en_attente' | 'acceptee' | 'refusee';

interface InscriptionBusiness {
  id: number;
  name: string;
  type: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ice: string | null;
  rc: string | null;
  isActive: boolean;
  ville: { id: number; nameFr: string } | null;
  agency: { id: number; nom: string; code: string } | null;
}

interface InscriptionItem {
  id: number;
  nomComplet: string;
  civilite: string | null;
  email: string;
  telephone: string;
  sav: string;
  villeName: string;
  cin: string;
  lienLocalisationMaps: string;
  active: boolean;
  inscriptionStatut: string | null;
  inscriptionTraiteeLe: string | null;
  inscriptionMotif: string | null;
  inscriptionRefusNombre: number;
  inscriptionDernierRefusLe: string | null;
  createdAt: string | null;
  businesses: InscriptionBusiness[];
}

interface InscriptionsResponse {
  statut: 'en_attente' | 'acceptee' | 'refusee';
  canApprove: boolean;
  canReject: boolean;
  counts: {
    enAttente: number;
    acceptee: number;
    refusee: number;
  };
  items: InscriptionItem[];
}

function formatDateFr(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export default function InscriptionsPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<StatutTab>('toutes');
  const [textFilter, setTextFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [feedback, setFeedback] = useState<OperationMessage | null>(null);

  // Modale refus unitaire
  const [refusTarget, setRefusTarget] = useState<InscriptionItem | null>(null);
  const [refusMotif, setRefusMotif] = useState('');

  // Confirmation validation groupée
  const [bulkApproveSelection, setBulkApproveSelection] = useState<{
    ids: number[];
    clear: () => void;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStatut = params.get('statut');
    const urlQ = params.get('q');
    const urlVille = params.get('ville');
    const urlAgence = params.get('agence');
    if (
      urlStatut === 'en_attente' ||
      urlStatut === 'acceptee' ||
      urlStatut === 'refusee' ||
      urlStatut === 'toutes'
    ) {
      setTab(urlStatut);
    }
    if (urlQ) setTextFilter(urlQ);
    if (urlVille) setVilleFilter(urlVille);
    if (urlAgence) setAgenceFilter(urlAgence);
  }, []);

  const syncUrlParams = (
    nextTab: StatutTab,
    nextQ: string,
    nextVille: string,
    nextAgence: string,
  ) => {
    const url = new URL(window.location.href);
    if (nextTab === 'toutes') url.searchParams.delete('statut');
    else url.searchParams.set('statut', nextTab);
    if (nextQ.trim()) url.searchParams.set('q', nextQ.trim());
    else url.searchParams.delete('q');
    if (nextVille) url.searchParams.set('ville', nextVille);
    else url.searchParams.delete('ville');
    if (nextAgence) url.searchParams.set('agence', nextAgence);
    else url.searchParams.delete('agence');
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    if (!refusTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRefusTarget(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [refusTarget]);

  const query = useQuery({
    queryKey: ['inscriptions', tab],
    queryFn: async () => {
      if (tab !== 'toutes') {
        return apiFetch<InscriptionsResponse>(`/inscriptions?statut=${tab}`);
      }
      const [pending, accepted, refused] = await Promise.all([
        apiFetch<InscriptionsResponse>('/inscriptions?statut=en_attente'),
        apiFetch<InscriptionsResponse>('/inscriptions?statut=acceptee'),
        apiFetch<InscriptionsResponse>('/inscriptions?statut=refusee'),
      ]);
      const combined = [...pending.items, ...accepted.items, ...refused.items].sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA || b.id - a.id;
      });
      return {
        statut: 'en_attente' as const,
        canApprove: pending.canApprove,
        canReject: pending.canReject,
        counts: pending.counts,
        items: combined,
      };
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string }>(`/inscriptions/${id}/accepter`, { method: 'POST' }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['inscriptions'] });
    },
    onError: (err) =>
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : "Erreur lors de l'acceptation.",
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) =>
      apiFetch<{ message: string }>(`/inscriptions/${id}/refuser`, {
        method: 'POST',
        body: { motif },
      }),
    onSuccess: (res) => {
      setRefusTarget(null);
      setRefusMotif('');
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['inscriptions'] });
    },
    onError: (err) =>
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors du refus.',
      }),
  });

  const bulkAcceptMutation = useMutation({
    mutationFn: (ids: number[]) =>
      apiFetch<{ message: string; acceptedCount: number; skippedCount: number }>(
        '/inscriptions/bulk-accepter',
        {
          method: 'POST',
          body: { ids },
        },
      ),
    onSuccess: (res) => {
      setFeedback({
        type: res.acceptedCount === 0 && res.skippedCount > 0 ? 'err' : 'ok',
        text: res.message,
      });
      setBulkApproveSelection(null);
      void queryClient.invalidateQueries({ queryKey: ['inscriptions'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Validation groupée impossible.',
      });
      setBulkApproveSelection(null);
    },
  });

  const data = query.data;
  const rawItems = useMemo(() => data?.items ?? [], [data?.items]);

  const villeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of rawItems) {
      if (item.villeName?.trim()) set.add(item.villeName.trim());
      for (const b of item.businesses) {
        if (b.ville?.nameFr) set.add(b.ville.nameFr);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [rawItems]);

  const agenceOptions = useMemo(() => {
    const map = new Map<number, { id: number; nom: string; code: string }>();
    for (const item of rawItems) {
      for (const b of item.businesses) {
        if (b.agency) map.set(b.agency.id, b.agency);
      }
    }
    return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [rawItems]);

  const filteredItems = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    return rawItems.filter((item) => {
      if (villeFilter) {
        const matchesVille =
          item.villeName?.trim() === villeFilter ||
          item.businesses.some((b) => b.ville?.nameFr === villeFilter);
        if (!matchesVille) return false;
      }
      if (agenceFilter) {
        const matchesAgence = item.businesses.some((b) => String(b.agency?.id) === agenceFilter);
        if (!matchesAgence) return false;
      }
      if (q) {
        const bizNames = item.businesses.map((b) => `${b.name} ${b.ice ?? ''}`).join(' ');
        const hay =
          `${item.nomComplet} ${item.email} ${item.telephone} ${item.villeName} ${bizNames}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rawItems, textFilter, villeFilter, agenceFilter]);

  const counts = data?.counts ?? { enAttente: 0, acceptee: 0, refusee: 0 };
  const totalCount = counts.enAttente + counts.acceptee + counts.refusee;

  const tabs: PageTabItem<StatutTab>[] = [
    {
      key: 'toutes',
      label: 'Toutes',
      count: totalCount,
      icon: 'solar:user-plus-bold-duotone',
    },
    {
      key: 'en_attente',
      label: 'En attente',
      count: counts.enAttente,
      icon: 'solar:clock-circle-bold-duotone',
    },
    {
      key: 'acceptee',
      label: 'Acceptées',
      count: counts.acceptee,
      icon: 'solar:check-circle-bold-duotone',
    },
    {
      key: 'refusee',
      label: 'Refusées',
      count: counts.refusee,
      icon: 'solar:close-circle-bold-duotone',
    },
  ];

  const activeFiltersCount =
    (tab !== 'toutes' ? 1 : 0) +
    (textFilter.trim() ? 1 : 0) +
    (villeFilter ? 1 : 0) +
    (agenceFilter ? 1 : 0);

  const resetFilters = () => {
    setTab('toutes');
    setTextFilter('');
    setVilleFilter('');
    setAgenceFilter('');
    setTableSearch('');
    syncUrlParams('toutes', '', '', '');
  };

  const handleTabChange = (next: StatutTab) => {
    setTab(next);
    syncUrlParams(next, textFilter, villeFilter, agenceFilter);
  };

  const handleExportCsv = (rows: InscriptionItem[]) => {
    exportRowsToCsv(
      'demandes-inscription',
      ['ID', 'Date', 'Candidat', 'E-mail', 'Téléphone', 'Ville', 'Enseignes', 'Statut', 'Motif'],
      rows.map((item) => [
        item.id,
        formatDateFr(item.createdAt),
        item.nomComplet,
        item.email,
        item.telephone,
        item.villeName,
        item.businesses.map((b) => b.name).join(' | '),
        item.inscriptionStatut ?? '',
        item.inscriptionMotif ?? '',
      ]),
    );
    setFeedback({
      type: 'ok',
      text: `Export CSV généré (${rows.length} demande${rows.length > 1 ? 's' : ''}).`,
    });
  };

  const columns: DataTableColumnDef<InscriptionItem>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <p className="tabular-nums text-xs font-semibold text-slate-800 dark:text-slate-200">
            {formatDateFr(row.original.createdAt)}
          </p>
          <p className="font-mono text-[11px] text-slate-400">#{row.original.id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'nomComplet',
      header: 'Candidat & Contact',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {item.civilite ? `${item.civilite} ` : ''}
                {item.nomComplet}
              </span>
              {item.inscriptionRefusNombre > 0 && (
                <Badge variant="warning" className="text-[10px]">
                  {item.inscriptionRefusNombre} refus antérieur(s)
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">{item.email}</p>
            <p className="tabular-nums text-xs text-slate-500 dark:text-slate-400">
              Tél : {item.telephone || '—'}
              {item.cin ? ` · CIN : ${item.cin}` : ''}
            </p>
            {item.inscriptionMotif && (
              <p className="rounded-md bg-rose-50 px-2 py-1 text-[11px] text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                Motif : {item.inscriptionMotif}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'businesses',
      header: 'Enseigne commerciale',
      accessorFn: (row) => row.businesses.map((b) => b.name).join(', '),
      cell: ({ row }) => {
        const businesses = row.original.businesses;
        if (businesses.length === 0) {
          return <span className="text-xs text-slate-400">Aucune enseigne</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            {businesses.map((b) => (
              <div key={b.id} className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{b.name}</span>
                {b.type && <span className="ml-1 text-slate-500">· {b.type}</span>}
                {b.ice && (
                  <span className="block font-mono text-[10px] text-slate-400">ICE : {b.ice}</span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: 'villeAgence',
      header: 'Ville & Agence',
      accessorFn: (row) =>
        `${row.villeName} ${row.businesses.map((b) => b.agency?.nom ?? '').join(' ')}`,
      cell: ({ row }) => {
        const item = row.original;
        const primaryBiz = item.businesses[0];
        return (
          <div className="space-y-1 text-xs">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {primaryBiz?.ville?.nameFr || item.villeName || 'Non définie'}
            </p>
            {primaryBiz?.agency ? (
              <Badge variant="secondary" className="text-[11px]">
                {primaryBiz.agency.nom} ({primaryBiz.agency.code})
              </Badge>
            ) : (
              <span className="text-[11px] text-slate-400">Agence à affecter</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'inscriptionStatut',
      header: 'Statut',
      cell: ({ row }) => {
        const s = row.original.inscriptionStatut;
        if (s === 'acceptee') return <StatusBadge status="acceptee" />;
        if (s === 'refusee') return <StatusBadge status="refusee" />;
        return <StatusBadge status="en_attente" />;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        if (item.inscriptionStatut !== 'en_attente') {
          return (
            <span className="text-xs text-slate-400">
              {item.inscriptionTraiteeLe
                ? `Traitée le ${formatDateFr(item.inscriptionTraiteeLe)}`
                : 'Traitée'}
            </span>
          );
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {data?.canApprove && (
              <Button
                type="button"
                size="sm"
                className="h-7 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700"
                disabled={acceptMutation.isPending}
                onClick={() => acceptMutation.mutate(item.id)}
              >
                <CheckCircle2 className="size-3.5" />
                Valider
              </Button>
            )}
            {data?.canReject && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-rose-300 px-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50"
                disabled={rejectMutation.isPending}
                onClick={() => {
                  setRefusTarget(item);
                  setRefusMotif('');
                }}
              >
                <XCircle className="size-3.5" />
                Refuser
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const bulkActions: DataTableBulkAction<InscriptionItem>[] = [];
  if (data?.canApprove) {
    bulkActions.push({
      key: 'bulk-approve',
      label: bulkAcceptMutation.isPending ? OPERATION_LABELS.updating : 'Valider la sélection',
      icon: <CheckCircle2 className="size-3.5" />,
      variant: 'default',
      disabled: bulkAcceptMutation.isPending,
      onClick: (rows, clear) => {
        const pendingIds = rows
          .filter((r) => r.inscriptionStatut === 'en_attente')
          .map((r) => r.id);
        if (pendingIds.length === 0) {
          setFeedback({
            type: 'err',
            text: 'Aucune demande « En attente » dans votre sélection.',
          });
          return;
        }
        setBulkApproveSelection({ ids: pendingIds, clear });
      },
    });
  }
  bulkActions.push({
    key: 'export',
    label: 'Exporter CSV',
    icon: <Download className="size-3.5" />,
    variant: 'outline',
    onClick: (rows) => handleExportCsv(rows),
  });

  return (
    <PageContent>
      <PageTabs tabs={tabs} value={tab} onChange={handleTabChange} />

      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      <FilterCard activeCount={activeFiltersCount} onReset={resetFilters} columns={4}>
        <FilterField label="Candidat / Email / Tél. / Enseigne" htmlFor="insc-filter-q">
          <Input
            id="insc-filter-q"
            value={textFilter}
            onChange={(e) => {
              const v = e.target.value;
              setTextFilter(v);
              syncUrlParams(tab, v, villeFilter, agenceFilter);
            }}
            placeholder="Nom, e-mail, téléphone, boutique..."
            className="h-9"
          />
        </FilterField>

        <FilterField label="Ville" htmlFor="insc-filter-ville">
          <select
            id="insc-filter-ville"
            value={villeFilter}
            onChange={(e) => {
              const v = e.target.value;
              setVilleFilter(v);
              syncUrlParams(tab, textFilter, v, agenceFilter);
            }}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">Toutes les villes</option>
            {villeOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Agence proposée" htmlFor="insc-filter-agence">
          <select
            id="insc-filter-agence"
            value={agenceFilter}
            onChange={(e) => {
              const v = e.target.value;
              setAgenceFilter(v);
              syncUrlParams(tab, textFilter, villeFilter, v);
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

        <FilterField label="Statut" htmlFor="insc-filter-statut">
          <select
            id="insc-filter-statut"
            value={tab}
            onChange={(e) => handleTabChange(e.target.value as StatutTab)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="toutes">Toutes</option>
            <option value="en_attente">En attente</option>
            <option value="acceptee">Acceptées</option>
            <option value="refusee">Refusées</option>
          </select>
        </FilterField>
      </FilterCard>

      <DataTable
        data={filteredItems}
        columns={columns}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Rechercher un vendeur, e-mail, téléphone ou enseigne..."
        isLoading={query.isLoading}
        isRefreshing={query.isFetching && !query.isLoading}
        enableSelection
        bulkActions={bulkActions}
        emptyMessage="Aucune demande d'inscription dans cette vue."
        emptyDescription="Les dossiers correspondant à votre périmètre apparaîtront ici."
        toolbarActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredItems.length === 0}
            onClick={() => handleExportCsv(filteredItems)}
          >
            <Download className="size-3.5" />
            Exporter CSV
          </Button>
        }
      />

      {refusTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !rejectMutation.isPending) {
              setRefusTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="refus-modal-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2
                id="refus-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Refuser la demande de {refusTarget.nomComplet}
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setRefusTarget(null)}
                className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Le motif est obligatoire (3 à 500 caractères). Le vendeur pourra soumettre un nouveau
              dossier ultérieurement avec le même e-mail.
            </p>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="refus-motif">Motif du refus *</Label>
              <textarea
                id="refus-motif"
                rows={3}
                value={refusMotif}
                onChange={(e) => setRefusMotif(e.target.value)}
                placeholder="Ex : Coordonnées incomplètes ou activité non éligible..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 outline-none focus:border-[#1B9DD9] focus:ring-2 focus:ring-[#1B9DD9]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRefusTarget(null)}
                disabled={rejectMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={rejectMutation.isPending || refusMotif.trim().length < 3}
                onClick={() =>
                  rejectMutation.mutate({ id: refusTarget.id, motif: refusMotif.trim() })
                }
              >
                {rejectMutation.isPending ? OPERATION_LABELS.updating : 'Confirmer le refus'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={Boolean(bulkApproveSelection)}
        title="Valider les demandes sélectionnées ?"
        description={
          bulkApproveSelection
            ? `${bulkApproveSelection.ids.length} dossier(s) vendeur en attente seront activés immédiatement.`
            : ''
        }
        confirmLabel="Valider la sélection"
        variant="default"
        isPending={bulkAcceptMutation.isPending}
        pendingLabel={OPERATION_LABELS.updating}
        onCancel={() => setBulkApproveSelection(null)}
        onConfirm={() => {
          if (!bulkApproveSelection) return;
          bulkAcceptMutation.mutate(bulkApproveSelection.ids, {
            onSuccess: () => bulkApproveSelection.clear(),
          });
        }}
      />
    </PageContent>
  );
}
