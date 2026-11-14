import { describe, expect, it } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import { SessionService } from '../src/modules/auth/session.service';

describe('Mon Profil & Sécurité des Sessions', () => {
  it('SessionService : révoque toutes les autres sessions sans toucher la session courante', async () => {
    let updateWhere: unknown = null;
    const deletedKeys: string[] = [];
    let invalidatedUserId: number | null = null;

    const fakeDb = {
      prisma: {
        authSession: {
          findMany: async () => [{ id: 'sess-old-1' }, { id: 'sess-old-2' }],
          updateMany: async (args: { where: unknown }) => {
            updateWhere = args.where;
            return { count: 2 };
          },
        },
      },
      getCacheRedisClient: () => ({
        status: 'ready',
        del: async (...keys: string[]) => {
          deletedKeys.push(...keys);
          return keys.length;
        },
      }),
    };

    const fakePermResolver = {
      invalidateUserCache: async (uid: number) => {
        invalidatedUserId = uid;
      },
    };

    const sessionService = new SessionService(
      fakeDb as never,
      fakePermResolver as never,
      {} as never,
    );

    const res = await sessionService.revokeOtherUserSessions(4806, 'sess-current');
    expect(res.revokedCount).toBe(2);
    expect(updateWhere).toEqual({
      userId: 4806,
      revokedAt: null,
      id: { not: 'sess-current' },
    });
    expect(deletedKeys).toHaveLength(2);
    expect(deletedKeys[0]).toContain('sess-old-1');
    expect(invalidatedUserId).toBe(4806);
  });

  it('AuthService : retourne getOwnProfile enrichi et protège villeId hors super_admin', async () => {
    let capturedUpdateData: Record<string, unknown> | null = null;

    const fakeDb = {
      prisma: {
        user: {
          findUnique: async () => ({
            id: 4806,
            nomComplet: 'Youssef Test',
            civilite: 'M.',
            picture: '',
            email: 'y.ismeg@gmail.com',
            telephone: '0663030635',
            sav: '0537000000',
            villeId: 1,
            villeName: 'Salé',
            cin: 'AB813016',
            lienLocalisationMaps: '',
            active: true,
            ramassageLiv: false,
            inscriptionStatut: 'acceptee',
            passwordAlgo: 'argon2id',
            passwordResetAt: null,
            parentId: null,
            createdAt: new Date('2026-01-10T10:00:00Z'),
            updatedAt: new Date('2026-11-14T00:00:00Z'),
            ville: { id: 1, nameFr: 'Salé', codeZone: 'SALE' },
            userRoles: [{ role: { id: 3, name: 'client', libelle: 'Client', portee: 'client' } }],
            agencesResponsable: [],
            agenceMembres: [],
            partenaireMembres: [],
            partenaireCoursier: null,
            businesses: [
              {
                id: 12,
                name: 'Atlas Shop',
                type: 'Boutique e-commerce',
                isActive: true,
                modePaiement: 'virement_bancaire',
                ville: { nameFr: 'Salé' },
              },
            ],
          }),
          count: async () => 1,
          update: async (args: { data: Record<string, unknown> }) => {
            capturedUpdateData = args.data;
            return {
              id: 4806,
              nomComplet: String(args.data.nomComplet ?? 'Youssef Test'),
              civilite: 'M.',
              email: 'y.ismeg@gmail.com',
              telephone: '0663030635',
              sav: String(args.data.sav ?? ''),
              villeId: 1,
              villeName: 'Salé',
              cin: 'AB813016',
              lienLocalisationMaps: '',
            };
          },
        },
        compteBancaire: {
          findMany: async () => [{ id: 101, ownerId: 12, isActive: true }],
        },
        authenticationLog: {
          findMany: async () => [
            {
              id: 500n,
              event: 'login',
              ipAddress: '127.0.0.1',
              userAgent: 'Mozilla/5.0 Chrome/130.0',
              location: null,
              createdAt: new Date('2026-11-14T00:10:00Z'),
            },
          ],
        },
      },
    };

    const authService = new AuthService(
      fakeDb as never,
      {} as never,
      {} as never,
      {
        resolveForUser: async () => ({
          user: { permissions: ['ViewAny:Command', 'Create:Command'] },
        }),
        invalidateUserCache: async () => undefined,
      } as never,
      {} as never,
      { record: async () => undefined } as never,
      {} as never,
      {} as never,
    );

    const profileRes = await authService.getOwnProfile(4806);
    expect(profileRes.profile.email).toBe('y.ismeg@gmail.com');
    expect(profileRes.roleSummary.businesses).toHaveLength(1);
    expect(profileRes.roleSummary.businesses[0]?.comptesBancairesActifs).toBe(1);
    expect(profileRes.roleSummary.subAccountsCount).toBe(1);
    expect(profileRes.securityLogs).toHaveLength(1);

    await authService.updateOwnProfile(
      4806,
      {
        nomComplet: 'Youssef Maj',
        civilite: 'M.',
        villeId: 99,
        cin: 'AB813016',
        sav: '0537112233',
      },
      false,
    );
    expect(capturedUpdateData).not.toBeNull();
    expect(capturedUpdateData?.villeId).toBeUndefined();
    expect(capturedUpdateData?.sav).toBe('0537112233');
  });

  it('AuthService : révoque les autres sessions et journalise sessions_revoked_others', async () => {
    const recordedEvents: Array<{ event: string; userId: number | null; detail?: string | null }> =
      [];
    const authService = new AuthService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        revokeOtherUserSessions: async () => ({ revokedCount: 3 }),
      } as never,
      {
        record: async (
          event: string,
          userId: number | null,
          _meta: unknown,
          detail?: string | null,
        ) => {
          recordedEvents.push({ event, userId, detail });
        },
      } as never,
      {} as never,
      {} as never,
    );

    const result = await authService.revokeOtherSessions(4806, 'sess-current', {
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
    });

    expect(result.ok).toBe(true);
    expect(result.revokedCount).toBe(3);
    expect(recordedEvents).toEqual([
      { event: 'sessions_revoked_others', userId: 4806, detail: 'count:3' },
    ]);
  });
});
