import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import {
  CreateRoleSchema,
  RoleScopeSchema,
  UpdateRoleSchema,
  type AuthUserDto,
  type RoleScope,
} from '@zakaria/shared-contracts';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { AccessContextService } from '../access-control/access-context.service';
import { PolicyService } from '../access-control/policy.service';
import { PermissionResolverService } from '../auth/permission-resolver.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
    private readonly permissionResolver: PermissionResolverService,
    private readonly accessContextService: AccessContextService,
  ) {}

  async listAvailablePermissions(actor: AuthUserDto, rawPortee?: string) {
    const parsedPortee = rawPortee ? RoleScopeSchema.safeParse(rawPortee) : null;
    const targetPortee: RoleScope = parsedPortee?.success
      ? parsedPortee.data
      : (actor.accessContext?.primaryScope ?? 'client');

    const allPermissions = await this.database.prisma.permission.findMany({
      where: { guardName: 'web' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const actorPermSet = new Set(actor.permissions);
    return allPermissions.filter((perm) => {
      if (!this.policy.isPermissionAllowedForScope(perm.name, targetPortee)) {
        return false;
      }
      return actor.isSuperAdmin || actorPermSet.has(perm.name);
    });
  }

  async listRoles(actor: AuthUserDto) {
    const where = this.policy.scopeRolesWhere(actor);
    return this.database.prisma.role.findMany({
      where,
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, name: true } } },
        },
        agence: { select: { id: true, code: true, nom: true } },
        partenaire: { select: { id: true, code: true, raisonSociale: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: [{ systeme: 'desc' }, { portee: 'asc' }, { id: 'asc' }],
    });
  }

  async createRole(actor: AuthUserDto, rawBody: unknown) {
    const dto = parseOrThrowZod(CreateRoleSchema, rawBody);

    let resolvedAgenceId = dto.agenceId ?? null;
    let resolvedClientId = dto.compteClientId ?? null;
    let resolvedPartenaireId = dto.partenaireId ?? null;
    let resolvedOwnerId: number | null = null;

    if (dto.portee === 'plateforme') {
      if (!this.policy.isPlatformAdmin(actor)) {
        throw new ForbiddenException(
          'Seul un administrateur plateforme peut créer un rôle plateforme.',
        );
      }
    } else if (dto.portee === 'agence') {
      const targetAgenceId = resolvedAgenceId ?? actor.accessContext?.managedAgenceIds[0] ?? null;
      if (!targetAgenceId) {
        throw new BadRequestException("agenceId est obligatoire pour un rôle de portée 'agence'.");
      }
      this.policy.assertCanManageAgence(actor, targetAgenceId);
      resolvedAgenceId = targetAgenceId;
    } else if (dto.portee === 'client') {
      if (!this.policy.isPlatformAdmin(actor)) {
        if (actor.parentId !== null) {
          throw new ForbiddenException('Un sous-compte ne peut pas créer de rôle client.');
        }
        resolvedClientId = actor.titulaireId;
        resolvedOwnerId = actor.titulaireId;
      } else {
        resolvedClientId = resolvedClientId ?? null;
        resolvedOwnerId = resolvedClientId;
      }
    } else if (dto.portee === 'partenaire') {
      const targetPartenaireId =
        resolvedPartenaireId ?? this.policy.getAdminPartenaireIds(actor)[0] ?? null;
      if (!targetPartenaireId) {
        throw new BadRequestException(
          "partenaireId est obligatoire pour un rôle de portée 'partenaire'.",
        );
      }
      if (
        !this.policy.isPlatformAdmin(actor) &&
        !this.policy.getAdminPartenaireIds(actor).includes(targetPartenaireId)
      ) {
        throw new ForbiddenException('Accès refusé pour créer un rôle sur ce partenaire.');
      }
      resolvedPartenaireId = targetPartenaireId;
    }

    const permissions =
      dto.permissionIds.length > 0
        ? await this.database.prisma.permission.findMany({
            where: { id: { in: dto.permissionIds }, guardName: 'web' },
            select: { id: true, name: true },
          })
        : [];

    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException('Une ou plusieurs permissions sélectionnées sont invalides.');
    }

    this.policy.assertNoPrivilegeEscalation(actor, dto.portee, permissions);

    const scopedTechName =
      dto.portee === 'plateforme'
        ? dto.name
        : `${dto.portee}_${resolvedAgenceId ?? resolvedClientId ?? resolvedPartenaireId ?? 'global'}_${dto.name}`;

    const duplicate = await this.database.prisma.role.findFirst({
      where: {
        guardName: 'web',
        OR: [{ name: dto.name }, { name: scopedTechName }],
      },
    });
    if (duplicate) {
      throw new ConflictException(`Un rôle avec le nom technique '${dto.name}' existe déjà.`);
    }

    return this.database.prisma.role.create({
      data: {
        name: this.policy.isPlatformAdmin(actor) ? dto.name : scopedTechName,
        guardName: 'web',
        libelle: dto.libelle,
        portee: dto.portee,
        agenceId: resolvedAgenceId,
        compteClientId: resolvedClientId,
        partenaireId: resolvedPartenaireId,
        ownerId: resolvedOwnerId,
        systeme: false,
        rolePermissions: {
          create: permissions.map((perm) => ({ permissionId: perm.id })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async updateRole(actor: AuthUserDto, roleId: number, rawBody: unknown) {
    const dto = parseOrThrowZod(UpdateRoleSchema, rawBody);
    const existing = await this.database.prisma.role.findUnique({
      where: { id: roleId },
      include: { userRoles: { select: { userId: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Rôle #${roleId} introuvable.`);
    }

    if (existing.systeme && !actor.isSuperAdmin) {
      throw new ForbiddenException('Les rôles système G4D sont protégés contre la modification.');
    }

    const canEdit =
      this.policy.isPlatformAdmin(actor) ||
      (existing.portee === 'agence' &&
        existing.agenceId !== null &&
        this.policy.canManageAgence(actor, existing.agenceId)) ||
      (existing.portee === 'client' &&
        actor.parentId === null &&
        (existing.compteClientId === actor.titulaireId ||
          existing.ownerId === actor.titulaireId)) ||
      (existing.portee === 'partenaire' &&
        existing.partenaireId !== null &&
        this.policy.getAdminPartenaireIds(actor).includes(existing.partenaireId));

    if (!canEdit) {
      throw new ForbiddenException("Vous n'avez pas l'autorisation de modifier ce rôle.");
    }

    if (dto.permissionIds) {
      const permissions =
        dto.permissionIds.length > 0
          ? await this.database.prisma.permission.findMany({
              where: { id: { in: dto.permissionIds }, guardName: 'web' },
              select: { id: true, name: true },
            })
          : [];

      if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('Permissions invalides.');
      }

      this.policy.assertNoPrivilegeEscalation(actor, existing.portee as RoleScope, permissions);

      await this.database.prisma.$transaction([
        this.database.prisma.rolePermission.deleteMany({ where: { roleId } }),
        ...(permissions.length > 0
          ? [
              this.database.prisma.rolePermission.createMany({
                data: permissions.map((p) => ({ roleId, permissionId: p.id })),
                skipDuplicates: true,
              }),
            ]
          : []),
      ]);
    }

    const updated = await this.database.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(dto.libelle ? { libelle: dto.libelle } : {}),
      },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, name: true } } },
        },
      },
    });

    await Promise.all(
      existing.userRoles.flatMap((ur) => [
        this.permissionResolver.invalidateUserCache(ur.userId),
        this.accessContextService.invalidateUser(ur.userId),
      ]),
    );

    return updated;
  }

  async deleteRole(actor: AuthUserDto, roleId: number) {
    const existing = await this.database.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { userRoles: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Rôle #${roleId} introuvable.`);
    }
    if (existing.systeme) {
      throw new ForbiddenException('Impossible de supprimer un rôle système G4D.');
    }
    if (existing._count.userRoles > 0) {
      throw new ConflictException(
        'Ce rôle est encore attribué à des utilisateurs. Réaffectez-les avant suppression.',
      );
    }

    const canDelete =
      this.policy.isPlatformAdmin(actor) ||
      (existing.portee === 'agence' &&
        existing.agenceId !== null &&
        this.policy.canManageAgence(actor, existing.agenceId)) ||
      (existing.portee === 'client' &&
        actor.parentId === null &&
        (existing.compteClientId === actor.titulaireId || existing.ownerId === actor.titulaireId));

    if (!canDelete) {
      throw new ForbiddenException('Suppression de rôle non autorisée.');
    }

    await this.database.prisma.role.delete({ where: { id: roleId } });
    return { ok: true };
  }
}
