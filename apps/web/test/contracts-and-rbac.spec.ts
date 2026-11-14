import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getIcon } from '@iconify/react';
import { describe, expect, it } from 'vitest';
import {
  CreateAgenceSchema,
  CreateBanqueSchema,
  CreateCompteBancaireSchema,
  CreateRoleSchema,
  CreateUserSchema,
  RefuserInscriptionSchema,
  RegisterClientSchema,
  SESSION_DURATION_OPTIONS,
} from '@zakaria/shared-contracts';
import '../src/components/ui/solar-icons';
import { ApiClientError } from '../src/lib/api-client';

const WEB_ROOT = resolve(__dirname, '..');

describe('Contrats Front/Back, Design System & RBAC', () => {
  it('expose les 6 durées de session dans le dropdown de connexion', () => {
    expect(SESSION_DURATION_OPTIONS.map((o) => o.value)).toEqual([
      '30m',
      '2h',
      '8h',
      '1d',
      '7d',
      '30d',
    ]);
  });

  it('normalise automatiquement les codes agence et valide les slugs de rôles', () => {
    const agence = CreateAgenceSchema.parse({ nom: 'Agence Tanger', code: 'tanger' });
    expect(agence.code).toBe('TANGER');

    const validRole = CreateRoleSchema.safeParse({
      name: 'superviseur_quai',
      libelle: 'Superviseur Quai',
      portee: 'agence',
      agenceId: 1,
    });
    expect(validRole.success).toBe(true);

    const invalidRole = CreateRoleSchema.safeParse({
      name: 'Role Avec Espaces!',
      libelle: 'Invalide',
      portee: 'agence',
    });
    expect(invalidRole.success).toBe(false);
  });

  it('valide CreateUserSchema et structure ApiClientError', () => {
    const parsedUser = CreateUserSchema.safeParse({
      nomComplet: 'Youssef Livreur',
      email: 'livreur@g4d.ma',
      password: 'Password!2026',
      roleId: 3,
      agenceId: 1,
      agenceRole: 'livreur',
    });
    expect(parsedUser.success).toBe(true);

    const err = new ApiClientError('Accès refusé', 403, { reason: 'csrf' });
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Accès refusé');
  });

  it('RegisterClientSchema valide le formulaire vendeur + enseigne et vérifie la confirmation mot de passe', () => {
    const ok = RegisterClientSchema.safeParse({
      nomComplet: 'Youssef El Amrani',
      civilite: 'M.',
      email: 'youssef@shop.ma',
      telephone: '0661223344',
      villeId: 1,
      password: 'Password!2026',
      passwordConfirmation: 'Password!2026',
      businessName: 'Atlas Couture',
      businessType: 'Boutique e-commerce',
    });
    expect(ok.success).toBe(true);

    const mismatch = RegisterClientSchema.safeParse({
      nomComplet: 'Youssef El Amrani',
      email: 'youssef@shop.ma',
      telephone: '0661223344',
      villeId: 1,
      password: 'Password!2026',
      passwordConfirmation: 'Different!2026',
      businessName: 'Atlas Couture',
    });
    expect(mismatch.success).toBe(false);
  });

  it('RefuserInscriptionSchema, CreateCompteBancaireSchema et CreateBanqueSchema appliquent les règles métier', () => {
    expect(RefuserInscriptionSchema.safeParse({ motif: 'ok' }).success).toBe(false);
    expect(RefuserInscriptionSchema.safeParse({ motif: 'Numéro injoignable' }).success).toBe(true);

    const compte = CreateCompteBancaireSchema.parse({
      banqueId: 1,
      rib: '007 810 0001234567890123 45',
      titulaireNom: 'Atlas Couture SARL',
    });
    expect(compte.rib).toBe('007810000123456789012345');

    expect(
      CreateBanqueSchema.safeParse({
        name: 'CIH Bank',
        codes: ['230', '12'],
      }).success,
    ).toBe(false);

    expect(
      CreateBanqueSchema.safeParse({
        name: 'CIH Bank',
        codes: ['230'],
      }).success,
    ).toBe(true);
  });

  it('SidebarTrigger et ThemeToggle utilisent bien la couleur primary', () => {
    const sidebarSrc = readFileSync(resolve(WEB_ROOT, 'src/components/ui/sidebar.tsx'), 'utf8');
    const themeToggleSrc = readFileSync(
      resolve(WEB_ROOT, 'src/components/app-shell/theme-toggle.tsx'),
      'utf8',
    );
    expect(sidebarSrc).toContain('text-primary');
    expect(themeToggleSrc).toContain('text-primary');
  });

  it('pré-enregistre les icônes Iconify Solar Linear et Bold Duotone de la plateforme', () => {
    const requiredSolarIcons = [
      'solar:panel-left-close-linear',
      'solar:panel-left-open-linear',
      'solar:panel-left-linear',
      'solar:sidebar-minimalistic-linear',
      'solar:sidebar-linear',
      'solar:widget-2-linear',
      'solar:delivery-linear',
      'solar:buildings-2-linear',
      'solar:hand-shake-linear',
      'solar:users-group-rounded-linear',
      'solar:user-id-linear',
      'solar:shield-keyhole-linear',
      'solar:devices-linear',
      'solar:settings-linear',
      'solar:alt-arrow-down-linear',
      'solar:global-linear',
      'solar:logout-2-linear',
      'solar:close-circle-linear',
      'solar:widget-5-bold-duotone',
      'solar:widget-2-bold-duotone',
      'solar:delivery-bold-duotone',
      'solar:buildings-2-bold-duotone',
      'solar:hand-shake-bold-duotone',
      'solar:users-group-rounded-bold-duotone',
      'solar:user-id-bold-duotone',
      'solar:shield-keyhole-bold-duotone',
      'solar:devices-bold-duotone',
      'solar:settings-bold-duotone',
      'solar:alt-arrow-down-bold-duotone',
      'solar:global-bold-duotone',
      'solar:logout-2-bold-duotone',
      'solar:close-circle-bold-duotone',
      'solar:panel-left-close-bold-duotone',
      'solar:panel-left-open-bold-duotone',
      'solar:sun-2-bold-duotone',
      'solar:moon-bold-duotone',
      'solar:shop-2-bold-duotone',
      'solar:user-plus-bold-duotone',
      'solar:banknote-2-bold-duotone',
      'solar:card-2-bold-duotone',
      'solar:user-circle-bold-duotone',
    ];

    for (const iconName of requiredSolarIcons) {
      expect(getIcon(iconName), `Icône manquante: ${iconName}`).toBeTruthy();
    }
  });
});
