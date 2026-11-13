import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthUserDto } from '@zakaria/shared-contracts';
import { describe, expect, it } from 'vitest';
import { PolicyService } from '../src/modules/access-control/policy.service';
import { SessionService } from '../src/modules/auth/session.service';
import { LocalDiskStorageAdapter } from '../src/modules/storage/local-disk-storage.adapter';

function buildMockUser(overrides: Partial<AuthUserDto> = {}): AuthUserDto {
  return {
    id: 10,
    titulaireId: 10,
    email: 'user@g4d.ma',
    nomComplet: 'Test User',
    civilite: null,
    telephone: null,
    villeName: 'Salé',
    villeId: 1,
    parentId: null,
    roleId: 2,
    isSuperAdmin: false,
    roles: ['client'],
    permissions: ['ViewAny:Command', 'Manage:SousComptes'],
    tarifRamassage: false,
    active: true,
    accessContext: {
      primaryScope: 'client',
      titulaireId: 10,
      isSuperAdmin: false,
      isPlatformAdmin: false,
      selectedAgenceId: null,
      agenceMemberships: [],
      managedAgenceIds: [],
      partenaireMemberships: [],
    },
    ...overrides,
  };
}

describe('AccessControlModule — Règles D-04..D-09 & Scopes Prisma (Sprint 02-B)', () => {
  const policy = new PolicyService();

  it('D-04 : Admin Agence requiert appartenance active manager + permission explicite', () => {
    const managerAgence1 = buildMockUser({
      roles: ['agence_admin'],
      permissions: ['agence:manage', 'colis:view'],
      accessContext: {
        primaryScope: 'agence',
        titulaireId: 10,
        isSuperAdmin: false,
        isPlatformAdmin: false,
        selectedAgenceId: 1,
        agenceMemberships: [
          {
            agenceId: 1,
            agenceCode: 'SALE',
            agenceNom: 'Agence Salé',
            role: 'manager',
            actif: true,
          },
          {
            agenceId: 2,
            agenceCode: 'CASA',
            agenceNom: 'Agence Casa',
            role: 'suivi',
            actif: true,
          },
        ],
        managedAgenceIds: [1],
        partenaireMemberships: [],
      },
    });

    expect(policy.canManageAgence(managerAgence1, 1, 'agence:manage')).toBe(true);
    expect(policy.canManageAgence(managerAgence1, 1, 'agence:secret')).toBe(false);
    expect(policy.canManageAgence(managerAgence1, 2, 'agence:manage')).toBe(false);
    expect(() => policy.assertCanManageAgence(managerAgence1, 2, 'agence:manage')).toThrow(
      ForbiddenException,
    );
  });

  it('D-05 & D-06 : SessionService bloque un compte sans rôle ou dont le titulaire est désactivé', () => {
    const sessionService = new SessionService({} as never, {} as never, {} as never);

    expect(() =>
      sessionService.assertAccountAccessAllowed({
        user: buildMockUser({ roles: [] }),
        parentActive: true,
        parentDeleted: false,
        deletedAt: null,
        inscriptionStatut: 'validee',
        passwordResetAt: null,
      }),
    ).toThrow(ForbiddenException);

    expect(() =>
      sessionService.assertAccountAccessAllowed({
        user: buildMockUser({ id: 99, parentId: 10, titulaireId: 10 }),
        parentActive: false,
        parentDeleted: false,
        deletedAt: null,
        inscriptionStatut: 'validee',
        passwordResetAt: null,
      }),
    ).toThrow(ForbiddenException);
  });

  it('Anti-escalade : interdit d’attribuer une permission absente du profil ou hors portée', () => {
    const clientTitulaire = buildMockUser({
      permissions: ['ViewAny:Command', 'Create:Command'],
    });

    expect(() =>
      policy.assertNoPrivilegeEscalation(clientTitulaire, 'client', [
        { id: 1, name: 'ViewAny:Command' },
      ]),
    ).not.toThrow();

    expect(() =>
      policy.assertNoPrivilegeEscalation(clientTitulaire, 'client', [
        { id: 2, name: 'Delete:Users' },
      ]),
    ).toThrow(ForbiddenException);

    expect(() =>
      policy.assertNoPrivilegeEscalation(
        buildMockUser({ permissions: ['system:wipe'] }),
        'client',
        [{ id: 3, name: 'system:wipe' }],
      ),
    ).toThrow(ForbiddenException);
  });

  it('D-09 : interdit d’émettre une clé API pour un sous-compte (parentId !== null)', () => {
    expect(() => policy.assertApiKeyTitulaireAllowed({ userParentId: null })).not.toThrow();
    expect(() => policy.assertApiKeyTitulaireAllowed({ userParentId: 42 })).toThrow(
      ForbiddenException,
    );
  });

  it('Scopes Prisma explicites : cloisonnent strictement les agences et utilisateurs par tenant', () => {
    const subAccount = buildMockUser({ id: 55, parentId: 10, titulaireId: 10 });
    expect(policy.scopeAgencesWhere(subAccount)).toEqual({ id: -1 });
    expect(policy.scopeUsersWhere(subAccount)).toEqual({ id: 55, deletedAt: null });

    const clientTitulaire = buildMockUser({ id: 10, parentId: null, titulaireId: 10 });
    expect(policy.scopeUsersWhere(clientTitulaire)).toEqual({
      deletedAt: null,
      OR: [{ id: 10 }, { parentId: 10 }],
    });
  });

  it('LocalDiskStorageAdapter : écrit/lit sur disque local et bloque le path traversal', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'g4d-storage-test-'));
    const prevPath = process.env.STORAGE_LOCAL_PATH;
    process.env.STORAGE_LOCAL_PATH = tmpDir;

    try {
      const adapter = new LocalDiskStorageAdapter();
      const stored = await adapter.putObject({
        folder: 'avatars',
        originalFilename: 'logo.png',
        content: Buffer.from('g4d-binary-test'),
        mimeType: 'image/png',
      });

      expect(stored.key.startsWith('avatars/')).toBe(true);
      expect(await adapter.exists(stored.key)).toBe(true);
      const bytes = await adapter.readObject(stored.key);
      expect(bytes.toString('utf8')).toBe('g4d-binary-test');

      await expect(adapter.readObject('../../etc/passwd')).rejects.toThrow(BadRequestException);
      await adapter.deleteObject(stored.key);
      expect(await adapter.exists(stored.key)).toBe(false);
    } finally {
      process.env.STORAGE_LOCAL_PATH = prevPath;
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
