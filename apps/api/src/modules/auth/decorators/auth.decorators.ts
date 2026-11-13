import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AuthContext } from '../auth.types';

export const REQUIRED_PERMISSIONS_KEY = 'g4d:required_permissions';

/**
 * Déclare les permissions RBAC exigées pour accéder à un endpoint ou un contrôleur.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/**
 * Extrait le contexte d'authentification complet (`user`, `titulaireId`, `sessionId`) injecté par SessionAuthGuard.
 */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { authContext?: AuthContext }>();
    if (!request.authContext) {
      throw new Error('CurrentAuth utilisé sans SessionAuthGuard.');
    }
    return request.authContext;
  },
);
