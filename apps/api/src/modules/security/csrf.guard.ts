import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { CsrfService } from './csrf.service';

export const SKIP_CSRF_KEY = 'g4d:skip_csrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Guard global CSRF :
 * 1) Vérifie l'en-tête Origin/Referer sur toutes les mutations (POST/PUT/PATCH/DELETE).
 * 2) Exige le jeton double-submit (cookie g4d.csrf + en-tête X-CSRF-Token) dès qu'une
 *    mutation est authentifiée par cookie de session.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly csrfService: CsrfService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const method = (request.method ?? 'GET').toUpperCase();
    if (SAFE_HTTP_METHODS.has(method)) {
      return true;
    }

    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCsrf) {
      return true;
    }

    this.csrfService.assertTrustedOrigin(request);

    if (this.csrfService.hasSessionCookie(request)) {
      this.csrfService.assertDoubleSubmitToken(request);
    }

    return true;
  }
}
