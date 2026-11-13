import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { loadBackendEnv } from '@zakaria/backend-config';

const CLIENT_ADMIN_ROLE_NAMES = new Set(['client', 'client_custom', 'sous_compte']);
const AGENCE_ROLE_NAMES = new Set([
  'agence_admin',
  'manager_agence',
  'suivi_agence',
  'livreur',
  'ramasseur',
]);
const PARTENAIRE_ROLE_NAMES = new Set(['partenaire', 'partenaire_admin', 'partenaire_operateur']);
const SYSTEM_ROLE_NAMES = new Set([
  'super_admin',
  'admin',
  'client',
  'livreur',
  'ramasseur',
  'suivi',
  'partenaire',
]);

async function main(): Promise<void> {
  const env = loadBackendEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log('[G4D RBAC Reconcile] Démarrage réconciliation D-07 / D-15 / Portées...');

    // 1. D-07 : Assigner toutes les permissions existantes au rôle super_admin
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'super_admin', guardName: 'web' },
    });

    if (superAdminRole) {
      const allPermissions = await prisma.permission.findMany({
        select: { id: true, name: true },
      });

      const inserted = await prisma.rolePermission.createMany({
        data: allPermissions.map((perm) => ({
          roleId: superAdminRole.id,
          permissionId: perm.id,
        })),
        skipDuplicates: true,
      });

      await prisma.role.update({
        where: { id: superAdminRole.id },
        data: { systeme: true, portee: 'plateforme' },
      });

      console.log(
        `[D-07] super_admin synchronisé avec ${allPermissions.length} permissions (+${inserted.count} nouvelles liaisons).`,
      );
    } else {
      console.log('[D-07] Rôle super_admin non trouvé — étape ignorée.');
    }

    // 2. D-15 : Supprimer les user_permissions directes redondantes sur les comptes ayant le rôle admin
    const adminUsers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { name: { in: ['admin', 'super_admin'] } },
          },
        },
      },
      select: {
        id: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { select: { permissionId: true } },
              },
            },
          },
        },
        userPermissions: { select: { permissionId: true } },
      },
    });

    let removedRedundantCount = 0;
    for (const adminUser of adminUsers) {
      const inheritedPermIds = new Set<number>();
      for (const ur of adminUser.userRoles) {
        for (const rp of ur.role.rolePermissions) {
          inheritedPermIds.add(rp.permissionId);
        }
      }

      const redundantIds = adminUser.userPermissions
        .map((up) => up.permissionId)
        .filter((permId) => inheritedPermIds.has(permId));

      if (redundantIds.length > 0) {
        const res = await prisma.userPermission.deleteMany({
          where: {
            userId: adminUser.id,
            permissionId: { in: redundantIds },
          },
        });
        removedRedundantCount += res.count;
      }
    }
    console.log(
      `[D-15] ${removedRedundantCount} permissions directes redondantes nettoyées sur ${adminUsers.length} comptes admins.`,
    );

    // 3. Synchroniser portee & systeme sur les rôles existants
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, ownerId: true, portee: true, systeme: true },
    });

    for (const role of roles) {
      let portee = role.portee || 'plateforme';
      let compteClientId: number | null = null;
      if (role.ownerId !== null || CLIENT_ADMIN_ROLE_NAMES.has(role.name)) {
        portee = 'client';
        compteClientId = role.ownerId;
      } else if (AGENCE_ROLE_NAMES.has(role.name)) {
        portee = 'agence';
      } else if (PARTENAIRE_ROLE_NAMES.has(role.name)) {
        portee = 'partenaire';
      }

      const systeme = SYSTEM_ROLE_NAMES.has(role.name) && role.ownerId === null;
      await prisma.role.update({
        where: { id: role.id },
        data: {
          portee,
          systeme,
          ...(compteClientId ? { compteClientId } : {}),
        },
      });
    }

    // 4. S'assurer que l'Agence Salé par défaut existe (idempotent)
    const saleExists = await prisma.agence.findUnique({ where: { code: 'SALE' } });
    if (!saleExists) {
      const villeSale = await prisma.ville.findFirst({
        where: { nameFr: { contains: 'Salé', mode: 'insensitive' } },
        select: { id: true },
      });
      await prisma.agence.create({
        data: {
          nom: 'Agence Salé (Principale)',
          code: 'SALE',
          villeId: villeSale?.id ?? null,
          actif: true,
        },
      });
      console.log('[Agences] Agence par défaut SALE créée.');
    }

    console.log('[G4D RBAC Reconcile] Terminé avec succès.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main();
