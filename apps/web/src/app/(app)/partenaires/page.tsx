'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreatePartenaireSchema } from '@zakaria/shared-contracts';
import { Copy, Download, KeyRound, Plus, Power, PowerOff, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface PartenaireRow {
  id: number;
  code: string;
  raisonSociale: string;
  ice: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  agencePartenaires?: Array<{
    id: number;
    actif: boolean;
    agence: { id: number; code: string; nom: string };
    partenaireZones?: Array<{
      id: number;
      actif: boolean;
      zone: { id: number; code: string; nom: string };
    }>;
  }>;
  coursiers: Array<{ id: number; nom: string; actif?: boolean }>;
  apiIdentifiants: Array<{ id: number; libelle: string; clePublique: string; actif?: boolean }>;
}

type PartenaireTab = 'tous' | 'actifs' | 'inactifs';

export default function PartenairesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPlatformAdmin = Boolean(user.accessContext?.isPlatformAdmin || user.isSuperAdmin);

  const [tab, setTab] = useState<PartenaireTab>('tous');
  const [textFilter, setTextFilter] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('');
  const [apiKeyFilter, setApiKeyFilter] = useState<'all' | 'with_key' | 'without_key'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [feedback, setFeedback] = useState<OperationMessage | null>(null);

  const [issuedSecret, setIssuedSecret] = useState<{
    partenaireCode: string;
    clePublique: string;
    secretClairUnique: string;
  } | null>(null);

  // Modale création partenaire
  const [modalOpen, setModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formRaisonSociale, setFormRaisonSociale] = useState('');
  const [formIce, setFormIce] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStatut = params.get('statut');
    const urlQ = params.get('q');
    const urlAgence = params.get('agence');
    const urlApiKey = params.get('apiKey');
    if (urlStatut === 'actifs' || urlStatut === 'inactifs') setTab(urlStatut);
    if (urlQ) setTextFilter(urlQ);
    if (urlAgence) setAgenceFilter(urlAgence);
    if (urlApiKey === 'with_key' || urlApiKey === 'without_key') setApiKeyFilter(urlApiKey);
  }, []);

  const syncUrlParams = (
    nextTab: PartenaireTab,
    nextQ: string,
    nextAgence: string,
    nextApiKey: 'all' | 'with_key' | 'without_key',
  ) => {
    const url = new URL(window.location.href);
    if (nextTab === 'tous') url.searchParams.delete('statut');
    else url.searchParams.set('statut', nextTab);
    if (nextQ.trim()) url.searchParams.set('q', nextQ.trim());
    else url.searchParams.delete('q');
    if (nextAgence) url.searchParams.set('agence', nextAgence);
    else url.searchParams.delete('agence');
    if (nextApiKey === 'all') url.searchParams.delete('apiKey');
    else url.searchParams.set('apiKey', nextApiKey);
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

  const partenairesQuery = useQuery({
    queryKey: ['partenaires'],
    queryFn: () => apiFetch<PartenaireRow[]>('/partenaires'),
  });

  const createPartenaireMutation = useMutation({
    mutationFn: () =>
      apiFetch('/partenaires', {
        method: 'POST',
        body: CreatePartenaireSchema.parse({
          code: formCode,
          raisonSociale: formRaisonSociale,
          ice: formIce.trim() || null,
          telephone: formTelephone.trim() || null,
          email: formEmail.trim() || null,
          actif: true,
        }),
      }),
    onSuccess: () => {
      setFormCode('');
      setFormRaisonSociale('');
      setFormIce('');
      setFormTelephone('');
      setFormEmail('');
      setFormError(null);
      setModalOpen(false);
      setFeedback({ type: 'ok', text: 'Partenaire B2B créé avec succès.' });
      void queryClient.invalidateQueries({ queryKey: ['partenaires'] });
    },
    onError: (err) =>
      setFormError(
        err instanceof Error ? err.message : 'Erreur lors de la création du partenaire.',
      ),
  });

  const issueKeyMutation = useMutation({
    mutationFn: (partenaire: PartenaireRow) =>
      apiFetch<{ clePublique: string; secretClairUnique: string }>('/partenaires/api-keys', {
        method: 'POST',
        body: {
          libelle: `Clé B2B ${partenaire.code}`,
          partenaireId: partenaire.id,
        },
      }).then((res) => ({ ...res, partenaireCode: partenaire.code })),
    onSuccess: (res) => {
      setIssuedSecret({
        partenaireCode: res.partenaireCode,
        clePublique: res.clePublique,
        secretClairUnique: res.secretClairUnique,
      });
      setFeedback({
        type: 'ok',
        text: `Clé API générée pour ${res.partenaireCode}. Copiez le secret affiché ci-dessous.`,
      });
      void queryClient.invalidateQueries({ queryKey: ['partenaires'] });
    },
    onError: (err) =>
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la génération de la clé API.',
      }),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, actif }: { ids: number[]; actif: boolean }) =>
      apiFetch<{ message: string }>('/partenaires/bulk-status', {
        method: 'POST',
        body: { ids, actif },
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['partenaires'] });
    },
    onError: (err) =>
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Mise à jour groupée impossible.',
      }),
  });

  const allRows = useMemo(() => partenairesQuery.data ?? [], [partenairesQuery.data]);

  const counts = useMemo(() => {
    const total = allRows.length;
    const actifs = allRows.filter((p) => p.actif).length;
    return { total, actifs, inactifs: total - actifs };
  }, [allRows]);

  const agenceOptions = useMemo(() => {
    const map = new Map<number, { id: number; code: string; nom: string }>();
    for (const p of allRows) {
      for (const ap of p.agencePartenaires ?? []) {
        map.set(ap.agence.id, ap.agence);
      }
    }
    return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    return allRows.filter((row) => {
      if (tab === 'actifs' && !row.actif) return false;
      if (tab === 'inactifs' && row.actif) return false;
      if (agenceFilter) {
        const hasAgence = (row.agencePartenaires ?? []).some(
          (ap) => String(ap.agence.id) === agenceFilter,
        );
        if (!hasAgence) return false;
      }
      if (apiKeyFilter === 'with_key' && row.apiIdentifiants.length === 0) return false;
      if (apiKeyFilter === 'without_key' && row.apiIdentifiants.length > 0) return false;
      if (q) {
        const hay =
          `${row.raisonSociale} ${row.code} ${row.ice ?? ''} ${row.email ?? ''} ${row.telephone ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allRows, tab, textFilter, agenceFilter, apiKeyFilter]);

  const activeFiltersCount =
    (tab !== 'tous' ? 1 : 0) +
    (textFilter.trim() ? 1 : 0) +
    (agenceFilter ? 1 : 0) +
    (apiKeyFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setTab('tous');
    setTextFilter('');
    setAgenceFilter('');
    setApiKeyFilter('all');
    setTableSearch('');
    syncUrlParams('tous', '', '', 'all');
  };

  const handleTabChange = (next: PartenaireTab) => {
    setTab(next);
    syncUrlParams(next, textFilter, agenceFilter, apiKeyFilter);
  };

  const handleExportCsv = (rows: PartenaireRow[]) => {
    exportRowsToCsv(
      'partenaires-b2b',
      ['Code', 'Raison sociale', 'ICE', 'Téléphone', 'E-mail', 'Coursiers', 'Clés API', 'Statut'],
      rows.map((p) => [
        p.code,
        p.raisonSociale,
        p.ice ?? '',
        p.telephone ?? '',
        p.email ?? '',
        p.coursiers.length,
        p.apiIdentifiants.length,
        p.actif ? 'Actif' : 'Inactif',
      ]),
    );
    setFeedback({
      type: 'ok',
      text: `Export CSV généré (${rows.length} partenaire${rows.length > 1 ? 's' : ''}).`,
    });
  };

  const tabs: PageTabItem<PartenaireTab>[] = [
    {
      key: 'tous',
      label: 'Tous',
      count: counts.total,
      icon: 'solar:hand-shake-bold-duotone',
    },
    {
      key: 'actifs',
      label: 'Actifs',
      count: counts.actifs,
      icon: 'solar:check-circle-bold-duotone',
    },
    {
      key: 'inactifs',
      label: 'Inactifs',
      count: counts.inactifs,
      icon: 'solar:close-circle-bold-duotone',
    },
  ];

  const columns: DataTableColumnDef<PartenaireRow>[] = [
    {
      accessorKey: 'raisonSociale',
      header: 'Partenaire & Code',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {p.raisonSociale}
              </span>
              <Badge variant="warning" className="font-mono text-[11px]">
                {p.code}
              </Badge>
            </div>
            {p.ice && (
              <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                ICE : {p.ice}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'contact',
      header: 'Coordonnées',
      accessorFn: (row) => `${row.email ?? ''} ${row.telephone ?? ''}`,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium">{p.email || '—'}</p>
            <p className="tabular-nums text-slate-500 dark:text-slate-400">{p.telephone || '—'}</p>
          </div>
        );
      },
    },
    {
      id: 'agencesZones',
      header: 'Agences & Zones',
      accessorFn: (row) => (row.agencePartenaires ?? []).map((ap) => ap.agence.nom).join(', '),
      cell: ({ row }) => {
        const aps = row.original.agencePartenaires ?? [];
        const zonesCount = aps.reduce((acc, ap) => acc + (ap.partenaireZones?.length ?? 0), 0);
        if (aps.length === 0) {
          return <span className="text-xs text-slate-400">Aucune agence liée</span>;
        }
        return (
          <div className="flex flex-wrap items-center gap-1">
            {aps.slice(0, 2).map((ap) => (
              <Badge key={ap.id} variant="secondary" className="text-[11px]">
                {ap.agence.code}
              </Badge>
            ))}
            {aps.length > 2 && (
              <Badge variant="outline" className="text-[11px]">
                +{aps.length - 2}
              </Badge>
            )}
            <span className="ml-1 text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
              ({zonesCount} zone{zonesCount > 1 ? 's' : ''})
            </span>
          </div>
        );
      },
    },
    {
      id: 'coursiers',
      header: 'Coursiers',
      accessorFn: (row) => row.coursiers.length,
      cell: ({ row }) => (
        <span className="tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.coursiers.length}
        </span>
      ),
    },
    {
      id: 'keys',
      header: 'Clés API',
      accessorFn: (row) => row.apiIdentifiants.length,
      cell: ({ row }) => {
        const keys = row.original.apiIdentifiants;
        if (keys.length === 0) {
          return <span className="text-xs text-slate-400">Aucune</span>;
        }
        return (
          <div className="space-y-0.5">
            <Badge variant="default" className="tabular-nums text-[11px]">
              {keys.length} active{keys.length > 1 ? 's' : ''}
            </Badge>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
              {keys[0]?.clePublique}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'actif',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.actif ? 'actif' : 'inactif'} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs"
          disabled={issueKeyMutation.isPending}
          onClick={() => issueKeyMutation.mutate(row.original)}
        >
          <KeyRound className="size-3.5 text-[#1B9DD9]" />
          {issueKeyMutation.isPending ? OPERATION_LABELS.saving : 'Émettre clé API'}
        </Button>
      ),
    },
  ];

  const bulkActions: DataTableBulkAction<PartenaireRow>[] = [];
  if (isPlatformAdmin) {
    bulkActions.push(
      {
        key: 'activate',
        label: bulkStatusMutation.isPending ? OPERATION_LABELS.updating : 'Activer',
        icon: <Power className="size-3.5" />,
        variant: 'outline',
        disabled: bulkStatusMutation.isPending,
        onClick: (rows, clear) => {
          bulkStatusMutation.mutate(
            { ids: rows.map((r) => r.id), actif: true },
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
            { ids: rows.map((r) => r.id), actif: false },
            { onSuccess: () => clear() },
          );
        },
      },
    );
  }
  bulkActions.push({
    key: 'export',
    label: 'Exporter CSV',
    icon: <Download className="size-3.5" />,
    variant: 'outline',
    onClick: (rows) => handleExportCsv(rows),
  });

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = CreatePartenaireSchema.safeParse({
      code: formCode,
      raisonSociale: formRaisonSociale,
      ice: formIce.trim() || null,
      telephone: formTelephone.trim() || null,
      email: formEmail.trim() || null,
      actif: true,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Formulaire invalide.');
      return;
    }
    setFormError(null);
    createPartenaireMutation.mutate();
  };

  return (
    <PageContent>
      <PageTabs tabs={tabs} value={tab} onChange={handleTabChange} />

      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {issuedSecret && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-2xs dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">
                Clé API générée ({issuedSecret.partenaireCode}) — copiez le secret maintenant
                (affiché une seule fois) :
              </p>
              <p className="mt-2 font-mono text-xs">Clé publique : {issuedSecret.clePublique}</p>
              <p className="mt-1 font-mono text-xs break-all">
                Secret HMAC : {issuedSecret.secretClairUnique}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  void navigator.clipboard?.writeText(issuedSecret.secretClairUnique);
                  setFeedback({ type: 'ok', text: 'Secret HMAC copié dans le presse-papiers.' });
                }}
              >
                <Copy className="size-3" />
                Copier
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setIssuedSecret(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      <FilterCard activeCount={activeFiltersCount} onReset={resetFilters} columns={4}>
        <FilterField label="Raison sociale / Code / ICE" htmlFor="part-filter-q">
          <Input
            id="part-filter-q"
            value={textFilter}
            onChange={(e) => {
              const v = e.target.value;
              setTextFilter(v);
              syncUrlParams(tab, v, agenceFilter, apiKeyFilter);
            }}
            placeholder="Colivraison, COLIV, ICE..."
            className="h-9"
          />
        </FilterField>

        <FilterField label="Agence rattachée" htmlFor="part-filter-agence">
          <select
            id="part-filter-agence"
            value={agenceFilter}
            onChange={(e) => {
              const v = e.target.value;
              setAgenceFilter(v);
              syncUrlParams(tab, textFilter, v, apiKeyFilter);
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

        <FilterField label="Clés API B2B" htmlFor="part-filter-keys">
          <select
            id="part-filter-keys"
            value={apiKeyFilter}
            onChange={(e) => {
              const v = e.target.value as 'all' | 'with_key' | 'without_key';
              setApiKeyFilter(v);
              syncUrlParams(tab, textFilter, agenceFilter, v);
            }}
            className={FILTER_SELECT_CLASS}
          >
            <option value="all">Tous</option>
            <option value="with_key">Avec clé active</option>
            <option value="without_key">Sans clé API</option>
          </select>
        </FilterField>

        <FilterField label="Statut" htmlFor="part-filter-statut">
          <select
            id="part-filter-statut"
            value={tab}
            onChange={(e) => handleTabChange(e.target.value as PartenaireTab)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="tous">Tous</option>
            <option value="actifs">Actifs</option>
            <option value="inactifs">Inactifs</option>
          </select>
        </FilterField>
      </FilterCard>

      <DataTable
        data={filteredRows}
        columns={columns}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Rechercher un partenaire par code, raison sociale, ICE ou e-mail..."
        isLoading={partenairesQuery.isLoading}
        isRefreshing={partenairesQuery.isFetching && !partenairesQuery.isLoading}
        enableSelection
        bulkActions={bulkActions}
        emptyMessage="Aucun partenaire B2B trouvé."
        emptyDescription="Ajustez vos filtres ou déclarez un nouveau partenaire."
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={() => handleExportCsv(filteredRows)}
            >
              <Download className="size-3.5" />
              Exporter CSV
            </Button>
            {isPlatformAdmin && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setFormError(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="size-3.5" />
                Nouveau partenaire
              </Button>
            )}
          </>
        }
      />

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !createPartenaireMutation.isPending) {
              setModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="partenaire-modal-title"
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2
                id="partenaire-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Nouveau partenaire B2B
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
                  <Label htmlFor="m-part-code">Code *</Label>
                  <Input
                    id="m-part-code"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="COLIV"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-part-ice">ICE</Label>
                  <Input
                    id="m-part-ice"
                    value={formIce}
                    onChange={(e) => setFormIce(e.target.value)}
                    placeholder="001234567000089"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="m-part-rs">Raison sociale *</Label>
                <Input
                  id="m-part-rs"
                  value={formRaisonSociale}
                  onChange={(e) => setFormRaisonSociale(e.target.value)}
                  placeholder="Colivraison Express SARL"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="m-part-email">E-mail</Label>
                  <Input
                    id="m-part-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ops@partenaire.ma"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-part-tel">Téléphone</Label>
                  <Input
                    id="m-part-tel"
                    value={formTelephone}
                    onChange={(e) => setFormTelephone(e.target.value)}
                    placeholder="0522000000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={createPartenaireMutation.isPending}
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={createPartenaireMutation.isPending}>
                  {createPartenaireMutation.isPending
                    ? OPERATION_LABELS.saving
                    : 'Créer le partenaire'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContent>
  );
}
