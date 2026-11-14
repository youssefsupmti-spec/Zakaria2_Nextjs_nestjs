'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActiveSessionItemDto } from '@zakaria/shared-contracts';
import {
  BadgeCheck,
  Download,
  Laptop,
  LogOut,
  MonitorSmartphone,
  Smartphone,
  Trash2,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatDateTimeFr, parseUserAgent } from '@/components/profile/profile-types';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { apiFetch } from '@/lib/api-client';

type SessionTab = 'toutes' | 'courante' | 'autres';
type DeviceTypeFilter = 'all' | 'desktop' | 'mobile' | 'tablet';

export default function ActiveSessionsPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<SessionTab>('toutes');
  const [uaFilter, setUaFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<DeviceTypeFilter>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [feedback, setFeedback] = useState<OperationMessage | null>(null);

  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);
  const [bulkRevokeSelection, setBulkRevokeSelection] = useState<{
    sessions: ActiveSessionItemDto[];
    clear: () => void;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    const urlUa = params.get('ua');
    const urlIp = params.get('ip');
    const urlDevice = params.get('device');
    if (urlTab === 'courante' || urlTab === 'autres') setTab(urlTab);
    if (urlUa) setUaFilter(urlUa);
    if (urlIp) setIpFilter(urlIp);
    if (urlDevice === 'desktop' || urlDevice === 'mobile' || urlDevice === 'tablet') {
      setDeviceFilter(urlDevice);
    }
  }, []);

  const syncUrlParams = (
    nextTab: SessionTab,
    nextUa: string,
    nextIp: string,
    nextDevice: DeviceTypeFilter,
  ) => {
    const url = new URL(window.location.href);
    if (nextTab === 'toutes') url.searchParams.delete('tab');
    else url.searchParams.set('tab', nextTab);
    if (nextUa.trim()) url.searchParams.set('ua', nextUa.trim());
    else url.searchParams.delete('ua');
    if (nextIp.trim()) url.searchParams.set('ip', nextIp.trim());
    else url.searchParams.delete('ip');
    if (nextDevice === 'all') url.searchParams.delete('device');
    else url.searchParams.set('device', nextDevice);
    window.history.replaceState({}, '', url.toString());
  };

  const sessionsQuery = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => apiFetch<{ sessions: ActiveSessionItemDto[] }>('/auth/sessions'),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch(`/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),
    onSuccess: () => {
      setFeedback({ type: 'ok', text: 'Session révoquée avec succès.' });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la révocation.',
      });
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean; message: string }>('/auth/sessions/revoke-others', {
        method: 'POST',
      }),
    onSuccess: (res) => {
      setConfirmRevokeOthers(false);
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: (err) => {
      setConfirmRevokeOthers(false);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la déconnexion globale.',
      });
    },
  });

  const bulkRevokeMutation = useMutation({
    mutationFn: async (sessions: ActiveSessionItemDto[]) => {
      const results = await Promise.allSettled(
        sessions.map((s) =>
          apiFetch(`/auth/sessions/${encodeURIComponent(s.id)}`, { method: 'DELETE' }),
        ),
      );
      const okCount = results.filter((r) => r.status === 'fulfilled').length;
      const errCount = results.length - okCount;
      return { okCount, errCount };
    },
    onSuccess: (res) => {
      setBulkRevokeSelection(null);
      setFeedback({
        type: res.okCount === 0 && res.errCount > 0 ? 'err' : 'ok',
        text:
          res.errCount > 0
            ? `${res.okCount} session(s) révoquée(s), ${res.errCount} erreur(s).`
            : `${res.okCount} session(s) révoquée(s) avec succès.`,
      });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: (err) => {
      setBulkRevokeSelection(null);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Révocation groupée impossible.',
      });
    },
  });

  const allSessions = useMemo(
    () => sessionsQuery.data?.sessions ?? [],
    [sessionsQuery.data?.sessions],
  );

  const counts = useMemo(() => {
    const total = allSessions.length;
    const courante = allSessions.filter((s) => s.isCurrent).length;
    const autres = total - courante;
    return { total, courante, autres };
  }, [allSessions]);

  const filteredSessions = useMemo(() => {
    const qUa = uaFilter.trim().toLowerCase();
    const qIp = ipFilter.trim().toLowerCase();
    return allSessions.filter((sess) => {
      if (tab === 'courante' && !sess.isCurrent) return false;
      if (tab === 'autres' && sess.isCurrent) return false;
      const parsed = parseUserAgent(sess.userAgent);
      if (deviceFilter !== 'all' && parsed.deviceType !== deviceFilter) return false;
      if (qUa) {
        const hay =
          `${parsed.label} ${parsed.browser} ${parsed.os} ${sess.userAgent ?? ''}`.toLowerCase();
        if (!hay.includes(qUa)) return false;
      }
      if (qIp && !(sess.ipAddress ?? '').toLowerCase().includes(qIp)) return false;
      return true;
    });
  }, [allSessions, tab, uaFilter, ipFilter, deviceFilter]);

  const activeFiltersCount =
    (tab !== 'toutes' ? 1 : 0) +
    (uaFilter.trim() ? 1 : 0) +
    (ipFilter.trim() ? 1 : 0) +
    (deviceFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setTab('toutes');
    setUaFilter('');
    setIpFilter('');
    setDeviceFilter('all');
    setTableSearch('');
    syncUrlParams('toutes', '', '', 'all');
  };

  const handleTabChange = (next: SessionTab) => {
    setTab(next);
    syncUrlParams(next, uaFilter, ipFilter, deviceFilter);
  };

  const handleExportCsv = (rows: ActiveSessionItemDto[]) => {
    exportRowsToCsv(
      'sessions-actives-g4d',
      ['Appareil', 'Adresse IP', 'Durée', 'Connexion', 'Dernière activité', 'Expiration', 'Type'],
      rows.map((s) => {
        const parsed = parseUserAgent(s.userAgent);
        return [
          parsed.label,
          s.ipAddress || 'Inconnue',
          s.durationCode,
          formatDateTimeFr(s.createdAt),
          formatDateTimeFr(s.lastActiveAt),
          formatDateTimeFr(s.expiresAt),
          s.isCurrent ? 'Cet appareil' : 'Autre appareil',
        ];
      }),
    );
    setFeedback({
      type: 'ok',
      text: `Export CSV généré (${rows.length} session${rows.length > 1 ? 's' : ''}).`,
    });
  };

  const tabs: PageTabItem<SessionTab>[] = [
    {
      key: 'toutes',
      label: 'Toutes',
      count: counts.total,
      icon: MonitorSmartphone,
    },
    {
      key: 'courante',
      label: 'Cet appareil',
      count: counts.courante,
      icon: BadgeCheck,
    },
    {
      key: 'autres',
      label: 'Autres appareils',
      count: counts.autres,
      icon: Laptop,
    },
  ];

  const columns: DataTableColumnDef<ActiveSessionItemDto>[] = [
    {
      id: 'device',
      header: 'Appareil & Navigateur',
      accessorFn: (row) => parseUserAgent(row.userAgent).label,
      cell: ({ row }) => {
        const s = row.original;
        const parsed = parseUserAgent(s.userAgent);
        const DeviceIcon = parsed.deviceType === 'mobile' ? Smartphone : Laptop;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                s.isCurrent
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <DeviceIcon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{parsed.label}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {parsed.browser} · {parsed.os}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'ipAddress',
      header: 'Adresse IP & Durée',
      accessorFn: (row) => `${row.ipAddress ?? ''} ${row.durationCode}`,
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="space-y-0.5 text-xs">
            <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
              {s.ipAddress || 'Inconnue'}
            </p>
            <Badge variant="outline" className="text-[10px]">
              Durée : {s.durationCode}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Connexion',
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-slate-700 dark:text-slate-300">
          {formatDateTimeFr(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'lastActiveAt',
      header: 'Dernière activité',
      cell: ({ row }) => (
        <span className="tabular-nums text-xs font-medium text-slate-800 dark:text-slate-200">
          {formatDateTimeFr(row.original.lastActiveAt)}
        </span>
      ),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expiration',
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-slate-500 dark:text-slate-400">
          {formatDateTimeFr(row.original.expiresAt)}
        </span>
      ),
    },
    {
      accessorKey: 'isCurrent',
      header: 'Statut',
      cell: ({ row }) =>
        row.original.isCurrent ? (
          <StatusBadge status="rattache" label="Cet appareil" />
        ) : (
          <StatusBadge status="active" label="Active" />
        ),
    },
    {
      id: 'actions',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original;
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            disabled={s.isCurrent || revokeMutation.isPending}
            title={
              s.isCurrent
                ? 'Utilisez Déconnexion pour fermer votre session actuelle.'
                : 'Révoquer cette session à distance'
            }
            onClick={() => revokeMutation.mutate(s.id)}
          >
            <Trash2 className="size-3" />
            {s.isCurrent ? 'Actuel' : 'Révoquer'}
          </Button>
        );
      },
    },
  ];

  const bulkActions: DataTableBulkAction<ActiveSessionItemDto>[] = [
    {
      key: 'revoke-selected',
      label: bulkRevokeMutation.isPending ? OPERATION_LABELS.deleting : 'Révoquer la sélection',
      icon: <Trash2 className="size-3.5" />,
      variant: 'destructive',
      disabled: bulkRevokeMutation.isPending,
      onClick: (rows, clear) => {
        const revocable = rows.filter((r) => !r.isCurrent);
        if (revocable.length === 0) {
          setFeedback({
            type: 'err',
            text: 'Aucune autre session révocable dans votre sélection.',
          });
          return;
        }
        setBulkRevokeSelection({ sessions: revocable, clear });
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

  return (
    <PageContent>
      <PageTabs
        tabs={tabs}
        value={tab}
        onChange={handleTabChange}
        rightSlot={
          <Link
            href="/profil?tab=sessions"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <UserCheck className="size-4 text-[#1B9DD9]" />
            Mon Profil &amp; Sécurité
          </Link>
        }
      />

      <OperationFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {sessionsQuery.error && (
        <OperationFeedbackBanner
          feedback={{
            type: 'err',
            text:
              sessionsQuery.error instanceof Error
                ? sessionsQuery.error.message
                : 'Erreur de chargement des sessions.',
          }}
        />
      )}

      <FilterCard activeCount={activeFiltersCount} onReset={resetFilters} columns={3}>
        <FilterField label="Navigateur / Système" htmlFor="sess-filter-ua">
          <Input
            id="sess-filter-ua"
            value={uaFilter}
            onChange={(e) => {
              const v = e.target.value;
              setUaFilter(v);
              syncUrlParams(tab, v, ipFilter, deviceFilter);
            }}
            placeholder="Chrome, Firefox, Windows, Android..."
            className="h-9"
          />
        </FilterField>

        <FilterField label="Adresse IP" htmlFor="sess-filter-ip">
          <Input
            id="sess-filter-ip"
            value={ipFilter}
            onChange={(e) => {
              const v = e.target.value;
              setIpFilter(v);
              syncUrlParams(tab, uaFilter, v, deviceFilter);
            }}
            placeholder="Ex : 197.230..."
            className="h-9"
          />
        </FilterField>

        <FilterField label="Type d'appareil" htmlFor="sess-filter-device">
          <select
            id="sess-filter-device"
            value={deviceFilter}
            onChange={(e) => {
              const v = e.target.value as DeviceTypeFilter;
              setDeviceFilter(v);
              syncUrlParams(tab, uaFilter, ipFilter, v);
            }}
            className={FILTER_SELECT_CLASS}
          >
            <option value="all">Tous les appareils</option>
            <option value="desktop">Ordinateur</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablette</option>
          </select>
        </FilterField>
      </FilterCard>

      <DataTable
        data={filteredSessions}
        columns={columns}
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Rechercher par appareil, navigateur ou adresse IP..."
        isLoading={sessionsQuery.isLoading}
        isRefreshing={sessionsQuery.isFetching && !sessionsQuery.isLoading}
        enableSelection
        isRowSelectable={(s) => !s.isCurrent}
        bulkActions={bulkActions}
        emptyMessage="Aucune session active trouvée."
        emptyDescription="Aucun appareil ne correspond aux filtres sélectionnés."
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredSessions.length === 0}
              onClick={() => handleExportCsv(filteredSessions)}
            >
              <Download className="size-3.5" />
              Exporter CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={counts.autres === 0 || revokeOthersMutation.isPending}
              onClick={() => setConfirmRevokeOthers(true)}
            >
              <LogOut className="size-3.5 text-red-500" />
              Déconnecter toutes les autres sessions ({counts.autres})
            </Button>
          </>
        }
      />

      <ConfirmActionDialog
        open={confirmRevokeOthers}
        title="Déconnecter toutes les autres sessions ?"
        description={`${counts.autres} autre(s) appareil(s) connecté(s) perdront immédiatement leur accès à la plateforme G4D.`}
        confirmLabel="Déconnecter tout"
        variant="destructive"
        isPending={revokeOthersMutation.isPending}
        pendingLabel={OPERATION_LABELS.deleting}
        onCancel={() => setConfirmRevokeOthers(false)}
        onConfirm={() => revokeOthersMutation.mutate()}
      />

      <ConfirmActionDialog
        open={Boolean(bulkRevokeSelection)}
        title="Révoquer les sessions sélectionnées ?"
        description={
          bulkRevokeSelection
            ? `${bulkRevokeSelection.sessions.length} session(s) distante(s) seront immédiatement fermées.`
            : ''
        }
        confirmLabel="Révoquer la sélection"
        variant="destructive"
        isPending={bulkRevokeMutation.isPending}
        pendingLabel={OPERATION_LABELS.deleting}
        onCancel={() => setBulkRevokeSelection(null)}
        onConfirm={() => {
          if (!bulkRevokeSelection) return;
          bulkRevokeMutation.mutate(bulkRevokeSelection.sessions, {
            onSuccess: () => bulkRevokeSelection.clear(),
          });
        }}
      />
    </PageContent>
  );
}
