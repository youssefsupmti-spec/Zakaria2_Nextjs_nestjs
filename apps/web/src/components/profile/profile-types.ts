export type ProfileTabKey = 'apercu' | 'informations' | 'securite' | 'sessions' | 'preferences';

export type PrimaryProfileRole = 'super_admin' | 'admin' | 'client' | 'livreur';

export interface ProfileRoleItem {
  id: number;
  name: string;
  libelle: string;
  portee: string;
}

export interface ProfileBusinessItem {
  id: number;
  name: string;
  type: string | null;
  isActive: boolean;
  modePaiement: string | null;
  villeName: string | null;
  comptesBancairesCount: number;
  comptesBancairesActifs: number;
}

export interface ProfileAgenceZoneItem {
  id: number;
  nom: string;
  code: string;
  activite: string;
}

export interface ProfileAgenceMembershipItem {
  id: number;
  agenceId: number;
  agenceNom: string;
  agenceCode: string;
  role: string;
  actif: boolean;
  depuis: string | null;
  zones: ProfileAgenceZoneItem[];
}

export interface ProfileAgenceResponsableItem {
  id: number;
  nom: string;
  code: string;
  actif: boolean;
}

export interface ProfilePartenaireMembershipItem {
  id: number;
  partenaireId: number;
  raisonSociale: string;
  code: string;
  role: string;
  actif: boolean;
}

export interface ProfilePartenaireCoursierItem {
  id: number;
  nom: string;
  actif: boolean;
  partenaireNom: string;
  partenaireCode: string;
}

export interface ProfileUser {
  id: number;
  nomComplet: string;
  civilite: string | null;
  picture: string;
  avatarDataUrl: string | null;
  email: string;
  telephone: string;
  sav: string;
  villeId: number | null;
  villeName: string;
  cin: string;
  lienLocalisationMaps: string;
  active: boolean;
  ramassageLiv: boolean;
  inscriptionStatut: string | null;
  passwordAlgo: string;
  passwordResetAt: string | null;
  parentId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  ville: {
    id: number;
    nameFr: string;
    codeZone: string;
  } | null;
}

export interface ProfileRoleSummary {
  roles: ProfileRoleItem[];
  permissionsCount: number;
  permissionsSample: string[];
  businesses: ProfileBusinessItem[];
  agenceMemberships: ProfileAgenceMembershipItem[];
  agencesResponsable: ProfileAgenceResponsableItem[];
  partenaireMemberships: ProfilePartenaireMembershipItem[];
  partenaireCoursier: ProfilePartenaireCoursierItem | null;
  subAccountsCount: number;
}

export interface ContactChangeRequestItem {
  id: number;
  detail: string;
  ipAddress: string | null;
  createdAt: string | null;
}

export interface SecurityLogItem {
  id: number;
  event: string;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  createdAt: string | null;
}

export interface ProfileResponse {
  profile: ProfileUser;
  roleSummary: ProfileRoleSummary;
  contactChangeRequests: ContactChangeRequestItem[];
  securityLogs: SecurityLogItem[];
}

export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  label: string;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  barClass: string;
  textClass: string;
  checks: {
    minLength: boolean;
    hasUpperAndLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

/** Décode un User-Agent HTTP brut en informations lisibles (navigateur, OS, type d'appareil). */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  if (!userAgent) {
    return {
      browser: 'Navigateur inconnu',
      os: 'Système inconnu',
      deviceType: 'desktop',
      label: 'Navigateur inconnu',
    };
  }

  let browser = 'Navigateur web';
  if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
  else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) browser = 'Opera';
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium'))
    browser = 'Google Chrome';
  else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';
  else if (userAgent.includes('curl/')) browser = 'Client CLI (curl)';

  let os = 'Système inconnu';
  if (userAgent.includes('Windows NT')) os = 'Windows';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone')) os = 'iPhone (iOS)';
  else if (userAgent.includes('iPad')) os = 'iPadOS';
  else if (userAgent.includes('Mac OS X')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';

  const deviceType: ParsedUserAgent['deviceType'] = /iPad|Tablet/i.test(userAgent)
    ? 'tablet'
    : /Mobi|Android|iPhone/i.test(userAgent)
      ? 'mobile'
      : 'desktop';

  return {
    browser,
    os,
    deviceType,
    label: `${browser} sur ${os}`,
  };
}

/** Évalue la robustesse d'un nouveau mot de passe selon 4 critères standards. */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUpperAndLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      label: 'À saisir',
      barClass: 'bg-slate-200 dark:bg-slate-700',
      textClass: 'text-slate-400',
      checks,
    };
  }

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.max(1, passedCount) as 1 | 2 | 3 | 4;

  if (score <= 1) {
    return {
      score: 1,
      label: 'Faible',
      barClass: 'bg-red-500',
      textClass: 'text-red-600 dark:text-red-400',
      checks,
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: 'Moyen',
      barClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
      checks,
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: 'Bon',
      barClass: 'bg-sky-500',
      textClass: 'text-sky-600 dark:text-sky-400',
      checks,
    };
  }

  return {
    score: 4,
    label: 'Excellent',
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    checks,
  };
}

/** Détermine la catégorie métier principale parmi les 4 rôles pour adapter l'affichage de /profil. */
export function resolvePrimaryProfileRole(
  roleNames: string[],
  isSuperAdmin: boolean,
  roleSummary?: ProfileRoleSummary,
): PrimaryProfileRole {
  const lower = new Set(roleNames.map((r) => r.toLowerCase()));
  if (isSuperAdmin || lower.has('super_admin')) return 'super_admin';
  if (lower.has('livreur') || lower.has('ramasseur')) return 'livreur';
  if (
    lower.has('admin') ||
    lower.has('manager') ||
    lower.has('suivi') ||
    (roleSummary &&
      roleSummary.agenceMemberships.some((m) => ['manager', 'suivi', 'agent'].includes(m.role)))
  ) {
    return 'admin';
  }
  if (
    roleSummary &&
    (roleSummary.agenceMemberships.some((m) => ['livreur', 'ramasseur'].includes(m.role)) ||
      roleSummary.partenaireCoursier !== null)
  ) {
    return 'livreur';
  }
  return 'client';
}

export function formatRoleMeta(roleName: string): { label: string; className: string } {
  switch (roleName.toLowerCase()) {
    case 'super_admin':
      return {
        label: 'Super Admin',
        className: 'border-red-300/40 bg-red-500/20 text-white',
      };
    case 'admin':
      return {
        label: 'Administrateur',
        className: 'border-amber-300/40 bg-amber-500/25 text-white',
      };
    case 'client':
      return {
        label: 'Vendeur / Client',
        className: 'border-sky-300/40 bg-sky-500/25 text-white',
      };
    case 'livreur':
    case 'ramasseur':
      return {
        label: 'Livreur / Coursier',
        className: 'border-emerald-300/40 bg-emerald-500/25 text-white',
      };
    default:
      return {
        label: roleName,
        className: 'border-white/25 bg-white/15 text-white',
      };
  }
}

export type SecurityEventIconKey =
  | 'shield_check'
  | 'logout'
  | 'key'
  | 'lock'
  | 'user'
  | 'camera'
  | 'edit'
  | 'devices'
  | 'alert'
  | 'history';

export function formatSecurityEvent(event: string): {
  label: string;
  icon: SecurityEventIconKey;
  toneClass: string;
} {
  switch (event) {
    case 'login':
      return {
        label: 'Connexion réussie',
        icon: 'shield_check',
        toneClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
      };
    case 'logout':
      return {
        label: 'Déconnexion',
        icon: 'logout',
        toneClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      };
    case 'password_changed':
      return {
        label: 'Mot de passe modifié',
        icon: 'key',
        toneClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300',
      };
    case 'password_reset':
      return {
        label: 'Mot de passe réinitialisé',
        icon: 'lock',
        toneClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
      };
    case 'profile_updated':
      return {
        label: 'Profil mis à jour',
        icon: 'user',
        toneClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
      };
    case 'avatar_updated':
      return {
        label: 'Photo de profil modifiée',
        icon: 'camera',
        toneClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300',
      };
    case 'contact_change_requested':
      return {
        label: 'Demande de modification coordonnées',
        icon: 'edit',
        toneClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      };
    case 'sessions_revoked_others':
      return {
        label: 'Autres appareils déconnectés',
        icon: 'devices',
        toneClass: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
      };
    case 'login_failed':
      return {
        label: 'Tentative de connexion refusée',
        icon: 'alert',
        toneClass: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300',
      };
    default:
      return {
        label: event,
        icon: 'history',
        toneClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}

export function formatDateTimeFr(iso: string | null | undefined, withTime = true): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(date);
}

export function extractInitials(fullName: string | null | undefined): string {
  const parts = (fullName ?? 'G4').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'G4';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
