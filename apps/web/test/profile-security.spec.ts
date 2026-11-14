import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ChangePasswordSchema,
  RequestContactChangeSchema,
  UploadAvatarSchema,
} from '@zakaria/shared-contracts';
import {
  evaluatePasswordStrength,
  parseUserAgent,
  resolvePrimaryProfileRole,
} from '../src/components/profile/profile-types';

const WEB_ROOT = resolve(__dirname, '..');

describe('Mon Profil & Sécurité — Contrats, Helpers UX & Assets', () => {
  it('valide les schémas de changement de mot de passe, coordonnées et avatar', () => {
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

    expect(
      RequestContactChangeSchema.safeParse({
        type: 'ville',
        nouvelleValeur: 'Casablanca',
        motif: 'Déménagement entrepôt principal',
      }).success,
    ).toBe(true);

    expect(
      UploadAvatarSchema.safeParse({
        dataUrl: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4',
      }).success,
    ).toBe(true);
  });

  it('décode correctement les User-Agents, évalue la robustesse du mot de passe et adapte les 4 rôles', () => {
    const winChrome = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    );
    expect(winChrome.browser).toBe('Google Chrome');
    expect(winChrome.os).toBe('Windows');
    expect(winChrome.deviceType).toBe('desktop');

    const iphoneSafari = parseUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    );
    expect(iphoneSafari.browser).toBe('Safari');
    expect(iphoneSafari.os).toBe('iPhone (iOS)');
    expect(iphoneSafari.deviceType).toBe('mobile');

    expect(evaluatePasswordStrength('').score).toBe(0);
    expect(evaluatePasswordStrength('abc').score).toBe(1);
    expect(evaluatePasswordStrength('G4dSecure!2026').score).toBe(4);

    expect(resolvePrimaryProfileRole(['super_admin'], true)).toBe('super_admin');
    expect(resolvePrimaryProfileRole(['admin'], false)).toBe('admin');
    expect(resolvePrimaryProfileRole(['livreur'], false)).toBe('livreur');
    expect(resolvePrimaryProfileRole(['client'], false)).toBe('client');

    expect(existsSync(resolve(WEB_ROOT, 'public/images/cover-profile.jpg'))).toBe(true);
  });
});
