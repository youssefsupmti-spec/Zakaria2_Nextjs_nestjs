import type { AuthUserDto } from '@zakaria/shared-contracts';
import { describe, expect, it } from 'vitest';
import { PolicyService } from '../src/modules/access-control/policy.service';
import { BanquesService, normalizeUniqueBankCodes } from '../src/modules/banques/banques.service';
import {
  extractRibPrefix3,
  normalizeRib,
} from '../src/modules/businesses/invoice-bank-resolver.service';

const ADMIN_ACTOR: AuthUserDto = {
  id: 1,
  titulaireId: 1,
  parentId: null,
  nomComplet: 'Admin G4D',
  civilite: 'M.',
  email: 'admin@g4d.ma',
  telephone: '0600000000',
  villeName: 'Salé',
  villeId: 1,
  roleId: 1,
  isSuperAdmin: true,
  tarifRamassage: false,
  active: true,
  roles: ['super_admin'],
  permissions: [],
  accessContext: {
    primaryScope: 'plateforme',
    titulaireId: 1,
    isSuperAdmin: true,
    isPlatformAdmin: true,
    selectedAgenceId: 1,
    agenceMemberships: [],
    managedAgenceIds: [],
    partenaireMemberships: [],
  },
};

describe('Référentiel Banques & Codes RIB', () => {
  it('normalizeUniqueBankCodes : normalise et déduplique les préfixes RIB', () => {
    expect(normalizeUniqueBankCodes([' 007 ', '011', '007', '230'])).toEqual(['007', '011', '230']);
  });

  it('normalizeRib & extractRibPrefix3 : nettoie les espaces et extrait le préfixe bancaire à 3 chiffres', () => {
    expect(normalizeRib('007 810 0001234567890123 45')).toBe('007810000123456789012345');
    expect(extractRibPrefix3('007 810 000123')).toBe('007');
  });

  it('BanquesService.bulkUpdateStatus : met à jour le statut sans doublon d’identifiants', async () => {
    let capturedWhere: unknown = null;
    let capturedData: unknown = null;
    const fakeDb = {
      prisma: {
        banque: {
          updateMany: async (args: { where: unknown; data: unknown }) => {
            capturedWhere = args.where;
            capturedData = args.data;
            return { count: 2 };
          },
        },
      },
    };

    const service = new BanquesService(fakeDb as never, new PolicyService());
    const result = await service.bulkUpdateStatus(ADMIN_ACTOR, {
      ids: [3, 5, 3],
      status: 'inactive',
    });

    expect(capturedWhere).toEqual({ id: { in: [3, 5] }, deletedAt: null });
    expect(capturedData).toEqual({ status: 'inactive' });
    expect(result).toMatchObject({
      ok: true,
      updatedCount: 2,
      skippedCount: 0,
    });
  });

  it('BanquesService.bulkArchive : ignore les banques liées à un compte actif et archive les autres', async () => {
    const txCalls: unknown[] = [];
    const fakeDb = {
      prisma: {
        banque: {
          findMany: async () => [
            { id: 1, name: 'Attijariwafa Bank' },
            { id: 2, name: 'Banque Populaire' },
          ],
          updateMany: (args: unknown) => ({ op: 'updateMany', args }),
        },
        banqueCode: {
          deleteMany: (args: unknown) => ({ op: 'deleteMany', args }),
        },
        compteBancaire: {
          groupBy: async () => [{ banqueId: 1, _count: { _all: 4 } }],
        },
        $transaction: async (ops: unknown[]) => {
          txCalls.push(...ops);
          return ops;
        },
      },
    };

    const service = new BanquesService(fakeDb as never, new PolicyService());
    const result = await service.bulkArchive(ADMIN_ACTOR, { ids: [1, 2, 99] });

    expect(result.ok).toBe(true);
    expect(result.archivedCount).toBe(1);
    expect(result.skippedCount).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(txCalls).toHaveLength(2);
  });
});
