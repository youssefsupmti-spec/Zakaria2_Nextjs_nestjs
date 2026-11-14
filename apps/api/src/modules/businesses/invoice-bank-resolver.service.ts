import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import type { InvoiceBankResolutionDto } from '@zakaria/shared-contracts';

export interface BankPrefixLookupEntry {
  code: string;
  banqueId: number;
  banqueName: string;
  banqueLogo: string | null;
}

export interface CompteBancaireLike {
  rib: string;
  titulaireNom: string | null;
  banqueNomCustom: string | null;
  banque: {
    id: number;
    name: string;
    logo: string | null;
    deletedAt?: Date | null;
  } | null;
}

/** Normalise un RIB en conservant uniquement les caractères alphanumériques majuscules. */
export function normalizeRib(rib: string): string {
  return rib.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}

/** Extrait le préfixe bancaire à 3 chiffres d'un RIB marocain si présent. */
export function extractRibPrefix3(rib: string): string | null {
  const clean = normalizeRib(rib);
  if (!/^\d{3}/.test(clean)) {
    return null;
  }
  return clean.slice(0, 3);
}

/**
 * Fonction pure de résolution bancaire à 3 niveaux (InvoiceBankResolver) :
 * 1. Relation `banque` active explicite
 * 2. Nom personnalisé saisi manuellement (`banqueNomCustom`)
 * 3. Préfixe 3 chiffres du RIB dans `banque_codes`
 */
export function resolveBankFromCompte(
  compte: CompteBancaireLike,
  prefixMap: Map<string, BankPrefixLookupEntry>,
): InvoiceBankResolutionDto {
  const titulaireNom = compte.titulaireNom?.trim() || 'Titulaire non renseigné';
  const rib = normalizeRib(compte.rib);

  if (compte.banque && !compte.banque.deletedAt) {
    return {
      banqueNom: compte.banque.name,
      banqueLogo: compte.banque.logo,
      rib,
      titulaireNom,
      estBanqueCustom: false,
      source: 'banque_relation',
    };
  }

  const customName = compte.banqueNomCustom?.trim();
  if (customName) {
    return {
      banqueNom: customName,
      banqueLogo: null,
      rib,
      titulaireNom,
      estBanqueCustom: true,
      source: 'banque_nom_custom',
    };
  }

  const prefix = extractRibPrefix3(rib);
  if (prefix) {
    const matched = prefixMap.get(prefix);
    if (matched) {
      return {
        banqueNom: matched.banqueName,
        banqueLogo: matched.banqueLogo,
        rib,
        titulaireNom,
        estBanqueCustom: false,
        source: 'rib_prefix',
      };
    }
  }

  return {
    banqueNom: 'Banque non identifiée',
    banqueLogo: null,
    rib,
    titulaireNom,
    estBanqueCustom: false,
    source: 'indetermine',
  };
}

@Injectable()
export class InvoiceBankResolverService {
  constructor(private readonly database: DatabaseService) {}

  /** Charge la table d'association préfixe RIB (3 chiffres) -> Banque active. */
  async loadPrefixLookupMap(): Promise<Map<string, BankPrefixLookupEntry>> {
    const rows = await this.database.prisma.banqueCode.findMany({
      where: {
        banque: { deletedAt: null },
      },
      select: {
        code: true,
        banque: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    const map = new Map<string, BankPrefixLookupEntry>();
    for (const row of rows) {
      map.set(row.code, {
        code: row.code,
        banqueId: row.banque.id,
        banqueName: row.banque.name,
        banqueLogo: row.banque.logo,
      });
    }
    return map;
  }

  resolve(
    compte: CompteBancaireLike,
    prefixMap: Map<string, BankPrefixLookupEntry>,
  ): InvoiceBankResolutionDto {
    return resolveBankFromCompte(compte, prefixMap);
  }
}
