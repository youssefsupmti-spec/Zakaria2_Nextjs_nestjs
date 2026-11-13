import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import type { FastifyRequest } from 'fastify';
import type { AuthContext } from '../auth.types';
import { SessionService } from '../session.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly cookieName = loadBackendEnv().AUTH_COOKIE_NAME;

  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { authContext?: AuthContext }>();

    const rawToken =
      request.cookies?.[this.cookieName] ??
      request.cookies?.['__Host-g4d.session'] ??
      request.cookies?.['g4d.session'];

    if (!rawToken) {
      throw new UnauthorizedException('Authentification requise.');
    }

    const authContext = await this.sessionService.validateSession(rawToken);
    request.authContext = authContext;
    return true;
  }
}
