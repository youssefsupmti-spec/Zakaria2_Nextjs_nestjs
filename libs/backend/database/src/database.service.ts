import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { loadBackendEnv, type RedisConnectionConfig } from '@zakaria/backend-config';

function createRedisClient(config: RedisConnectionConfig): Redis {
  const client = config.url
    ? new Redis(config.url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 4_000,
      })
    : new Redis({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 4_000,
      });

  client.on('error', () => {
    // Géré lors du ping() pour éviter les crashs non-capturés au boot
  });

  return client;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;
  private readonly cacheRedis: Redis;
  private readonly queueRedis: Redis;
  readonly prisma: PrismaClient;

  constructor() {
    const env = loadBackendEnv();
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 15,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    const adapter = new PrismaPg(this.pool);
    this.prisma = new PrismaClient({ adapter });

    this.cacheRedis = createRedisClient(env.REDIS_CACHE);
    const sameRedisTarget =
      (env.REDIS_CACHE.url && env.REDIS_CACHE.url === env.REDIS_QUEUE.url) ||
      (!env.REDIS_CACHE.url &&
        !env.REDIS_QUEUE.url &&
        env.REDIS_CACHE.host === env.REDIS_QUEUE.host &&
        env.REDIS_CACHE.port === env.REDIS_QUEUE.port);
    this.queueRedis = sameRedisTarget ? this.cacheRedis : createRedisClient(env.REDIS_QUEUE);
  }

  /** Instance Redis Cache (allkeys-lru : sessions, AccessContext RBAC, rate limiting). */
  getCacheRedisClient(): Redis {
    return this.cacheRedis;
  }

  /** Compatibilité ascendante : retourne le client Redis Cache. */
  getRedisClient(): Redis {
    return this.cacheRedis;
  }

  /** Instance Redis Queue dédiée à BullMQ (noeviction). */
  getQueueRedisClient(): Redis {
    return this.queueRedis;
  }

  getPgPool(): Pool {
    return this.pool;
  }

  async onModuleInit(): Promise<void> {
    try {
      const ok = await this.ping();
      if (ok.connected) {
        this.logger.log(`PostgreSQL connecté (${ok.latencyMs} ms)`);
      }
    } catch (error) {
      this.logger.warn(
        `PostgreSQL non joignable à l'initialisation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const [cacheOk, queueOk] = await Promise.all([this.pingCacheRedis(), this.pingQueueRedis()]);
      if (cacheOk.connected) {
        this.logger.log(`Redis Cache connecté (${cacheOk.latencyMs} ms)`);
      }
      if (queueOk.connected) {
        this.logger.log(`Redis Queue connecté (${queueOk.latencyMs} ms)`);
      }
    } catch (error) {
      this.logger.warn(
        `Redis non joignable à l'initialisation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async ping(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = performance.now();
    try {
      await this.pool.query('SELECT 1 AS ok');
      const latencyMs = Math.round(performance.now() - start);
      return { connected: true, latencyMs };
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      return { connected: false, latencyMs };
    }
  }

  private async pingRedisClient(client: Redis): Promise<{ connected: boolean; latencyMs: number }> {
    const start = performance.now();
    try {
      if (client.status === 'wait' || client.status === 'end') {
        await client.connect();
      }
      const pong = await client.ping();
      const latencyMs = Math.round(performance.now() - start);
      return { connected: pong === 'PONG', latencyMs };
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      return { connected: false, latencyMs };
    }
  }

  async pingCacheRedis(): Promise<{ connected: boolean; latencyMs: number }> {
    return this.pingRedisClient(this.cacheRedis);
  }

  async pingQueueRedis(): Promise<{ connected: boolean; latencyMs: number }> {
    return this.pingRedisClient(this.queueRedis);
  }

  async pingRedis(): Promise<{ connected: boolean; latencyMs: number }> {
    return this.pingCacheRedis();
  }

  private async closeRedisClient(client: Redis): Promise<void> {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.prisma.$disconnect();
    } finally {
      await this.pool.end();
      await this.closeRedisClient(this.cacheRedis);
      if (this.queueRedis !== this.cacheRedis) {
        await this.closeRedisClient(this.queueRedis);
      }
    }
  }
}

export { Prisma, PrismaClient };
