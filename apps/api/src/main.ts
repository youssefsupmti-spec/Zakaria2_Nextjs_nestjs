import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import { loadBackendEnv } from '@zakaria/backend-config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { setupSwaggerDocs } from './app/swagger.setup';
import { GlobalHttpExceptionFilter } from './common/filters/global-http-exception.filter';

async function bootstrap(): Promise<void> {
  const env = loadBackendEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
    { bufferLogs: true },
  );

  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.register(fastifyCookie);
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  const allowedOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  if (env.SWAGGER_ENABLED) {
    setupSwaggerDocs(app);
    logger.log(`Documentation OpenAPI active sur /api/docs`, 'G4D-API');
  }

  app.enableShutdownHooks();

  await app.listen(env.API_PORT, env.API_HOST);
  logger.log(
    `API G4D NestJS + Fastify démarrée sur http://${env.API_HOST}:${env.API_PORT}/api/v1`,
    'G4D-API',
  );
}

void bootstrap();
