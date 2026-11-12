import { Module } from '@nestjs/common';
import { DatabaseModule } from '@zakaria/backend-database';
import { HealthController } from './health.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
})
export class AppModule {}

