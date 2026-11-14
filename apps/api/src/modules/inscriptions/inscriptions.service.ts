import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService, type Prisma } from '@zakaria/backend-database';
import {
  INSCRIPTION_STATUT_VALUES,
  RefuserInscriptionSchema,
  type AuthUserDto,
  type InscriptionStatut,
} from '@zakaria/shared-contracts';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { AccessContextService } from '../access-control/access-context.service';
import { PolicyService } from '../access-control/policy.service';
import { AuthAuditService } from '../auth/auth-audit.service';
import type { RequestMeta } from '../auth/auth.types';
import { PermissionResolverService } from '../auth/permission-resolver.service';
import { SessionService } from '../auth/session.service';
import { AgenceRamassageService } from '../businesses/agence-ramassage.service';

export interface ListInscriptionsQuery {
  statut?: string;
  search?: string;
}

@Injectable()
export class InscriptionsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
    private readonly agenceRamassage: AgenceRamassageService,
    private readonly permissionResolver: PermissionResolverService,
    private readonly accessContextService: AccessContextService,
    private readonly sessionService: SessionService,
    private readonly audit: AuthAuditService,
  ) {}

  private assertCanViewInscriptions(actor: AuthUserDto): void {
    if (this.agenceRamassage.isClientActor(actor)) {
      throw new ForbiddenException(
        "L'espace validation des inscriptions est réservé aux équipes G4D.",
      );
    }
    if (this.agenceRamassage.hasGlobalClientScope(actor)) {
      return;
    }
    const allowed =
      this.policy.hasPermission(actor, 'Approve:DemandeInscription') ||
      this.policy.hasPermission(actor, 'Reject:DemandeInscription') ||
      this.policy.hasPermission(actor, 'View:PendingClientsAlert') ||
      this.agenceRamassage.getScopedAgenceIds(actor).length > 0;

    if (!allowed) {
      throw new ForbiddenException("Accès refusé aux demandes d'inscription vendeurs.");
    }
  }

  private assertCanDecision(actor: AuthUserDto, permission: string): void {
    if (this.agenceRamassage.isClientActor(actor)) {
      throw new ForbiddenException('Action interdite pour un compte vendeur.');
    }
    if (this.policy.isPlatformAdmin(actor)) {
      return;
    }
    if (!this.policy.hasPermission(actor, permission)) {
      throw new ForbiddenException(`Permission requise : ${permission}.`);
    }
  }

  private async buildUserScopeWhere(
    actor: AuthUserDto,
    includeSoftDeletedBusinesses: boolean,
  ): Promise<Prisma.UserWhereInput> {
    if (this.agenceRamassage.hasGlobalClientScope(actor)) {
      return {};
    }
    const businessScope = await this.agenceRamassage.buildBusinessScopeWhere(actor, {
      includeSoftDeleted: includeSoftDeletedBusinesses,
    });
    return {
      businesses: {
        some: businessScope,
      },
    };
  }

  private buildStatusWhere(
    statut: InscriptionStatut,
    userScope: Prisma.UserWhereInput,
    search?: string,
  ): Prisma.UserWhereInput {
    const clauses: Prisma.UserWhereInput[] = [userScope, { inscriptionStatut: statut }];

    if (statut !== 'refusee') {
      clauses.push({ deletedAt: null });
    }

    if (search) {
      clauses.push({
        OR: [
          { nomComplet: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { telephone: { contains: search, mode: 'insensitive' } },
          { villeName: { contains: search, mode: 'insensitive' } },
          { businesses: { some: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      });
    }

    return { AND: clauses };
  }

  /** Liste les demandes d'inscription (en_attente / acceptee / refusee) + compteurs scopés. */
  async list(actor: AuthUserDto, query: ListInscriptionsQuery) {
    this.assertCanViewInscriptions(actor);

    const requestedStatut = INSCRIPTION_STATUT_VALUES.includes(query.statut as InscriptionStatut)
      ? (query.statut as InscriptionStatut)
      : 'en_attente';
    const search = query.search?.trim();

    const [activeScope, refuseScope] = await Promise.all([
      this.buildUserScopeWhere(actor, false),
      this.buildUserScopeWhere(actor, true),
    ]);

    const selectedWhere = this.buildStatusWhere(
      requestedStatut,
      requestedStatut === 'refusee' ? refuseScope : activeScope,
      search,
    );

    const [enAttenteCount, accepteeCount, refuseeCount, items] = await Promise.all([
      this.database.prisma.user.count({
        where: this.buildStatusWhere('en_attente', activeScope),
      }),
      this.database.prisma.user.count({
        where: this.buildStatusWhere('acceptee', activeScope),
      }),
      this.database.prisma.user.count({
        where: this.buildStatusWhere('refusee', refuseScope),
      }),
      this.database.prisma.user.findMany({
        where: selectedWhere,
        select: {
          id: true,
          nomComplet: true,
          civilite: true,
          email: true,
          telephone: true,
          sav: true,
          villeId: true,
          villeName: true,
          cin: true,
          lienLocalisationMaps: true,
          active: true,
          inscriptionStatut: true,
          inscriptionTraiteePar: true,
          inscriptionTraiteeLe: true,
          inscriptionMotif: true,
          inscriptionRefusNombre: true,
          inscriptionDernierRefusLe: true,
          createdAt: true,
          businesses: {
            where: requestedStatut === 'refusee' ? undefined : { deletedAt: null },
            select: {
              id: true,
              name: true,
              type: true,
              telephone: true,
              email: true,
              adresse: true,
              ice: true,
              rc: true,
              isActive: true,
              ville: { select: { id: true, nameFr: true } },
              agency: { select: { id: true, nom: true, code: true } },
            },
            orderBy: { id: 'asc' },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    ]);

    return {
      statut: requestedStatut,
      canApprove:
        this.policy.isPlatformAdmin(actor) ||
        this.policy.hasPermission(actor, 'Approve:DemandeInscription'),
      canReject:
        this.policy.isPlatformAdmin(actor) ||
        this.policy.hasPermission(actor, 'Reject:DemandeInscription'),
      counts: {
        enAttente: enAttenteCount,
        acceptee: accepteeCount,
        refusee: refuseeCount,
      },
      items,
    };
  }

  /** Vérifie que le client ciblé appartient au périmètre de l'acteur avant traitement. */
  private async assertClientInActorScope(actor: AuthUserDto, clientId: number): Promise<void> {
    if (this.agenceRamassage.hasGlobalClientScope(actor)) {
      return;
    }
    const scope = await this.buildUserScopeWhere(actor, false);
    const matched = await this.database.prisma.user.findFirst({
      where: { AND: [{ id: clientId }, scope] },
      select: { id: true },
    });
    if (!matched) {
      throw new ForbiddenException('Ce vendeur est hors du périmètre de votre agence.');
    }
  }

  /**
   * AccepterDemandeInscription : verrouillage FOR UPDATE + vérification d'au moins 1 enseigne active.
   */
  async accepter(actor: AuthUserDto, clientId: number, meta: RequestMeta) {
    this.assertCanDecision(actor, 'Approve:DemandeInscription');
    await this.assertClientInActorScope(actor, clientId);

    const now = new Date();
    await this.database.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        Array<{ id: number; inscription_statut: string | null }>
      >`SELECT id, inscription_statut FROM "users" WHERE id = ${clientId} FOR UPDATE`;

      const row = locked[0];
      if (!row) {
        throw new NotFoundException("Demande d'inscription introuvable.");
      }
      if (row.inscription_statut !== 'en_attente') {
        throw new BadRequestException("Cette demande n'est plus au statut en attente.");
      }

      const businessCount = await tx.business.count({
        where: { userId: clientId, deletedAt: null },
      });
      if (businessCount < 1) {
        throw new BadRequestException(
          "Impossible d'accepter ce vendeur : aucune enseigne active n'est rattachée à son dossier.",
        );
      }

      await tx.user.update({
        where: { id: clientId },
        data: {
          active: true,
          deletedAt: null,
          inscriptionStatut: 'acceptee',
          inscriptionTraiteePar: actor.id,
          inscriptionTraiteeLe: now,
        },
      });
    });

    await this.permissionResolver.invalidateUserCache(clientId);
    await this.accessContextService.invalidateUser(clientId);
    await this.audit.record('inscription_accepted', clientId, meta, `traite_par:${actor.id}`);

    return {
      ok: true,
      id: clientId,
      statut: 'acceptee',
      message: 'Inscription validée : le compte vendeur est désormais actif.',
    };
  }

  /**
   * RefuserDemandeInscription : verrouillage FOR UPDATE, incrément inscriptionRefusNombre,
   * motif obligatoire, soft-delete compte + enseignes et révocation des sessions.
   */
  async refuser(actor: AuthUserDto, clientId: number, rawPayload: unknown, meta: RequestMeta) {
    this.assertCanDecision(actor, 'Reject:DemandeInscription');
    await this.assertClientInActorScope(actor, clientId);

    const dto = parseOrThrowZod(
      RefuserInscriptionSchema,
      rawPayload,
      'Un motif de refus valide est obligatoire.',
    );

    const now = new Date();
    await this.database.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        Array<{ id: number; inscription_statut: string | null }>
      >`SELECT id, inscription_statut FROM "users" WHERE id = ${clientId} FOR UPDATE`;

      const row = locked[0];
      if (!row) {
        throw new NotFoundException("Demande d'inscription introuvable.");
      }
      if (row.inscription_statut !== 'en_attente') {
        throw new BadRequestException("Cette demande n'est plus au statut en attente.");
      }

      await tx.user.update({
        where: { id: clientId },
        data: {
          active: false,
          inscriptionStatut: 'refusee',
          inscriptionRefusNombre: { increment: 1 },
          inscriptionDernierRefusLe: now,
          inscriptionMotif: dto.motif.trim(),
          inscriptionTraiteePar: actor.id,
          inscriptionTraiteeLe: now,
          deletedAt: now,
        },
      });

      await tx.business.updateMany({
        where: { userId: clientId, deletedAt: null },
        data: { isActive: false, deletedAt: now },
      });
    });

    await this.sessionService.revokeAllUserSessions(clientId, 'inscription_refused');
    await this.permissionResolver.invalidateUserCache(clientId);
    await this.accessContextService.invalidateUser(clientId);
    await this.audit.record(
      'inscription_rejected',
      clientId,
      meta,
      `traite_par:${actor.id} | ${dto.motif.trim()}`,
    );

    return {
      ok: true,
      id: clientId,
      statut: 'refusee',
      message: "La demande d'inscription a été refusée et archivée.",
    };
  }
}
