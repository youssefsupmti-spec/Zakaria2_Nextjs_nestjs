import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { loadBackendEnv } from '@zakaria/backend-config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor() {
    const env = loadBackendEnv();
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
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

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

export * from './database.module';

