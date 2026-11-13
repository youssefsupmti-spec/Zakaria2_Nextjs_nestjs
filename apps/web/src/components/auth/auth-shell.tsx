'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { G4dLogo } from '@/components/brand/g4d-logo';

const CURRENT_YEAR = 2026;

interface G4dAuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function G4dAuthShell({ title, subtitle, children, footer }: G4dAuthShellProps) {
  return (
    <div className="g4d-auth-root min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans antialiased">
      <style>{`
        .g4d-auth-root .g4d-auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .g4d-auth-root .g4d-auth-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin: 0;
        }
        .g4d-auth-root .g4d-auth-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .g4d-auth-root .g4d-auth-label-text {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e293b;
        }
        .g4d-auth-root .g4d-auth-forgot {
          font-size: 0.75rem;
          font-weight: 600;
          color: #0284c7;
          text-decoration: none;
        }
        .g4d-auth-root .g4d-auth-forgot:hover {
          text-decoration: underline;
        }
        .g4d-auth-root .g4d-auth-input-wrap {
          position: relative;
          display: block;
        }
        .g4d-auth-root .g4d-auth-input {
          width: 100%;
          height: 2.875rem;
          padding: 0 0.875rem;
          font-size: 0.9375rem;
          font-weight: 500;
          font-family: inherit;
          color: #0f172a;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .g4d-auth-root .g4d-auth-input--pw {
          padding-right: 3rem;
        }
        .g4d-auth-root .g4d-auth-input::placeholder {
          color: #94a3b8;
        }
        .g4d-auth-root .g4d-auth-input:focus-visible,
        .g4d-auth-root .g4d-auth-input:focus {
          border-color: #0284c7;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.14);
        }
        .g4d-auth-root .g4d-auth-input--error {
          border-color: #ef4444;
        }
        .g4d-auth-root .g4d-auth-input--error:focus-visible,
        .g4d-auth-root .g4d-auth-input--error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
        }
        .g4d-auth-root .g4d-auth-pw-toggle {
          position: absolute;
          top: 50%;
          right: 0.5rem;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.125rem;
          height: 2.125rem;
          padding: 0;
          background: transparent;
          border: 0;
          border-radius: 0.5rem;
          cursor: pointer;
          color: #64748b;
          transition: color 0.15s ease, background-color 0.15s ease;
        }
        .g4d-auth-root .g4d-auth-pw-toggle:hover {
          color: #0284c7;
          background-color: #f1f5f9;
        }
        .g4d-auth-root .g4d-auth-pw-toggle:focus-visible {
          outline: 2px solid #0284c7;
          outline-offset: 2px;
        }
        .g4d-auth-root .g4d-auth-submit {
          margin-top: 0.25rem;
          height: 3rem;
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 700;
          font-family: inherit;
          color: #ffffff;
          border: 0;
          border-radius: 0.75rem;
          cursor: pointer;
          background: linear-gradient(135deg, #1b9dd9 0%, #0284c7 60%, #0369a1 100%);
          box-shadow: 0 10px 22px -10px rgba(2, 132, 199, 0.55);
          transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .g4d-auth-root .g4d-auth-submit:hover:not(:disabled) {
          filter: brightness(1.04);
          transform: translateY(-1px);
          box-shadow: 0 14px 26px -10px rgba(2, 132, 199, 0.65);
        }
        .g4d-auth-root .g4d-auth-submit:focus-visible {
          outline: 2px solid #0284c7;
          outline-offset: 2px;
        }
        .g4d-auth-root .g4d-auth-submit:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .g4d-auth-root .g4d-auth-footer-block {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748b;
        }
        .g4d-auth-root .g4d-auth-link {
          color: #0284c7;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .g4d-auth-root .g4d-auth-link:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* Panneau Gauche : Cockpit Logistique (5 colonnes Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 relative flex-col justify-between overflow-hidden bg-[#06152d] text-white p-8 xl:p-11">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-[center_bottom] bg-no-repeat opacity-90"
          style={{ backgroundImage: "url('/images/auth-aside-bg.webp?v=20261113-2')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#06152d]/75 via-transparent to-[#06152d]/90"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,21,45,0.92)_0%,rgba(6,21,45,0.62)_45%,transparent_75%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] z-20"
          style={{ background: 'linear-gradient(90deg, #F9A03F 0%, #1B9DD9 100%)' }}
        />

        {/* Étage 1 : Haut — Badge Réseau temps réel uniquement */}
        <div className="relative z-10 flex items-center justify-end">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-200 whitespace-nowrap backdrop-blur-sm">
            <span
              className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
              aria-hidden="true"
            />
            Réseau actif · 564 villes
          </span>
        </div>

        {/* Étage 2 : Bloc Marque & Titre positionné haut à gauche (au-dessus de Marrakech) */}
        <div className="relative z-10 mt-4 xl:mt-6 space-y-4">
          <div>
            <G4dLogo
              variant="light"
              priority
              imageClassName="h-16 xl:h-20 max-h-20 w-auto shadow-none filter-none bg-transparent border-0"
            />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200">
              PLATEFORME LOGISTIQUE SAAS
            </span>
            <h2 className="text-3xl xl:text-[34px] font-extrabold tracking-tight leading-[1.15] text-white">
              Livraison rapide, traçable &amp; fiable
            </h2>
            <p className="text-sm xl:text-[15px] leading-relaxed text-slate-200/95 max-w-md">
              Pilotez vos expéditions, vos ramassages multi-agences et vos reversements CRBT depuis
              un cockpit logistique unifié.
            </p>
          </div>
        </div>

        {/* Étage 3 : Carte Glassmorphism en bas + Copyright */}
        <div className="relative z-10 mt-auto pt-6 space-y-5">
          <div className="bg-[#081d38]/65 backdrop-blur-md border border-white/15 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">Gestion Complète &amp; Multi-Agence</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300/80">
                  Routage inter-agences automatisé, suivi en direct et rapprochement financier
                  sécurisé.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-lg bg-sky-400/15 border border-sky-400/25 px-2.5 py-1 text-[11px] font-semibold text-sky-200">
                Temps réel
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-white/10">
              <div>
                <div className="text-lg font-extrabold tracking-tight text-white tabular-nums">
                  24h/48h
                </div>
                <div className="text-[11px] font-medium text-slate-300/80">Délai moyen</div>
              </div>
              <div>
                <div className="text-lg font-extrabold tracking-tight text-sky-300 tabular-nums">
                  100%
                </div>
                <div className="text-[11px] font-medium text-slate-300/80">Traçabilité</div>
              </div>
              <div>
                <div className="text-lg font-extrabold tracking-tight text-amber-300 tabular-nums">
                  J+1
                </div>
                <div className="text-[11px] font-medium text-slate-300/80">Reversement</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-300/80">
            <p className="m-0">&copy; {CURRENT_YEAR} G4D Express &mdash; Tous droits réservés</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/15 px-2.5 py-1 text-[11px] font-medium text-slate-100 whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              Protection Argon2id &amp; TLS
            </span>
          </div>
        </div>
      </aside>

      {/* Panneau Droit : Formulaire épuré sans boîte sur fond blanc (7 colonnes Desktop) */}
      <main className="col-span-1 lg:col-span-7 flex flex-col justify-between min-h-screen bg-white px-6 py-6 sm:px-12 lg:px-16">
        {/* Barre supérieure discrète */}
        <header className="flex flex-wrap items-center justify-between gap-3 w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md px-1 py-0.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>

          <div className="text-sm text-slate-500">
            Nouveau vendeur ?{' '}
            <Link
              href="/register"
              className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md px-1 py-0.5"
            >
              Créer un compte
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* Conteneur central respirant directement sur le fond blanc */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-8">
          {/* Logo affiché sur mobile uniquement */}
          <div className="flex items-center justify-between gap-3 lg:hidden mb-7">
            <G4dLogo variant="default" priority />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              564 villes
            </span>
          </div>

          {/* Icône d'accès élégante sur Desktop uniquement */}
          <div className="hidden lg:inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 border border-sky-100 text-sky-600 mb-5">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 m-0">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed mb-7">{subtitle}</p>

          {children}

          {footer}
        </div>

        {/* Pied de page discret */}
        <footer className="w-full flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Besoin d&apos;aide&nbsp;?{' '}
            <a
              href="mailto:Contact@g4d.ma"
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
            >
              Contact@g4d.ma
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="lg:hidden">&copy; {CURRENT_YEAR} G4D Express &middot;</span>
            <span>Accès sécurisé Argon2id &amp; TLS</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
