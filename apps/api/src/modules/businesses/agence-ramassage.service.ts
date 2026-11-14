import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService, type Prisma } from '@zakaria/backend-database';
import type { AuthUserDto } from '@zakaria/shared-contracts';
import { PolicyService } from '../access-control/policy.service';

export type CouvertureBusinessStatut =
  'rattache' | 'couvert_par_zone' | 'hors_zone' | 'orphelin_sans_ville';

export interface AgenceLightDto {
  id: number;
  nom: string;
  code: string;
  actif: boolean;
}

export interface CouvertureBusinessEvaluation {
  statut: CouvertureBusinessStatut;
  label: string;
  agenceRamassage: AgenceLightDto | null;
  agencesEligibles: AgenceLightDto[];
}

export interface RamassageZoneIndexEntry {
  zoneId: number;
  agence: AgenceLightDto;
}

/**
 * Service DDD du périmètre vendeurs/enseignes et de la couverture de ramassage par agence.
 * Implémente les règles métier Laravel AgenceRamassageService, CouvertureDuBusiness et PerimetreClients.
 */
@Injectable()
export class AgenceRamassageService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
  ) {}

  /** Indique si l'acteur voit l'ensemble du périmètre clients/enseignes sans restriction d'agence. */
  hasGlobalClientScope(actor: AuthUserDto): boolean {
    return (
      this.policy.isPlatformAdmin(actor) || this.policy.hasPermission(actor, 'Bypass:AgenceScope')
    );
  }

  /** Indique si l'acteur est un utilisateur client/vendeur restreint à son compte titulaire. */
  isClientActor(actor: AuthUserDto): boolean {
    if (this.hasGlobalClientScope(actor)) {
      return false;
    }
    if (actor.accessContext?.primaryScope) {
      return actor.accessContext.primaryScope === 'client';
    }
    return actor.roles.includes('client');
  }

  /** Retourne les IDs d'agences visibles pour l'acteur (membres actifs ou agence sélectionnée). */
  getScopedAgenceIds(actor: AuthUserDto): number[] {
    const ids = new Set<number>(this.policy.getMemberAgenceIds(actor));
    if (actor.accessContext?.selectedAgenceId) {
      ids.add(actor.accessContext.selectedAgenceId);
    }
    return [...ids];
  }

  /**
   * Construit le filtre Prisma BusinessWhereInput correspondant à PerimetreClients :
   * - Client : uniquement ses propres enseignes (`userId === titulaireId`)
   * - Admin / Bypass:AgenceScope : toutes les enseignes non supprimées
   * - Membre d'agence : enseignes rattachées à l'agence OU sans agence dont la ville est dans une zone ramassage=true
   */
  async buildBusinessScopeWhere(
    actor: AuthUserDto,
    options?: { includeSoftDeleted?: boolean },
  ): Promise<Prisma.BusinessWhereInput> {
    const baseDeleteFilter: Prisma.BusinessWhereInput = options?.includeSoftDeleted
      ? {}
      : { deletedAt: null };

    if (this.isClientActor(actor)) {
      return {
        ...baseDeleteFilter,
        userId: actor.titulaireId,
      };
    }

    if (this.hasGlobalClientScope(actor)) {
      return baseDeleteFilter;
    }

    const agenceIds = this.getScopedAgenceIds(actor);
    if (agenceIds.length === 0) {
      throw new ForbiddenException(
        "Accès refusé : aucune agence n'est associée à votre compte pour consulter ce périmètre.",
      );
    }

    const ramassageZones = await this.database.prisma.agenceZone.findMany({
      where: {
        agenceId: { in: agenceIds },
        ramassage: true,
        agence: { actif: true, deletedAt: null },
      },
      select: { zoneId: true },
    });
    const coveredZoneIds = [...new Set(ramassageZones.map((az) => az.zoneId))];

    const scopeBranches: Prisma.BusinessWhereInput[] = [{ agencyId: { in: agenceIds } }];
    if (coveredZoneIds.length > 0) {
      scopeBranches.push({
        agencyId: null,
        ville: {
          zoneId: { in: coveredZoneIds },
          deletedAt: null,
        },
      });
    }

    return {
      ...baseDeleteFilter,
      OR: scopeBranches,
    };
  }

  /** Charge l'index des agences actives couvrant chaque zone en ramassage. */
  async loadRamassageZonesByZoneId(): Promise<Map<number, AgenceLightDto[]>> {
    const rows = await this.database.prisma.agenceZone.findMany({
      where: {
        ramassage: true,
        agence: { actif: true, deletedAt: null },
      },
      select: {
        zoneId: true,
        agence: {
          select: { id: true, nom: true, code: true, actif: true },
        },
      },
      orderBy: { agenceId: 'asc' },
    });

    const map = new Map<number, AgenceLightDto[]>();
    for (const row of rows) {
      const current = map.get(row.zoneId) ?? [];
      if (!current.some((a) => a.id === row.agence.id)) {
        current.push(row.agence);
      }
      map.set(row.zoneId, current);
    }
    return map;
  }

  /** Évalue CouvertureDuBusiness pour une enseigne à partir de l'index des zones ramassage. */
  evaluateCouverture(
    business: {
      villeId: number | null;
      ville: { zoneId: number | null } | null;
      agency: AgenceLightDto | null;
    },
    zonesIndex: Map<number, AgenceLightDto[]>,
  ): CouvertureBusinessEvaluation {
    if (business.agency && business.agency.actif) {
      return {
        statut: 'rattache',
        label: `Rattaché · ${business.agency.nom}`,
        agenceRamassage: business.agency,
        agencesEligibles: [business.agency],
      };
    }

    if (!business.villeId || !business.ville) {
      return {
        statut: 'orphelin_sans_ville',
        label: 'Orphelin sans ville',
        agenceRamassage: null,
        agencesEligibles: [],
      };
    }

    const agencesEligibles = business.ville.zoneId
      ? (zonesIndex.get(business.ville.zoneId) ?? [])
      : [];

    if (agencesEligibles.length > 0) {
      return {
        statut: 'couvert_par_zone',
        label:
          agencesEligibles.length === 1
            ? `Couvert par zone · ${agencesEligibles[0].nom}`
            : `Couvert par zone (${agencesEligibles.length} agences)`,
        agenceRamassage: agencesEligibles[0] ?? null,
        agencesEligibles,
      };
    }

    return {
      statut: 'hors_zone',
      label: 'Hors zone de ramassage',
      agenceRamassage: null,
      agencesEligibles: [],
    };
  }
}
