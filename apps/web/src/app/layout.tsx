import type { Metadata } from 'next';
import { G4D_LOGO_PATH } from '@/lib/brand';

export const metadata: Metadata = {
  title: {
    default: 'G4D — Livraison nationale rapide & traçable',
    template: '%s | G4D — Group For Delivery',
  },
  description:
    'G4D — Plateforme de livraison nationale. Suivez votre colis en temps réel, calculez votre tarif et gérez vos expéditions depuis un espace dédié.',
  icons: {
    icon: G4D_LOGO_PATH,
    apple: G4D_LOGO_PATH,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body style={{ margin: 0 }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
