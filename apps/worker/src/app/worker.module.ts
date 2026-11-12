import { Module } from '@nestjs/common';
import { DatabaseModule } from '@zakaria/backend-database';

@Module({
  imports: [DatabaseModule],
})
export class WorkerModule {}

