'use client';

import {
  Building2,
  Calendar,
  Camera,
  Loader2,
  Mail,
  MapPin,
  MonitorSmartphone,
  Phone,
  SquarePen,
  UserCheck,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  extractInitials,
  formatDateTimeFr,
  formatRoleMeta,
  type ProfileRoleSummary,
  type ProfileTabKey,
  type ProfileUser,
} from './profile-types';

async function resizeImageToDataUrl(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Format non supporté. Utilisez une image JPG, PNG ou WebP.');
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error('Le fichier sélectionné dépasse 6 Mo.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Fichier image invalide ou corrompu.'));
      img.onload = () => {
        const maxDim = 360;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Traitement graphique indisponible dans ce navigateur.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const output = canvas.toDataURL('image/webp', 0.86);
        resolve(
          output.startsWith('data:image/webp') ? output : canvas.toDataURL('image/jpeg', 0.86),
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileHeader({
  profile,
  roleSummary,
  roleNames,
  activeSessionsCount,
  isUploadingAvatar,
  onUploadAvatar,
  onSelectTab,
}: {
  profile: ProfileUser;
  roleSummary: ProfileRoleSummary;
  roleNames: string[];
  activeSessionsCount: number;
  isUploadingAvatar: boolean;
  onUploadAvatar: (dataUrl: string, filename: string) => void;
  onSelectTab: (tab: ProfileTabKey) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const initials = extractInitials(profile.nomComplet);
  const effectiveRoles =
    roleSummary.roles.length > 0 ? roleSummary.roles.map((r) => r.name) : roleNames;

  const primaryOrgLabel =
    roleSummary.agenceMemberships[0]?.agenceNom ??
    roleSummary.agencesResponsable[0]?.nom ??
    roleSummary.partenaireCoursier?.partenaireNom ??
    roleSummary.partenaireMemberships[0]?.raisonSociale ??
    (roleSummary.businesses.length > 0
      ? `${roleSummary.businesses.length} enseigne(s) active(s)`
      : null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      onUploadAvatar(dataUrl, file.name);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Erreur lors du traitement de l’image.');
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm dark:border-slate-800">
      <div
        className="relative flex min-h-[210px] flex-col justify-between bg-cover bg-center p-5 text-white sm:p-7"
        style={{ backgroundImage: "url('/images/cover-profile.jpg')" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(118deg, rgba(12, 30, 44, 0.94) 0%, rgba(18, 71, 108, 0.85) 45%, rgba(26, 95, 160, 0.72) 78%, rgba(15, 23, 42, 0.82) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-[3px] bg-gradient-to-r from-[#1b9dd9] via-[#3fb4e8] to-[#f7901e]"
        />

        {/* Barre supérieure */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-xs">
              <UserCheck className="size-4 text-[#3fb4e8]" />
              Espace Mon Compte &amp; Sécurité
            </span>
            <span className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-xs font-bold text-white/95 backdrop-blur-xs">
              #{profile.id}
            </span>
            {profile.parentId && (
              <span className="rounded-lg border border-amber-300/35 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-100 backdrop-blur-xs">
                Sous-compte (Titulaire #{profile.parentId})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-xs ${
                profile.active
                  ? 'border-emerald-300/40 bg-emerald-500/25 text-emerald-100'
                  : 'border-amber-300/40 bg-amber-500/25 text-amber-100'
              }`}
            >
              <span
                className={`size-2 rounded-full ${profile.active ? 'bg-emerald-300' : 'bg-amber-300'}`}
              />
              {profile.active ? 'Compte actif' : 'Compte inactif'}
            </span>
            {profile.inscriptionStatut && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/90 uppercase backdrop-blur-xs">
                {profile.inscriptionStatut === 'acceptee'
                  ? 'Vérifié'
                  : profile.inscriptionStatut === 'en_attente'
                    ? 'En attente'
                    : profile.inscriptionStatut}
              </span>
            )}
          </div>
        </div>

        {/* Bloc Identité + Actions */}
        <div className="relative z-10 mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Avatar interactif */}
            <div className="relative shrink-0 self-start">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-[#16517f]/90 text-2xl font-extrabold text-white shadow-lg sm:size-24">
                {profile.avatarDataUrl ? (
                  <img
                    src={profile.avatarDataUrl}
                    alt={profile.nomComplet}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                title="Changer la photo de profil"
                className="absolute -right-1.5 -bottom-1.5 flex size-8 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-[#f7901e] text-white shadow-md transition-transform hover:scale-105 hover:bg-[#e08a2b] disabled:opacity-60"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
            </div>

            {/* Nom + Rôles + Méta-pilules */}
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {profile.civilite ? `${profile.civilite} ` : ''}
                  {profile.nomComplet}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5">
                  {effectiveRoles.map((role) => {
                    const meta = formatRoleMeta(role);
                    return (
                      <span
                        key={role}
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-xs ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-100/90 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-4 text-[#3fb4e8]" />
                  {profile.email}
                </span>
                {profile.telephone && (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Phone className="size-4 text-[#3fb4e8]" />
                    {profile.telephone}
                  </span>
                )}
                {(profile.ville?.nameFr || profile.villeName) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-[#f9a03f]" />
                    {profile.ville?.nameFr ?? profile.villeName}
                  </span>
                )}
                {primaryOrgLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4 text-[#f9a03f]" />
                    {primaryOrgLabel}
                  </span>
                )}
                {profile.createdAt && (
                  <span className="inline-flex items-center gap-1.5 text-slate-200/80">
                    <Calendar className="size-4 text-slate-300" />
                    Membre depuis le {formatDateTimeFr(profile.createdAt, false)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action rapide */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => onSelectTab('informations')}
              className="border border-white/25 bg-white text-[#12476c] shadow-sm hover:bg-slate-100"
            >
              <SquarePen className="size-4" />
              Modifier le profil
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSelectTab('sessions')}
              className="border-white/30 bg-white/10 text-white backdrop-blur-xs hover:bg-white/20 hover:text-white"
            >
              <MonitorSmartphone className="size-4 text-[#3fb4e8]" />
              {activeSessionsCount} session{activeSessionsCount > 1 ? 's' : ''} active
              {activeSessionsCount > 1 ? 's' : ''}
            </Button>
          </div>
        </div>

        {avatarError && (
          <div className="relative z-10 mt-3 rounded-lg border border-red-300/40 bg-red-500/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs">
            {avatarError}
          </div>
        )}
      </div>
    </section>
  );
}
