import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService, type Prisma } from '@zakaria/backend-database';
import {
  CreateBusinessSchema,
  CreateCompteBancaireSchema,
  UpdateBusinessSchema,
  UpdateCompteBancaireSchema,
  type AuthUserDto,
} from '@zakaria/shared-contracts';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { PolicyService } from '../access-control/policy.service';
import { AgenceRamassageService, type CouvertureBusinessStatut } from './agence-ramassage.service';
import { InvoiceBankResolverService, normalizeRib } from './invoice-bank-resolver.service';

export interface BusinessListQuery {
  search?: string;
  couverture?: string;
  agencyId?: string;
  modePaiement?: string;
  isActive?: string;
}

@Injectable()
export class BusinessesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
    private readonly agenceRamassage: AgenceRamassageService,
    private readonly bankResolver: InvoiceBankResolverService,
  ) {}

  private assertCanReadList(actor: AuthUserDto): void {
    if (this.agenceRamassage.isClientActor(actor)) {
      return;
    }
    if (this.agenceRamassage.hasGlobalClientScope(actor)) {
      return;
    }
    if (
      this.policy.hasPermission(actor, 'ViewAny:Business') ||
      this.policy.hasPermission(actor, 'View:BusinessesAdministration') ||
      this.agenceRamassage.getScopedAgenceIds(actor).length > 0
    ) {
      return;
    }
    throw new ForbiddenException('Accès refusé à la gestion des enseignes commerciales.');
  }

  private async loadAndAssertBusinessAccess(
    actor: AuthUserDto,
    businessId: number,
    requiredStaffPerm?: string,
  ) {
    const scopeWhere = await this.agenceRamassage.buildBusinessScopeWhere(actor);
    const business = await this.database.prisma.business.findFirst({
      where: {
        AND: [{ id: businessId }, scopeWhere],
      },
      include: {
        user: {
          select: {
            id: true,
            nomComplet: true,
            email: true,
            telephone: true,
            active: true,
            inscriptionStatut: true,
          },
        },
        ville: { select: { id: true, nameFr: true, codeZone: true, zoneId: true } },
        returnVille: { select: { id: true, nameFr: true, codeZone: true, zoneId: true } },
        agency: { select: { id: true, nom: true, code: true, actif: true } },
      },
    });

    if (!business) {
      throw new NotFoundException('Enseigne commerciale introuvable ou hors de votre périmètre.');
    }

    if (!this.agenceRamassage.isClientActor(actor) && requiredStaffPerm) {
      if (
        !this.policy.isPlatformAdmin(actor) &&
        !this.policy.hasPermission(actor, requiredStaffPerm)
      ) {
        throw new ForbiddenException(`Permission requise : ${requiredStaffPerm}.`);
      }
    }

    return business;
  }

  /** Liste les enseignes visibles dans le périmètre de l'acteur avec leur couverture et compte bancaire actif. */
  async list(actor: AuthUserDto, query: BusinessListQuery) {
    this.assertCanReadList(actor);

    const scopeWhere = await this.agenceRamassage.buildBusinessScopeWhere(actor);
    const search = query.search?.trim();
    const andClauses: Prisma.BusinessWhereInput[] = [scopeWhere];

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { ice: { contains: search, mode: 'insensitive' } },
          { rc: { contains: search, mode: 'insensitive' } },
          { telephone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { user: { nomComplet: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.modePaiement === 'espece' || query.modePaiement === 'virement_bancaire') {
      andClauses.push({ modePaiement: query.modePaiement });
    }

    if (query.isActive === 'true') {
      andClauses.push({ isActive: true });
    } else if (query.isActive === 'false') {
      andClauses.push({ isActive: false });
    }

    if (query.agencyId && Number.isInteger(Number(query.agencyId)) && Number(query.agencyId) > 0) {
      andClauses.push({ agencyId: Number(query.agencyId) });
    }

    const [businesses, zonesIndex, prefixMap, agences, villes, banques] = await Promise.all([
      this.database.prisma.business.findMany({
        where: { AND: andClauses },
        include: {
          user: {
            select: {
              id: true,
              nomComplet: true,
              email: true,
              telephone: true,
              active: true,
              inscriptionStatut: true,
            },
          },
          ville: { select: { id: true, nameFr: true, codeZone: true, zoneId: true } },
          returnVille: { select: { id: true, nameFr: true, codeZone: true, zoneId: true } },
          agency: { select: { id: true, nom: true, code: true, actif: true } },
        },
        orderBy: [{ isActive: 'desc' }, { id: 'desc' }],
      }),
      this.agenceRamassage.loadRamassageZonesByZoneId(),
      this.bankResolver.loadPrefixLookupMap(),
      this.database.prisma.agence.findMany({
        where: { deletedAt: null, actif: true },
        select: { id: true, nom: true, code: true },
        orderBy: { nom: 'asc' },
      }),
      this.database.prisma.ville.findMany({
        where: { deletedAt: null },
        select: { id: true, nameFr: true, codeZone: true, zoneId: true },
        orderBy: { nameFr: 'asc' },
      }),
      this.database.prisma.banque.findMany({
        where: { deletedAt: null, status: 'active' },
        select: { id: true, name: true, swiftCode: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const businessIds = businesses.map((b) => b.id);
    const allComptes =
      businessIds.length > 0
        ? await this.database.prisma.compteBancaire.findMany({
            where: {
              ownerType: 'BUSINESS',
              ownerId: { in: businessIds },
              deletedAt: null,
            },
            include: {
              banque: { select: { id: true, name: true, logo: true, deletedAt: true } },
            },
            orderBy: [{ isActive: 'desc' }, { id: 'desc' }],
          })
        : [];

    const comptesByBusiness = new Map<number, typeof allComptes>();
    for (const c of allComptes) {
      const listForB = comptesByBusiness.get(c.ownerId) ?? [];
      listForB.push(c);
      comptesByBusiness.set(c.ownerId, listForB);
    }

    const enriched = businesses.map((b) => {
      const couverture = this.agenceRamassage.evaluateCouverture(b, zonesIndex);
      const comptes = (comptesByBusiness.get(b.id) ?? []).map((c) => ({
        id: c.id,
        banqueId: c.banqueId,
        banqueNomCustom: c.banqueNomCustom,
        rib: c.rib,
        titulaireNom: c.titulaireNom,
        isActive: c.isActive,
        resolvedBank: this.bankResolver.resolve(c, prefixMap),
      }));
      const activeCompte = comptes.find((c) => c.isActive) ?? null;

      return {
        ...b,
        couverture,
        comptesCount: comptes.length,
        activeCompte,
        comptes,
      };
    });

    const stats = {
      total: enriched.length,
      actifs: enriched.filter((b) => b.isActive).length,
      virement: enriched.filter((b) => b.modePaiement === 'virement_bancaire').length,
      espece: enriched.filter((b) => b.modePaiement === 'espece').length,
      rattaches: enriched.filter((b) => b.couverture.statut === 'rattache').length,
      couvertsParZone: enriched.filter((b) => b.couverture.statut === 'couvert_par_zone').length,
      orphelins: enriched.filter((b) => b.couverture.statut === 'orphelin_sans_ville').length,
      horsZone: enriched.filter((b) => b.couverture.statut === 'hors_zone').length,
    };

    const couvertureFilter = query.couverture as CouvertureBusinessStatut | undefined;
    const filtered =
      couvertureFilter &&
      ['rattache', 'couvert_par_zone', 'hors_zone', 'orphelin_sans_ville'].includes(
        couvertureFilter,
      )
        ? enriched.filter((b) => b.couverture.statut === couvertureFilter)
        : enriched;

    return {
      isClientView: this.agenceRamassage.isClientActor(actor),
      canDeleteBusiness:
        this.policy.isPlatformAdmin(actor) || this.policy.hasPermission(actor, 'Delete:Business'),
      stats,
      items: filtered,
      options: {
        agences,
        villes,
        banques,
      },
    };
  }

  /** Détails d'une enseigne + ses comptes bancaires résolus. */
  async getOne(actor: AuthUserDto, businessId: number) {
    const business = await this.loadAndAssertBusinessAccess(actor, businessId);
    const [zonesIndex, prefixMap, comptesRaw] = await Promise.all([
      this.agenceRamassage.loadRamassageZonesByZoneId(),
      this.bankResolver.loadPrefixLookupMap(),
      this.database.prisma.compteBancaire.findMany({
        where: { ownerType: 'BUSINESS', ownerId: business.id, deletedAt: null },
        include: {
          banque: { select: { id: true, name: true, logo: true, deletedAt: true } },
        },
        orderBy: [{ isActive: 'desc' }, { id: 'desc' }],
      }),
    ]);

    return {
      business: {
        ...business,
        couverture: this.agenceRamassage.evaluateCouverture(business, zonesIndex),
      },
      comptes: comptesRaw.map((c) => ({
        ...c,
        resolvedBank: this.bankResolver.resolve(c, prefixMap),
      })),
    };
  }

  /** Crée une nouvelle enseigne commerciale (client pour lui-même ou staff/admin). */
  async create(actor: AuthUserDto, rawPayload: unknown) {
    const dto = parseOrThrowZod(
      CreateBusinessSchema,
      rawPayload,
      'Données de création du business invalides.',
    );
    const isClient = this.agenceRamassage.isClientActor(actor);

    if (
      !isClient &&
      !this.policy.isPlatformAdmin(actor) &&
      !this.policy.hasPermission(actor, 'Create:Business')
    ) {
      throw new ForbiddenException("Accès refusé : permission 'Create:Business' requise.");
    }

    if (dto.modePaiement === 'virement_bancaire') {
      throw new BadRequestException(
        'Le virement bancaire nécessite un compte bancaire actif. Créez d’abord le business, ajoutez et activez son compte bancaire, puis activez le virement.',
      );
    }

    const ownerUserId = isClient ? actor.titulaireId : (dto.userId ?? actor.titulaireId);
    const ownerExists = await this.database.prisma.user.findFirst({
      where: { id: ownerUserId, deletedAt: null },
      select: { id: true },
    });
    if (!ownerExists) {
      throw new BadRequestException('Propriétaire (vendeur) introuvable ou supprimé.');
    }

    let agencyId: number | null = dto.agencyId ?? null;
    if (isClient) {
      agencyId = null;
    } else if (agencyId !== null && !this.agenceRamassage.hasGlobalClientScope(actor)) {
      const allowedAgences = this.agenceRamassage.getScopedAgenceIds(actor);
      if (!allowedAgences.includes(agencyId)) {
        throw new ForbiddenException("Vous ne pouvez rattacher un business qu'à votre agence.");
      }
    }

    const created = await this.database.prisma.business.create({
      data: {
        userId: ownerUserId,
        name: dto.name.trim(),
        type: dto.type ?? null,
        logo: dto.logo ?? null,
        adresse: dto.adresse?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        ice: dto.ice?.trim() || null,
        rc: dto.rc?.trim() || null,
        telephone: dto.telephone?.trim() || null,
        villeId: dto.villeId ?? null,
        agencyId,
        isActive: dto.isActive ?? true,
        modePaiement: dto.modePaiement ?? null,
        defaultFragile: dto.defaultFragile ?? false,
        defaultOpenpackage: dto.defaultOpenpackage ?? true,
        defaultEssayage: dto.defaultEssayage ?? false,
        labelMessage: dto.labelMessage?.trim() || null,
        autoSendPreparation: dto.autoSendPreparation ?? false,
        returnType: dto.returnType ?? null,
        returnRecipient: dto.returnRecipient?.trim() || null,
        returnPhone: dto.returnPhone?.trim() || null,
        returnVilleId: dto.returnVilleId ?? null,
        returnAddress: dto.returnAddress?.trim() || null,
        returnNote: dto.returnNote?.trim() || null,
      },
    });

    return { ok: true, business: created };
  }

  /** Met à jour un business en appliquant la garde virement_bancaire + périmètre d'agence. */
  async update(actor: AuthUserDto, businessId: number, rawPayload: unknown) {
    const existing = await this.loadAndAssertBusinessAccess(actor, businessId, 'Update:Business');
    const dto = parseOrThrowZod(
      UpdateBusinessSchema,
      rawPayload,
      'Données de modification du business invalides.',
    );
    const isClient = this.agenceRamassage.isClientActor(actor);

    const nextModePaiement =
      dto.modePaiement !== undefined ? dto.modePaiement : existing.modePaiement;
    if (nextModePaiement === 'virement_bancaire') {
      const activeAccount = await this.database.prisma.compteBancaire.findFirst({
        where: {
          ownerType: 'BUSINESS',
          ownerId: businessId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!activeAccount) {
        throw new BadRequestException(
          'Le virement bancaire nécessite un compte bancaire actif pour ce business.',
        );
      }
    }

    let nextAgencyId = existing.agencyId;
    if (!isClient && dto.agencyId !== undefined) {
      if (dto.agencyId !== null && !this.agenceRamassage.hasGlobalClientScope(actor)) {
        const allowed = this.agenceRamassage.getScopedAgenceIds(actor);
        if (!allowed.includes(dto.agencyId)) {
          throw new ForbiddenException("Vous ne pouvez rattacher un business qu'à votre agence.");
        }
      }
      nextAgencyId = dto.agencyId;
    }

    const updated = await this.database.prisma.business.update({
      where: { id: businessId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.logo !== undefined ? { logo: dto.logo } : {}),
        ...(dto.adresse !== undefined ? { adresse: dto.adresse?.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim().toLowerCase() || null } : {}),
        ...(dto.ice !== undefined ? { ice: dto.ice?.trim() || null } : {}),
        ...(dto.rc !== undefined ? { rc: dto.rc?.trim() || null } : {}),
        ...(dto.telephone !== undefined ? { telephone: dto.telephone?.trim() || null } : {}),
        ...(dto.villeId !== undefined ? { villeId: dto.villeId } : {}),
        ...(!isClient && dto.agencyId !== undefined ? { agencyId: nextAgencyId } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.modePaiement !== undefined ? { modePaiement: dto.modePaiement } : {}),
        ...(dto.defaultFragile !== undefined ? { defaultFragile: dto.defaultFragile } : {}),
        ...(dto.defaultOpenpackage !== undefined
          ? { defaultOpenpackage: dto.defaultOpenpackage }
          : {}),
        ...(dto.defaultEssayage !== undefined ? { defaultEssayage: dto.defaultEssayage } : {}),
        ...(dto.labelMessage !== undefined
          ? { labelMessage: dto.labelMessage?.trim() || null }
          : {}),
        ...(dto.autoSendPreparation !== undefined
          ? { autoSendPreparation: dto.autoSendPreparation }
          : {}),
        ...(dto.returnType !== undefined ? { returnType: dto.returnType } : {}),
        ...(dto.returnRecipient !== undefined
          ? { returnRecipient: dto.returnRecipient?.trim() || null }
          : {}),
        ...(dto.returnPhone !== undefined ? { returnPhone: dto.returnPhone?.trim() || null } : {}),
        ...(dto.returnVilleId !== undefined ? { returnVilleId: dto.returnVilleId } : {}),
        ...(dto.returnAddress !== undefined
          ? { returnAddress: dto.returnAddress?.trim() || null }
          : {}),
        ...(dto.returnNote !== undefined ? { returnNote: dto.returnNote?.trim() || null } : {}),
      },
    });

    return { ok: true, business: updated };
  }

  /**
   * Suppression douce d'un business réservée aux administrateurs/staff autorisés.
   * Note : lorsque le modèle Command/Colis sera migré au Sprint 05+, compléter la garde avec COUNT(commands).
   */
  async softDelete(actor: AuthUserDto, businessId: number) {
    if (this.agenceRamassage.isClientActor(actor)) {
      throw new ForbiddenException(
        "La suppression d'une enseigne est réservée à l'administration G4D.",
      );
    }
    await this.loadAndAssertBusinessAccess(actor, businessId, 'Delete:Business');

    const now = new Date();
    await this.database.prisma.$transaction([
      this.database.prisma.compteBancaire.updateMany({
        where: { ownerType: 'BUSINESS', ownerId: businessId, deletedAt: null },
        data: { isActive: false, deletedAt: now },
      }),
      this.database.prisma.business.update({
        where: { id: businessId },
        data: { isActive: false, deletedAt: now },
      }),
    ]);

    return { ok: true, id: businessId, message: 'Enseigne archivée avec ses comptes bancaires.' };
  }

  /** Liste les comptes bancaires d'un business avec résolution bancaire 3 niveaux. */
  async listComptes(actor: AuthUserDto, businessId: number) {
    await this.loadAndAssertBusinessAccess(actor, businessId);
    const [comptes, prefixMap] = await Promise.all([
      this.database.prisma.compteBancaire.findMany({
        where: { ownerType: 'BUSINESS', ownerId: businessId, deletedAt: null },
        include: {
          banque: { select: { id: true, name: true, logo: true, deletedAt: true } },
        },
        orderBy: [{ isActive: 'desc' }, { id: 'desc' }],
      }),
      this.bankResolver.loadPrefixLookupMap(),
    ]);

    return {
      comptes: comptes.map((c) => ({
        ...c,
        resolvedBank: this.bankResolver.resolve(c, prefixMap),
      })),
    };
  }

  /** Crée un compte bancaire rattaché à un business (toujours inactif à la création). */
  async createCompte(actor: AuthUserDto, businessId: number, rawPayload: unknown) {
    await this.loadAndAssertBusinessAccess(actor, businessId, 'Update:Business');
    const dto = parseOrThrowZod(
      CreateCompteBancaireSchema,
      rawPayload,
      'Données du compte bancaire invalides.',
    );

    if (dto.banqueId) {
      const bank = await this.database.prisma.banque.findFirst({
        where: { id: dto.banqueId, deletedAt: null },
        select: { id: true },
      });
      if (!bank) {
        throw new BadRequestException('Banque sélectionnée introuvable.');
      }
    }

    const created = await this.database.prisma.compteBancaire.create({
      data: {
        ownerType: 'BUSINESS',
        ownerId: businessId,
        banqueId: dto.banqueId ?? null,
        banqueNomCustom: dto.banqueId ? null : dto.banqueNomCustom?.trim() || null,
        rib: normalizeRib(dto.rib),
        titulaireNom: dto.titulaireNom.trim(),
        isActive: false,
      },
    });

    return { ok: true, compte: created };
  }

  /** Met à jour un compte bancaire existant d'un business. */
  async updateCompte(
    actor: AuthUserDto,
    businessId: number,
    compteId: number,
    rawPayload: unknown,
  ) {
    await this.loadAndAssertBusinessAccess(actor, businessId, 'Update:Business');
    const dto = parseOrThrowZod(
      UpdateCompteBancaireSchema,
      rawPayload,
      'Données de mise à jour du compte bancaire invalides.',
    );

    const existing = await this.database.prisma.compteBancaire.findFirst({
      where: {
        id: compteId,
        ownerType: 'BUSINESS',
        ownerId: businessId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new NotFoundException('Compte bancaire introuvable pour ce business.');
    }

    if (dto.banqueId) {
      const bank = await this.database.prisma.banque.findFirst({
        where: { id: dto.banqueId, deletedAt: null },
        select: { id: true },
      });
      if (!bank) {
        throw new BadRequestException('Banque sélectionnée introuvable.');
      }
    }

    const updated = await this.database.prisma.compteBancaire.update({
      where: { id: compteId },
      data: {
        ...(dto.banqueId !== undefined ? { banqueId: dto.banqueId } : {}),
        ...(dto.banqueNomCustom !== undefined
          ? { banqueNomCustom: dto.banqueId ? null : dto.banqueNomCustom?.trim() || null }
          : {}),
        ...(dto.rib !== undefined ? { rib: normalizeRib(dto.rib) } : {}),
        ...(dto.titulaireNom !== undefined ? { titulaireNom: dto.titulaireNom.trim() } : {}),
      },
    });

    return { ok: true, compte: updated };
  }

  /**
   * Active un compte bancaire pour un business et désactive les autres dans la même transaction
   * (respect strict de l'index unique partiel PostgreSQL comptes_bancaires_one_active_per_owner_idx).
   */
  async activateCompte(actor: AuthUserDto, businessId: number, compteId: number) {
    await this.loadAndAssertBusinessAccess(actor, businessId, 'Update:Business');

    const existing = await this.database.prisma.compteBancaire.findFirst({
      where: {
        id: compteId,
        ownerType: 'BUSINESS',
        ownerId: businessId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new NotFoundException('Compte bancaire introuvable.');
    }

    await this.database.prisma.$transaction([
      this.database.prisma.compteBancaire.updateMany({
        where: {
          ownerType: 'BUSINESS',
          ownerId: businessId,
          deletedAt: null,
          isActive: true,
          id: { not: compteId },
        },
        data: { isActive: false },
      }),
      this.database.prisma.compteBancaire.update({
        where: { id: compteId },
        data: { isActive: true },
      }),
    ]);

    return { ok: true, id: compteId, message: 'Compte bancaire activé comme compte principal.' };
  }

  /** Supprime un compte bancaire, avec blocage s'il est actif alors que le business est en virement bancaire. */
  async deleteCompte(actor: AuthUserDto, businessId: number, compteId: number) {
    const business = await this.loadAndAssertBusinessAccess(actor, businessId, 'Update:Business');

    const existing = await this.database.prisma.compteBancaire.findFirst({
      where: {
        id: compteId,
        ownerType: 'BUSINESS',
        ownerId: businessId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new NotFoundException('Compte bancaire introuvable.');
    }

    if (existing.isActive && business.modePaiement === 'virement_bancaire') {
      throw new BadRequestException(
        'Ce business utilise le virement bancaire : activez un autre compte bancaire ou passez en paiement espèce avant de supprimer son compte actif.',
      );
    }

    await this.database.prisma.compteBancaire.update({
      where: { id: compteId },
      data: { isActive: false, deletedAt: new Date() },
    });

    return { ok: true, id: compteId };
  }
}
