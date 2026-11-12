import { Controller, Get, Inject } from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import type { HealthStatusDto } from '@zakaria/shared-contracts';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  async checkHealth(): Promise<HealthStatusDto> {
    const [dbPing, redisPing] = await Promise.all([
      this.databaseService.ping(),
      this.databaseService.pingRedis(),
    ]);

    return {
      status: dbPing.connected && redisPing.connected ? 'ok' : 'degraded',
      service: 'zakaria2-api',
      brand: 'G4D — Group For Delivery',
      version: '0.1.0-sprint01',
      timestamp: new Date().toISOString(),
      database: dbPing,
      redis: redisPing,
    };
  }
}
