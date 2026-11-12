/**
 * Identité visuelle centrale G4D — Group For Delivery
 * Utilisée sur la Landing Page, le Login et toutes les pages futures (Dashboard, Sidebar, Bons, Factures).
 */
export const G4D_BRAND = {
  name: 'G4D',
  fullName: 'G4D — Group For Delivery',
  tagline: 'Le Meilleur Dans Le Domaine',
  logoPath: '/assets/logos/nouveau_logo_G4d.png?v=20261113',
  logoTrimPath: '/assets/logos/nouveau_logo_trim.png?v=20261113',
  email: 'Contact@g4d.ma',
  phone: '(+212)6 23 34 46 07',
  phoneHref: 'tel:+212623344607',
  address: 'Avenue moulay, rachid hay linbiat, Salé',
} as const;

export const G4D_LOGO_PATH = G4D_BRAND.logoPath;
export const G4D_LOGO_TRIM_PATH = G4D_BRAND.logoTrimPath;
