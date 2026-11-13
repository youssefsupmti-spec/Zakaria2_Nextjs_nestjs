import { z } from 'zod';

/**
 * Contrat de réponse de l'endpoint GET /api/v1/health
 */
export const HealthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  service: z.string(),
  brand: z.literal('G4D — Group For Delivery'),
  version: z.string(),
  timestamp: z.string(),
  database: z.object({
    connected: z.boolean(),
    latencyMs: z.number().nonnegative(),
  }),
  redis: z
    .object({
      connected: z.boolean(),
      latencyMs: z.number().nonnegative(),
    })
    .optional(),
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
  /** Compatibilité transitoire avec l'ancien formulaire Lot 2.4 */
  rememberMe: z.boolean().optional(),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

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
});

export type AuthUserDto = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
  sessionExpiresAt: z.string().datetime(),
  sessionDuration: SessionDurationSchema,
  redirectTo: z.string(),
});

export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;

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

