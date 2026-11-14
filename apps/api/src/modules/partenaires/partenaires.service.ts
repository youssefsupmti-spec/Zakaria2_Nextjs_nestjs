import { createCipheriv, createHmac, createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseService } from '@zakaria/backend-database';
import {
  AssignAgencePartenaireSchema,
  AssignPartenaireZoneSchema,
  BulkActifStatusSchema,
  CreateApiIdentifiantSchema,
  CreatePartenaireCoursierSchema,
  CreatePartenaireMembreSchema,
  CreatePartenaireSchema,
  UpdatePartenaireSchema,
  UpsertPartenaireConnexionSchema,
  type AuthUserDto,
} from '@zakaria/shared-contracts';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { AccessContextService } from '../access-control/access-context.service';
import { PolicyService } from '../access-control/policy.service';

@Injectable()
export class PartenairesService {
  private readonly env = loadBackendEnv();

  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
    private readonly accessContextService: AccessContextService,
  ) {}

  private encryptSecret(plaintext: string): string {
    const key = createHash('sha256').update(this.env.AUTH_SECRET).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private hashApiSecret(rawSecret: string): string {
    return createHmac('sha256', this.env.API_SECRET_PEPPER).update(rawSecret).digest('hex');
  }

  async listPartenaires(actor: AuthUserDto) {
    const where = this.policy.scopePartenairesWhere(actor);
    return this.database.prisma.partenaire.findMany({
      where,
      include: {
        agencePartenaires: {
          include: {
            agence: { select: { id: true, code: true, nom: true } },
            partenaireZones: {
              include: { zone: { select: { id: true, code: true, nom: true } } },
            },
          },
        },
        coursiers: {
          select: { id: true, nom: true, telephone: true, userId: true, actif: true },
        },
        membres: {
          include: {
            user: { select: { id: true, nomComplet: true, email: true, active: true } },
          },
        },
        apiIdentifiants: {
          where: { revokedAt: null },
          select: {
            id: true,
            libelle: true,
            clePublique: true,
            scopes: true,
            actif: true,
            expiresAt: true,
            lastUsedAt: true,
            createdAt: true,
          },
        },
        connexions: {
          select: {
            id: true,
            apiTypeCode: true,
            baseUrl: true,
            actif: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ actif: 'desc' }, { id: 'asc' }],
    });
  }

  async createPartenaire(actor: AuthUserDto, rawBody: unknown) {
    if (!this.policy.isPlatformAdmin(actor)) {
      throw new ForbiddenException('Seul un administrateur plateforme peut créer un partenaire.');
    }
    const dto = parseOrThrowZod(CreatePartenaireSchema, rawBody);
    const existing = await this.database.prisma.partenaire.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Le code partenaire '${dto.code}' existe déjà.`);
    }
    return this.database.prisma.partenaire.create({ data: dto });
  }

  async updatePartenaire(actor: AuthUserDto, partenaireId: number, rawBody: unknown) {
    if (!this.policy.isPlatformAdmin(actor)) {
      throw new ForbiddenException(
        'Seul un administrateur plateforme peut modifier un partenaire.',
      );
    }
    const dto = parseOrThrowZod(UpdatePartenaireSchema, rawBody);
    const existing = await this.database.prisma.partenaire.findFirst({
      where: { id: partenaireId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Partenaire #${partenaireId} introuvable.`);
    }
    return this.database.prisma.partenaire.update({
      where: { id: partenaireId },
      data: dto,
    });
  }

  async assignAgenceContract(actor: AuthUserDto, partenaireId: number, rawBody: unknown) {
    const dto = parseOrThrowZod(AssignAgencePartenaireSchema, rawBody);
    this.policy.assertCanManageAgence(actor, dto.agenceId);

    const [partenaire, agence] = await Promise.all([
      this.database.prisma.partenaire.findFirst({ where: { id: partenaireId, deletedAt: null } }),
      this.database.prisma.agence.findFirst({ where: { id: dto.agenceId, deletedAt: null } }),
    ]);
    if (!partenaire || !agence) {
      throw new NotFoundException('Partenaire ou agence introuvable.');
    }

    return this.database.prisma.agencePartenaire.upsert({
      where: {
        agenceId_partenaireId: { agenceId: dto.agenceId, partenaireId },
      },
      update: {
        actif: dto.actif,
        depuis: dto.depuis ? new Date(dto.depuis) : null,
        jusqua: dto.jusqua ? new Date(dto.jusqua) : null,
      },
      create: {
        agenceId: dto.agenceId,
        partenaireId,
        actif: dto.actif,
        depuis: dto.depuis ? new Date(dto.depuis) : null,
        jusqua: dto.jusqua ? new Date(dto.jusqua) : null,
      },
    });
  }

  async assignPartenaireZone(actor: AuthUserDto, rawBody: unknown) {
    const dto = parseOrThrowZod(AssignPartenaireZoneSchema, rawBody);
    const contract = await this.database.prisma.agencePartenaire.findUnique({
      where: { id: dto.agencePartenaireId },
    });
    if (!contract) {
      throw new NotFoundException('Contrat agence-partenaire introuvable.');
    }
    this.policy.assertCanManageAgence(actor, contract.agenceId);

    return this.database.prisma.partenaireZone.upsert({
      where: {
        agencePartenaireId_zoneId: {
          agencePartenaireId: dto.agencePartenaireId,
          zoneId: dto.zoneId,
        },
      },
      update: { actif: dto.actif },
      create: {
        agencePartenaireId: dto.agencePartenaireId,
        zoneId: dto.zoneId,
        actif: dto.actif,
      },
    });
  }

  async addCoursier(actor: AuthUserDto, partenaireId: number, rawBody: unknown) {
    const canPartnerAdmin = this.policy.getAdminPartenaireIds(actor).includes(partenaireId);
    if (!this.policy.isPlatformAdmin(actor) && !canPartnerAdmin) {
      throw new ForbiddenException('Accès refusé pour ajouter un coursier à ce partenaire.');
    }
    const dto = parseOrThrowZod(CreatePartenaireCoursierSchema, rawBody);
    return this.database.prisma.partenaireCoursier.create({
      data: {
        partenaireId,
        nom: dto.nom,
        telephone: dto.telephone ?? null,
        userId: dto.userId ?? null,
        actif: dto.actif,
      },
    });
  }

  async assignPartenaireMembre(actor: AuthUserDto, partenaireId: number, rawBody: unknown) {
    const canPartnerAdmin = this.policy.getAdminPartenaireIds(actor).includes(partenaireId);
    if (!this.policy.isPlatformAdmin(actor) && !canPartnerAdmin) {
      throw new ForbiddenException('Accès refusé pour gérer les membres de ce partenaire.');
    }
    const dto = parseOrThrowZod(CreatePartenaireMembreSchema, rawBody);
    const [partenaire, user] = await Promise.all([
      this.database.prisma.partenaire.findFirst({ where: { id: partenaireId, deletedAt: null } }),
      this.database.prisma.user.findFirst({ where: { id: dto.userId, deletedAt: null } }),
    ]);
    if (!partenaire || !user) {
      throw new NotFoundException('Partenaire ou utilisateur introuvable.');
    }

    const member = await this.database.prisma.partenaireMembre.upsert({
      where: { partenaireId_userId: { partenaireId, userId: dto.userId } },
      update: { role: dto.role, actif: dto.actif },
      create: {
        partenaireId,
        userId: dto.userId,
        role: dto.role,
        actif: dto.actif,
      },
      include: {
        user: { select: { id: true, nomComplet: true, email: true } },
      },
    });

    await this.accessContextService.invalidateUser(dto.userId);
    return member;
  }

  async upsertConnexion(actor: AuthUserDto, partenaireId: number, rawBody: unknown) {
    if (!this.policy.isPlatformAdmin(actor)) {
      throw new ForbiddenException(
        'Seul un administrateur plateforme peut configurer la connexion API sortante partenaire.',
      );
    }
    const dto = parseOrThrowZod(UpsertPartenaireConnexionSchema, rawBody);
    const partenaire = await this.database.prisma.partenaire.findFirst({
      where: { id: partenaireId, deletedAt: null },
    });
    if (!partenaire) {
      throw new NotFoundException(`Partenaire #${partenaireId} introuvable.`);
    }

    return this.database.prisma.partenaireConnexion.create({
      data: {
        partenaireId,
        apiTypeCode: dto.apiTypeCode,
        baseUrl: dto.baseUrl,
        identifiantChiffre: this.encryptSecret(dto.identifiant),
        secretChiffre: this.encryptSecret(dto.secret),
        actif: dto.actif,
      },
      select: {
        id: true,
        partenaireId: true,
        apiTypeCode: true,
        baseUrl: true,
        actif: true,
        createdAt: true,
      },
    });
  }

  /**
   * Émission d'une clé API B2B (HMAC-SHA256 avec API_SECRET_PEPPER).
   * Applique strictement la règle D-09 : jamais de clé API sur un sous-compte (parentId !== null).
   */
  async createApiIdentifiant(actor: AuthUserDto, rawBody: unknown) {
    const dto = parseOrThrowZod(CreateApiIdentifiantSchema, rawBody);

    const hasPartenaire = dto.partenaireId !== null && dto.partenaireId !== undefined;
    const hasUser = dto.userId !== null && dto.userId !== undefined;
    if ((hasPartenaire && hasUser) || (!hasPartenaire && !hasUser)) {
      throw new BadRequestException(
        'Spécifiez exactement un titulaire : soit partenaireId, soit userId.',
      );
    }

    if (hasPartenaire && dto.partenaireId) {
      const canPartnerAdmin = this.policy.getAdminPartenaireIds(actor).includes(dto.partenaireId);
      if (!this.policy.isPlatformAdmin(actor) && !canPartnerAdmin) {
        throw new ForbiddenException('Accès refusé pour créer une clé API partenaire.');
      }
      const partenaire = await this.database.prisma.partenaire.findFirst({
        where: { id: dto.partenaireId, deletedAt: null },
      });
      if (!partenaire) {
        throw new NotFoundException('Partenaire introuvable.');
      }
    }

    if (hasUser && dto.userId) {
      const targetUser = await this.database.prisma.user.findFirst({
        where: { id: dto.userId, deletedAt: null },
        select: { id: true, parentId: true },
      });
      if (!targetUser) {
        throw new NotFoundException('Compte utilisateur introuvable.');
      }
      this.policy.assertApiKeyTitulaireAllowed({ userParentId: targetUser.parentId });

      if (!this.policy.isPlatformAdmin(actor) && actor.titulaireId !== targetUser.id) {
        throw new ForbiddenException(
          'Vous ne pouvez créer une clé API que pour votre compte titulaire.',
        );
      }
    }

    const publicKey = `g4d_pk_${randomBytes(16).toString('hex')}`;
    const rawSecret = `g4d_sk_${randomBytes(32).toString('base64url')}`;
    const secretEmpreinte = this.hashApiSecret(rawSecret);

    const created = await this.database.prisma.apiIdentifiant.create({
      data: {
        partenaireId: dto.partenaireId ?? null,
        userId: dto.userId ?? null,
        libelle: dto.libelle,
        clePublique: publicKey,
        secretEmpreinte,
        scopes: dto.scopes ?? ['colis:read', 'colis:create'],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      select: {
        id: true,
        libelle: true,
        clePublique: true,
        partenaireId: true,
        userId: true,
        scopes: true,
        actif: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      ...created,
      secretClairUnique: rawSecret,
    };
  }

  async revokeApiIdentifiant(actor: AuthUserDto, keyId: number) {
    const keyRow = await this.database.prisma.apiIdentifiant.findUnique({
      where: { id: keyId },
    });
    if (!keyRow) {
      throw new NotFoundException('Clé API introuvable.');
    }

    const isOwnerUser =
      keyRow.userId !== null && keyRow.userId === actor.titulaireId && actor.parentId === null;
    const isPartnerAdmin =
      keyRow.partenaireId !== null &&
      this.policy.getAdminPartenaireIds(actor).includes(keyRow.partenaireId);

    if (!this.policy.isPlatformAdmin(actor) && !isOwnerUser && !isPartnerAdmin) {
      throw new ForbiddenException('Accès refusé pour révoquer cette clé API.');
    }

    return this.database.prisma.apiIdentifiant.update({
      where: { id: keyId },
      data: { actif: false, revokedAt: new Date() },
      select: { id: true, clePublique: true, actif: true, revokedAt: true },
    });
  }

  async bulkUpdateStatus(actor: AuthUserDto, rawBody: unknown) {
    if (!this.policy.isPlatformAdmin(actor)) {
      throw new ForbiddenException(
        'Seul un administrateur plateforme peut modifier le statut des partenaires en lot.',
      );
    }
    const dto = parseOrThrowZod(
      BulkActifStatusSchema,
      rawBody,
      'Paramètres de mise à jour groupée des partenaires invalides.',
    );
    const uniqueIds = [...new Set(dto.ids)];

    const result = await this.database.prisma.partenaire.updateMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      data: { actif: dto.actif },
    });

    return {
      ok: true,
      updatedCount: result.count,
      skippedCount: Math.max(0, uniqueIds.length - result.count),
      message: `${result.count} partenaire(s) ${dto.actif ? 'activé(s)' : 'désactivé(s)'}.`,
    };
  }
}
