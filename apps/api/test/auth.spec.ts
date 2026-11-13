import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import bcrypt from 'bcryptjs';
import type { FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';
import { LoginRequestSchema, SESSION_DURATION_TTL_SECONDS } from '@zakaria/shared-contracts';
import { PermissionsGuard } from '../src/modules/auth/guards/permissions.guard';
import { PasswordHasherService } from '../src/modules/auth/password-hasher.service';
import { CSRF_COOKIE_NAME, CsrfService } from '../src/modules/security/csrf.service';

describe('Auth & Sécurité CSRF (Lot 2.5)', () => {
  it('PasswordHasherService : vérifie un hash Laravel $2y$12$ et signale le rehash Argon2id', async () => {
    const hasher = new PasswordHasherService();
    const plain = 'G4dSecret#2026';
    const bcrypt2b = await bcrypt.hash(plain, 12);
    const laravel2y = bcrypt2b.replace(/^\$2b\$/, '$2y$');

    const ok = await hasher.verifyAndCheckRehash(plain, laravel2y);
    expect(ok.valid).toBe(true);
    expect(ok.needsRehash).toBe(true);

    const ko = await hasher.verifyAndCheckRehash('MauvaisMotDePasse', laravel2y);
    expect(ko.valid).toBe(false);
    expect(ko.needsRehash).toBe(false);
  });

  it('PasswordHasherService : hache en Argon2id et vérifie sans rehash superflu', async () => {
    const hasher = new PasswordHasherService();
    const plain = 'Argon2Pass!99';
    const argonHash = await hasher.hashArgon2(plain);

    expect(argonHash.startsWith('$argon2id$')).toBe(true);
    const res = await hasher.verifyAndCheckRehash(plain, argonHash);
    expect(res.valid).toBe(true);
    expect(res.needsRehash).toBe(false);
  });

  it('LoginRequestSchema : valide les durées dropdown 30m..30d et rejette les valeurs inconnues', () => {
    for (const duration of Object.keys(SESSION_DURATION_TTL_SECONDS)) {
      const parsed = LoginRequestSchema.safeParse({
        email: 'client@g4d.ma',
        password: 'password123',
        sessionDuration: duration,
      });
      expect(parsed.success).toBe(true);
    }

    const invalid = LoginRequestSchema.safeParse({
      email: 'client@g4d.ma',
      password: 'password123',
      sessionDuration: '999d',
    });
    expect(invalid.success).toBe(false);
  });

  it('PermissionsGuard : autorise super_admin et bloque les permissions manquantes', () => {
    const reflector = {
      getAllAndOverride: () => ['ViewAny:Command', 'Manage:SousComptes'],
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    const makeCtx = (isSuperAdmin: boolean, permissions: string[]) =>
      ({
        getHandler: () => () => undefined,
        getClass: () => class TestController {},
        switchToHttp: () => ({
          getRequest: () => ({
            authContext: {
              user: { isSuperAdmin, permissions },
            },
          }),
        }),
      }) as unknown as ExecutionContext;

    expect(guard.canActivate(makeCtx(true, []))).toBe(true);
    expect(guard.canActivate(makeCtx(false, ['ViewAny:Command', 'Manage:SousComptes']))).toBe(true);
    expect(() => guard.canActivate(makeCtx(false, ['ViewAny:Command']))).toThrow(
      ForbiddenException,
    );
  });

  it('CsrfService : valide le double-submit HMAC et bloque les origines ou jetons falsifiés', () => {
    const csrf = new CsrfService();
    const token = csrf.generateToken();
    expect(csrf.isValidSignedToken(token)).toBe(true);
    expect(csrf.isValidSignedToken(`${token}tamper`)).toBe(false);

    const validRequest = {
      headers: {
        origin: 'https://app.g4dmaroc.xyz',
        'x-csrf-token': token,
      },
      cookies: {
        [CSRF_COOKIE_NAME]: token,
      },
    } as unknown as FastifyRequest;

    expect(() => csrf.assertTrustedOrigin(validRequest)).not.toThrow();
    expect(() => csrf.assertDoubleSubmitToken(validRequest)).not.toThrow();

    const evilOriginReq = {
      headers: { origin: 'https://evil-attacker.example' },
      cookies: {},
    } as unknown as FastifyRequest;
    expect(() => csrf.assertTrustedOrigin(evilOriginReq)).toThrow(ForbiddenException);

    const mismatchTokenReq = {
      headers: { 'x-csrf-token': csrf.generateToken() },
      cookies: { [CSRF_COOKIE_NAME]: token },
    } as unknown as FastifyRequest;
    expect(() => csrf.assertDoubleSubmitToken(mismatchTokenReq)).toThrow(ForbiddenException);
  });
});
