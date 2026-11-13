import { Module } from '@nestjs/common';
import { DatabaseModule } from '@zakaria/backend-database';
import { AuthModule } from '../modules/auth/auth.module';
import { HealthController } from './health.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}

