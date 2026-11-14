'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateAgenceSchema,
  CreateZoneSchema,
  type VilleOptionDto,
} from '@zakaria/shared-contracts';
import { Building2, Download, Globe, MapPin, Plus, Power, PowerOff, X } from 'lucide-react';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface ZoneItemDto {
  id: number;
  nom: string;
  code: string;
  actif: boolean;
}

interface AgenceItemDto {
  id: number;
  nom: string;
  code: string;
  villeId: number | null;
  telephone: string | null;
  adresse: string | null;
  actif: boolean;
  ville: { id: number; nameFr: string } | null;
  responsable: { id: number; nomComplet: string; email: string } | null;
  agenceZones: Array<{
    zoneId: number;
    livraison: boolean;
    ramassage: boolean;
    zone: { id: number; nom: string; code: string };
  }>;
  _count: { membres: number; agencePartenaires: number };
}

type TerritoryTab = 'agences' | 'zones' | 'villes';

export default function AgencesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPlatformAdmin = Boolean(user.isSuperAdmin || user.accessContext?.isPlatformAdmin);

  const [tab, setTab] = useState<TerritoryTab>('agences');
  const [feedback, setFeedback] = useState<OperationMessage | null>(null);

  // Filtres contextuels Agences
  const [agenceQuery, setAgenceQuery] = useState('');
  const [agenceStatus, setAgenceStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [agenceZoneId, setAgenceZoneId] = useState('');

  // Filtres contextuels Zones
  const [zoneQuery, setZoneQuery] = useState('');
  const [zoneStatus, setZoneStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [zoneAgenceId, setZoneAgenceId] = useState('');

  // Filtres contextuels Villes
  const [villeQuery, setVilleQuery] = useState('');
  const [villeZoneId, setVilleZoneId] = useState('');
  const [villeCouverture, setVilleCouverture] = useState<'all' | 'couverte' | 'sans_zone'>('all');

  // Recherche instantanée dans la card tableau
  const [tableSearch, setTableSearch] = useState('');

  // Modale Agence
  const [agenceModalOpen, setAgenceModalOpen] = useState(false);
  const [agenceNom, setAgenceNom] = useState('');
  const [agenceCode, setAgenceCode] = useState('');
  const [agenceVilleId, setAgenceVilleId] = useState('');
  const [agenceTel, setAgenceTel] = useState('');
  const [agenceAdresse, setAgenceAdresse] = useState('');
  const [agenceFormErr, setAgenceFormErr] = useState<string | null>(null);

  // Modale Zone
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [zoneNom, setZoneNom] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneFormErr, setZoneFormErr] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAgenceModalOpen(false);
        setZoneModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const agencesQuery = useQuery({
    queryKey: ['agences'],
    queryFn: () => apiFetch<AgenceItemDto[]>('/agences'),
  });

  const zonesQuery = useQuery({
    queryKey: ['agences-zones'],
    queryFn: () => apiFetch<ZoneItemDto[]>('/agences/zones'),
  });

  const villesQuery = useQuery({
    queryKey: ['public-villes'],
    queryFn: () => apiFetch<{ villes: VilleOptionDto[] }>('/auth/villes'),
  });

  const agences = useMemo(() => agencesQuery.data ?? [], [agencesQuery.data]);
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const villes = useMemo(() => villesQuery.data?.villes ?? [], [villesQuery.data]);

  const zonesById = useMemo(() => {
    const map = new Map<number, ZoneItemDto>();
    for (const z of zones) map.set(z.id, z);
    return map;
  }, [zones]);

  const agencesByZoneId = useMemo(() => {
    const map = new Map<number, AgenceItemDto[]>();
    for (const a of agences) {
      for (const az of a.agenceZones) {
        const list = map.get(az.zoneId) ?? [];
        list.push(a);
        map.set(az.zoneId, list);
      }
    }
    return map;
  }, [agences]);

  const villesCountByZoneId = useMemo(() => {
    const map = new Map<number, number>();
    for (const v of villes) {
      if (v.zoneId) {
        map.set(v.zoneId, (map.get(v.zoneId) ?? 0) + 1);
      }
    }
    return map;
  }, [villes]);

  const filteredAgences = useMemo(() => {
    const q = agenceQuery.trim().toLowerCase();
    const tq = tableSearch.trim().toLowerCase();
    return agences.filter((a) => {
      if (agenceStatus === 'active' && !a.actif) return false;
      if (agenceStatus === 'inactive' && a.actif) return false;
      if (agenceZoneId && !a.agenceZones.some((az) => az.zoneId === Number(agenceZoneId))) {
        return false;
      }
      if (
        q &&
        !a.nom.toLowerCase().includes(q) &&
        !a.code.toLowerCase().includes(q) &&
        !(a.ville?.nameFr ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
      if (
        tq &&
        !a.nom.toLowerCase().includes(tq) &&
        !a.code.toLowerCase().includes(tq) &&
        !(a.ville?.nameFr ?? '').toLowerCase().includes(tq)
      ) {
        return false;
      }
      return true;
    });
  }, [agences, agenceQuery, agenceStatus, agenceZoneId, tableSearch]);

  const filteredZones = useMemo(() => {
    const q = zoneQuery.trim().toLowerCase();
    const tq = tableSearch.trim().toLowerCase();
    return zones.filter((z) => {
      if (zoneStatus === 'active' && !z.actif) return false;
      if (zoneStatus === 'inactive' && z.actif) return false;
      if (zoneAgenceId) {
        const linked = agencesByZoneId.get(z.id) ?? [];
        if (!linked.some((a) => a.id === Number(zoneAgenceId))) return false;
      }
      if (q && !z.nom.toLowerCase().includes(q) && !z.code.toLowerCase().includes(q)) return false;
      if (tq && !z.nom.toLowerCase().includes(tq) && !z.code.toLowerCase().includes(tq))
        return false;
      return true;
    });
  }, [zones, zoneQuery, zoneStatus, zoneAgenceId, agencesByZoneId, tableSearch]);

  const filteredVilles = useMemo(() => {
    const q = villeQuery.trim().toLowerCase();
    const tq = tableSearch.trim().toLowerCase();
    return villes.filter((v) => {
      if (villeZoneId && String(v.zoneId ?? '') !== villeZoneId) return false;
      if (villeCouverture === 'couverte' && !v.zoneId) return false;
      if (villeCouverture === 'sans_zone' && v.zoneId) return false;
      if (q && !v.nameFr.toLowerCase().includes(q) && !v.codeZone.toLowerCase().includes(q)) {
        return false;
      }
      if (tq && !v.nameFr.toLowerCase().includes(tq) && !v.codeZone.toLowerCase().includes(tq)) {
        return false;
      }
      return true;
    });
  }, [villes, villeQuery, villeZoneId, villeCouverture, tableSearch]);

  const createAgenceMutation = useMutation({
    mutationFn: () => {
      const parsed = CreateAgenceSchema.safeParse({
        nom: agenceNom.trim(),
        code: agenceCode.trim(),
        villeId: agenceVilleId ? Number(agenceVilleId) : undefined,
        telephone: agenceTel.trim() || undefined,
        adresse: agenceAdresse.trim() || undefined,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Données agence invalides.');
      }
      return apiFetch('/agences', { method: 'POST', body: parsed.data });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agences'] });
      setFeedback({ type: 'ok', text: `Agence « ${agenceNom} » créée.` });
      setAgenceModalOpen(false);
    },
    onError: (err) => {
      setAgenceFormErr(err instanceof Error ? err.message : 'Création agence impossible.');
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: () => {
      const parsed = CreateZoneSchema.safeParse({
        nom: zoneNom.trim(),
        code: zoneCode.trim(),
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Données zone invalides.');
      }
      return apiFetch('/agences/zones', { method: 'POST', body: parsed.data });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agences-zones'] });
      setFeedback({ type: 'ok', text: `Zone « ${zoneNom} » créée.` });
      setZoneModalOpen(false);
    },
    onError: (err) => {
      setZoneFormErr(err instanceof Error ? err.message : 'Création zone impossible.');
    },
  });

  const bulkAgenceStatusMutation = useMutation({
    mutationFn: ({ ids, actif }: { ids: number[]; actif: boolean }) =>
      apiFetch<{ message: string }>('/agences/bulk-status', {
        method: 'POST',
        body: { ids, actif },
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['agences'] });
      setFeedback({ type: 'ok', text: res.message });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Mise à jour groupée impossible.',
      });
    },
  });

  const bulkZoneStatusMutation = useMutation({
    mutationFn: ({ ids, actif }: { ids: number[]; actif: boolean }) =>
      apiFetch<{ message: string }>('/agences/zones/bulk-status', {
        method: 'POST',
        body: { ids, actif },
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['agences-zones'] });
      setFeedback({ type: 'ok', text: res.message });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Mise à jour groupée impossible.',
      });
    },
  });

  const tabs: PageTabItem<TerritoryTab>[] = [
    {
      key: 'agences',
      label: 'Agences',
      count: agences.length,
      icon: Building2,
    },
    {
      key: 'zones',
      label: 'Zones territoriales',
      count: zones.length,
      icon: MapPin,
    },
    {
      key: 'villes',
      label: 'Villes',
      count: villes.length,
      icon: Globe,
    },
  ];

  const agenceColumns: DataTableColumnDef<AgenceItemDto>[] = [
    {
      accessorKey: 'nom',
      header: 'Agence & Code',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1B9DD9]/10 text-[#1B9DD9] dark:bg-sky-950/70">
            <Building2 className="size-4.5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{row.original.nom}</p>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {row.original.code}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'ville',
      header: 'Ville & Contact',
      accessorFn: (r) => r.ville?.nameFr ?? '',
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="font-medium text-slate-800 dark:text-slate-200">
            {row.original.ville?.nameFr ?? 'Ville non renseignée'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {row.original.telephone || row.original.adresse || '—'}
          </p>
        </div>
      ),
    },
    {
      id: 'zones',
      header: 'Zones couvertes',
      accessorFn: (r) => r.agenceZones.map((az) => az.zone.code).join(', '),
      cell: ({ row }) => {
        const list = row.original.agenceZones;
        if (list.length === 0) return <span className="text-xs text-slate-400">Aucune zone</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {list.map((az) => (
              <Badge key={az.zoneId} variant="secondary" className="text-[11px]">
                {az.zone.nom} ({az.zone.code})
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: 'metrics',
      header: 'Membres / Partenaires',
      accessorFn: (r) => r._count.membres,
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-slate-600 dark:text-slate-300">
          {row.original._count.membres} membre(s) · {row.original._count.agencePartenaires}{' '}
          partenaire(s)
        </span>
      ),
    },
    {
      accessorKey: 'actif',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.actif ? 'active' : 'inactive'} />,
    },
  ];

  const zoneColumns: DataTableColumnDef<ZoneItemDto>[] = [
    {
      accessorKey: 'nom',
      header: 'Zone territoriale',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{row.original.nom}</p>
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Code : {row.original.code}
          </p>
        </div>
      ),
    },
    {
      id: 'agences',
      header: 'Agences rattachées',
      accessorFn: (r) => (agencesByZoneId.get(r.id) ?? []).map((a) => a.nom).join(', '),
      cell: ({ row }) => {
        const linked = agencesByZoneId.get(row.original.id) ?? [];
        if (linked.length === 0) {
          return <span className="text-xs text-slate-400">Aucune agence active</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {linked.map((a) => (
              <Badge key={a.id} variant="outline" className="text-[11px]">
                {a.nom}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: 'villesCount',
      header: 'Villes liées',
      accessorFn: (r) => villesCountByZoneId.get(r.id) ?? 0,
      cell: ({ row }) => (
        <span className="tabular-nums text-xs font-semibold">
          {villesCountByZoneId.get(row.original.id) ?? 0} ville(s)
        </span>
      ),
    },
    {
      accessorKey: 'actif',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.actif ? 'active' : 'inactive'} />,
    },
  ];

  const villeColumns: DataTableColumnDef<VilleOptionDto>[] = [
    {
      accessorKey: 'nameFr',
      header: 'Ville',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {row.original.nameFr}
        </span>
      ),
    },
    {
      accessorKey: 'codeZone',
      header: 'Code Zone',
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {row.original.codeZone || '—'}
        </Badge>
      ),
    },
    {
      id: 'zone',
      header: 'Zone territoriale',
      accessorFn: (r) => (r.zoneId ? (zonesById.get(r.zoneId)?.nom ?? `Zone #${r.zoneId}`) : ''),
      cell: ({ row }) => {
        const z = row.original.zoneId ? zonesById.get(row.original.zoneId) : null;
        return z ? (
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{z.nom}</span>
        ) : (
          <span className="text-xs text-slate-400">Non rattachée</span>
        );
      },
    },
    {
      id: 'couverture',
      header: 'Couverture',
      accessorFn: (r) => (r.zoneId ? 'Rattachée' : 'Hors zone'),
      cell: ({ row }) => <StatusBadge status={row.original.zoneId ? 'rattache' : 'hors_zone'} />,
    },
  ];

  const agenceBulkActions: DataTableBulkAction<AgenceItemDto>[] = [
    {
      key: 'activate',
      label: bulkAgenceStatusMutation.isPending ? OPERATION_LABELS.updating : 'Activer',
      icon: <Power className="size-3.5" />,
      disabled: bulkAgenceStatusMutation.isPending,
      onClick: (rows, clear) => {
        bulkAgenceStatusMutation.mutate(
          { ids: rows.map((r) => r.id), actif: true },
          { onSuccess: () => clear() },
        );
      },
    },
    {
      key: 'deactivate',
      label: bulkAgenceStatusMutation.isPending ? OPERATION_LABELS.updating : 'Désactiver',
      icon: <PowerOff className="size-3.5" />,
      disabled: bulkAgenceStatusMutation.isPending,
      onClick: (rows, clear) => {
        bulkAgenceStatusMutation.mutate(
          { ids: rows.map((r) => r.id), actif: false },
          { onSuccess: () => clear() },
        );
      },
    },
    {
      key: 'export',
      label: 'Exportation CSV',
      icon: <Download className="size-3.5" />,
      onClick: (rows) => {
        exportRowsToCsv(
          'g4d-agences-selection.csv',
          ['ID', 'Nom', 'Code', 'Ville', 'Zones', 'Membres', 'Statut'],
          rows.map((r) => [
            r.id,
            r.nom,
            r.code,
            r.ville?.nameFr ?? '',
            r.agenceZones.map((az) => az.zone.nom).join(' | '),
            r._count.membres,
            r.actif ? 'Active' : 'Inactive',
          ]),
        );
        setFeedback({ type: 'ok', text: `${rows.length} agence(s) exportée(s) en CSV.` });
      },
    },
  ];

  const zoneBulkActions: DataTableBulkAction<ZoneItemDto>[] = [];
  if (isPlatformAdmin) {
    zoneBulkActions.push(
      {
        key: 'activate',
        label: bulkZoneStatusMutation.isPending ? OPERATION_LABELS.updating : 'Activer',
        icon: <Power className="size-3.5" />,
        disabled: bulkZoneStatusMutation.isPending,
        onClick: (rows, clear) => {
          bulkZoneStatusMutation.mutate(
            { ids: rows.map((r) => r.id), actif: true },
            { onSuccess: () => clear() },
          );
        },
      },
      {
        key: 'deactivate',
        label: bulkZoneStatusMutation.isPending ? OPERATION_LABELS.updating : 'Désactiver',
        icon: <PowerOff className="size-3.5" />,
        disabled: bulkZoneStatusMutation.isPending,
        onClick: (rows, clear) => {
          bulkZoneStatusMutation.mutate(
            { ids: rows.map((r) => r.id), actif: false },
            { onSuccess: () => clear() },
          );
        },
      },
    );
  }
  zoneBulkActions.push({
    key: 'export',
    label: 'Exportation CSV',
    icon: <Download className="size-3.5" />,
    onClick: (rows) => {
      exportRowsToCsv(
        'g4d-zones-selection.csv',
        ['ID', 'Nom', 'Code', 'Villes', 'Statut'],
        rows.map((r) => [
          r.id,
          r.nom,
          r.code,
          villesCountByZoneId.get(r.id) ?? 0,
          r.actif ? 'Active' : 'Inactive',
        ]),
      );
      setFeedback({ type: 'ok', text: `${rows.length} zone(s) exportée(s) en CSV.` });
    },
  });

  const villeBulkActions: DataTableBulkAction<VilleOptionDto>[] = [
    {
      key: 'export',
      label: 'Exportation CSV',
      icon: <Download className="size-3.5" />,
      onClick: (rows) => {
        exportRowsToCsv(
          'g4d-villes-selection.csv',
          ['ID', 'Ville', 'Code Zone', 'Zone'],
          rows.map((r) => [
            r.id,
            r.nameFr,
            r.codeZone,
            r.zoneId ? (zonesById.get(r.zoneId)?.nom ?? '') : '',
          ]),
        );
        setFeedback({ type: 'ok', text: `${rows.length} ville(s) exportée(s) en CSV.` });
      },
    },
  ];

  const activeFiltersCount =
    tab === 'agences'
      ? (agenceQuery.trim() ? 1 : 0) + (agenceStatus !== 'all' ? 1 : 0) + (agenceZoneId ? 1 : 0)
      : tab === 'zones'
        ? (zoneQuery.trim() ? 1 : 0) + (zoneStatus !== 'all' ? 1 : 0) + (zoneAgenceId ? 1 : 0)
        : (villeQuery.trim() ? 1 : 0) + (villeZoneId ? 1 : 0) + (villeCouverture !== 'all' ? 1 : 0);

  const resetCurrentTabFilters = () => {
    setTableSearch('');
    if (tab === 'agences') {
      setAgenceQuery('');
      setAgenceStatus('all');
      setAgenceZoneId('');
    } else if (tab === 'zones') {
      setZoneQuery('');
      setZoneStatus('all');
      setZoneAgenceId('');
    } else {
      setVilleQuery('');
      setVilleZoneId('');
      setVilleCouverture('all');
    }
  };

  return (
    <PageContent>
      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* 1. Tabs Agences / Zones / Villes */}
      <PageTabs
        tabs={tabs}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setTableSearch('');
        }}
      />

      {/* 2. Card de filtrage adaptée à l'onglet */}
      {tab === 'agences' && (
        <FilterCard columns={3} activeCount={activeFiltersCount} onReset={resetCurrentTabFilters}>
          <FilterField label="Agence / Code / Ville" htmlFor="filter-agence-q">
            <Input
              id="filter-agence-q"
              value={agenceQuery}
              onChange={(e) => setAgenceQuery(e.target.value)}
              placeholder="Salé, Tanger, Casa..."
            />
          </FilterField>
          <FilterField label="Zone couverte" htmlFor="filter-agence-zone">
            <select
              id="filter-agence-zone"
              value={agenceZoneId}
              onChange={(e) => setAgenceZoneId(e.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nom} ({z.code})
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Statut" htmlFor="filter-agence-status">
            <select
              id="filter-agence-status"
              value={agenceStatus}
              onChange={(e) => setAgenceStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className={FILTER_SELECT_CLASS}
            >
              <option value="all">Toutes</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </FilterField>
        </FilterCard>
      )}

      {tab === 'zones' && (
        <FilterCard columns={3} activeCount={activeFiltersCount} onReset={resetCurrentTabFilters}>
          <FilterField label="Zone / Code" htmlFor="filter-zone-q">
            <Input
              id="filter-zone-q"
              value={zoneQuery}
              onChange={(e) => setZoneQuery(e.target.value)}
              placeholder="RABAT-SALE, CASABLANCA..."
            />
          </FilterField>
          <FilterField label="Agence rattachée" htmlFor="filter-zone-agence">
            <select
              id="filter-zone-agence"
              value={zoneAgenceId}
              onChange={(e) => setZoneAgenceId(e.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Toutes les agences</option>
              {agences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom} ({a.code})
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Statut" htmlFor="filter-zone-status">
            <select
              id="filter-zone-status"
              value={zoneStatus}
              onChange={(e) => setZoneStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className={FILTER_SELECT_CLASS}
            >
              <option value="all">Toutes</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </FilterField>
        </FilterCard>
      )}

      {tab === 'villes' && (
        <FilterCard columns={3} activeCount={activeFiltersCount} onReset={resetCurrentTabFilters}>
          <FilterField label="Ville / Code zone" htmlFor="filter-ville-q">
            <Input
              id="filter-ville-q"
              value={villeQuery}
              onChange={(e) => setVilleQuery(e.target.value)}
              placeholder="Salé, Kénitra, Rabat..."
            />
          </FilterField>
          <FilterField label="Zone territoriale" htmlFor="filter-ville-zone">
            <select
              id="filter-ville-zone"
              value={villeZoneId}
              onChange={(e) => setVilleZoneId(e.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nom} ({z.code})
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Couverture" htmlFor="filter-ville-couv">
            <select
              id="filter-ville-couv"
              value={villeCouverture}
              onChange={(e) =>
                setVilleCouverture(e.target.value as 'all' | 'couverte' | 'sans_zone')
              }
              className={FILTER_SELECT_CLASS}
            >
              <option value="all">Toutes</option>
              <option value="couverte">Rattachées à une zone</option>
              <option value="sans_zone">Sans zone</option>
            </select>
          </FilterField>
        </FilterCard>
      )}

      {/* 3 & 4. DataTable unifiée selon l'onglet actif */}
      {tab === 'agences' && (
        <DataTable
          data={filteredAgences}
          columns={agenceColumns}
          searchValue={tableSearch}
          onSearchChange={setTableSearch}
          searchPlaceholder="Rechercher une agence..."
          isLoading={agencesQuery.isLoading}
          isRefreshing={agencesQuery.isFetching && !agencesQuery.isLoading}
          enableSelection
          bulkActions={agenceBulkActions}
          emptyMessage="Aucune agence trouvée."
          toolbarActions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filteredAgences.length === 0}
                onClick={() => {
                  exportRowsToCsv(
                    'g4d-agences.csv',
                    ['ID', 'Nom', 'Code', 'Ville', 'Zones', 'Membres', 'Statut'],
                    filteredAgences.map((r) => [
                      r.id,
                      r.nom,
                      r.code,
                      r.ville?.nameFr ?? '',
                      r.agenceZones.map((az) => az.zone.nom).join(' | '),
                      r._count.membres,
                      r.actif ? 'Active' : 'Inactive',
                    ]),
                  );
                  setFeedback({
                    type: 'ok',
                    text: `${filteredAgences.length} agence(s) exportée(s) en CSV.`,
                  });
                }}
              >
                <Download className="size-3.5" />
                Exportation CSV
              </Button>
              {isPlatformAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setAgenceNom('');
                    setAgenceCode('');
                    setAgenceVilleId('');
                    setAgenceTel('');
                    setAgenceAdresse('');
                    setAgenceFormErr(null);
                    setAgenceModalOpen(true);
                  }}
                >
                  <Plus className="size-3.5" />
                  Nouvelle agence
                </Button>
              )}
            </>
          }
        />
      )}

      {tab === 'zones' && (
        <DataTable
          data={filteredZones}
          columns={zoneColumns}
          searchValue={tableSearch}
          onSearchChange={setTableSearch}
          searchPlaceholder="Rechercher une zone territoriale..."
          isLoading={zonesQuery.isLoading}
          isRefreshing={zonesQuery.isFetching && !zonesQuery.isLoading}
          enableSelection
          bulkActions={zoneBulkActions}
          emptyMessage="Aucune zone territoriale trouvée."
          toolbarActions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filteredZones.length === 0}
                onClick={() => {
                  exportRowsToCsv(
                    'g4d-zones.csv',
                    ['ID', 'Nom', 'Code', 'Villes', 'Statut'],
                    filteredZones.map((r) => [
                      r.id,
                      r.nom,
                      r.code,
                      villesCountByZoneId.get(r.id) ?? 0,
                      r.actif ? 'Active' : 'Inactive',
                    ]),
                  );
                  setFeedback({
                    type: 'ok',
                    text: `${filteredZones.length} zone(s) exportée(s) en CSV.`,
                  });
                }}
              >
                <Download className="size-3.5" />
                Exportation CSV
              </Button>
              {isPlatformAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setZoneNom('');
                    setZoneCode('');
                    setZoneFormErr(null);
                    setZoneModalOpen(true);
                  }}
                >
                  <Plus className="size-3.5" />
                  Nouvelle zone
                </Button>
              )}
            </>
          }
        />
      )}

      {tab === 'villes' && (
        <DataTable
          data={filteredVilles}
          columns={villeColumns}
          searchValue={tableSearch}
          onSearchChange={setTableSearch}
          searchPlaceholder="Rechercher une ville ou un code zone..."
          isLoading={villesQuery.isLoading}
          isRefreshing={villesQuery.isFetching && !villesQuery.isLoading}
          enableSelection
          bulkActions={villeBulkActions}
          emptyMessage="Aucune ville trouvée."
          toolbarActions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredVilles.length === 0}
              onClick={() => {
                exportRowsToCsv(
                  'g4d-villes.csv',
                  ['ID', 'Ville', 'Code Zone', 'Zone'],
                  filteredVilles.map((r) => [
                    r.id,
                    r.nameFr,
                    r.codeZone,
                    r.zoneId ? (zonesById.get(r.zoneId)?.nom ?? '') : '',
                  ]),
                );
                setFeedback({
                  type: 'ok',
                  text: `${filteredVilles.length} ville(s) exportée(s) en CSV.`,
                });
              }}
            >
              <Download className="size-3.5" />
              Exportation CSV
            </Button>
          }
        />
      )}

      {/* Modale Création Agence */}
      {agenceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !createAgenceMutation.isPending) {
              setAgenceModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Nouvelle agence physique
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setAgenceModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="size-4" />
              </button>
            </div>

            {agenceFormErr && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {agenceFormErr}
              </div>
            )}

            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setAgenceFormErr(null);
                createAgenceMutation.mutate();
              }}
              className="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-agence-nom">Nom de l’agence</Label>
                  <Input
                    id="new-agence-nom"
                    required
                    value={agenceNom}
                    onChange={(e) => setAgenceNom(e.target.value)}
                    placeholder="Ex: Agence Tanger"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-agence-code">Code agence</Label>
                  <Input
                    id="new-agence-code"
                    required
                    value={agenceCode}
                    onChange={(e) => setAgenceCode(e.target.value.toUpperCase())}
                    placeholder="TANGER"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-agence-ville">Ville siège</Label>
                  <select
                    id="new-agence-ville"
                    value={agenceVilleId}
                    onChange={(e) => setAgenceVilleId(e.target.value)}
                    className={FILTER_SELECT_CLASS}
                  >
                    <option value="">Non précisée</option>
                    {villes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nameFr}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-agence-tel">Téléphone</Label>
                  <Input
                    id="new-agence-tel"
                    value={agenceTel}
                    onChange={(e) => setAgenceTel(e.target.value)}
                    placeholder="0537..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-agence-addr">Adresse</Label>
                <Input
                  id="new-agence-addr"
                  value={agenceAdresse}
                  onChange={(e) => setAgenceAdresse(e.target.value)}
                  placeholder="Adresse du centre de tri / agence"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={createAgenceMutation.isPending}
                  onClick={() => setAgenceModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createAgenceMutation.isPending}>
                  {createAgenceMutation.isPending ? OPERATION_LABELS.saving : 'Créer l’agence'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Création Zone */}
      {zoneModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !createZoneMutation.isPending) {
              setZoneModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Nouvelle zone territoriale
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setZoneModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="size-4" />
              </button>
            </div>

            {zoneFormErr && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {zoneFormErr}
              </div>
            )}

            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setZoneFormErr(null);
                createZoneMutation.mutate();
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-zone-nom">Nom de la zone</Label>
                <Input
                  id="new-zone-nom"
                  required
                  value={zoneNom}
                  onChange={(e) => setZoneNom(e.target.value)}
                  placeholder="Ex: Grand Rabat"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-zone-code">Code zone</Label>
                <Input
                  id="new-zone-code"
                  required
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value.toUpperCase())}
                  placeholder="RABAT"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={createZoneMutation.isPending}
                  onClick={() => setZoneModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createZoneMutation.isPending}>
                  {createZoneMutation.isPending ? OPERATION_LABELS.saving : 'Créer la zone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContent>
  );
}
