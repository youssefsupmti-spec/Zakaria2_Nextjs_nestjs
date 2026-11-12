import { FilePlus2, Truck, MapPinned, WalletCards } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Créer un Envoi',
    description:
      'Ajoutez vos colis unitairement, par import Excel ou via notre API et imprimez vos étiquettes code-barres en un clic.',
    icon: FilePlus2,
  },
  {
    step: '02',
    title: 'Ramassage',
    description:
      'Notre livreur collecte vos colis directement depuis votre adresse et valide votre bon de ramassage.',
    icon: Truck,
  },
  {
    step: '03',
    title: 'Livraison Rapide',
    description:
      'Vos colis sont acheminés et livrés en 24h/48h à vos clients finaux avec suivi en temps réel.',
    icon: MapPinned,
  },
  {
    step: '04',
    title: 'Recevoir le Paiement',
    description:
      'Nous transférons régulièrement vos fonds encaissés (CRBT) accompagnés de vos factures détaillées.',
    icon: WalletCards,
  },
];

export function ProcessSection() {
  return (
    <section id="processus" className="py-20 lg:py-24 bg-[#0F172A] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#3FB4E8]/30 bg-[#1B9DD9]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3FB4E8]">
            Comment ça marche ?
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Un Processus Simple en 4 Étapes
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Expédiez vos commandes en toute sérénité grâce à un flux pensé pour les e-commerçants.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs transition-all hover:border-[#3FB4E8]/40 hover:bg-white/8"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B9DD9]/20 text-[#3FB4E8] border border-[#3FB4E8]/30">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-[#F9A03F]/20 border border-[#F9A03F]/40 px-3 py-1 text-xs font-extrabold text-[#F9A03F] tabular-nums">
                    Étape {item.step}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

