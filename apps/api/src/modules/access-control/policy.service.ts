import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma } from '@zakaria/backend-database';
import type { AuthUserDto, RoleScope } from '@zakaria/shared-contracts';

const PLATEFORME_ONLY_PERMISSION_PREFIXES = [
  'system:',
  'plateforme:',
  'agence:create',
  'agences:create',
  'agences:delete',
  'settings:',
];

const AGENCY_RESTRICTED_ROLE_NAMES = new Set(['livreur', 'ramasseur', 'suivi', 'agent']);
const PLATFORM_PRIVILEGED_ROLE_NAMES = new Set(['super_admin', 'admin']);

@Injectable()
export class PolicyService {
  isPlatformAdmin(user: AuthUserDto): boolean {
    return (
      user.isSuperAdmin ||
      user.roles.includes('super_admin') ||
      user.roles.includes('admin') ||
      Boolean(user.accessContext?.isPlatformAdmin)
    );
  }

  hasPermission(user: AuthUserDto, permission: string): boolean {
    if (this.isPlatformAdmin(user) && user.isSuperAdmin) {
      return true;
    }
    return user.permissions.includes(permission);
  }

  getManagedAgenceIds(user: AuthUserDto): number[] {
    return user.accessContext?.managedAgenceIds ?? [];
  }

  getMemberAgenceIds(user: AuthUserDto): number[] {
    return user.accessContext?.agenceMemberships.map((m) => m.agenceId) ?? [];
  }

  getAdminPartenaireIds(user: AuthUserDto): number[] {
    return (
      user.accessContext?.partenaireMemberships
        .filter((p) => p.role === 'admin_partenaire')
        .map((p) => p.partenaireId) ?? []
    );
  }

  getMemberPartenaireIds(user: AuthUserDto): number[] {
    return user.accessContext?.partenaireMemberships.map((p) => p.partenaireId) ?? [];
  }

  /**
   * D-04 : Admin Agence = appartenance active 'manager' dans agence_membres + permission explicite.
   */
  canManageAgence(user: AuthUserDto, agenceId: number, requiredPermission?: string): boolean {
    if (this.isPlatformAdmin(user)) {
      return requiredPermission ? this.hasPermission(user, requiredPermission) : true;
    }
    const isManager = this.getManagedAgenceIds(user).includes(agenceId);
    if (!isManager) return false;
    if (!requiredPermission) return true;
    return this.hasPermission(user, requiredPermission);
  }

  assertCanManageAgence(user: AuthUserDto, agenceId: number, requiredPermission?: string): void {
    if (!this.canManageAgence(user, agenceId, requiredPermission)) {
      throw new ForbiddenException(
        `Accès refusé : vous devez être manager actif de l'agence #${agenceId}${requiredPermission ? ` avec la permission '${requiredPermission}'` : ''}.`,
      );
    }
  }

  assertCanViewAgence(user: AuthUserDto, agenceId: number): void {
    if (this.isPlatformAdmin(user)) return;
    if (this.getMemberAgenceIds(user).includes(agenceId)) return;
    throw new ForbiddenException(`Accès refusé à l'agence #${agenceId}.`);
  }

  /** Scope Prisma explicite pour lister les agences visibles par l'acteur (sans RLS). */
  scopeAgencesWhere(user: AuthUserDto): Prisma.AgenceWhereInput {
    if (this.isPlatformAdmin(user)) {
      return { deletedAt: null };
    }
    const agenceIds = this.getMemberAgenceIds(user);
    if (agenceIds.length === 0) {
      return { id: -1 };
    }
    return { deletedAt: null, id: { in: agenceIds } };
  }

  /** Scope Prisma explicite pour lister les partenaires visibles par l'acteur (sans RLS). */
  scopePartenairesWhere(user: AuthUserDto): Prisma.PartenaireWhereInput {
    if (this.isPlatformAdmin(user)) {
      return { deletedAt: null };
    }
    const agenceIds = this.getMemberAgenceIds(user);
    const partenaireIds = this.getMemberPartenaireIds(user);
    const orFilters: Prisma.PartenaireWhereInput[] = [];
    if (agenceIds.length > 0) {
      orFilters.push({
        agencePartenaires: { some: { agenceId: { in: agenceIds }, actif: true } },
      });
    }
    if (partenaireIds.length > 0) {
      orFilters.push({ id: { in: partenaireIds } });
    }
    if (orFilters.length === 0) {
      return { id: -1 };
    }
    return { deletedAt: null, OR: orFilters };
  }

  /** Scope Prisma explicite pour lister les utilisateurs visibles par l'acteur (sans RLS). */
  scopeUsersWhere(user: AuthUserDto): Prisma.UserWhereInput {
    if (this.isPlatformAdmin(user)) {
      return { deletedAt: null };
    }
    const managedAgenceIds = this.getManagedAgenceIds(user);
    if (managedAgenceIds.length > 0) {
      return {
        deletedAt: null,
        agenceMembres: { some: { agenceId: { in: managedAgenceIds } } },
      };
    }
    const adminPartenaireIds = this.getAdminPartenaireIds(user);
    if (adminPartenaireIds.length > 0) {
      return {
        deletedAt: null,
        partenaireMembres: { some: { partenaireId: { in: adminPartenaireIds } } },
      };
    }
    if (user.parentId === null) {
      return {
        deletedAt: null,
        OR: [{ id: user.titulaireId }, { parentId: user.titulaireId }],
      };
    }
    return { id: user.id, deletedAt: null };
  }

  /** Scope Prisma explicite pour lister les rôles visibles par l'acteur. */
  scopeRolesWhere(user: AuthUserDto): Prisma.RoleWhereInput {
    if (this.isPlatformAdmin(user)) {
      return {};
    }
    const managedAgenceIds = this.getManagedAgenceIds(user);
    if (managedAgenceIds.length > 0) {
      return {
        OR: [
          { portee: 'agence', agenceId: { in: managedAgenceIds } },
          { portee: 'agence', agenceId: null, systeme: true },
        ],
      };
    }
    const adminPartenaireIds = this.getAdminPartenaireIds(user);
    if (adminPartenaireIds.length > 0) {
      return {
        OR: [
          { portee: 'partenaire', partenaireId: { in: adminPartenaireIds } },
          { portee: 'partenaire', partenaireId: null, systeme: true },
        ],
      };
    }
    if (user.parentId === null) {
      return {
        OR: [
          { portee: 'client', compteClientId: user.titulaireId },
          { ownerId: user.titulaireId },
          { portee: 'client', compteClientId: null, ownerId: null, systeme: true },
        ],
      };
    }
    return { id: -1 };
  }

  isPermissionAllowedForScope(permissionName: string, targetPortee: RoleScope): boolean {
    if (targetPortee === 'plateforme') {
      return true;
    }
    if (targetPortee === 'agence') {
      return !permissionName.startsWith('system:') && !permissionName.startsWith('plateforme:');
    }
    return !PLATEFORME_ONLY_PERMISSION_PREFIXES.some((prefix) => permissionName.startsWith(prefix));
  }

  /**
   * Anti-escalade de privilèges stricte :
   * assignedPermissions ⊆ actorPermissions ∩ scopeAllowedPermissions
   */
  assertNoPrivilegeEscalation(
    actor: AuthUserDto,
    targetPortee: RoleScope,
    requestedPermissions: Array<{ id: number; name: string }>,
  ): void {
    const actorPermSet = new Set(actor.permissions);
    const enforceActorSubset = !actor.isSuperAdmin;

    for (const perm of requestedPermissions) {
      if (!this.isPermissionAllowedForScope(perm.name, targetPortee)) {
        throw new ForbiddenException(
          `Escalade interdite : la permission '${perm.name}' n'est pas autorisée pour la portée '${targetPortee}'.`,
        );
      }
      if (enforceActorSubset && !actorPermSet.has(perm.name)) {
        throw new ForbiddenException(
          `Escalade de privilèges refusée : vous ne possédez pas la permission '${perm.name}'.`,
        );
      }
    }
  }

  /**
   * D-08 : Vérifie qu'un rôle cible peut être attribué par l'acteur sans escalade.
   */
  assertCanAssignRoleToUser(
    actor: AuthUserDto,
    role: {
      name: string;
      portee: string;
      agenceId: number | null;
      compteClientId: number | null;
      partenaireId: number | null;
      ownerId: number | null;
      rolePermissions: Array<{ permission: { id: number; name: string } }>;
    },
    targetAgenceId?: number | null,
  ): void {
    if (this.isPlatformAdmin(actor)) {
      if (role.name === 'super_admin' && !actor.isSuperAdmin) {
        throw new ForbiddenException('Seul un super_admin peut attribuer le rôle super_admin.');
      }
      return;
    }

    if (PLATFORM_PRIVILEGED_ROLE_NAMES.has(role.name) || role.portee === 'plateforme') {
      throw new ForbiddenException('Attribution de rôle plateforme refusée (anti-escalade).');
    }

    const managedAgenceIds = this.getManagedAgenceIds(actor);
    if (managedAgenceIds.length > 0) {
      const effectiveAgenceId = role.agenceId ?? targetAgenceId ?? null;
      if (
        (effectiveAgenceId === null || !managedAgenceIds.includes(effectiveAgenceId)) &&
        !AGENCY_RESTRICTED_ROLE_NAMES.has(role.name)
      ) {
        throw new ForbiddenException(
          'Un manager d’agence ne peut attribuer que des rôles de sa propre agence ou flotte locale.',
        );
      }
    } else if (actor.parentId === null) {
      if (
        role.portee !== 'client' ||
        (role.compteClientId !== null && role.compteClientId !== actor.titulaireId) ||
        (role.ownerId !== null && role.ownerId !== actor.titulaireId)
      ) {
        throw new ForbiddenException(
          'Un titulaire ne peut attribuer que ses propres rôles client.',
        );
      }
    } else {
      throw new ForbiddenException('Un sous-compte ne peut pas gérer les rôles d’autres comptes.');
    }

    this.assertNoPrivilegeEscalation(
      actor,
      role.portee as RoleScope,
      role.rolePermissions.map((rp) => rp.permission),
    );
  }

  /**
   * D-09 : Les clés API sont réservées exclusivement aux titulaires (parentId === null) ou partenaires.
   */
  assertApiKeyTitulaireAllowed(target: {
    partenaireId?: number | null;
    userParentId?: number | null;
  }): void {
    if (target.userParentId !== undefined && target.userParentId !== null) {
      throw new ForbiddenException(
        'Règle D-09 : un sous-compte ne peut pas posséder de clé API. Utilisez le compte titulaire.',
      );
    }
  }
}
