'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Truck } from 'lucide-react';
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

      {/* Panneau Gauche : Visuel G4D pur sans texte ni logo superposé (6 colonnes Desktop) */}
      <aside className="hidden lg:block lg:col-span-6 relative overflow-hidden bg-[#06152d]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/brand/Gemini_Generated_Image_a6v3mga6v3mga6v3.jpg')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] z-20"
          style={{ background: 'linear-gradient(90deg, #F9A03F 0%, #1B9DD9 100%)' }}
        />
      </aside>

      {/* Panneau Droit : Formulaire SaaS minimaliste & professionnel sur fond blanc (6 colonnes Desktop) */}
      <main className="col-span-1 lg:col-span-6 flex flex-col justify-between min-h-screen bg-white px-4 py-4 sm:px-10 sm:py-6 lg:px-14">
        {/* Barre supérieure discrète */}
        <header className="flex flex-wrap items-center justify-between gap-3 w-full">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md px-1 py-0.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l&apos;accueil
          </a>

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
        <div className="w-full max-w-[420px] mx-auto my-auto py-5 sm:py-8">
          <div className="flex flex-col items-center justify-center text-center mb-6 sm:mb-7">
            <G4dLogo
              variant="default"
              priority
              imageClassName="h-24 sm:h-28 max-h-28 w-auto shadow-none filter-none"
            />
            <span className="mt-3 inline-flex lg:hidden items-center gap-2 rounded-full bg-sky-50/90 border border-sky-100/90 px-4 py-1.5 text-xs font-bold text-[#0c4a6e] shadow-[0_1px_2px_rgba(2,132,199,0.06)]">
              <Truck className="h-3.5 w-3.5 text-[#f97316]" aria-hidden="true" />
              Le Meilleur dans le Domaine
            </span>
          </div>

          <h1 className="font-barlow-condensed text-center text-[2rem] leading-tight font-extrabold text-[var(--text-dark)] tracking-[0.04em] uppercase m-0 mb-[6px]">
            {title}
          </h1>
          <p className="font-barlow text-center text-[0.95rem] font-normal text-[var(--gray-text)] leading-relaxed mt-0 mb-7">
            {subtitle}
          </p>

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
            <span>&copy; {CURRENT_YEAR} G4D Express &middot;</span>
            <span>Accès sécurisé Argon2id &amp; TLS</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
