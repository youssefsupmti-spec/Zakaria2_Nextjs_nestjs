import { Module } from '@nestjs/common';
import { DatabaseModule } from '@zakaria/backend-database';
import { MailWorkerService } from './mail-worker.service';

@Module({
  imports: [DatabaseModule],
  providers: [MailWorkerService],
})
export class WorkerModule {}

