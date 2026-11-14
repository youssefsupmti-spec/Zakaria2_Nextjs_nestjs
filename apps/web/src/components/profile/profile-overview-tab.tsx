'use client';

import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  CreditCard,
  KeyRound,
  MapPin,
  MonitorSmartphone,
  Shield,
  ShieldCheck,
  Store,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  formatDateTimeFr,
  type PrimaryProfileRole,
  type ProfileRoleSummary,
  type ProfileTabKey,
  type ProfileUser,
} from './profile-types';

interface KpiCard {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  accent: string;
}

function buildRoleKpis(
  primaryRole: PrimaryProfileRole,
  profile: ProfileUser,
  roleSummary: ProfileRoleSummary,
  activeSessionsCount: number,
): KpiCard[] {
  if (primaryRole === 'super_admin') {
    return [
      {
        label: 'Périmètre d’administration',
        value: 'Global Plateforme',
        helper: `${roleSummary.roles.length} rôle(s) · ${roleSummary.permissionsCount} permissions`,
        icon: ShieldCheck,
        accent: 'text-primary bg-primary/10',
      },
      {
        label: 'Hachage & Sécurité',
        value: profile.passwordAlgo.toUpperCase(),
        helper: profile.passwordResetAt
          ? `Modifié le ${formatDateTimeFr(profile.passwordResetAt, false)}`
          : 'Aucun changement récent',
        icon: KeyRound,
        accent: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60',
      },
      {
        label: 'Sessions actives',
        value: String(activeSessionsCount),
        helper: 'Appareils actuellement connectés',
        icon: MonitorSmartphone,
        accent: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/60',
      },
      {
        label: 'Statut du compte',
        value: profile.active ? 'Opérationnel' : 'Suspendu',
        helper: `ID #${profile.id}`,
        icon: BadgeCheck,
        accent: 'text-[#f7901e] bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60',
      },
    ];
  }

  if (primaryRole === 'admin') {
    const primaryAgence =
      roleSummary.agenceMemberships[0]?.agenceNom ??
      roleSummary.agencesResponsable[0]?.nom ??
      'Siège / Central';
    const zonesCount = roleSummary.agenceMemberships.reduce((acc, m) => acc + m.zones.length, 0);
    return [
      {
        label: 'Agence de rattachement',
        value: primaryAgence,
        helper: `${roleSummary.agenceMemberships.length} rattachement(s) actif(s)`,
        icon: Building2,
        accent: 'text-primary bg-primary/10',
      },
      {
        label: 'Périmètre RBAC',
        value: `${roleSummary.permissionsCount} droits`,
        helper: `${roleSummary.roles.length} rôle(s) attribué(s)`,
        icon: Shield,
        accent: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/60',
      },
      {
        label: 'Zones assignées',
        value: String(zonesCount),
        helper: 'Couverture distribution / ramassage',
        icon: MapPin,
        accent: 'text-[#f7901e] bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60',
      },
      {
        label: 'Sessions actives',
        value: String(activeSessionsCount),
        helper: 'Appareils connectés',
        icon: MonitorSmartphone,
        accent: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60',
      },
    ];
  }

  if (primaryRole === 'livreur') {
    const agenceNom =
      roleSummary.agenceMemberships[0]?.agenceNom ??
      roleSummary.partenaireCoursier?.partenaireNom ??
      'Affectation en attente';
    const zonesCount = roleSummary.agenceMemberships.reduce((acc, m) => acc + m.zones.length, 0);
    return [
      {
        label: 'Rattachement terrain',
        value: agenceNom,
        helper: roleSummary.partenaireCoursier ? 'Coursier partenaire' : 'Équipe agence G4D',
        icon: Truck,
        accent: 'text-primary bg-primary/10',
      },
      {
        label: 'Zones de tournée',
        value: String(zonesCount),
        helper: 'Livraison & ramassage actifs',
        icon: MapPin,
        accent: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60',
      },
      {
        label: 'Mode tarif ramassage',
        value: profile.ramassageLiv ? 'Activé' : 'Standard',
        helper: profile.ville?.nameFr ?? (profile.villeName || 'Ville non définie'),
        icon: Banknote,
        accent: 'text-[#f7901e] bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60',
      },
      {
        label: 'Sessions actives',
        value: String(activeSessionsCount),
        helper: 'Appareils connectés',
        icon: MonitorSmartphone,
        accent: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/60',
      },
    ];
  }

  // CLIENT (Vendeur)
  const activeBusinesses = roleSummary.businesses.filter((b) => b.isActive).length;
  const totalRibs = roleSummary.businesses.reduce((acc, b) => acc + b.comptesBancairesActifs, 0);
  return [
    {
      label: 'Enseignes actives',
      value: `${activeBusinesses} / ${roleSummary.businesses.length}`,
      helper: 'Boutiques gérées sur G4D',
      icon: Store,
      accent: 'text-primary bg-primary/10',
    },
    {
      label: 'Comptes bancaires (RIB)',
      value: String(totalRibs),
      helper: totalRibs > 0 ? 'RIB actif(s) pour virements CRBT' : 'Aucun RIB actif configuré',
      icon: CreditCard,
      accent: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60',
    },
    {
      label: 'Ville d’expédition',
      value: profile.ville?.nameFr ?? (profile.villeName || 'Non renseignée'),
      helper: profile.ville?.codeZone ? `Zone ${profile.ville.codeZone}` : 'Coordonnée protégée',
      icon: MapPin,
      accent: 'text-[#f7901e] bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60',
    },
    {
      label: 'Sessions & Sous-comptes',
      value: `${activeSessionsCount} / ${roleSummary.subAccountsCount}`,
      helper: 'Sessions actives / Équipe vendeur',
      icon: Users,
      accent: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/60',
    },
  ];
}

export function ProfileOverviewTab({
  primaryRole,
  profile,
  roleSummary,
  activeSessionsCount,
  onSelectTab,
}: {
  primaryRole: PrimaryProfileRole;
  profile: ProfileUser;
  roleSummary: ProfileRoleSummary;
  activeSessionsCount: number;
  onSelectTab: (tab: ProfileTabKey) => void;
}) {
  const kpis = buildRoleKpis(primaryRole, profile, roleSummary, activeSessionsCount);

  return (
    <div className="space-y-6">
      {/* 4 cartes KPI adaptées au rôle */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-colors dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {kpi.label}
                </p>
                <p className="mt-1.5 truncate text-lg font-extrabold text-slate-900 tabular-nums dark:text-slate-100">
                  {kpi.value}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {kpi.helper}
                </p>
              </div>
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${kpi.accent}`}
              >
                <kpi.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grille 2 colonnes : Fiche Compte + Périmètre Métier adapté */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Fiche Détails du compte */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Détails du compte
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthèse d’identité et de rattachement administratif.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectTab('informations')}
            >
              Modifier
            </Button>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Nom complet
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {profile.civilite ? `${profile.civilite} ` : ''}
                {profile.nomComplet}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">N° CIN</dt>
              <dd className="mt-0.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                {profile.cin || 'Non renseigné'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                E-mail de connexion
              </dt>
              <dd className="mt-0.5 truncate font-semibold text-slate-900 dark:text-slate-100">
                {profile.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Téléphone principal
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                {profile.telephone || 'Non renseigné'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Téléphone SAV / Secondaire
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                {profile.sav || 'Non renseigné'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Ville &amp; Code zone
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {profile.ville
                  ? `${profile.ville.nameFr} (${profile.ville.codeZone})`
                  : profile.villeName || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Localisation GPS / Maps
              </dt>
              <dd className="mt-0.5">
                {profile.lienLocalisationMaps ? (
                  <a
                    href={profile.lienLocalisationMaps}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Ouvrir dans Google Maps
                    <ArrowUpRight className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-400">Non renseignée</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Dernière mise à jour
              </dt>
              <dd className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                {formatDateTimeFr(profile.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Panneau Périmètre Métier adapté au rôle */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          {primaryRole === 'client' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Mes Enseignes &amp; Comptes Bancaires
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Les boutiques et RIB sont gérés séparément de votre fiche personnelle.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/banques"
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    RIB &amp; Banques
                  </Link>
                  <Link href="/businesses" className={buttonVariants({ size: 'sm' })}>
                    Gérer mes enseignes
                  </Link>
                </div>
              </div>

              {roleSummary.businesses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Aucune enseigne rattachée pour le moment.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {roleSummary.businesses.map((biz) => (
                    <div
                      key={biz.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                            {biz.name}
                          </span>
                          <Badge variant={biz.isActive ? 'success' : 'secondary'}>
                            {biz.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {biz.type || 'Enseigne vendeur'}
                          {biz.villeName ? ` · ${biz.villeName}` : ''}
                          {biz.modePaiement
                            ? ` · Paiement : ${biz.modePaiement === 'virement_bancaire' ? 'Virement' : 'Espèce'}`
                            : ''}
                        </p>
                      </div>
                      <Badge variant={biz.comptesBancairesActifs > 0 ? 'default' : 'warning'}>
                        {biz.comptesBancairesActifs} RIB actif
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(primaryRole === 'admin' || primaryRole === 'livreur') && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {primaryRole === 'livreur'
                    ? 'Agences, Partenaire & Zones de tournée'
                    : 'Agences rattachées & Autorisations'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Périmètre opérationnel assigné en lecture seule par la direction.
                </p>
              </div>

              {roleSummary.agenceMemberships.length === 0 &&
              roleSummary.partenaireMemberships.length === 0 &&
              !roleSummary.partenaireCoursier ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Aucun rattachement agence ou partenaire spécifique.
                </div>
              ) : (
                <div className="space-y-3">
                  {roleSummary.agenceMemberships.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            [{m.agenceCode}]
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {m.agenceNom}
                          </span>
                        </div>
                        <Badge variant={m.actif ? 'success' : 'secondary'}>Rôle : {m.role}</Badge>
                      </div>
                      {m.zones.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {m.zones.map((z) => (
                            <span
                              key={`${z.id}-${z.activite}`}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                              {z.nom} · {z.activite}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {roleSummary.partenaireCoursier && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                      <p className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                        Coursier partenaire
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                        {roleSummary.partenaireCoursier.partenaireNom} (
                        {roleSummary.partenaireCoursier.partenaireCode})
                      </p>
                    </div>
                  )}

                  {roleSummary.partenaireMemberships.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        [{pm.code}] {pm.raisonSociale}
                      </span>
                      <Badge variant="outline">{pm.role}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {roleSummary.permissionsSample.length > 0 && (
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Aperçu des autorisations ({roleSummary.permissionsCount})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleSummary.permissionsSample.slice(0, 10).map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-[11px]">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {primaryRole === 'super_admin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Gouvernance &amp; Rôles Plateforme
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Accès complet sur l’ensemble des modules et agences G4D.
                  </p>
                </div>
                <Link href="/roles" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Rôles &amp; RBAC
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Rôles assignés
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {roleSummary.roles.map((r) => (
                      <Badge key={r.id} variant="default">
                        {r.libelle} ({r.portee})
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Protection session &amp; audit
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Cookies HttpOnly + Double-Submit CSRF + {profile.passwordAlgo.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link href="/users" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Utilisateurs &amp; Comptes
                </Link>
                <Link
                  href="/agences"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Agences &amp; Zones
                </Link>
                <Link
                  href="/inscriptions"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Demandes d’inscription
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
