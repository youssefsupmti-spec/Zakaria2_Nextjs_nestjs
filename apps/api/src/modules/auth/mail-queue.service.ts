import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { getBullMqConnectionOptions, loadBackendEnv } from '@zakaria/backend-config';
import {
  MAIL_JOB_PASSWORD_RESET,
  MAIL_QUEUE_NAME,
  type PasswordResetMailJobPayload,
} from '@zakaria/shared-contracts';

@Injectable()
export class MailQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private readonly queue: Queue<PasswordResetMailJobPayload>;

  constructor() {
    const env = loadBackendEnv();
    this.queue = new Queue<PasswordResetMailJobPayload>(MAIL_QUEUE_NAME, {
      prefix: env.REDIS_PREFIX,
      connection: getBullMqConnectionOptions(env),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    });

    this.queue.on('error', (error) => {
      this.logger.warn(`Erreur file BullMQ '${MAIL_QUEUE_NAME}': ${error.message}`);
    });
  }

  async enqueuePasswordReset(payload: PasswordResetMailJobPayload): Promise<void> {
    await this.queue.add(MAIL_JOB_PASSWORD_RESET, payload);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
