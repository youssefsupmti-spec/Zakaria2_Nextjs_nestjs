import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../app/app.module';
import { buildOpenApiDocument } from '../app/swagger.setup';

async function generateOpenApi(): Promise<void> {
  process.env.NODE_ENV = 'test';
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { logger: false, abortOnError: false },
  );

  try {
    app.setGlobalPrefix('api/v1');
    const document = buildOpenApiDocument(app);
    const outPath = path.resolve(process.cwd(), 'apps/api/openapi.json');
    await writeFile(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    console.log(`[G4D OpenAPI] Spécification générée : ${outPath}`);
  } finally {
    await app.close();
  }
}

void generateOpenApi();
