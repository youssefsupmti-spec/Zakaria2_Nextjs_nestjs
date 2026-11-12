import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, LogIn } from 'lucide-react';
import { G4dLogo } from '@/components/brand/g4d-logo';

export function LandingFooter() {
  return (
    <footer className="bg-[#0F172A] text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Colonne 1 : Identité G4D */}
          <div className="lg:col-span-5 space-y-4">
            <G4dLogo variant="light" />
            <p className="max-w-sm text-sm text-slate-400 leading-relaxed">
              <strong className="text-white">G4D — Group For Delivery</strong> est votre partenaire
              logistique e-commerce au Maroc : ramassage quotidien gratuit, livraison express
              24h/48h, suivi en temps réel et retour de fonds CRBT rapide.
            </p>
            <div className="pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1B9DD9]/20 border border-[#3FB4E8]/35 px-4 py-2 text-xs font-bold text-[#3FB4E8] hover:bg-[#1B9DD9] hover:text-white transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Accès Portail Marchand &amp; Équipe (/login)</span>
              </Link>
            </div>
          </div>

          {/* Colonne 2 : Navigation Rapide */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#accueil" className="hover:text-[#3FB4E8] transition-colors">
                  Accueil &amp; Suivi Colis
                </a>
              </li>
              <li>
                <a href="#valeurs" className="hover:text-[#3FB4E8] transition-colors">
                  Nos 4 Piliers (Fiabilité, Rapidité, Traçabilité, Praticité)
                </a>
              </li>
              <li>
                <a href="#apropos" className="hover:text-[#3FB4E8] transition-colors">
                  À Propos de G4D
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-[#3FB4E8] transition-colors">
                  Catalogue des Services
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#F9A03F] transition-colors font-semibold">
                  Connexion Espace Client
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Coordonnées officielles */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Contact &amp; Siège Social
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#3FB4E8] shrink-0 mt-1" />
                <span>Avenue moulay, rachid hay linbiat, Salé</span>
              </li>
              <li className="flex items-center gap-3 tabular-nums">
                <Phone className="h-4 w-4 text-[#F9A03F] shrink-0" />
                <a href="tel:+212623344607" className="hover:text-white transition-colors">
                  (+212) 6 23 34 46 07
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#1B9DD9] shrink-0" />
                <a href="mailto:Contact@g4d.ma" className="hover:text-white transition-colors">
                  Contact@g4d.ma
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Lundi - samedi 9h - 21h</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} G4D — Group For Delivery. Tous droits réservés.</p>
          <p className="tabular-nums">
            Plateforme Logistique Nouvelle Génération · Next.js + NestJS
          </p>
        </div>
      </div>
    </footer>
  );
}

