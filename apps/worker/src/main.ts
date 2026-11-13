import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadBackendEnv } from '@zakaria/backend-config';
import { WorkerModule } from './app/worker.module';

async function bootstrapWorker(): Promise<void> {
  const env = loadBackendEnv();
  const logger = new Logger('G4D-Worker');

  const appContext = await NestFactory.createApplicationContext(WorkerModule);
  appContext.enableShutdownHooks();

  logger.log(
    `⚙️ Worker G4D initialisé (Redis cible: ${env.REDIS_HOST}:${env.REDIS_PORT}, préfixe: ${env.REDIS_PREFIX})`,
  );
}

void bootstrapWorker();
