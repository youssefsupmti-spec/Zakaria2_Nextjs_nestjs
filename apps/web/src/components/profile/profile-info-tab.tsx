'use client';

import { CheckCircle2, Lock, SquarePen, Trash2 } from 'lucide-react';
import { CIVILITE_VALUES, type VilleOptionDto } from '@zakaria/shared-contracts';
import { useEffect, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTimeFr, type ContactChangeRequestItem, type ProfileUser } from './profile-types';

export function ProfileInfoTab({
  profile,
  villes,
  isSuperAdmin,
  contactChangeRequests,
  isSavingProfile,
  isDeletingAvatar,
  isRequestingContact,
  onSaveProfile,
  onDeleteAvatar,
  onSubmitContactRequest,
}: {
  profile: ProfileUser;
  villes: VilleOptionDto[];
  isSuperAdmin: boolean;
  contactChangeRequests: ContactChangeRequestItem[];
  isSavingProfile: boolean;
  isDeletingAvatar: boolean;
  isRequestingContact: boolean;
  onSaveProfile: (payload: {
    nomComplet: string;
    civilite: string | null;
    villeId: number | null;
    cin: string;
    sav: string;
    lienLocalisationMaps: string;
  }) => void;
  onDeleteAvatar: () => void;
  onSubmitContactRequest: (payload: {
    type: 'email' | 'telephone' | 'sav' | 'ville';
    nouvelleValeur: string;
    motif: string;
  }) => Promise<boolean>;
}) {
  const [civilite, setCivilite] = useState<string>(profile.civilite ?? 'M.');
  const [nomComplet, setNomComplet] = useState(profile.nomComplet ?? '');
  const [villeId, setVilleId] = useState<string>(profile.villeId ? String(profile.villeId) : '');
  const [cin, setCin] = useState(profile.cin ?? '');
  const [sav, setSav] = useState(profile.sav ?? '');
  const [lienMaps, setLienMaps] = useState(profile.lienLocalisationMaps ?? '');

  // Modale de demande encadrée de modification coordonnées
  const [modalOpen, setModalOpen] = useState(false);
  const [contactType, setContactType] = useState<'email' | 'telephone' | 'sav' | 'ville'>(
    'telephone',
  );
  const [contactValeur, setContactValeur] = useState('');
  const [contactMotif, setContactMotif] = useState('');

  useEffect(() => {
    setCivilite(profile.civilite ?? 'M.');
    setNomComplet(profile.nomComplet ?? '');
    setVilleId(profile.villeId ? String(profile.villeId) : '');
    setCin(profile.cin ?? '');
    setSav(profile.sav ?? '');
    setLienMaps(profile.lienLocalisationMaps ?? '');
  }, [profile]);

  const isDirty =
    nomComplet.trim() !== (profile.nomComplet ?? '').trim() ||
    (civilite || null) !== (profile.civilite ?? null) ||
    cin.trim() !== (profile.cin ?? '').trim() ||
    sav.trim() !== (profile.sav ?? '').trim() ||
    lienMaps.trim() !== (profile.lienLocalisationMaps ?? '').trim() ||
    (isSuperAdmin && (villeId ? Number(villeId) : null) !== (profile.villeId ?? null));

  const handleReset = () => {
    setCivilite(profile.civilite ?? 'M.');
    setNomComplet(profile.nomComplet ?? '');
    setVilleId(profile.villeId ? String(profile.villeId) : '');
    setCin(profile.cin ?? '');
    setSav(profile.sav ?? '');
    setLienMaps(profile.lienLocalisationMaps ?? '');
  };

  const handleSubmitProfile = (e: FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      nomComplet: nomComplet.trim(),
      civilite: civilite || null,
      villeId: villeId ? Number(villeId) : null,
      cin: cin.trim(),
      sav: sav.trim(),
      lienLocalisationMaps: lienMaps.trim(),
    });
  };

  const handleSubmitContact = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onSubmitContactRequest({
      type: contactType,
      nouvelleValeur: contactValeur.trim(),
      motif: contactMotif.trim(),
    });
    if (ok) {
      setContactValeur('');
      setContactMotif('');
      setModalOpen(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Formulaire Informations Personnelles */}
      <form
        onSubmit={handleSubmitProfile}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Informations personnelles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identité et localisation opérationnelle associées à votre compte.
            </p>
          </div>
          {isDirty && <Badge variant="warning">Modifications non enregistrées</Badge>}
        </div>

        {/* Gestion rapide suppression avatar */}
        {profile.avatarDataUrl && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatarDataUrl}
                alt={profile.nomComplet}
                className="size-11 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
              />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Photo de profil personnalisée active
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Vous pouvez la remplacer via l’icône caméra en haut de page.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isDeletingAvatar}
              onClick={onDeleteAvatar}
            >
              <Trash2 className="size-4 text-red-500" />
              {isDeletingAvatar ? 'Suppression…' : 'Supprimer'}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="prof-civilite">Civilité</Label>
            <select
              id="prof-civilite"
              value={civilite}
              onChange={(e) => setCivilite(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {CIVILITE_VALUES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="prof-nom">Nom complet *</Label>
            <Input
              id="prof-nom"
              value={nomComplet}
              onChange={(e) => setNomComplet(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="prof-cin">N° CIN</Label>
            <Input
              id="prof-cin"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              placeholder="Ex: AB123456"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="prof-sav">Téléphone SAV / Secondaire</Label>
            <Input
              id="prof-sav"
              value={sav}
              onChange={(e) => setSav(e.target.value)}
              placeholder="Ex: 0522000000"
              className="mt-1.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="prof-ville">Ville de rattachement</Label>
              {!isSuperAdmin && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Verrouillée (voir Coordonnées)
                </span>
              )}
            </div>
            <select
              id="prof-ville"
              value={villeId}
              disabled={!isSuperAdmin}
              onChange={(e) => setVilleId(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-400"
            >
              <option value="">Sélectionner…</option>
              {villes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nameFr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="prof-maps">Lien localisation Google Maps</Label>
              {lienMaps.trim() && (
                <a
                  href={lienMaps.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Tester le lien
                </a>
              )}
            </div>
            <Input
              id="prof-maps"
              value={lienMaps}
              onChange={(e) => setLienMaps(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSavingProfile}
            >
              Réinitialiser
            </Button>
          )}
          <Button type="submit" disabled={isSavingProfile || !isDirty}>
            <CheckCircle2 className="size-4" />
            {isSavingProfile ? 'Enregistrement…' : 'Enregistrer les informations'}
          </Button>
        </div>
      </form>

      {/* Coordonnées protégées & Demandes Support */}
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Coordonnées &amp; Vérification
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protégées contre les modifications non autorisées.
            </p>
          </div>
          <Badge variant="success">Vérifiées</Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>E-mail de connexion</span>
              <Lock className="size-4 text-slate-400" />
            </div>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{profile.email}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Téléphone principal</span>
              <Lock className="size-4 text-slate-400" />
            </div>
            <p className="mt-1 font-semibold text-slate-900 tabular-nums dark:text-slate-100">
              {profile.telephone || 'Non renseigné'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Ville principale</span>
              <Lock className="size-4 text-slate-400" />
            </div>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {profile.ville?.nameFr ?? (profile.villeName || 'Non renseignée')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setModalOpen((prev) => !prev)}
        >
          <SquarePen className="size-4 text-primary" />
          {modalOpen ? 'Fermer le formulaire de demande' : 'Demander une modification'}
        </Button>

        {modalOpen && (
          <form
            onSubmit={handleSubmitContact}
            className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4 dark:bg-primary/[0.08]"
          >
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Nouvelle demande à l’équipe support G4D
            </p>
            <div>
              <Label htmlFor="req-type">Coordonnée concernée</Label>
              <select
                id="req-type"
                value={contactType}
                onChange={(e) =>
                  setContactType(e.target.value as 'email' | 'telephone' | 'sav' | 'ville')
                }
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="telephone">Téléphone principal</option>
                <option value="email">Adresse e-mail de connexion</option>
                <option value="sav">Téléphone SAV</option>
                <option value="ville">Ville principale</option>
              </select>
            </div>
            <div>
              <Label htmlFor="req-val">Nouvelle valeur souhaitée *</Label>
              <Input
                id="req-val"
                value={contactValeur}
                onChange={(e) => setContactValeur(e.target.value)}
                required
                placeholder={
                  contactType === 'email'
                    ? 'nouveau@exemple.ma'
                    : contactType === 'ville'
                      ? 'Ex: Casablanca'
                      : 'Ex: 0661000000'
                }
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="req-motif">Motif justificatif *</Label>
              <Input
                id="req-motif"
                value={contactMotif}
                onChange={(e) => setContactMotif(e.target.value)}
                required
                placeholder="Ex: Changement de numéro professionnel"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isRequestingContact}>
                {isRequestingContact ? 'Envoi…' : 'Transmettre la demande'}
              </Button>
            </div>
          </form>
        )}

        {/* Historique des demandes */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-2.5 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Historique des demandes ({contactChangeRequests.length})
          </p>
          {contactChangeRequests.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Aucune demande de modification enregistrée.
            </p>
          ) : (
            <div className="space-y-2">
              {contactChangeRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      Transmise au support
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTimeFr(req.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                    {req.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
