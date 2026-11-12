import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { loadBackendEnv } from '@zakaria/backend-config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;
  private redis: Redis;

  constructor() {
    const env = loadBackendEnv();
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    this.redis = env.REDIS_URL
      ? new Redis(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 4_000,
        })
      : new Redis({
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          username: env.REDIS_USERNAME,
          password: env.REDIS_PASSWORD,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 4_000,
        });

    this.redis.on('error', () => {
      // Géré lors du ping() pour éviter les crashs non-capturés
    });
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
      const redisOk = await this.pingRedis();
      if (redisOk.connected) {
        this.logger.log(`Redis connecté (${redisOk.latencyMs} ms)`);
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

  async pingRedis(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = performance.now();
    try {
      if (this.redis.status === 'wait' || this.redis.status === 'end') {
        await this.redis.connect();
      }
      const pong = await this.redis.ping();
      const latencyMs = Math.round(performance.now() - start);
      return { connected: pong === 'PONG', latencyMs };
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      return { connected: false, latencyMs };
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}

export * from './database.module';
