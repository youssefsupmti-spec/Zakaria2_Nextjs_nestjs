import { BadRequestException } from '@nestjs/common';
import type { AuthUserDto } from '@zakaria/shared-contracts';
import { describe, expect, it } from 'vitest';
import { PolicyService } from '../src/modules/access-control/policy.service';
import { AgenceRamassageService } from '../src/modules/businesses/agence-ramassage.service';
import { BusinessesService } from '../src/modules/businesses/businesses.service';
import {
  InvoiceBankResolverService,
  resolveBankFromCompte,
  type BankPrefixLookupEntry,
} from '../src/modules/businesses/invoice-bank-resolver.service';

const ADMIN_ACTOR: AuthUserDto = {
  id: 1,
  titulaireId: 1,
  parentId: null,
  nomComplet: 'Admin G4D',
  civilite: 'M.',
  email: 'admin@g4d.ma',
  telephone: '0600000000',
  villeName: 'Salé',
  villeId: 1,
  roleId: 1,
  isSuperAdmin: true,
  tarifRamassage: false,
  active: true,
  roles: ['super_admin'],
  permissions: [],
  accessContext: {
    primaryScope: 'plateforme',
    titulaireId: 1,
    isSuperAdmin: true,
    isPlatformAdmin: true,
    selectedAgenceId: 1,
    agenceMemberships: [],
    managedAgenceIds: [],
    partenaireMemberships: [],
  },
};

describe('Vendeurs, Business & Couverture Agence', () => {
  it('InvoiceBankResolver : applique la résolution à 3 niveaux (relation -> custom -> préfixe RIB)', () => {
    const prefixMap = new Map<string, BankPrefixLookupEntry>([
      [
        '007',
        {
          code: '007',
          banqueId: 1,
          banqueName: 'Attijariwafa Bank',
          banqueLogo: 'attijari.png',
        },
      ],
    ]);

    // Niveau 1 : relation banque active
    const level1 = resolveBankFromCompte(
      {
        rib: '011810000123456789012345',
        titulaireNom: 'Boutique Atlas',
        banqueNomCustom: 'Ignoré',
        banque: { id: 2, name: 'BMCE Bank of Africa', logo: 'bmce.png', deletedAt: null },
      },
      prefixMap,
    );
    expect(level1.source).toBe('banque_relation');
    expect(level1.banqueNom).toBe('BMCE Bank of Africa');
    expect(level1.estBanqueCustom).toBe(false);

    // Niveau 2 : banqueNomCustom
    const level2 = resolveBankFromCompte(
      {
        rib: '007810000123456789012345',
        titulaireNom: 'Sarl Orion',
        banqueNomCustom: 'CIH Offshore Custom',
        banque: null,
      },
      prefixMap,
    );
    expect(level2.source).toBe('banque_nom_custom');
    expect(level2.banqueNom).toBe('CIH Offshore Custom');
    expect(level2.estBanqueCustom).toBe(true);

    // Niveau 3 : préfixe RIB 3 chiffres
    const level3 = resolveBankFromCompte(
      {
        rib: '007 810 0001234567890123 45',
        titulaireNom: 'Casa Mode',
        banqueNomCustom: null,
        banque: null,
      },
      prefixMap,
    );
    expect(level3.source).toBe('rib_prefix');
    expect(level3.banqueNom).toBe('Attijariwafa Bank');

    // Fallback indéterminé
    const unknown = resolveBankFromCompte(
      {
        rib: '999810000123456789012345',
        titulaireNom: null,
        banqueNomCustom: null,
        banque: null,
      },
      prefixMap,
    );
    expect(unknown.source).toBe('indetermine');
    expect(unknown.banqueNom).toBe('Banque non identifiée');
  });

  it('AgenceRamassageService : évalue la couverture (rattaché, zone, hors zone, orphelin)', () => {
    const policy = new PolicyService();
    const service = new AgenceRamassageService({} as never, policy);
    const saleAgence = { id: 1, nom: 'Agence Salé', code: 'SALE', actif: true };
    const zonesIndex = new Map([[10, [saleAgence]]]);

    expect(
      service.evaluateCouverture(
        { villeId: 5, ville: { zoneId: 10 }, agency: saleAgence },
        zonesIndex,
      ).statut,
    ).toBe('rattache');

    expect(
      service.evaluateCouverture({ villeId: null, ville: null, agency: null }, zonesIndex).statut,
    ).toBe('orphelin_sans_ville');

    const parZone = service.evaluateCouverture(
      { villeId: 5, ville: { zoneId: 10 }, agency: null },
      zonesIndex,
    );
    expect(parZone.statut).toBe('couvert_par_zone');
    expect(parZone.agenceRamassage?.code).toBe('SALE');

    expect(
      service.evaluateCouverture({ villeId: 8, ville: { zoneId: 99 }, agency: null }, zonesIndex)
        .statut,
    ).toBe('hors_zone');
  });

  it('BusinessesService : refuse mode_paiement=virement_bancaire sans compte bancaire actif', async () => {
    const policy = new PolicyService();
    const fakeDb = {
      prisma: {
        business: {
          findFirst: async () => ({
            id: 42,
            userId: 10,
            name: 'Boutique Test',
            agencyId: null,
            modePaiement: 'espece',
            user: {
              id: 10,
              nomComplet: 'Test',
              email: 't@g4d.ma',
              telephone: '0600',
              active: true,
              inscriptionStatut: 'acceptee',
            },
            ville: null,
            returnVille: null,
            agency: null,
          }),
        },
        compteBancaire: {
          findFirst: async () => null,
        },
      },
    };

    const service = new BusinessesService(
      fakeDb as never,
      policy,
      new AgenceRamassageService(fakeDb as never, policy),
      new InvoiceBankResolverService(fakeDb as never),
    );

    await expect(
      service.update(ADMIN_ACTOR, 42, { modePaiement: 'virement_bancaire' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('BusinessesService : refuse de supprimer le compte bancaire actif si mode virement_bancaire', async () => {
    const policy = new PolicyService();
    const fakeDb = {
      prisma: {
        business: {
          findFirst: async () => ({
            id: 42,
            userId: 10,
            name: 'Boutique Virement',
            agencyId: 1,
            modePaiement: 'virement_bancaire',
            user: {
              id: 10,
              nomComplet: 'Test',
              email: 't@g4d.ma',
              telephone: '0600',
              active: true,
              inscriptionStatut: 'acceptee',
            },
            ville: null,
            returnVille: null,
            agency: null,
          }),
        },
        compteBancaire: {
          findFirst: async () => ({
            id: 77,
            ownerType: 'BUSINESS',
            ownerId: 42,
            isActive: true,
            deletedAt: null,
          }),
        },
      },
    };

    const service = new BusinessesService(
      fakeDb as never,
      policy,
      new AgenceRamassageService(fakeDb as never, policy),
      new InvoiceBankResolverService(fakeDb as never),
    );

    await expect(service.deleteCompte(ADMIN_ACTOR, 42, 77)).rejects.toThrow(BadRequestException);
  });
});
