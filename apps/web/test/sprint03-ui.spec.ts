import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ChangePasswordSchema,
  CreateBanqueSchema,
  CreateCompteBancaireSchema,
  RefuserInscriptionSchema,
  RegisterClientSchema,
  RequestContactChangeSchema,
} from '@zakaria/shared-contracts';

const WEB_ROOT = resolve(__dirname, '..');

describe('Sprint 03 Contrats & UI Primary Icons', () => {
  it('SidebarTrigger et ThemeToggle utilisent bien la couleur primary', () => {
    const sidebarSrc = readFileSync(resolve(WEB_ROOT, 'src/components/ui/sidebar.tsx'), 'utf8');
    const themeToggleSrc = readFileSync(
      resolve(WEB_ROOT, 'src/components/app-shell/theme-toggle.tsx'),
      'utf8',
    );
    expect(sidebarSrc).toContain('text-primary');
    expect(themeToggleSrc).toContain('text-primary');
  });

  it('solar-icons.ts embarque les 5 icônes Solar Bold Duotone du Sprint 03', () => {
    const solarIconsSrc = readFileSync(
      resolve(WEB_ROOT, 'src/components/ui/solar-icons.ts'),
      'utf8',
    );
    for (const iconKey of [
      'shop-2-bold-duotone',
      'user-plus-bold-duotone',
      'banknote-2-bold-duotone',
      'card-2-bold-duotone',
      'user-circle-bold-duotone',
    ]) {
      expect(solarIconsSrc).toContain(iconKey);
    }
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

    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'NewPassword!26',
        newPasswordConfirmation: 'NewPassword!26',
      }).success,
    ).toBe(true);

    expect(
      RequestContactChangeSchema.safeParse({
        type: 'telephone',
        nouvelleValeur: '0611223344',
        motif: 'Nouvelle carte SIM professionnelle',
      }).success,
    ).toBe(true);
  });
});
