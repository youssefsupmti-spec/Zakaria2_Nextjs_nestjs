import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export function buildOpenApiDocument(app: NestFastifyApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('G4D Delivery — API Plateforme')
    .setDescription(
      'API NestJS/Fastify G4D (Authentification sessions opaques, Multi-Agences, Partenaires B2B, RBAC borné, Stockage local).',
    )
    .setVersion('0.2.5-sprint02b')
    .addCookieAuth('g4d.session')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwaggerDocs(app: NestFastifyApplication): OpenAPIObject {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
  });
  return document;
}
