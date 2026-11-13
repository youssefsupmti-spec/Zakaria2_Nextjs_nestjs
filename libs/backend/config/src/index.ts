import { z } from 'zod';

const BackendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  WEB_PORT: z.coerce.number().int().positive().default(3100),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(3101),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: z
    .string()
    .default('https://app.g4dmaroc.xyz,https://api.g4dmaroc.xyz,http://localhost:3100'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL est obligatoire')
    .default('postgresql://postgres:postgres@localhost:5432/zakaria2_next_dev?schema=public'),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_USERNAME: z.string().default('default'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_PREFIX: z.string().default('zakaria2'),
  AUTH_COOKIE_NAME: z.string().min(1).optional(),
  AUTH_SECRET: z
    .string()
    .min(16)
    .default('dev-only-g4d-auth-secret-change-me-in-production'),
  APP_PUBLIC_URL: z.string().url().default('https://app.g4dmaroc.xyz'),
  API_INTERNAL_URL: z.string().url().default('http://127.0.0.1:3101'),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_SECURE: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('G4D Delivery <no-reply@g4dmaroc.xyz>'),
  LEGACY_MYSQL_URL: z.string().optional(),
});

export type BackendEnv = Omit<z.infer<typeof BackendEnvSchema>, 'AUTH_COOKIE_NAME' | 'MAIL_HOST'> & {
  AUTH_COOKIE_NAME: string;
  MAIL_HOST: string;
};

let cachedEnv: BackendEnv | null = null;

/**
 * Charge et valide strictement les variables d'environnement du backend NestJS/Worker.
 * Si REDIS_URL est défini (ex: redis://default:pass@host:6379), extrait automatiquement
 * REDIS_HOST, REDIS_PORT, REDIS_USERNAME et REDIS_PASSWORD.
 */
export function loadBackendEnv(
  rawEnv: Record<string, string | undefined> = process.env,
): BackendEnv {
  if (cachedEnv && rawEnv === process.env) {
    return cachedEnv;
  }

  const parsed = BackendEnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`[G4D BackendConfig] Configuration d'environnement invalide: ${details}`);
  }

  const resolvedData: BackendEnv = {
    ...parsed.data,
    AUTH_COOKIE_NAME:
      parsed.data.AUTH_COOKIE_NAME?.trim() ||
      (parsed.data.NODE_ENV === 'production' ? '__Host-g4d.session' : 'g4d.session'),
    MAIL_HOST:
      parsed.data.MAIL_HOST?.trim() ||
      (parsed.data.NODE_ENV === 'production' ? 'mailpit' : '127.0.0.1'),
  };

  if (!rawEnv.API_PORT && resolvedData.PORT) {
    resolvedData.API_PORT = resolvedData.PORT;
  }

  if (resolvedData.REDIS_URL) {
    try {
      const url = new URL(resolvedData.REDIS_URL);
      if (url.hostname) resolvedData.REDIS_HOST = url.hostname;
      if (url.port) resolvedData.REDIS_PORT = Number(url.port);
      if (url.username) resolvedData.REDIS_USERNAME = decodeURIComponent(url.username);
      if (url.password) resolvedData.REDIS_PASSWORD = decodeURIComponent(url.password);
    } catch {
      // Conserver les valeurs par défaut si l'URL est mal formée
    }
  }

  if (rawEnv === process.env) {
    cachedEnv = resolvedData;
  }
  return resolvedData;
}
