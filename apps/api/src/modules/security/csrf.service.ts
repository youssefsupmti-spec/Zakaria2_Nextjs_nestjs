import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import type { FastifyRequest } from 'fastify';

export const CSRF_COOKIE_NAME = 'g4d.csrf';

@Injectable()
export class CsrfService {
  private readonly env = loadBackendEnv();
  private readonly allowedOrigins: Set<string>;

  constructor() {
    const origins = new Set<string>();
    for (const raw of this.env.CORS_ORIGINS.split(',')) {
      const normalized = this.extractOrigin(raw.trim());
      if (normalized) origins.add(normalized);
    }
    const publicOrigin = this.extractOrigin(this.env.APP_PUBLIC_URL);
    if (publicOrigin) origins.add(publicOrigin);
    if (this.env.NODE_ENV !== 'production') {
      origins.add('http://localhost:3100');
      origins.add('http://127.0.0.1:3100');
      origins.add(`http://localhost:${this.env.API_PORT}`);
      origins.add(`http://127.0.0.1:${this.env.API_PORT}`);
    }
    this.allowedOrigins = origins;
  }

  private extractOrigin(rawUrl: string | undefined): string | null {
    if (!rawUrl) return null;
    try {
      return new URL(rawUrl).origin.toLowerCase();
    } catch {
      return null;
    }
  }

  private signNonce(nonce: string): string {
    return createHmac('sha256', this.env.CSRF_SECRET).update(nonce).digest('base64url');
  }

  /** Génère un jeton CSRF double-submit signé par HMAC-SHA256. */
  generateToken(): string {
    const nonce = randomBytes(24).toString('base64url');
    const signature = this.signNonce(nonce);
    return `${nonce}.${signature}`;
  }

  /** Vérifie la signature HMAC du jeton CSRF en temps constant. */
  isValidSignedToken(token: string | undefined): token is string {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [nonce, signature] = parts;
    if (!nonce || !signature) return false;

    const expectedSig = this.signNonce(nonce);
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  /** Vérifie que l'en-tête Origin (ou Referer) d'une requête mutante provient d'un hôte autorisé. */
  assertTrustedOrigin(request: FastifyRequest): void {
    const rawOrigin = request.headers.origin;
    const rawReferer = request.headers.referer;
    const originHeader = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
    const refererHeader = Array.isArray(rawReferer) ? rawReferer[0] : rawReferer;

    const candidate = this.extractOrigin(originHeader) ?? this.extractOrigin(refererHeader);
    if (!candidate) {
      return;
    }

    if (this.allowedOrigins.has(candidate)) {
      return;
    }

    const forwardedHost = request.headers['x-forwarded-host'];
    const hostHeader = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost || request.headers.host;
    if (hostHeader) {
      const forwardedProtoRaw = request.headers['x-forwarded-proto'];
      const proto = Array.isArray(forwardedProtoRaw)
        ? forwardedProtoRaw[0]
        : forwardedProtoRaw || request.protocol || 'https';
      const sameOrigin = `${proto}://${hostHeader}`.toLowerCase();
      if (candidate === sameOrigin) {
        return;
      }
    }

    throw new ForbiddenException('Origine de requête non autorisée (protection CSRF).');
  }

  /** Vérifie la correspondance cookie <-> en-tête X-CSRF-Token en temps constant. */
  assertDoubleSubmitToken(request: FastifyRequest): void {
    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];
    const rawHeader = request.headers['x-csrf-token'];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!this.isValidSignedToken(cookieToken) || !this.isValidSignedToken(headerToken)) {
      throw new ForbiddenException(
        'Jeton CSRF manquant ou invalide. Rechargez la page ou récupérez /api/v1/security/csrf.',
      );
    }

    const cookieBuf = Buffer.from(cookieToken, 'utf8');
    const headerBuf = Buffer.from(headerToken, 'utf8');
    if (cookieBuf.length !== headerBuf.length || !timingSafeEqual(cookieBuf, headerBuf)) {
      throw new ForbiddenException('Discordance du jeton CSRF (protection double-submit).');
    }
  }

  hasSessionCookie(request: FastifyRequest): boolean {
    return Boolean(
      request.cookies?.[this.env.AUTH_COOKIE_NAME] ??
      request.cookies?.['__Host-g4d.session'] ??
      request.cookies?.['g4d.session'],
    );
  }
}
