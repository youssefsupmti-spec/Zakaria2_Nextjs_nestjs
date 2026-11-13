'use client';

import type { ReactNode } from 'react';
import { ArrowLeft, Truck } from 'lucide-react';
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
    <div className="min-h-screen w-full flex flex-row max-[900px]:flex-col bg-white text-slate-900 font-sans antialiased">
      {/* Panneau Visuel G4D : 50% sur Desktop, bandeau haut 260px (<=900px) et 50px (<=480px) */}
      <aside className="relative overflow-hidden bg-[#06152d] flex-[0_0_50%] min-h-screen max-[900px]:order-[-1] max-[900px]:w-full max-[900px]:flex-[0_0_260px] max-[900px]:min-h-[260px] max-[480px]:flex-[0_0_50px] max-[480px]:min-h-[50px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/brand/g4d-login-bg.webp')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] z-20"
          style={{ background: 'linear-gradient(90deg, #F9A03F 0%, #1B9DD9 100%)' }}
        />
      </aside>

      {/* Panneau Formulaire : 50% Desktop (48px 56px), flex-1 (36px 24px <=900px, 28px 18px <=480px) */}
      <main className="relative z-[2] flex-[0_0_50%] flex flex-col justify-between items-center min-h-screen bg-white px-[56px] py-[48px] overflow-y-auto max-[900px]:flex-1 max-[900px]:w-full max-[900px]:min-h-0 max-[900px]:px-[24px] max-[900px]:py-[36px] max-[480px]:px-[18px] max-[480px]:py-[28px]">
        <header className="flex flex-wrap items-center justify-between gap-3 w-full">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md px-1 py-0.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à l&apos;accueil
          </a>
        </header>

        <div className="w-full max-w-[420px] mx-auto my-auto py-5 sm:py-8">
          <div className="flex flex-col items-center justify-center text-center mb-6 sm:mb-7">
            <G4dLogo
              variant="default"
              priority
              imageClassName="h-24 sm:h-28 max-h-28 w-auto shadow-none filter-none"
            />
            <span className="mt-3 hidden max-[900px]:inline-flex items-center gap-2 rounded-full bg-sky-50/90 border border-sky-100/90 px-4 py-1.5 text-xs font-bold text-[#0c4a6e] shadow-[0_1px_2px_rgba(2,132,199,0.06)]">
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
