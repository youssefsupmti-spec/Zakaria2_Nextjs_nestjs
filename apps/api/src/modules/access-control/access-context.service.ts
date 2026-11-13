import { Injectable, Logger } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';
import {
  AgenceMemberRoleSchema,
  PartenaireMemberRoleSchema,
  type AccessAgenceMembershipDto,
  type AccessContextDto,
  type AccessPartenaireMembershipDto,
  type AuthUserDto,
  type RoleScope,
} from '@zakaria/shared-contracts';

const ACCESS_CTX_CACHE_TTL_SECONDS = 120;

@Injectable()
export class AccessContextService {
  private readonly logger = new Logger(AccessContextService.name);
  private readonly prefix = loadBackendEnv().REDIS_PREFIX;

  constructor(private readonly database: DatabaseService) {}

  private cacheKey(userId: number): string {
    return `${this.prefix}:auth:ctx:u:${userId}`;
  }

  private isWithinDateWindow(depuis: Date | null, jusqua: Date | null, now: Date): boolean {
    if (depuis && depuis.getTime() > now.getTime()) return false;
    if (jusqua) {
      const endOfDay = new Date(jusqua);
      endOfDay.setUTCHours(23, 59, 59, 999);
      if (endOfDay.getTime() < now.getTime()) return false;
    }
    return true;
  }

  async resolveForUser(
    user: Pick<AuthUserDto, 'id' | 'titulaireId' | 'isSuperAdmin' | 'roles'>,
    bypassCache = false,
  ): Promise<AccessContextDto> {
    const redis = this.database.getCacheRedisClient();
    const key = this.cacheKey(user.id);

    if (!bypassCache && redis.status === 'ready') {
      try {
        const cached = await redis.get(key);
        if (cached) {
          return JSON.parse(cached) as AccessContextDto;
        }
      } catch {
        // Fallback PostgreSQL
      }
    }

    const now = new Date();
    const [agenceRows, partenaireRows] = await Promise.all([
      this.database.prisma.agenceMembre.findMany({
        where: {
          userId: user.id,
          actif: true,
          agence: { actif: true, deletedAt: null },
        },
        include: {
          agence: { select: { id: true, code: true, nom: true } },
        },
        orderBy: { agenceId: 'asc' },
      }),
      this.database.prisma.partenaireMembre.findMany({
        where: {
          userId: user.id,
          actif: true,
          partenaire: { actif: true, deletedAt: null },
        },
        include: {
          partenaire: { select: { id: true, code: true, raisonSociale: true } },
        },
        orderBy: { partenaireId: 'asc' },
      }),
    ]);

    const agenceMemberships: AccessAgenceMembershipDto[] = [];
    for (const row of agenceRows) {
      if (!this.isWithinDateWindow(row.depuis, row.jusqua, now)) continue;
      const parsedRole = AgenceMemberRoleSchema.safeParse(row.role);
      if (!parsedRole.success) continue;
      agenceMemberships.push({
        agenceId: row.agence.id,
        agenceCode: row.agence.code,
        agenceNom: row.agence.nom,
        role: parsedRole.data,
        actif: row.actif,
      });
    }

    const partenaireMemberships: AccessPartenaireMembershipDto[] = [];
    for (const row of partenaireRows) {
      const parsedRole = PartenaireMemberRoleSchema.safeParse(row.role);
      if (!parsedRole.success) continue;
      partenaireMemberships.push({
        partenaireId: row.partenaire.id,
        partenaireCode: row.partenaire.code,
        raisonSociale: row.partenaire.raisonSociale,
        role: parsedRole.data,
        actif: row.actif,
      });
    }

    const isPlatformAdmin =
      user.isSuperAdmin || user.roles.includes('admin') || user.roles.includes('super_admin');
    const managedAgenceIds = agenceMemberships
      .filter((m) => m.role === 'manager')
      .map((m) => m.agenceId);

    let primaryScope: RoleScope = 'client';
    if (isPlatformAdmin) {
      primaryScope = 'plateforme';
    } else if (agenceMemberships.length > 0) {
      primaryScope = 'agence';
    } else if (partenaireMemberships.length > 0) {
      primaryScope = 'partenaire';
    }

    const accessContext: AccessContextDto = {
      primaryScope,
      titulaireId: user.titulaireId,
      isSuperAdmin: user.isSuperAdmin,
      isPlatformAdmin,
      selectedAgenceId: agenceMemberships[0]?.agenceId ?? null,
      agenceMemberships,
      managedAgenceIds,
      partenaireMemberships,
    };

    if (redis.status === 'ready') {
      try {
        await redis.set(key, JSON.stringify(accessContext), 'EX', ACCESS_CTX_CACHE_TTL_SECONDS);
      } catch (error) {
        this.logger.warn(
          `Impossible de cacher AccessContext u:${user.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return accessContext;
  }

  async invalidateUser(userId: number): Promise<void> {
    const redis = this.database.getCacheRedisClient();
    if (redis.status === 'ready') {
      await redis.del(this.cacheKey(userId)).catch(() => undefined);
    }
  }
}
