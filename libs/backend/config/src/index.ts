import { z } from 'zod';

const BackendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  WEB_PORT: z.coerce.number().int().positive().default(3100),
  API_PORT: z.coerce.number().int().positive().default(3101),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: z.string().default('http://localhost:3100'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL est obligatoire')
    .default('postgresql://postgres:postgres@localhost:5432/zakaria2_next_dev?schema=public'),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PREFIX: z.string().default('zakaria2'),
});

export type BackendEnv = z.infer<typeof BackendEnvSchema>;

let cachedEnv: BackendEnv | null = null;

/**
 * Charge et valide strictement les variables d'environnement du backend NestJS/Worker.
 */
export function loadBackendEnv(rawEnv: Record<string, string | undefined> = process.env): BackendEnv {
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

  if (rawEnv === process.env) {
    cachedEnv = parsed.data;
  }
  return parsed.data;
}

