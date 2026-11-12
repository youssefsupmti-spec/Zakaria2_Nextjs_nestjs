'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  LogIn,
  UserPlus,
  Menu,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { G4dLogo } from '@/components/brand/g4d-logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Nos Piliers', href: '#valeurs' },
  { label: 'À Propos', href: '#apropos' },
  { label: 'Services', href: '#services' },
  { label: 'Processus', href: '#processus' },
  { label: 'Contact', href: '#contact' },
];

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Topbar d'informations officielles G4D */}
      <div className="hidden lg:block bg-[#0F172A] text-slate-300 border-b border-slate-800/80 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">
          <div className="flex items-center gap-6">
            <a
              href="tel:+212623344607"
              className="inline-flex items-center gap-2 hover:text-[#3FB4E8] transition-colors tabular-nums"
            >
              <Phone className="h-3.5 w-3.5 text-[#F9A03F]" />
              <span>(+212) 6 23 34 46 07</span>
            </a>
            <span className="h-3.5 w-px bg-slate-700" />
            <a
              href="mailto:Contact@g4d.ma"
              className="inline-flex items-center gap-2 hover:text-[#3FB4E8] transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-[#1B9DD9]" />
              <span>Contact@g4d.ma</span>
            </a>
            <span className="h-3.5 w-px bg-slate-700" />
            <span className="inline-flex items-center gap-2 text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-[#3FB4E8]" />
              <span>Avenue moulay, rachid hay linbiat, Salé</span>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Clock className="h-3.5 w-3.5 text-[#F9A03F]" />
              <span>Lundi - samedi 9h - 21h</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Réseau National Actif
            </span>
          </div>
        </div>
      </div>

      {/* Barre de navigation principale */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <G4dLogo priority showTagline />

          {/* Navigation Desktop */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-1"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#1B9DD9]/8 hover:text-[#1B9DD9]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Boutons d'action Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'border-[#1B9DD9]/30 text-[#0F172A] hover:bg-[#1B9DD9]/8 hover:text-[#0E86C2]',
              )}
            >
              <LogIn className="h-4 w-4 text-[#1B9DD9]" />
              <span>Espace Client</span>
            </Link>

            <a
              href="#contact"
              className={cn(buttonVariants({ variant: 'default', size: 'default' }))}
            >
              <UserPlus className="h-4 w-4" />
              <span>Devenir Client</span>
              <ArrowUpRight className="h-4 w-4 opacity-80" />
            </a>
          </div>

          {/* Bouton Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Ouvrir le menu de navigation"
            className="inline-flex lg:hidden items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl">
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-[#1B9DD9]/10 hover:text-[#1B9DD9]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
              >
                <LogIn className="h-4 w-4 text-[#1B9DD9]" />
                <span>Espace Client (/login)</span>
              </Link>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}
              >
                <UserPlus className="h-4 w-4" />
                <span>Devenir Client G4D</span>
              </a>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 tabular-nums font-medium">
                <Phone className="h-3.5 w-3.5 text-[#F9A03F]" />
                <span>(+212) 6 23 34 46 07</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#1B9DD9]" />
                <span>Contact@g4d.ma</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#3FB4E8]" />
                <span>Lundi - samedi 9h - 21h</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

