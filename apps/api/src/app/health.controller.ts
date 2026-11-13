import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';
import type { HealthStatusDto } from '@zakaria/shared-contracts';

@ApiTags('Santé')
@Controller('health')
export class HealthController {
  private readonly env = loadBackendEnv();

  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Vérification santé PostgreSQL, Redis Cache & Redis Queue' })
  async checkHealth(): Promise<HealthStatusDto> {
    const [dbPing, cachePing, queuePing] = await Promise.all([
      this.databaseService.ping(),
      this.databaseService.pingCacheRedis(),
      this.databaseService.pingQueueRedis(),
    ]);

    const healthy = dbPing.connected && cachePing.connected && queuePing.connected;

    return {
      status: healthy ? 'ok' : 'degraded',
      service: 'zakaria2-api',
      brand: 'G4D — Group For Delivery',
      version: '0.2.5-lot25',
      timestamp: new Date().toISOString(),
      database: dbPing,
      redis: cachePing,
      redisCache: cachePing,
      redisQueue: queuePing,
      smtpConfigured: this.env.SMTP_CONFIGURED,
    };
  }
}
