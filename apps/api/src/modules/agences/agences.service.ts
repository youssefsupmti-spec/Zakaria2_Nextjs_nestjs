import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import {
  AssignAgenceMembreSchema,
  AssignMembreZoneSchema,
  CreateAgenceSchema,
  CreateZoneSchema,
  UpdateAgenceSchema,
  UpsertAgenceZoneSchema,
  type AuthUserDto,
} from '@zakaria/shared-contracts';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { AccessContextService } from '../access-control/access-context.service';
import { PolicyService } from '../access-control/policy.service';

@Injectable()
export class AgencesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
    private readonly accessContextService: AccessContextService,
  ) {}

  async listZones() {
    return this.database.prisma.zone.findMany({
      where: { deletedAt: null },
      orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
    });
  }

  async createZone(actor: AuthUserDto, rawBody: unknown) {
    if (!this.policy.isPlatformAdmin(actor)) {
      throw new BadRequestException('Seul un administrateur plateforme peut créer une zone.');
    }
    const dto = parseOrThrowZod(CreateZoneSchema, rawBody);
    const existing = await this.database.prisma.zone.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Le code zone '${dto.code}' existe déjà.`);
    }
    return this.database.prisma.zone.create({ data: dto });
  }

  async listAgences(actor: AuthUserDto) {
    const where = this.policy.scopeAgencesWhere(actor);
    return this.database.prisma.agence.findMany({
      where,
      include: {
        ville: { select: { id: true, nameFr: true } },
        responsable: { select: { id: true, nomComplet: true, email: true } },
        agenceZones: {
          include: { zone: { select: { id: true, nom: true, code: true } } },
          orderBy: { zoneId: 'asc' },
        },
        _count: { select: { membres: true, agencePartenaires: true } },
      },
      orderBy: [{ actif: 'desc' }, { id: 'asc' }],
    });
  }

  async createAgence(actor: AuthUserDto, rawBody: unknown) {
    if (!this.policy.isPlatformAdmin(actor)) {
      throw new BadRequestException('Seul un administrateur plateforme peut créer une agence.');
    }
    const dto = parseOrThrowZod(CreateAgenceSchema, rawBody);
    const existing = await this.database.prisma.agence.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Une agence avec le code '${dto.code}' existe déjà.`);
    }
    return this.database.prisma.agence.create({ data: dto });
  }

  async updateAgence(actor: AuthUserDto, agenceId: number, rawBody: unknown) {
    this.policy.assertCanManageAgence(actor, agenceId);
    const dto = parseOrThrowZod(UpdateAgenceSchema, rawBody);
    const existing = await this.database.prisma.agence.findFirst({
      where: { id: agenceId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Agence #${agenceId} introuvable.`);
    }
    return this.database.prisma.agence.update({
      where: { id: agenceId },
      data: dto,
    });
  }

  async upsertAgenceZone(actor: AuthUserDto, agenceId: number, rawBody: unknown) {
    this.policy.assertCanManageAgence(actor, agenceId);
    const dto = parseOrThrowZod(UpsertAgenceZoneSchema, rawBody);

    const [agence, zone] = await Promise.all([
      this.database.prisma.agence.findFirst({ where: { id: agenceId, deletedAt: null } }),
      this.database.prisma.zone.findFirst({ where: { id: dto.zoneId, deletedAt: null } }),
    ]);
    if (!agence || !zone) {
      throw new NotFoundException('Agence ou zone introuvable.');
    }

    return this.database.prisma.agenceZone.upsert({
      where: { agenceId_zoneId: { agenceId, zoneId: dto.zoneId } },
      update: { livraison: dto.livraison, ramassage: dto.ramassage },
      create: {
        agenceId,
        zoneId: dto.zoneId,
        livraison: dto.livraison,
        ramassage: dto.ramassage,
      },
      include: { zone: { select: { id: true, nom: true, code: true } } },
    });
  }

  async listAgenceMembres(actor: AuthUserDto, agenceId: number) {
    this.policy.assertCanViewAgence(actor, agenceId);
    return this.database.prisma.agenceMembre.findMany({
      where: { agenceId },
      include: {
        user: {
          select: { id: true, nomComplet: true, email: true, telephone: true, active: true },
        },
        membreZones: {
          include: { zone: { select: { id: true, nom: true, code: true } } },
        },
      },
      orderBy: [{ actif: 'desc' }, { id: 'asc' }],
    });
  }

  async assignAgenceMembre(actor: AuthUserDto, agenceId: number, rawBody: unknown) {
    this.policy.assertCanManageAgence(actor, agenceId);
    const dto = parseOrThrowZod(AssignAgenceMembreSchema, rawBody);

    if (!this.policy.isPlatformAdmin(actor) && dto.role === 'manager') {
      throw new BadRequestException(
        'Seul un administrateur plateforme peut nommer un manager d’agence.',
      );
    }

    const [agence, user] = await Promise.all([
      this.database.prisma.agence.findFirst({ where: { id: agenceId, deletedAt: null } }),
      this.database.prisma.user.findFirst({ where: { id: dto.userId, deletedAt: null } }),
    ]);
    if (!agence || !user) {
      throw new NotFoundException('Agence ou utilisateur introuvable.');
    }

    const member = await this.database.prisma.agenceMembre.upsert({
      where: { agenceId_userId: { agenceId, userId: dto.userId } },
      update: {
        role: dto.role,
        actif: dto.actif,
        depuis: dto.depuis ? new Date(dto.depuis) : null,
        jusqua: dto.jusqua ? new Date(dto.jusqua) : null,
      },
      create: {
        agenceId,
        userId: dto.userId,
        role: dto.role,
        actif: dto.actif,
        depuis: dto.depuis ? new Date(dto.depuis) : null,
        jusqua: dto.jusqua ? new Date(dto.jusqua) : null,
      },
      include: {
        user: { select: { id: true, nomComplet: true, email: true } },
      },
    });

    await this.accessContextService.invalidateUser(dto.userId);
    return member;
  }

  /**
   * Règle d'intégrité territoriale Chantier 33 :
   * Un membre ne peut être affecté à une zone en livraison/ramassage que si son agence
   * couvre activement cette activité sur ladite zone dans agence_zone.
   */
  async assignMembreZone(
    actor: AuthUserDto,
    agenceId: number,
    agenceMembreId: number,
    rawBody: unknown,
  ) {
    this.policy.assertCanManageAgence(actor, agenceId);
    const dto = parseOrThrowZod(AssignMembreZoneSchema, rawBody);

    const membre = await this.database.prisma.agenceMembre.findFirst({
      where: { id: agenceMembreId, agenceId },
    });
    if (!membre) {
      throw new NotFoundException("Membre d'agence introuvable pour cette agence.");
    }

    const agenceZone = await this.database.prisma.agenceZone.findUnique({
      where: { agenceId_zoneId: { agenceId, zoneId: dto.zoneId } },
    });
    const activityAllowed =
      agenceZone && (dto.activite === 'livraison' ? agenceZone.livraison : agenceZone.ramassage);

    if (!activityAllowed) {
      throw new BadRequestException(
        `Contrainte territoriale C33 : l'agence #${agenceId} ne couvre pas l'activité '${dto.activite}' sur la zone #${dto.zoneId}.`,
      );
    }

    return this.database.prisma.membreZone.upsert({
      where: {
        agenceMembreId_zoneId_activite: {
          agenceMembreId,
          zoneId: dto.zoneId,
          activite: dto.activite,
        },
      },
      update: { actif: dto.actif },
      create: {
        agenceMembreId,
        zoneId: dto.zoneId,
        activite: dto.activite,
        actif: dto.actif,
      },
      include: { zone: { select: { id: true, nom: true, code: true } } },
    });
  }
}
