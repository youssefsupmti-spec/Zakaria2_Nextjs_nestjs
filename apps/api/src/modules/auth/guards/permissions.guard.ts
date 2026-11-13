import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { AuthContext } from '../auth.types';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/auth.decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { authContext?: AuthContext }>();
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException('Contexte utilisateur absent.');
    }

    if (authContext.user.isSuperAdmin) {
      return true;
    }

    const userPermSet = new Set(authContext.user.permissions);
    const missing = requiredPermissions.filter((perm) => !userPermSet.has(perm));

    if (missing.length > 0) {
      throw new ForbiddenException(
        `Accès refusé : permission(s) requise(s) (${missing.join(', ')}).`,
      );
    }

    return true;
  }
}

