import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Shield, Award, Headphones, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  'Couverture nationale étendue (Grandes villes, régions et localités périphériques)',
  'Gestion automatisée des colis avec échange (retour contre-colis sécurisé)',
  'Facturation transparente et états de versement CRBT détaillés au centime près',
  'Équipe support réactive joignable du lundi au samedi de 9h à 21h',
];

export function AboutSection() {
  return (
    <section id="apropos" className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Colonne Visuelle */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-gradient-to-br from-[#0F172A] via-[#0c1e2c] to-[#1B9DD9]/40 p-8 sm:p-10 text-white shadow-2xl">
              <Image
                src="/images/landing/thumbs/g4d-service-background.png"
                alt="Infrastructure G4D Group For Delivery"
                width={640}
                height={440}
                className="w-full h-64 sm:h-72 object-cover rounded-2xl border border-white/15 shadow-lg"
              />

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
                  <Shield className="h-5 w-5 text-[#3FB4E8] mb-1.5" />
                  <p className="text-lg font-extrabold tabular-nums">100%</p>
                  <p className="text-xs text-slate-300">Fonds CRBT garantis</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
                  <Award className="h-5 w-5 text-[#F9A03F] mb-1.5" />
                  <p className="text-lg font-extrabold tabular-nums">Salé Hub</p>
                  <p className="text-xs text-slate-300">Centre de tri central</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
                  <Headphones className="h-5 w-5 text-emerald-400 mb-1.5" />
                  <p className="text-lg font-extrabold tabular-nums">9h - 21h</p>
                  <p className="text-xs text-slate-300">Accompagnement dédié</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Texte */}
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F9A03F]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#E08A2B]">
              À Propos de G4D — Group For Delivery
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
              Votre Partenaire de Confiance pour Propulser Votre E-Commerce au Maroc
            </h2>

            <p className="text-base text-slate-600 leading-relaxed">
              Basée à <strong className="text-[#0F172A]">Salé (Hay Linbiat, Avenue Moulay Rachid)</strong>,{' '}
              <strong className="text-[#1B9DD9]">G4D — Group For Delivery</strong> met à la
              disposition des marchands en ligne, enseignes et distributeurs une chaîne logistique
              moderne, structurée autour de livreurs régionaux dédiés et d&apos;un réseau national
              interconnecté.
            </p>

            <ul className="space-y-3.5 pt-1">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-[#1B9DD9] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
              >
                <span>Se connecter à la plateforme</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#contact"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
              >
                <span>Contacter notre équipe</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

