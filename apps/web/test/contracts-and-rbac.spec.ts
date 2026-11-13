import { getIcon } from '@iconify/react';
import { describe, expect, it } from 'vitest';
import {
  CreateAgenceSchema,
  CreateRoleSchema,
  CreateUserSchema,
  SESSION_DURATION_OPTIONS,
} from '@zakaria/shared-contracts';
import '../src/components/ui/solar-icons';
import { ApiClientError } from '../src/lib/api-client';

describe('Contrats Front/Back & Client API G4D (Lot 2.5 / Sprint 02-B)', () => {
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

  it('pré-enregistre les icônes Iconify Solar Linear de la Sidebar et du bouton SidebarToggle', () => {
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
    ];

    for (const iconName of requiredSolarIcons) {
      expect(getIcon(iconName), `Icône manquante: ${iconName}`).toBeTruthy();
    }
  });
});
