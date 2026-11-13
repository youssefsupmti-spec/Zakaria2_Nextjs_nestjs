import 'dotenv/config';
import { z } from 'zod';

export interface RedisConnectionConfig {
  url?: string;
  host: string;
  port: number;
  username: string;
  password?: string;
}

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
  REDIS_CACHE_URL: z.string().optional(),
  REDIS_QUEUE_URL: z.string().optional(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(56379),
  REDIS_USERNAME: z.string().default('default'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_PREFIX: z.string().default('zakaria2'),
  AUTH_COOKIE_NAME: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(16).default('dev-only-g4d-auth-secret-change-me-in-production'),
  CSRF_SECRET: z.string().min(16).optional(),
  API_SECRET_PEPPER: z.string().min(16).optional(),
  APP_PUBLIC_URL: z.string().url().default('https://app.g4dmaroc.xyz'),
  API_INTERNAL_URL: z.string().url().default('http://127.0.0.1:3101'),
  STORAGE_LOCAL_PATH: z.string().min(1).optional(),
  SWAGGER_ENABLED: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true' || v === '1')),
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

export type BackendEnv = Omit<
  z.infer<typeof BackendEnvSchema>,
  | 'AUTH_COOKIE_NAME'
  | 'MAIL_HOST'
  | 'CSRF_SECRET'
  | 'API_SECRET_PEPPER'
  | 'STORAGE_LOCAL_PATH'
  | 'SWAGGER_ENABLED'
> & {
  AUTH_COOKIE_NAME: string;
  MAIL_HOST: string;
  SMTP_CONFIGURED: boolean;
  CSRF_SECRET: string;
  API_SECRET_PEPPER: string;
  STORAGE_LOCAL_PATH: string;
  SWAGGER_ENABLED: boolean;
  REDIS_CACHE: RedisConnectionConfig;
  REDIS_QUEUE: RedisConnectionConfig;
};

let cachedEnv: BackendEnv | null = null;

function parseRedisUrl(
  redisUrl: string | undefined,
  fallback: RedisConnectionConfig,
): RedisConnectionConfig {
  if (!redisUrl) {
    return { ...fallback };
  }

  try {
    const url = new URL(redisUrl);
    return {
      url: redisUrl,
      host: url.hostname || fallback.host,
      port: url.port ? Number(url.port) : fallback.port,
      username: url.username ? decodeURIComponent(url.username) : fallback.username,
      password: url.password ? decodeURIComponent(url.password) : fallback.password,
    };
  } catch {
    return { ...fallback };
  }
}

/**
 * Charge et valide strictement les variables d'environnement du backend NestJS/Worker.
 * Prend en charge la séparation Redis Cache (LRU) / Redis Queue (noeviction) avec fallback
 * compatible sur REDIS_URL si une seule instance est fournie.
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

  const isProd = parsed.data.NODE_ENV === 'production';
  const mailHost = parsed.data.MAIL_HOST?.trim() || (isProd ? '' : '127.0.0.1');

  const fallbackRedis: RedisConnectionConfig = {
    url: parsed.data.REDIS_URL,
    host: parsed.data.REDIS_HOST,
    port: parsed.data.REDIS_PORT,
    username: parsed.data.REDIS_USERNAME,
    password: parsed.data.REDIS_PASSWORD,
  };

  const baseRedis = parseRedisUrl(parsed.data.REDIS_URL, fallbackRedis);
  const cacheRedis = parseRedisUrl(parsed.data.REDIS_CACHE_URL, baseRedis);
  const queueRedis = parseRedisUrl(parsed.data.REDIS_QUEUE_URL, baseRedis);

  const resolvedData: BackendEnv = {
    ...parsed.data,
    API_PORT: !rawEnv.API_PORT && parsed.data.PORT ? parsed.data.PORT : parsed.data.API_PORT,
    REDIS_HOST: queueRedis.host,
    REDIS_PORT: queueRedis.port,
    REDIS_USERNAME: queueRedis.username,
    REDIS_PASSWORD: queueRedis.password,
    REDIS_CACHE: cacheRedis,
    REDIS_QUEUE: queueRedis,
    AUTH_COOKIE_NAME:
      parsed.data.AUTH_COOKIE_NAME?.trim() || (isProd ? '__Host-g4d.session' : 'g4d.session'),
    CSRF_SECRET: parsed.data.CSRF_SECRET?.trim() || `${parsed.data.AUTH_SECRET}:csrf-subkey-g4d`,
    API_SECRET_PEPPER:
      parsed.data.API_SECRET_PEPPER?.trim() || `${parsed.data.AUTH_SECRET}:api-pepper-g4d`,
    STORAGE_LOCAL_PATH:
      parsed.data.STORAGE_LOCAL_PATH?.trim() ||
      (isProd ? '/app/storage/uploads' : './storage/uploads'),
    SWAGGER_ENABLED: parsed.data.SWAGGER_ENABLED ?? !isProd,
    MAIL_HOST: mailHost,
    SMTP_CONFIGURED: Boolean(mailHost) && !(isProd && mailHost.toLowerCase() === 'mailpit'),
  };

  if (rawEnv === process.env) {
    cachedEnv = resolvedData;
  }
  return resolvedData;
}

/** Construit les options de connexion IORedis attendues par BullMQ (Queue & Worker). */
export function getBullMqConnectionOptions(env: BackendEnv = loadBackendEnv()): {
  host: string;
  port: number;
  username: string;
  password?: string;
  maxRetriesPerRequest: null;
} {
  return {
    host: env.REDIS_QUEUE.host,
    port: env.REDIS_QUEUE.port,
    username: env.REDIS_QUEUE.username,
    ...(env.REDIS_QUEUE.password ? { password: env.REDIS_QUEUE.password } : {}),
    maxRetriesPerRequest: null,
  };
}
