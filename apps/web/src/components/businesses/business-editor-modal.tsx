'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import {
  BUSINESS_ACTIVITY_TYPES,
  MODE_PAIEMENT_VALUES,
  RETURN_TYPE_VALUES,
  type InvoiceBankResolutionDto,
} from '@zakaria/shared-contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/solar-icons';
import { apiFetch } from '@/lib/api-client';

export interface BusinessCompteItem {
  id: number;
  banqueId: number | null;
  banqueNomCustom: string | null;
  rib: string;
  titulaireNom: string | null;
  isActive: boolean;
  resolvedBank: InvoiceBankResolutionDto;
}

export interface BusinessItemDto {
  id: number;
  userId: number;
  name: string;
  type: string | null;
  logo: string | null;
  adresse: string | null;
  email: string | null;
  ice: string | null;
  rc: string | null;
  telephone: string | null;
  villeId: number | null;
  agencyId: number | null;
  isActive: boolean;
  modePaiement: 'espece' | 'virement_bancaire' | null;
  defaultFragile: boolean;
  defaultOpenpackage: boolean;
  defaultEssayage: boolean;
  labelMessage: string | null;
  autoSendPreparation: boolean;
  returnType: 'agence' | 'adresse_personnalisee' | null;
  returnRecipient: string | null;
  returnPhone: string | null;
  returnVilleId: number | null;
  returnAddress: string | null;
  returnNote: string | null;
  user: {
    id: number;
    nomComplet: string;
    email: string;
    telephone: string;
  };
  ville: { id: number; nameFr: string } | null;
  agency: { id: number; nom: string; code: string } | null;
  couverture: {
    statut: 'rattache' | 'couvert_par_zone' | 'hors_zone' | 'orphelin_sans_ville';
    label: string;
  };
  comptesCount: number;
  activeCompte: BusinessCompteItem | null;
  comptes: BusinessCompteItem[];
}

export interface BusinessOptionsDto {
  agences: Array<{ id: number; nom: string; code: string }>;
  villes: Array<{ id: number; nameFr: string; codeZone: string }>;
  banques: Array<{ id: number; name: string; swiftCode: string | null }>;
}

interface BusinessEditorModalProps {
  open: boolean;
  isClientView: boolean;
  business: BusinessItemDto | null;
  options: BusinessOptionsDto;
  onClose: () => void;
  onFeedback: (msg: { type: 'ok' | 'err'; text: string }) => void;
}

type EditorTab = 'general' | 'preferences' | 'retour' | 'comptes';

export function BusinessEditorModal({
  open,
  isClientView,
  business,
  options,
  onClose,
  onFeedback,
}: BusinessEditorModalProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<EditorTab>('general');
  const [localError, setLocalError] = useState<string | null>(null);

  // Champs business
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(BUSINESS_ACTIVITY_TYPES[0]);
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [villeId, setVilleId] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ice, setIce] = useState('');
  const [rc, setRc] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [modePaiement, setModePaiement] = useState<string>('');
  const [defaultFragile, setDefaultFragile] = useState(false);
  const [defaultOpenpackage, setDefaultOpenpackage] = useState(true);
  const [defaultEssayage, setDefaultEssayage] = useState(false);
  const [autoSendPreparation, setAutoSendPreparation] = useState(false);
  const [labelMessage, setLabelMessage] = useState('');

  const [returnType, setReturnType] = useState<string>('');
  const [returnRecipient, setReturnRecipient] = useState('');
  const [returnPhone, setReturnPhone] = useState('');
  const [returnVilleId, setReturnVilleId] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [returnNote, setReturnNote] = useState('');

  // Formulaire nouveau compte bancaire
  const [banqueId, setBanqueId] = useState('');
  const [banqueNomCustom, setBanqueNomCustom] = useState('');
  const [rib, setRib] = useState('');
  const [titulaireNom, setTitulaireNom] = useState('');

  useEffect(() => {
    if (!open) return;
    setLocalError(null);
    setTab('general');
    setName(business?.name ?? '');
    setType(business?.type ?? BUSINESS_ACTIVITY_TYPES[0]);
    setTelephone(business?.telephone ?? '');
    setEmail(business?.email ?? '');
    setVilleId(business?.villeId ? String(business.villeId) : '');
    setAgencyId(business?.agencyId ? String(business.agencyId) : '');
    setAdresse(business?.adresse ?? '');
    setIce(business?.ice ?? '');
    setRc(business?.rc ?? '');
    setIsActive(business?.isActive ?? true);

    setModePaiement(business?.modePaiement ?? '');
    setDefaultFragile(business?.defaultFragile ?? false);
    setDefaultOpenpackage(business?.defaultOpenpackage ?? true);
    setDefaultEssayage(business?.defaultEssayage ?? false);
    setAutoSendPreparation(business?.autoSendPreparation ?? false);
    setLabelMessage(business?.labelMessage ?? '');

    setReturnType(business?.returnType ?? '');
    setReturnRecipient(business?.returnRecipient ?? '');
    setReturnPhone(business?.returnPhone ?? '');
    setReturnVilleId(business?.returnVilleId ? String(business.returnVilleId) : '');
    setReturnAddress(business?.returnAddress ?? '');
    setReturnNote(business?.returnNote ?? '');

    setBanqueId('');
    setBanqueNomCustom('');
    setRib('');
    setTitulaireNom('');
  }, [open, business]);

  const saveBusinessMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        type: type || null,
        telephone: telephone.trim() || null,
        email: email.trim() || null,
        villeId: villeId ? Number(villeId) : null,
        ...(!isClientView ? { agencyId: agencyId ? Number(agencyId) : null } : {}),
        adresse: adresse.trim() || null,
        ice: ice.trim() || null,
        rc: rc.trim() || null,
        isActive,
        modePaiement: modePaiement ? (modePaiement as (typeof MODE_PAIEMENT_VALUES)[number]) : null,
        defaultFragile,
        defaultOpenpackage,
        defaultEssayage,
        autoSendPreparation,
        labelMessage: labelMessage.trim() || null,
        returnType: returnType ? (returnType as (typeof RETURN_TYPE_VALUES)[number]) : null,
        returnRecipient: returnRecipient.trim() || null,
        returnPhone: returnPhone.trim() || null,
        returnVilleId: returnVilleId ? Number(returnVilleId) : null,
        returnAddress: returnAddress.trim() || null,
        returnNote: returnNote.trim() || null,
      };
      if (business) {
        return apiFetch(`/businesses/${business.id}`, { method: 'PATCH', body: payload });
      }
      return apiFetch('/businesses', { method: 'POST', body: payload });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      onFeedback({
        type: 'ok',
        text: business ? `Enseigne ${name} mise à jour.` : `Enseigne ${name} créée.`,
      });
      onClose();
    },
    onError: (err) => {
      setLocalError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    },
  });

  const addCompteMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/businesses/${business?.id}/comptes-bancaires`, {
        method: 'POST',
        body: {
          banqueId: banqueId ? Number(banqueId) : null,
          banqueNomCustom: !banqueId ? banqueNomCustom.trim() || null : null,
          rib: rib.trim(),
          titulaireNom: titulaireNom.trim(),
        },
      }),
    onSuccess: () => {
      setBanqueId('');
      setBanqueNomCustom('');
      setRib('');
      setTitulaireNom('');
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      onFeedback({ type: 'ok', text: 'Compte bancaire ajouté (pensez à l’activer si principal).' });
    },
    onError: (err) => {
      setLocalError(err instanceof Error ? err.message : "Erreur d'ajout du compte bancaire.");
    },
  });

  const activateCompteMutation = useMutation({
    mutationFn: (compteId: number) =>
      apiFetch<{ message: string }>(
        `/businesses/${business?.id}/comptes-bancaires/${compteId}/activer`,
        { method: 'POST' },
      ),
    onSuccess: (res) => {
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      onFeedback({ type: 'ok', text: res.message });
    },
    onError: (err) => {
      setLocalError(err instanceof Error ? err.message : "Erreur lors de l'activation.");
    },
  });

  const deleteCompteMutation = useMutation({
    mutationFn: (compteId: number) =>
      apiFetch(`/businesses/${business?.id}/comptes-bancaires/${compteId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ['businesses'] });
      onFeedback({ type: 'ok', text: 'Compte bancaire supprimé.' });
    },
    onError: (err) => {
      setLocalError(err instanceof Error ? err.message : 'Suppression impossible.');
    },
  });

  if (!open) return null;

  const tabs: Array<{ key: EditorTab; label: string }> = [
    { key: 'general', label: 'Général' },
    { key: 'preferences', label: 'Préférences colis' },
    { key: 'retour', label: 'Adresse de retour' },
    ...(business
      ? [{ key: 'comptes' as const, label: `Comptes bancaires (${business.comptes.length})` }]
      : []),
  ];

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    saveBusinessMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* En-tête modale */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {business ? `Enseigne · ${business.name}` : 'Nouvelle enseigne commerciale'}
            </h2>
            {business && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vendeur : {business.user.nomComplet} · {business.couverture.label}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-slate-50 px-5 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setLocalError(null);
                setTab(t.key);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                tab === t.key
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {localError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              {localError}
            </div>
          )}

          {tab !== 'comptes' ? (
            <form id="business-editor-form" onSubmit={handleSave} className="space-y-4">
              {tab === 'general' && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="biz-name">Nom de l&apos;enseigne *</Label>
                      <Input
                        id="biz-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="biz-type">Type d&apos;activité</Label>
                      <select
                        id="biz-type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        {BUSINESS_ACTIVITY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="biz-tel">Téléphone</Label>
                      <Input
                        id="biz-tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="biz-email">E-mail</Label>
                      <Input
                        id="biz-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="biz-ville">Ville de ramassage</Label>
                      <select
                        id="biz-ville"
                        value={villeId}
                        onChange={(e) => setVilleId(e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">Aucune ville</option>
                        {options.villes.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nameFr}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!isClientView && (
                      <div className="space-y-1.5">
                        <Label htmlFor="biz-agency">Agence de rattachement (staff)</Label>
                        <select
                          id="biz-agency"
                          value={agencyId}
                          onChange={(e) => setAgencyId(e.target.value)}
                          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                          <option value="">Résolution auto par zone</option>
                          {options.agences.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nom} ({a.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="biz-addr">Adresse commerciale</Label>
                    <Input
                      id="biz-addr"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="biz-ice">ICE</Label>
                      <Input id="biz-ice" value={ice} onChange={(e) => setIce(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="biz-rc">RC</Label>
                      <Input id="biz-rc" value={rc} onChange={(e) => setRc(e.target.value)} />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="h-4 w-4 rounded accent-primary"
                        />
                        <span>Enseigne active</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {tab === 'preferences' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-paiement">Mode de règlement des factures</Label>
                    <select
                      id="biz-paiement"
                      value={modePaiement}
                      onChange={(e) => setModePaiement(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="">Non défini</option>
                      <option value="espece">Espèce</option>
                      <option value="virement_bancaire">
                        Virement bancaire (compte actif obligatoire)
                      </option>
                    </select>
                    {modePaiement === 'virement_bancaire' && !business?.activeCompte && (
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        Attention : ce business n&apos;a pas encore de compte bancaire actif.
                        Activez-en un dans l&apos;onglet « Comptes bancaires ».
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={defaultFragile}
                        onChange={(e) => setDefaultFragile(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>Colis fragile par défaut</span>
                    </label>
                    <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={defaultOpenpackage}
                        onChange={(e) => setDefaultOpenpackage(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>Autoriser ouverture à la livraison</span>
                    </label>
                    <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={defaultEssayage}
                        onChange={(e) => setDefaultEssayage(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>Autoriser essayage</span>
                    </label>
                    <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSendPreparation}
                        onChange={(e) => setAutoSendPreparation(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>Envoi auto en préparation</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="biz-label-msg">
                      Message imprimé sur l&apos;étiquette colis
                    </Label>
                    <Input
                      id="biz-label-msg"
                      value={labelMessage}
                      onChange={(e) => setLabelMessage(e.target.value)}
                      placeholder="Ex: Merci pour votre commande !"
                    />
                  </div>
                </>
              )}

              {tab === 'retour' && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ret-type">Mode de retour</Label>
                      <select
                        id="ret-type"
                        value={returnType}
                        onChange={(e) => setReturnType(e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">Par défaut</option>
                        <option value="agence">Retrait en agence G4D</option>
                        <option value="adresse_personnalisee">Adresse personnalisée</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ret-ville">Ville de retour</Label>
                      <select
                        id="ret-ville"
                        value={returnVilleId}
                        onChange={(e) => setReturnVilleId(e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">Identique</option>
                        {options.villes.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nameFr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ret-rec">Destinataire retour</Label>
                      <Input
                        id="ret-rec"
                        value={returnRecipient}
                        onChange={(e) => setReturnRecipient(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ret-phone">Téléphone retour</Label>
                      <Input
                        id="ret-phone"
                        value={returnPhone}
                        onChange={(e) => setReturnPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ret-addr">Adresse complète de retour</Label>
                    <Input
                      id="ret-addr"
                      value={returnAddress}
                      onChange={(e) => setReturnAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ret-note">Instructions livreur retour</Label>
                    <Input
                      id="ret-note"
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                    />
                  </div>
                </>
              )}
            </form>
          ) : (
            <div className="space-y-5">
              {/* Liste comptes existants */}
              <div className="space-y-2.5">
                {business?.comptes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700">
                    Aucun compte bancaire enregistré pour ce business.
                  </p>
                ) : (
                  business?.comptes.map((compte) => (
                    <div
                      key={compte.id}
                      className={`flex flex-col gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between ${
                        compte.isActive
                          ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800/70 dark:bg-emerald-950/30'
                          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Icon
                            icon="solar:card-2-bold-duotone"
                            width={18}
                            height={18}
                            className="text-primary"
                          />
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {compte.resolvedBank.banqueNom}
                          </span>
                          {compte.isActive && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              Compte principal actif
                            </span>
                          )}
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {compte.resolvedBank.source}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          RIB : {compte.resolvedBank.rib}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Titulaire : {compte.resolvedBank.titulaireNom}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!compte.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={activateCompteMutation.isPending}
                            onClick={() => activateCompteMutation.mutate(compte.id)}
                          >
                            Activer
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deleteCompteMutation.isPending}
                          onClick={() => deleteCompteMutation.mutate(compte.id)}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulaire d'ajout de compte bancaire */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addCompteMutation.mutate();
                }}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Ajouter un nouveau compte bancaire
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="cb-bank">Banque (référentiel)</Label>
                    <select
                      id="cb-bank"
                      value={banqueId}
                      onChange={(e) => setBanqueId(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Détection auto RIB / Autre</option>
                      {options.banques.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!banqueId && (
                    <div className="space-y-1">
                      <Label htmlFor="cb-custom">Nom banque personnalisé (si hors liste)</Label>
                      <Input
                        id="cb-custom"
                        value={banqueNomCustom}
                        onChange={(e) => setBanqueNomCustom(e.target.value)}
                        placeholder="Ex: Wise / Paysera (optionnel)"
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="cb-rib">RIB (24 chiffres au Maroc) *</Label>
                    <Input
                      id="cb-rib"
                      required
                      value={rib}
                      onChange={(e) => setRib(e.target.value)}
                      placeholder="007 810 000..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cb-titulaire">Nom du titulaire *</Label>
                    <Input
                      id="cb-titulaire"
                      required
                      value={titulaireNom}
                      onChange={(e) => setTitulaireNom(e.target.value)}
                      placeholder="Société ou nom complet"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={addCompteMutation.isPending}>
                    {addCompteMutation.isPending ? 'Ajout…' : 'Ajouter le compte'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Pied de modale */}
        {tab !== 'comptes' && (
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              form="business-editor-form"
              disabled={saveBusinessMutation.isPending}
            >
              {saveBusinessMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
