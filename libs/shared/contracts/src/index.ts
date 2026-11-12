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
  rememberMe: z.boolean(),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

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

