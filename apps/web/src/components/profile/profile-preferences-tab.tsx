'use client';

import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import {
  applyDocumentTheme,
  persistTheme,
  type ThemeMode,
} from '@/components/app-shell/theme-toggle';
import { Badge } from '@/components/ui/badge';
import '@/components/ui/solar-icons';

export type BadgeStyleVariant = 'soft' | 'solid' | 'outline';

const BADGE_PREVIEW_ITEMS: Array<{
  label: string;
  soft: string;
  solid: string;
  outline: string;
}> = [
  {
    label: 'Livré',
    soft: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    solid: 'bg-emerald-600 text-white border border-emerald-600',
    outline:
      'bg-transparent text-emerald-700 border-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-500',
  },
  {
    label: 'En cours',
    soft: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
    solid: 'bg-[#1b9dd9] text-white border border-[#1b9dd9]',
    outline:
      'bg-transparent text-[#1b9dd9] border-2 border-[#1b9dd9] dark:text-[#3fb4e8] dark:border-[#3fb4e8]',
  },
  {
    label: 'Reporté',
    soft: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
    solid: 'bg-amber-500 text-white border border-amber-500',
    outline:
      'bg-transparent text-amber-700 border-2 border-amber-500 dark:text-amber-300 dark:border-amber-400',
  },
  {
    label: 'Refusé',
    soft: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70',
    solid: 'bg-rose-600 text-white border border-rose-600',
    outline:
      'bg-transparent text-rose-700 border-2 border-rose-600 dark:text-rose-400 dark:border-rose-500',
  },
  {
    label: 'Retourné',
    soft: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/70',
    solid: 'bg-red-600 text-white border border-red-600',
    outline:
      'bg-transparent text-red-700 border-2 border-red-600 dark:text-red-400 dark:border-red-500',
  },
];

export function ProfilePreferencesTab() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [badgeVariant, setBadgeVariant] = useState<BadgeStyleVariant>('soft');

  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem('g4d-theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme);
      } else {
        setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      }

      const storedVariant = window.localStorage.getItem('badgeVariant');
      if (storedVariant === 'solid' || storedVariant === 'outline' || storedVariant === 'soft') {
        setBadgeVariant(storedVariant);
      }
    } catch {
      // Ignorer si stockage navigateur restreint
    }

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === 'dark' || detail === 'light') {
        setTheme(detail);
      }
    };
    window.addEventListener('g4d-theme-changed', onThemeChange);
    return () => window.removeEventListener('g4d-theme-changed', onThemeChange);
  }, []);

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    applyDocumentTheme(mode);
    persistTheme(mode);
  };

  const handleSelectBadgeVariant = (variant: BadgeStyleVariant) => {
    setBadgeVariant(variant);
    document.documentElement.dataset.badgeVariant = variant;
    try {
      window.localStorage.setItem('badgeVariant', variant);
    } catch {
      // Ignorer
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Thème & Style de badges */}
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Préférences d’affichage
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personnalisez l’apparence de votre poste G4D. Sauvegarde instantanée.
          </p>
        </div>

        {/* Sélecteur Thème Clair / Sombre */}
        <div>
          <p className="mb-2.5 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Thème de l’interface
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                theme === 'light'
                  ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/20'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-[#f7901e]">
                <Icon icon="solar:sun-2-bold-duotone" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Mode Clair</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Contraste élevé de jour
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                theme === 'dark'
                  ? 'border-primary bg-primary/[0.1] ring-2 ring-primary/25'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-800 text-sky-400">
                <Icon icon="solar:moon-bold-duotone" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Mode Sombre</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confort nocturne réduit en luminosité
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Sélecteur Style de badges hérité de Zakaria2 */}
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
          <p className="mb-2.5 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Style des badges de statut logistique
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: 'soft' as const, title: 'Doux (Soft)', desc: 'Fond pastel léger' },
              { key: 'solid' as const, title: 'Plein (Solid)', desc: 'Couleur franche élevée' },
              { key: 'outline' as const, title: 'Contour (Outline)', desc: 'Bordure nette épurée' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectBadgeVariant(opt.key)}
                className={`flex cursor-pointer flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                  badgeVariant === opt.key
                    ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {opt.title}
                </span>
                <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Aperçu en direct des 5 statuts */}
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="mb-2.5 text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Aperçu en direct
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {BADGE_PREVIEW_ITEMS.map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold transition-all ${item[badgeVariant]}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paramètres régionaux & Notifications */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Région, Langue &amp; Notifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configuration standardisée pour le réseau logistique Maroc.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Langue de l’interface
              </p>
              <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">Français (FR)</p>
            </div>
            <Badge variant="default">Actif</Badge>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Fuseau horaire opérationnel
              </p>
              <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
                Africa/Casablanca (UTC+1)
              </p>
            </div>
            <Icon icon="solar:clock-circle-bold-duotone" className="size-5 text-primary" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Alertes e-mail de sécurité
              </p>
              <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
                Réinitialisations &amp; changements mot de passe
              </p>
            </div>
            <Badge variant="success">Activées</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
