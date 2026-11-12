import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import type { HealthStatusDto } from '@zakaria/shared-contracts';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async checkHealth(): Promise<HealthStatusDto> {
    const dbPing = await this.databaseService.ping();

    return {
      status: dbPing.connected ? 'ok' : 'degraded',
      service: 'zakaria2-api',
      brand: 'G4D — Group For Delivery',
      version: '0.1.0-sprint01',
      timestamp: new Date().toISOString(),
      database: dbPing,
    };
  }
}

