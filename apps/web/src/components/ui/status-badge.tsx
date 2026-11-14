'use client';

import { Badge, type BadgeProps } from '@/components/ui/badge';

export type G4dStatusKey =
  | 'active'
  | 'inactive'
  | 'actif'
  | 'inactif'
  | 'desactive'
  | 'en_attente'
  | 'acceptee'
  | 'refusee'
  | 'rattache'
  | 'couvert_par_zone'
  | 'hors_zone'
  | 'orphelin_sans_ville'
  | 'custom'
  | 'plateforme'
  | 'agence';

const STATUS_STYLE_MAP: Record<
  G4dStatusKey,
  { variant: NonNullable<BadgeProps['variant']>; defaultLabel: string }
> = {
  active: { variant: 'success', defaultLabel: 'Active' },
  inactive: { variant: 'destructive', defaultLabel: 'Inactive' },
  actif: { variant: 'success', defaultLabel: 'Actif' },
  inactif: { variant: 'destructive', defaultLabel: 'Inactif' },
  desactive: { variant: 'destructive', defaultLabel: 'Désactivé' },
  en_attente: { variant: 'warning', defaultLabel: 'En attente' },
  acceptee: { variant: 'success', defaultLabel: 'Acceptée' },
  refusee: { variant: 'destructive', defaultLabel: 'Refusée' },
  rattache: { variant: 'success', defaultLabel: 'Rattachée' },
  couvert_par_zone: { variant: 'default', defaultLabel: 'Couverte (zone)' },
  hors_zone: { variant: 'warning', defaultLabel: 'Hors zone' },
  orphelin_sans_ville: { variant: 'destructive', defaultLabel: 'Sans ville' },
  custom: { variant: 'warning', defaultLabel: 'Custom' },
  plateforme: { variant: 'default', defaultLabel: 'Plateforme' },
  agence: { variant: 'secondary', defaultLabel: 'Agence' },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: G4dStatusKey;
  label?: string;
  className?: string;
}) {
  const config = STATUS_STYLE_MAP[status];
  return (
    <Badge variant={config.variant} className={className}>
      {label ?? config.defaultLabel}
    </Badge>
  );
}
