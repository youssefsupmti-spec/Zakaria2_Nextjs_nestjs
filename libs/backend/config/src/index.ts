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
});

export type BackendEnv = z.infer<typeof BackendEnvSchema>;

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

  const data = { ...parsed.data };

  if (!rawEnv.API_PORT && data.PORT) {
    data.API_PORT = data.PORT;
  }

  if (data.REDIS_URL) {
    try {
      const url = new URL(data.REDIS_URL);
      if (url.hostname) data.REDIS_HOST = url.hostname;
      if (url.port) data.REDIS_PORT = Number(url.port);
      if (url.username) data.REDIS_USERNAME = decodeURIComponent(url.username);
      if (url.password) data.REDIS_PASSWORD = decodeURIComponent(url.password);
    } catch {
      // Conserver les valeurs par défaut si l'URL est mal formée
    }
  }

  if (rawEnv === process.env) {
    cachedEnv = data;
  }
  return data;
}
