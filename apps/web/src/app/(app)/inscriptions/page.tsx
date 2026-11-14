'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/solar-icons';
import { apiFetch } from '@/lib/api-client';

type StatutTab = 'en_attente' | 'acceptee' | 'refusee';

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
  statut: StatutTab;
  canApprove: boolean;
  canReject: boolean;
  counts: {
    enAttente: number;
    acceptee: number;
    refusee: number;
  };
  items: InscriptionItem[];
}

export default function InscriptionsPage() {
  const queryClient = useQueryClient();
  const [statut, setStatut] = useState<StatutTab>('en_attente');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [refusTarget, setRefusTarget] = useState<InscriptionItem | null>(null);
  const [refusMotif, setRefusMotif] = useState('');

  const query = useQuery({
    queryKey: ['inscriptions', statut, search],
    queryFn: () => {
      const params = new URLSearchParams({ statut });
      if (search.trim()) params.set('search', search.trim());
      return apiFetch<InscriptionsResponse>(`/inscriptions?${params.toString()}`);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string }>(`/inscriptions/${id}/accepter`, { method: 'POST' }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['inscriptions'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : "Erreur lors de l'acceptation.",
      });
    },
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
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors du refus.',
      });
    },
  });

  const data = query.data;
  const tabs: Array<{ key: StatutTab; label: string; count: number; badgeClass: string }> = [
    {
      key: 'en_attente',
      label: 'En attente',
      count: data?.counts.enAttente ?? 0,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      key: 'acceptee',
      label: 'Acceptées',
      count: data?.counts.acceptee ?? 0,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      key: 'refusee',
      label: 'Refusées',
      count: data?.counts.refusee ?? 0,
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Demandes d&apos;inscription vendeurs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Validation des nouveaux vendeurs e-commerce et contrôle de leur première enseigne.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, email, téléphone, boutique…"
            className="h-9 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Retour utilisateur */}
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

      {/* Onglets de statut */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {tabs.map((tab) => {
          const active = statut === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatut(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                  active ? 'bg-white/20 text-white' : tab.badgeClass
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste des dossiers */}
      {query.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Chargement des dossiers d&apos;inscription…
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {query.error instanceof Error ? query.error.message : 'Erreur de chargement.'}
        </div>
      ) : !data?.items.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Icon
            icon="solar:user-plus-bold-duotone"
            width={36}
            height={36}
            className="mx-auto mb-2 text-slate-400"
          />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Aucun dossier dans cet onglet
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Les demandes correspondant à votre périmètre apparaîtront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.civilite ? `${item.civilite} ` : ''}
                      {item.nomComplet}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      #{item.id}
                    </span>
                    {item.inscriptionRefusNombre > 0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {item.inscriptionRefusNombre} refus antérieur(s)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <span>Email : {item.email}</span>
                    <span>Tél : {item.telephone || '—'}</span>
                    {item.sav && <span>SAV : {item.sav}</span>}
                    <span>Ville : {item.villeName || 'Non définie'}</span>
                    {item.cin && <span>CIN : {item.cin}</span>}
                  </div>

                  {item.businesses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.businesses.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/70"
                        >
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {b.name}
                          </span>
                          {b.type && (
                            <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                              · {b.type}
                            </span>
                          )}
                          {b.ville && (
                            <span className="ml-1.5 text-sky-700 dark:text-sky-400">
                              ({b.ville.nameFr})
                            </span>
                          )}
                          {b.ice && (
                            <span className="ml-1.5 text-[11px] text-slate-400">ICE {b.ice}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.inscriptionMotif && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                      <span className="font-semibold">Motif enregistré : </span>
                      {item.inscriptionMotif}
                    </div>
                  )}
                </div>

                {statut === 'en_attente' && (
                  <div className="flex shrink-0 items-center gap-2">
                    {data.canApprove && (
                      <Button
                        size="sm"
                        disabled={acceptMutation.isPending}
                        onClick={() => acceptMutation.mutate(item.id)}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Accepter le vendeur
                      </Button>
                    )}
                    {data.canReject && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rejectMutation.isPending}
                        onClick={() => {
                          setRefusTarget(item);
                          setRefusMotif('');
                        }}
                        className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        Refuser
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale de refus avec motif obligatoire */}
      {refusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Refuser la demande de {refusTarget.nomComplet}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Le motif est obligatoire (3 à 500 caractères). Le vendeur pourra soumettre un nouveau
              dossier ultérieurement avec le même e-mail.
            </p>
            <div className="mt-4 space-y-2">
              <Label htmlFor="refus-motif">Motif du refus *</Label>
              <textarea
                id="refus-motif"
                rows={3}
                value={refusMotif}
                onChange={(e) => setRefusMotif(e.target.value)}
                placeholder="Ex: Coordonnées incomplètes ou activité non éligible…"
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRefusTarget(null)}
                disabled={rejectMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                disabled={rejectMutation.isPending || refusMotif.trim().length < 3}
                onClick={() =>
                  rejectMutation.mutate({ id: refusTarget.id, motif: refusMotif.trim() })
                }
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {rejectMutation.isPending ? 'Traitement…' : 'Confirmer le refus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
