import { z } from 'zod';

/**
 * Contrat de réponse de l'endpoint GET /api/v1/health
 */
const RedisHealthItemSchema = z.object({
  connected: z.boolean(),
  latencyMs: z.number().nonnegative(),
});

export const HealthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  service: z.string(),
  brand: z.literal('G4D — Group For Delivery'),
  version: z.string(),
  timestamp: z.string(),
  database: RedisHealthItemSchema,
  redis: RedisHealthItemSchema.optional(),
  redisCache: RedisHealthItemSchema.optional(),
  redisQueue: RedisHealthItemSchema.optional(),
  smtpConfigured: z.boolean().optional(),
});

export type HealthStatusDto = z.infer<typeof HealthStatusSchema>;

/**
 * Durées de session sélectionnables sur la page de connexion ("Rester connecté")
 */
export const SESSION_DURATION_VALUES = ['30m', '2h', '8h', '1d', '7d', '30d'] as const;

export const SessionDurationSchema = z.enum(SESSION_DURATION_VALUES);
export type SessionDuration = z.infer<typeof SessionDurationSchema>;

export const SESSION_DURATION_OPTIONS: ReadonlyArray<{
  value: SessionDuration;
  label: string;
  ttlSeconds: number;
}> = [
  { value: '30m', label: '30 minutes', ttlSeconds: 30 * 60 },
  { value: '2h', label: '2 heures', ttlSeconds: 2 * 60 * 60 },
  { value: '8h', label: '8 heures (par défaut)', ttlSeconds: 8 * 60 * 60 },
  { value: '1d', label: '1 jour', ttlSeconds: 24 * 60 * 60 },
  { value: '7d', label: '7 jours', ttlSeconds: 7 * 24 * 60 * 60 },
  { value: '30d', label: '30 jours', ttlSeconds: 30 * 24 * 60 * 60 },
];

export const SESSION_DURATION_TTL_SECONDS: Record<SessionDuration, number> = {
  '30m': 30 * 60,
  '2h': 2 * 60 * 60,
  '8h': 8 * 60 * 60,
  '1d': 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60,
  '30d': 30 * 24 * 60 * 60,
};

/**
 * Schéma de validation partagé Front/Back pour la connexion G4D (/login)
 */
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "L'adresse e-mail ou l'identifiant est obligatoire." })
    .email({ message: 'Veuillez saisir une adresse e-mail valide (ex: marchand@g4d.ma).' }),
  password: z
    .string()
    .min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
    .max(128, { message: 'Le mot de passe est trop long.' }),
  sessionDuration: SessionDurationSchema.optional(),
  rememberMe: z.boolean().optional(),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

/**
 * Portées multi-organisationnelles (Sprint 02-B / C137)
 */
export const ROLE_SCOPE_VALUES = ['plateforme', 'agence', 'client', 'partenaire'] as const;
export const RoleScopeSchema = z.enum(ROLE_SCOPE_VALUES);
export type RoleScope = z.infer<typeof RoleScopeSchema>;

export const AGENCE_MEMBER_ROLE_VALUES = [
  'manager',
  'suivi',
  'agent',
  'livreur',
  'ramasseur',
] as const;
export const AgenceMemberRoleSchema = z.enum(AGENCE_MEMBER_ROLE_VALUES);
export type AgenceMemberRole = z.infer<typeof AgenceMemberRoleSchema>;

export const MEMBRE_ZONE_ACTIVITE_VALUES = ['livraison', 'ramassage'] as const;
export const MembreZoneActiviteSchema = z.enum(MEMBRE_ZONE_ACTIVITE_VALUES);
export type MembreZoneActivite = z.infer<typeof MembreZoneActiviteSchema>;

export const PARTENAIRE_MEMBER_ROLE_VALUES = ['admin_partenaire', 'operateur', 'lecture'] as const;
export const PartenaireMemberRoleSchema = z.enum(PARTENAIRE_MEMBER_ROLE_VALUES);
export type PartenaireMemberRole = z.infer<typeof PartenaireMemberRoleSchema>;

export const AccessAgenceMembershipSchema = z.object({
  agenceId: z.number().int().positive(),
  agenceCode: z.string(),
  agenceNom: z.string(),
  role: AgenceMemberRoleSchema,
  actif: z.boolean(),
});
export type AccessAgenceMembershipDto = z.infer<typeof AccessAgenceMembershipSchema>;

export const AccessPartenaireMembershipSchema = z.object({
  partenaireId: z.number().int().positive(),
  partenaireCode: z.string(),
  raisonSociale: z.string(),
  role: PartenaireMemberRoleSchema,
  actif: z.boolean(),
});
export type AccessPartenaireMembershipDto = z.infer<typeof AccessPartenaireMembershipSchema>;

export const AccessContextSchema = z.object({
  primaryScope: RoleScopeSchema,
  titulaireId: z.number().int().positive(),
  isSuperAdmin: z.boolean(),
  isPlatformAdmin: z.boolean(),
  selectedAgenceId: z.number().int().positive().nullable(),
  agenceMemberships: z.array(AccessAgenceMembershipSchema),
  managedAgenceIds: z.array(z.number().int().positive()),
  partenaireMemberships: z.array(AccessPartenaireMembershipSchema),
});
export type AccessContextDto = z.infer<typeof AccessContextSchema>;

/**
 * Représentation publique de l'utilisateur authentifié (sans champs sensibles)
 */
export const AuthUserSchema = z.object({
  id: z.number().int().positive(),
  titulaireId: z.number().int().positive(),
  email: z.string().email(),
  nomComplet: z.string(),
  civilite: z.string().nullable(),
  telephone: z.string().nullable(),
  villeName: z.string(),
  villeId: z.number().int().positive().nullable(),
  parentId: z.number().int().positive().nullable(),
  roleId: z.number().int().positive().nullable(),
  isSuperAdmin: z.boolean(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  tarifRamassage: z.boolean(),
  active: z.boolean(),
  accessContext: AccessContextSchema.optional(),
});

export type AuthUserDto = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
  sessionExpiresAt: z.string().datetime(),
  sessionDuration: SessionDurationSchema,
  redirectTo: z.string(),
});

export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;

export const ActiveSessionItemSchema = z.object({
  id: z.string(),
  durationCode: SessionDurationSchema,
  expiresAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  isCurrent: z.boolean(),
});
export type ActiveSessionItemDto = z.infer<typeof ActiveSessionItemSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "L'adresse e-mail est obligatoire." })
    .email({ message: 'Veuillez saisir une adresse e-mail valide.' }),
});

export type ForgotPasswordRequestDto = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, { message: "L'adresse e-mail est obligatoire." })
      .email({ message: 'Veuillez saisir une adresse e-mail valide.' }),
    token: z.string().trim().min(32, { message: 'Jeton de réinitialisation invalide.' }),
    password: z
      .string()
      .min(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
      .max(128, { message: 'Le mot de passe est trop long.' }),
    passwordConfirmation: z.string().min(8, {
      message: 'La confirmation du mot de passe doit contenir au moins 8 caractères.',
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Les deux mots de passe ne correspondent pas.',
  });

export type ResetPasswordRequestDto = z.infer<typeof ResetPasswordRequestSchema>;

/** Constantes & payload file BullMQ e-mails (partagés API <-> Worker) */
export const MAIL_QUEUE_NAME = 'g4d-mail' as const;
export const MAIL_JOB_PASSWORD_RESET = 'password-reset' as const;

export interface PasswordResetMailJobPayload {
  email: string;
  nomComplet: string;
  resetUrl: string;
  expiresMinutes: number;
  requestedAtIso: string;
  ipAddress?: string | null;
}

/**
 * Schéma de suivi rapide d'un colis depuis la Landing Page G4D
 */
export const PublicParcelTrackSchema = z.object({
  trackingCode: z
    .string()
    .trim()
    .min(4, { message: 'Veuillez saisir un code de suivi valide (ex: G4D-102948).' })
    .max(64, { message: 'Code de suivi trop long.' }),
});

export type PublicParcelTrackDto = z.infer<typeof PublicParcelTrackSchema>;

/**
 * ── Sprint 02-B : Zones, Agences, Partenaires, Rôles & Utilisateurs ──
 */
export const CreateZoneSchema = z.object({
  nom: z.string().trim().min(2, 'Nom de zone requis').max(255),
  code: z
    .string()
    .trim()
    .min(2, 'Code zone requis')
    .max(50)
    .transform((v) => v.toUpperCase()),
  actif: z.boolean().default(true),
});
export type CreateZoneDto = z.infer<typeof CreateZoneSchema>;

export const CreateAgenceSchema = z.object({
  nom: z.string().trim().min(2, "Nom d'agence requis").max(255),
  code: z
    .string()
    .trim()
    .min(2, 'Code agence requis')
    .max(50)
    .transform((v) => v.toUpperCase()),
  villeId: z.number().int().positive().nullable().optional(),
  responsableId: z.number().int().positive().nullable().optional(),
  telephone: z.string().trim().max(50).nullable().optional(),
  adresse: z.string().trim().max(500).nullable().optional(),
  actif: z.boolean().default(true),
});
export type CreateAgenceDto = z.infer<typeof CreateAgenceSchema>;

export const UpdateAgenceSchema = CreateAgenceSchema.partial();
export type UpdateAgenceDto = z.infer<typeof UpdateAgenceSchema>;

export const UpsertAgenceZoneSchema = z.object({
  zoneId: z.number().int().positive(),
  livraison: z.boolean().default(true),
  ramassage: z.boolean().default(true),
});
export type UpsertAgenceZoneDto = z.infer<typeof UpsertAgenceZoneSchema>;

export const AssignAgenceMembreSchema = z.object({
  userId: z.number().int().positive(),
  role: AgenceMemberRoleSchema,
  actif: z.boolean().default(true),
  depuis: z.string().nullable().optional(),
  jusqua: z.string().nullable().optional(),
});
export type AssignAgenceMembreDto = z.infer<typeof AssignAgenceMembreSchema>;

export const AssignMembreZoneSchema = z.object({
  zoneId: z.number().int().positive(),
  activite: MembreZoneActiviteSchema,
  actif: z.boolean().default(true),
});
export type AssignMembreZoneDto = z.infer<typeof AssignMembreZoneSchema>;

export const CreatePartenaireSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Code partenaire requis')
    .max(50)
    .transform((v) => v.toUpperCase()),
  raisonSociale: z.string().trim().min(2, 'Raison sociale requise').max(255),
  ice: z.string().trim().max(64).nullable().optional(),
  telephone: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email('E-mail partenaire invalide').nullable().optional(),
  actif: z.boolean().default(true),
});
export type CreatePartenaireDto = z.infer<typeof CreatePartenaireSchema>;

export const UpdatePartenaireSchema = CreatePartenaireSchema.partial();
export type UpdatePartenaireDto = z.infer<typeof UpdatePartenaireSchema>;

export const AssignAgencePartenaireSchema = z.object({
  agenceId: z.number().int().positive(),
  depuis: z.string().nullable().optional(),
  jusqua: z.string().nullable().optional(),
  actif: z.boolean().default(true),
});
export type AssignAgencePartenaireDto = z.infer<typeof AssignAgencePartenaireSchema>;

export const AssignPartenaireZoneSchema = z.object({
  agencePartenaireId: z.number().int().positive(),
  zoneId: z.number().int().positive(),
  actif: z.boolean().default(true),
});
export type AssignPartenaireZoneDto = z.infer<typeof AssignPartenaireZoneSchema>;

export const CreatePartenaireCoursierSchema = z.object({
  nom: z.string().trim().min(2, 'Nom du coursier requis').max(255),
  telephone: z.string().trim().max(50).nullable().optional(),
  userId: z.number().int().positive().nullable().optional(),
  actif: z.boolean().default(true),
});
export type CreatePartenaireCoursierDto = z.infer<typeof CreatePartenaireCoursierSchema>;

export const CreatePartenaireMembreSchema = z.object({
  userId: z.number().int().positive(),
  role: PartenaireMemberRoleSchema.default('operateur'),
  actif: z.boolean().default(true),
});
export type CreatePartenaireMembreDto = z.infer<typeof CreatePartenaireMembreSchema>;

export const CreateApiIdentifiantSchema = z.object({
  libelle: z.string().trim().min(2, 'Libellé requis').max(120),
  partenaireId: z.number().int().positive().nullable().optional(),
  userId: z.number().int().positive().nullable().optional(),
  scopes: z.array(z.string().trim().min(1)).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type CreateApiIdentifiantDto = z.infer<typeof CreateApiIdentifiantSchema>;

export const UpsertPartenaireConnexionSchema = z.object({
  apiTypeCode: z.string().trim().min(2).max(64).default('custom'),
  baseUrl: z.string().url('URL de connexion invalide').max(500),
  identifiant: z.string().trim().min(1, 'Identifiant requis'),
  secret: z.string().trim().min(1, 'Secret requis'),
  actif: z.boolean().default(true),
});
export type UpsertPartenaireConnexionDto = z.infer<typeof UpsertPartenaireConnexionSchema>;

export const CreateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nom technique du rôle requis')
    .max(100)
    .regex(/^[a-z0-9_:-]+$/, 'Utiliser uniquement minuscules, chiffres, _, : ou -'),
  libelle: z.string().trim().min(2, 'Libellé lisible requis').max(100),
  portee: RoleScopeSchema.default('client'),
  agenceId: z.number().int().positive().nullable().optional(),
  compteClientId: z.number().int().positive().nullable().optional(),
  partenaireId: z.number().int().positive().nullable().optional(),
  permissionIds: z.array(z.number().int().positive()).default([]),
});
export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = z.object({
  libelle: z.string().trim().min(2).max(100).optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
});
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;

export const CreateUserSchema = z.object({
  nomComplet: z.string().trim().min(2, 'Nom complet requis').max(255),
  email: z.string().trim().email('Adresse e-mail invalide'),
  password: z.string().min(8, 'Au moins 8 caractères').max(128),
  telephone: z.string().trim().max(50).default(''),
  villeId: z.number().int().positive().nullable().optional(),
  active: z.boolean().default(true),
  roleId: z.number().int().positive(),
  agenceId: z.number().int().positive().nullable().optional(),
  agenceRole: AgenceMemberRoleSchema.nullable().optional(),
  partenaireId: z.number().int().positive().nullable().optional(),
  partenaireRole: PartenaireMemberRoleSchema.nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  nomComplet: z.string().trim().min(2).max(255).optional(),
  telephone: z.string().trim().max(50).optional(),
  villeId: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  roleId: z.number().int().positive().optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
