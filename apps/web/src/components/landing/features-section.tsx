import Image from 'next/image';

const G4D_PILLARS = [
  {
    title: 'Fiabilité',
    subtitle: 'Engagement & Sécurité',
    description:
      'Chaque colis est pris en charge avec rigueur depuis son ramassage jusqu’à sa remise en main propre, avec sécurisation intégrale de vos encaissements CRBT.',
    iconSrc: '/images/landing/icons/g4d-fiabilite.svg',
    badgeColor: 'bg-[#1B9DD9]/10 text-[#0E86C2]',
    borderHover: 'hover:border-[#1B9DD9]/50',
  },
  {
    title: 'Rapidité',
    subtitle: 'Express 24h / 48h',
    description:
      'Un circuit de tri et d’expédition optimisé depuis notre hub de Salé permettant des livraisons en 24h sur l’axe Rabat-Salé-Casablanca et 24h-48h au niveau national.',
    iconSrc: '/images/landing/icons/g4d-rapidite.svg',
    badgeColor: 'bg-[#F9A03F]/15 text-[#E08A2B]',
    borderHover: 'hover:border-[#F9A03F]/50',
  },
  {
    title: 'Traçabilité',
    subtitle: 'Suivi Temps Réel',
    description:
      'Suivez chaque étape du cycle de vie de vos colis (Bons de ramassage, Bons d’envoi, Distribution, Relances et Retours) avec historique horodaté complet.',
    iconSrc: '/images/landing/icons/g4d-tracabilite.svg',
    badgeColor: 'bg-[#3FB4E8]/15 text-[#1B9DD9]',
    borderHover: 'hover:border-[#3FB4E8]/50',
  },
  {
    title: 'Praticité',
    subtitle: 'Plateforme Tout-en-un',
    description:
      'Importez vos commandes en masse, imprimez vos tickets normalisés avec code-barres, gérez vos échanges et consultez vos factures en quelques clics.',
    iconSrc: '/images/landing/icons/g4d-practicite.svg',
    badgeColor: 'bg-emerald-500/12 text-emerald-700',
    borderHover: 'hover:border-emerald-500/50',
  },
];

export function FeaturesSection() {
  return (
    <section id="valeurs" className="py-20 lg:py-24 bg-slate-50/70 border-b border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1B9DD9]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0E86C2]">
            Nos 4 Piliers Fondamentaux
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Pourquoi les e-commerçants choisissent{' '}
            <span className="text-[#1B9DD9]">G4D — Group For Delivery</span>
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Une infrastructure technologique et logistique pensée pour maximiser votre taux de
            livraison et accélérer votre trésorerie.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {G4D_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className={`group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${pillar.borderHover}`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 group-hover:scale-105 transition-transform">
                  <Image
                    src={pillar.iconSrc}
                    alt={pillar.title}
                    width={36}
                    height={36}
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${pillar.badgeColor}`}
                >
                  {pillar.subtitle}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A] group-hover:text-[#1B9DD9] transition-colors">
                {pillar.title}
              </h3>

              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

