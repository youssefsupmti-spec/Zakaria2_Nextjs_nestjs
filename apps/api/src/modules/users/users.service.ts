import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import { CreateUserSchema, UpdateUserSchema, type AuthUserDto } from '@zakaria/shared-contracts';
import { z } from 'zod';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { AccessContextService } from '../access-control/access-context.service';
import { PolicyService } from '../access-control/policy.service';
import { PasswordHasherService } from '../auth/password-hasher.service';
import { PermissionResolverService } from '../auth/permission-resolver.service';
import { SessionService } from '../auth/session.service';

const UpdateStatusSchema = z.object({
  active: z.boolean(),
});

const AGENCY_LOCAL_STAFF_ROLES = new Set(['livreur', 'ramasseur']);

@Injectable()
export class UsersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly permissionResolver: PermissionResolverService,
    private readonly accessContextService: AccessContextService,
    private readonly sessionService: SessionService,
  ) {}

  async listUsers(actor: AuthUserDto) {
    const where = this.policy.scopeUsersWhere(actor);
    return this.database.prisma.user.findMany({
      where,
      take: 150,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        nomComplet: true,
        email: true,
        telephone: true,
        villeId: true,
        villeName: true,
        active: true,
        parentId: true,
        inscriptionStatut: true,
        createdAt: true,
        userRoles: {
          include: {
            role: { select: { id: true, name: true, libelle: true, portee: true } },
          },
        },
        agenceMembres: {
          include: {
            agence: { select: { id: true, code: true, nom: true } },
          },
        },
        partenaireMembres: {
          include: {
            partenaire: { select: { id: true, code: true, raisonSociale: true } },
          },
        },
      },
    });
  }

  /**
   * Création d'un compte utilisateur avec contrôle anti-escalade et règles D-08 / C137 :
   * - Manager d'agence : peut créer des livreurs/ramasseurs rattachés à une de ses agences gérées.
   * - Titulaire client : peut créer ses sous-comptes (parentId = titulaireId).
   * - Admin plateforme : gestion globale.
   */
  async createUser(actor: AuthUserDto, rawBody: unknown) {
    const dto = parseOrThrowZod(CreateUserSchema, rawBody);
    const emailNormalized = dto.email.trim().toLowerCase();

    const duplicate = await this.database.prisma.user.findFirst({
      where: { email: emailNormalized, deletedAt: null },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(
        `Un compte actif existe déjà avec l'e-mail '${emailNormalized}'.`,
      );
    }

    const role = await this.database.prisma.role.findUnique({
      where: { id: dto.roleId },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, name: true } } },
        },
      },
    });
    if (!role) {
      throw new NotFoundException(`Rôle #${dto.roleId} introuvable.`);
    }

    let resolvedParentId = dto.parentId ?? null;
    let resolvedAgenceId = dto.agenceId ?? null;
    let resolvedAgenceRole = dto.agenceRole ?? null;

    if (!this.policy.isPlatformAdmin(actor)) {
      const managedAgenceIds = this.policy.getManagedAgenceIds(actor);
      if (managedAgenceIds.length > 0) {
        // Règle D-08 : manager d'agence crée/gère livreurs et ramasseurs locaux uniquement
        const targetAgenceId = resolvedAgenceId ?? managedAgenceIds[0];
        this.policy.assertCanManageAgence(actor, targetAgenceId);
        if (!AGENCY_LOCAL_STAFF_ROLES.has(role.name) && role.agenceId !== targetAgenceId) {
          throw new ForbiddenException(
            "Règle D-08 : un responsable d'agence ne peut créer que des livreurs, ramasseurs ou rôles de son agence.",
          );
        }
        resolvedAgenceId = targetAgenceId;
        resolvedAgenceRole =
          resolvedAgenceRole ?? (role.name === 'ramasseur' ? 'ramasseur' : 'livreur');
        resolvedParentId = null;
      } else if (actor.parentId === null) {
        // Titulaire client créant un sous-compte
        resolvedParentId = actor.titulaireId;
        resolvedAgenceId = null;
      } else {
        throw new ForbiddenException('Un sous-compte ne peut pas créer d’autres comptes.');
      }
    }

    this.policy.assertCanAssignRoleToUser(actor, role, resolvedAgenceId);

    const ville = dto.villeId
      ? await this.database.prisma.ville.findUnique({
          where: { id: dto.villeId },
          select: { id: true, nameFr: true },
        })
      : null;

    const passwordHash = await this.passwordHasher.hashArgon2(dto.password);

    const created = await this.database.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          nomComplet: dto.nomComplet,
          email: emailNormalized,
          password: passwordHash,
          passwordAlgo: 'argon2id',
          telephone: dto.telephone,
          villeId: ville?.id ?? null,
          villeName: ville?.nameFr ?? '',
          active: dto.active,
          parentId: resolvedParentId,
          inscriptionStatut: 'validee',
        },
        select: {
          id: true,
          nomComplet: true,
          email: true,
          telephone: true,
          active: true,
          parentId: true,
          createdAt: true,
        },
      });

      await tx.userRole.create({
        data: { userId: newUser.id, roleId: role.id },
      });

      if (resolvedAgenceId && resolvedAgenceRole) {
        await tx.agenceMembre.create({
          data: {
            agenceId: resolvedAgenceId,
            userId: newUser.id,
            role: resolvedAgenceRole,
            actif: true,
          },
        });
      }

      if (dto.partenaireId) {
        await tx.partenaireMembre.create({
          data: {
            partenaireId: dto.partenaireId,
            userId: newUser.id,
            role: dto.partenaireRole ?? 'operateur',
            actif: true,
          },
        });
      }

      return newUser;
    });

    return created;
  }

  private async loadAndAssertTargetManageable(actor: AuthUserDto, targetId: number) {
    const scopeWhere = this.policy.scopeUsersWhere(actor);
    const target = await this.database.prisma.user.findFirst({
      where: { AND: [scopeWhere, { id: targetId }] },
      include: {
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });
    if (!target) {
      throw new ForbiddenException("Utilisateur introuvable ou hors de votre périmètre d'accès.");
    }
    if (!actor.isSuperAdmin && target.userRoles.some((ur) => ur.role.name === 'super_admin')) {
      throw new ForbiddenException('Impossible de modifier un compte super_admin.');
    }
    return target;
  }

  async updateUser(actor: AuthUserDto, targetId: number, rawBody: unknown) {
    const dto = parseOrThrowZod(UpdateUserSchema, rawBody);
    await this.loadAndAssertTargetManageable(actor, targetId);

    if (dto.roleId) {
      const role = await this.database.prisma.role.findUnique({
        where: { id: dto.roleId },
        include: {
          rolePermissions: { include: { permission: { select: { id: true, name: true } } } },
        },
      });
      if (!role) {
        throw new NotFoundException(`Rôle #${dto.roleId} introuvable.`);
      }
      this.policy.assertCanAssignRoleToUser(actor, role);

      await this.database.prisma.$transaction([
        this.database.prisma.userRole.deleteMany({ where: { userId: targetId } }),
        this.database.prisma.userRole.create({ data: { userId: targetId, roleId: dto.roleId } }),
      ]);
    }

    const ville =
      dto.villeId !== undefined
        ? dto.villeId
          ? await this.database.prisma.ville.findUnique({
              where: { id: dto.villeId },
              select: { id: true, nameFr: true },
            })
          : null
        : undefined;

    const updated = await this.database.prisma.user.update({
      where: { id: targetId },
      data: {
        ...(dto.nomComplet !== undefined ? { nomComplet: dto.nomComplet } : {}),
        ...(dto.telephone !== undefined ? { telephone: dto.telephone } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(ville !== undefined
          ? { villeId: ville?.id ?? null, villeName: ville?.nameFr ?? '' }
          : {}),
      },
      select: {
        id: true,
        nomComplet: true,
        email: true,
        telephone: true,
        active: true,
        parentId: true,
      },
    });

    await Promise.all([
      this.permissionResolver.invalidateUserCache(targetId),
      this.accessContextService.invalidateUser(targetId),
    ]);

    if (dto.active === false) {
      await this.cascadeDisableSessions(targetId);
    }

    return updated;
  }

  /**
   * Activation / Désactivation avec cascade D-06 :
   * la désactivation d'un titulaire révoque immédiatement les sessions et caches
   * du titulaire ET de l'ensemble de ses sous-comptes (parent_id = targetId).
   */
  async setUserStatus(actor: AuthUserDto, targetId: number, rawBody: unknown) {
    if (actor.id === targetId) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte connecté.');
    }
    const dto = parseOrThrowZod(UpdateStatusSchema, rawBody);
    const target = await this.loadAndAssertTargetManageable(actor, targetId);

    const updated = await this.database.prisma.user.update({
      where: { id: targetId },
      data: { active: dto.active },
      select: { id: true, nomComplet: true, email: true, active: true, parentId: true },
    });

    if (!dto.active) {
      await this.cascadeDisableSessions(target.id);
    } else {
      await this.permissionResolver.invalidateUserCache(target.id);
      if (target.parentId === null) {
        const subs = await this.database.prisma.user.findMany({
          where: { parentId: target.id, deletedAt: null },
          select: { id: true },
        });
        await Promise.all(subs.map((s) => this.permissionResolver.invalidateUserCache(s.id)));
      }
    }

    return updated;
  }

  private async cascadeDisableSessions(titulaireOrUserId: number): Promise<void> {
    await Promise.all([
      this.sessionService.revokeAllUserSessions(titulaireOrUserId, 'account_disabled'),
      this.accessContextService.invalidateUser(titulaireOrUserId),
    ]);

    const subAccounts = await this.database.prisma.user.findMany({
      where: { parentId: titulaireOrUserId, deletedAt: null },
      select: { id: true },
    });

    await Promise.all(
      subAccounts.flatMap((sub) => [
        this.sessionService.revokeAllUserSessions(sub.id, 'titulaire_disabled'),
        this.accessContextService.invalidateUser(sub.id),
      ]),
    );
  }
}
