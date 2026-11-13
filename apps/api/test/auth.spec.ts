import assert from 'node:assert/strict';
import test from 'node:test';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import bcrypt from 'bcryptjs';
import {
  LoginRequestSchema,
  SESSION_DURATION_TTL_SECONDS,
} from '@zakaria/shared-contracts';
import { PasswordHasherService } from '../src/modules/auth/password-hasher.service';
import { PermissionsGuard } from '../src/modules/auth/guards/permissions.guard';

test('PasswordHasherService : vérifie un hash Laravel $2y$12$ et signale le rehash Argon2id', async () => {
  const hasher = new PasswordHasherService();
  const plain = 'G4dSecret#2026';
  const bcrypt2b = await bcrypt.hash(plain, 12);
  const laravel2y = bcrypt2b.replace(/^\$2b\$/, '$2y$');

  const ok = await hasher.verifyAndCheckRehash(plain, laravel2y);
  assert.equal(ok.valid, true);
  assert.equal(ok.needsRehash, true);

  const ko = await hasher.verifyAndCheckRehash('MauvaisMotDePasse', laravel2y);
  assert.equal(ko.valid, false);
  assert.equal(ko.needsRehash, false);
});

test('PasswordHasherService : hache en Argon2id et vérifie sans rehash superflu', async () => {
  const hasher = new PasswordHasherService();
  const plain = 'Argon2Pass!99';
  const argonHash = await hasher.hashArgon2(plain);

  assert.equal(argonHash.startsWith('$argon2id$'), true);
  const res = await hasher.verifyAndCheckRehash(plain, argonHash);
  assert.equal(res.valid, true);
  assert.equal(res.needsRehash, false);
});

test('LoginRequestSchema : valide les durées dropdown 30m..30d et rejette les valeurs inconnues', () => {
  for (const duration of Object.keys(SESSION_DURATION_TTL_SECONDS)) {
    const parsed = LoginRequestSchema.safeParse({
      email: 'client@g4d.ma',
      password: 'password123',
      sessionDuration: duration,
    });
    assert.equal(parsed.success, true);
  }

  const invalid = LoginRequestSchema.safeParse({
    email: 'client@g4d.ma',
    password: 'password123',
    sessionDuration: '999d',
  });
  assert.equal(invalid.success, false);
});

test('PermissionsGuard : autorise super_admin et bloque les permissions manquantes', () => {
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

  assert.equal(guard.canActivate(makeCtx(true, [])), true);
  assert.equal(
    guard.canActivate(makeCtx(false, ['ViewAny:Command', 'Manage:SousComptes'])),
    true,
  );
  assert.throws(
    () => guard.canActivate(makeCtx(false, ['ViewAny:Command'])),
    ForbiddenException,
  );
});

