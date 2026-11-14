'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { CIVILITE_VALUES, type VilleOptionDto } from '@zakaria/shared-contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/solar-icons';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface ProfileResponse {
  profile: {
    id: number;
    nomComplet: string;
    civilite: string | null;
    email: string;
    telephone: string;
    sav: string;
    villeId: number | null;
    villeName: string;
    cin: string;
    lienLocalisationMaps: string;
    active: boolean;
    inscriptionStatut: string | null;
  };
  contactChangeRequests: Array<{
    id: number;
    detail: string;
    createdAt: string | null;
  }>;
}

export default function ProfilPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [civilite, setCivilite] = useState<string>('M.');
  const [nomComplet, setNomComplet] = useState('');
  const [villeId, setVilleId] = useState<string>('');
  const [cin, setCin] = useState('');
  const [lienMaps, setLienMaps] = useState('');

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');

  // Demande modification coordonnées critiques
  const [contactOpen, setContactOpen] = useState(false);
  const [contactType, setContactType] = useState<'email' | 'telephone' | 'sav'>('telephone');
  const [contactValeur, setContactValeur] = useState('');
  const [contactMotif, setContactMotif] = useState('');

  const profileQuery = useQuery({
    queryKey: ['own-profile'],
    queryFn: () => apiFetch<ProfileResponse>('/auth/profile'),
  });

  const villesQuery = useQuery({
    queryKey: ['public-villes'],
    queryFn: () => apiFetch<{ villes: VilleOptionDto[] }>('/auth/villes'),
  });

  useEffect(() => {
    const p = profileQuery.data?.profile;
    if (p) {
      setCivilite(p.civilite ?? 'M.');
      setNomComplet(p.nomComplet ?? '');
      setVilleId(p.villeId ? String(p.villeId) : '');
      setCin(p.cin ?? '');
      setLienMaps(p.lienLocalisationMaps ?? '');
    }
  }, [profileQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/auth/profile', {
        method: 'PATCH',
        body: {
          nomComplet: nomComplet.trim(),
          civilite: civilite || null,
          villeId: villeId ? Number(villeId) : null,
          cin: cin.trim(),
          lienLocalisationMaps: lienMaps.trim(),
        },
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur de mise à jour du profil.',
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/auth/profile/password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword,
          newPasswordConfirmation,
        },
      }),
    onSuccess: (res) => {
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      setFeedback({ type: 'ok', text: res.message });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Échec du changement de mot de passe.',
      });
    },
  });

  const contactChangeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/auth/profile/contact-change', {
        method: 'POST',
        body: {
          type: contactType,
          nouvelleValeur: contactValeur.trim(),
          motif: contactMotif.trim(),
        },
      }),
    onSuccess: (res) => {
      setContactOpen(false);
      setContactValeur('');
      setContactMotif('');
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de l’envoi de la demande.',
      });
    },
  });

  const profile = profileQuery.data?.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-primary dark:bg-sky-950/60">
            <Icon icon="solar:user-circle-bold-duotone" width={26} height={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Mon Profil &amp; Sécurité
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user.nomComplet} · Rôles : {user.roles.join(', ') || 'Aucun'}
            </p>
          </div>
        </div>
        <Link
          href="/account/sessions"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Icon icon="solar:devices-bold-duotone" width={16} height={16} className="text-primary" />
          <span>Sessions actives</span>
        </Link>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bloc 1 : Identité & Localisation */}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            updateProfileMutation.mutate();
          }}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Informations personnelles
          </h2>

          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prof-civilite">Civilité</Label>
              <select
                id="prof-civilite"
                value={civilite}
                onChange={(e) => setCivilite(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {CIVILITE_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-nom">Nom complet *</Label>
              <Input
                id="prof-nom"
                required
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prof-ville">Ville</Label>
              <select
                id="prof-ville"
                value={villeId}
                onChange={(e) => setVilleId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Aucune ville</option>
                {villesQuery.data?.villes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nameFr}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-cin">CIN</Label>
              <Input id="prof-cin" value={cin} onChange={(e) => setCin(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-maps">Lien localisation Google Maps</Label>
            <Input
              id="prof-maps"
              value={lienMaps}
              onChange={(e) => setLienMaps(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Sauvegarde…' : 'Enregistrer le profil'}
            </Button>
          </div>
        </form>

        {/* Bloc 2 : Coordonnées protégées */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Coordonnées de contact protégées
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ces coordonnées identifient votre compte et nécessitent une validation support pour
                être modifiées.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setContactOpen((prev) => !prev)}>
              {contactOpen ? 'Fermer' : 'Demander modification'}
            </Button>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/70">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                E-mail de connexion
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {profile?.email ?? user.email}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/70">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Téléphone principal
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {profile?.telephone || 'Non renseigné'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/70">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Téléphone SAV
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {profile?.sav || 'Non renseigné'}
              </span>
            </div>
          </div>

          {contactOpen && (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                contactChangeMutation.mutate();
              }}
              className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 dark:border-sky-900/60 dark:bg-sky-950/30"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="cc-type">Champ à modifier</Label>
                  <select
                    id="cc-type"
                    value={contactType}
                    onChange={(e) =>
                      setContactType(e.target.value as 'email' | 'telephone' | 'sav')
                    }
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="telephone">Téléphone principal</option>
                    <option value="sav">Numéro SAV</option>
                    <option value="email">Adresse e-mail</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cc-val">Nouvelle valeur *</Label>
                  <Input
                    id="cc-val"
                    required
                    value={contactValeur}
                    onChange={(e) => setContactValeur(e.target.value)}
                    placeholder="Nouveau numéro ou e-mail"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cc-motif">Motif de la demande *</Label>
                <Input
                  id="cc-motif"
                  required
                  value={contactMotif}
                  onChange={(e) => setContactMotif(e.target.value)}
                  placeholder="Changement de ligne professionnelle…"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={contactChangeMutation.isPending}>
                  {contactChangeMutation.isPending ? 'Envoi…' : 'Transmettre au support'}
                </Button>
              </div>
            </form>
          )}

          {(profileQuery.data?.contactChangeRequests.length ?? 0) > 0 && (
            <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Dernières demandes enregistrées
              </p>
              {profileQuery.data?.contactChangeRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  {req.detail}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bloc 3 : Mot de passe */}
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          changePasswordMutation.mutate();
        }}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Changer votre mot de passe
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hachage Argon2id immédiat avec vérification du mot de passe actuel.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pwd-current">Mot de passe actuel *</Label>
            <Input
              id="pwd-current"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd-new">Nouveau mot de passe *</Label>
            <Input
              id="pwd-new"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd-confirm">Confirmation *</Label>
            <Input
              id="pwd-confirm"
              type="password"
              required
              minLength={8}
              value={newPasswordConfirmation}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </Button>
        </div>
      </form>
    </div>
  );
}
