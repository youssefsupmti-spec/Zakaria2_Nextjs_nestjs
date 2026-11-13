import { Injectable, Logger } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';
import type { AuthUserDto } from '@zakaria/shared-contracts';

const PERMS_CACHE_TTL_SECONDS = 300;

export interface ResolvedUserAccess {
  user: AuthUserDto;
  parentActive: boolean;
  parentDeleted: boolean;
  deletedAt: Date | null;
  inscriptionStatut: string | null;
  passwordResetAt: Date | null;
}

@Injectable()
export class PermissionResolverService {
  private readonly logger = new Logger(PermissionResolverService.name);
  private readonly prefix = loadBackendEnv().REDIS_PREFIX;

  constructor(private readonly database: DatabaseService) {}

  private cacheKey(userId: number): string {
    return `${this.prefix}:auth:perms:u:${userId}`;
  }

  async resolveForUser(userId: number, bypassCache = false): Promise<ResolvedUserAccess | null> {
    const redis = this.database.getRedisClient();
    const key = this.cacheKey(userId);

    if (!bypassCache && redis.status === 'ready') {
      try {
        const cached = await redis.get(key);
        if (cached) {
          const parsed = JSON.parse(cached) as Omit<
            ResolvedUserAccess,
            'deletedAt' | 'passwordResetAt'
          > & {
            deletedAt: string | null;
            passwordResetAt: string | null;
          };
          return {
            ...parsed,
            deletedAt: parsed.deletedAt ? new Date(parsed.deletedAt) : null,
            passwordResetAt: parsed.passwordResetAt ? new Date(parsed.passwordResetAt) : null,
          };
        }
      } catch {
        // Fallback BDD en cas d'erreur Redis
      }
    }

    const row = await this.database.prisma.user.findUnique({
      where: { id: userId },
      include: {
        parent: {
          select: {
            id: true,
            active: true,
            deletedAt: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    const roleNames = row.userRoles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    for (const ur of row.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.name);
      }
    }
    for (const up of row.userPermissions) {
      permissionSet.add(up.permission.name);
    }

    const primaryRoleId = row.userRoles[0]?.role.id ?? null;
    const isSuperAdmin = roleNames.includes('super_admin');

    const resolved: ResolvedUserAccess = {
      user: {
        id: row.id,
        titulaireId: row.parentId ?? row.id,
        email: row.email,
        nomComplet: row.nomComplet,
        civilite: row.civilite,
        telephone: row.telephone || null,
        villeName: row.villeName,
        villeId: row.villeId,
        parentId: row.parentId,
        roleId: primaryRoleId,
        isSuperAdmin,
        roles: roleNames,
        permissions: Array.from(permissionSet).sort(),
        tarifRamassage: row.ramassageLiv,
        active: row.active,
      },
      parentActive: row.parent ? row.parent.active : true,
      parentDeleted: row.parent ? row.parent.deletedAt !== null : false,
      deletedAt: row.deletedAt,
      inscriptionStatut: row.inscriptionStatut,
      passwordResetAt: row.passwordResetAt,
    };

    if (redis.status === 'ready') {
      try {
        await redis.set(key, JSON.stringify(resolved), 'EX', PERMS_CACHE_TTL_SECONDS);
      } catch (error) {
        this.logger.warn(
          `Impossible de mettre en cache les permissions utilisateur ${userId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return resolved;
  }

  async invalidateUserCache(userId: number): Promise<void> {
    const redis = this.database.getRedisClient();
    if (redis.status === 'ready') {
      try {
        await redis.del(this.cacheKey(userId));
      } catch {
        // Ignorer
      }
    }
  }
}
