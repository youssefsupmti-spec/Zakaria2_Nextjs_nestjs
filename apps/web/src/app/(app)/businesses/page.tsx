'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BusinessEditorModal,
  type BusinessItemDto,
  type BusinessOptionsDto,
} from '@/components/businesses/business-editor-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import '@/components/ui/solar-icons';
import { apiFetch } from '@/lib/api-client';

interface BusinessesListResponse {
  isClientView: boolean;
  canDeleteBusiness: boolean;
  stats: {
    total: number;
    actifs: number;
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

const COUVERTURE_BADGE: Record<string, string> = {
  rattache: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  couvert_par_zone: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  hors_zone: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  orphelin_sans_ville: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
};

export default function BusinessesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [couverture, setCouverture] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['businesses', search, couverture, modePaiement],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (couverture) params.set('couverture', couverture);
      if (modePaiement) params.set('modePaiement', modePaiement);
      const qs = params.toString();
      return apiFetch<BusinessesListResponse>(`/businesses${qs ? `?${qs}` : ''}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/businesses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setFeedback({ type: 'ok', text: 'Enseigne archivée avec ses comptes bancaires.' });
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : "Erreur lors de l'archivage.",
      });
    },
  });

  const data = query.data;
  const activeModalBusiness =
    selectedBusinessId !== null
      ? (data?.items.find((b) => b.id === selectedBusinessId) ?? null)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {data?.isClientView
              ? 'Mes enseignes & comptes bancaires'
              : 'Administration des enseignes (Business)'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestion multi-enseignes, couverture de ramassage par agence et comptes RIB de règlement.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setSelectedBusinessId(null);
            setModalOpen(true);
          }}
        >
          + Nouvelle enseigne
        </Button>
      </div>

      {/* KPI synthèse */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total enseignes
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
              {data.stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Virement bancaire
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary">
              {data.stats.virement}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Couvertes (agence/zone)
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
              {data.stats.rattaches + data.stats.couvertsParZone}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Orphelines / Hors zone
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
              {data.stats.orphelins + data.stats.horsZone}
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom enseigne, vendeur, ICE, téléphone…"
          className="h-9 w-full bg-white sm:w-72 dark:bg-slate-900"
        />
        {!data?.isClientView && (
          <select
            value={couverture}
            onChange={(e) => setCouverture(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Toutes couvertures</option>
            <option value="rattache">Rattaché explicitement</option>
            <option value="couvert_par_zone">Couvert par zone</option>
            <option value="hors_zone">Hors zone ramassage</option>
            <option value="orphelin_sans_ville">Orphelin sans ville</option>
          </select>
        )}
        <select
          value={modePaiement}
          onChange={(e) => setModePaiement(e.target.value)}
          className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="">Tous modes de paiement</option>
          <option value="virement_bancaire">Virement bancaire</option>
          <option value="espece">Espèce</option>
        </select>
      </div>

      {/* Liste */}
      {query.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Chargement des enseignes…
        </div>
      ) : !data?.items.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Icon
            icon="solar:shop-2-bold-duotone"
            width={36}
            height={36}
            className="mx-auto mb-2 text-slate-400"
          />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Aucune enseigne trouvée
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((biz) => (
            <div
              key={biz.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {biz.name}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          biz.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {biz.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {biz.type || 'Activité standard'} · Vendeur : {biz.user.nomComplet}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      COUVERTURE_BADGE[biz.couverture.statut] ?? ''
                    }`}
                  >
                    {biz.couverture.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <span>Ville : {biz.ville?.nameFr ?? 'Non définie'}</span>
                  <span>Tél : {biz.telephone || '—'}</span>
                  <span>
                    Règlement :{' '}
                    {biz.modePaiement === 'virement_bancaire'
                      ? 'Virement bancaire'
                      : biz.modePaiement === 'espece'
                        ? 'Espèce'
                        : 'Non défini'}
                  </span>
                </div>

                {biz.activeCompte && (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/70">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      RIB principal ({biz.activeCompte.resolvedBank.banqueNom}) :{' '}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {biz.activeCompte.resolvedBank.rib}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBusinessId(biz.id);
                    setModalOpen(true);
                  }}
                >
                  Configurer &amp; RIB ({biz.comptesCount})
                </Button>
                {data.canDeleteBusiness && !data.isClientView && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(biz.id)}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                  >
                    Archiver
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <BusinessEditorModal
          open={modalOpen}
          isClientView={data.isClientView}
          business={activeModalBusiness}
          options={data.options}
          onClose={() => setModalOpen(false)}
          onFeedback={setFeedback}
        />
      )}
    </div>
  );
}
