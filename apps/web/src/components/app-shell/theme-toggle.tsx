'use client';

import { Icon } from '@iconify/react';
import { useLayoutEffect, useState } from 'react';
import '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'g4d-theme';
const THEME_COOKIE_NAME = 'g4d_theme';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function applyDocumentTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

function persistTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignorer si localStorage est bloqué par le navigateur
  }
  document.cookie = `${THEME_COOKIE_NAME}=${mode}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function ThemeToggle({
  defaultTheme = 'light',
  className,
}: {
  defaultTheme?: ThemeMode;
  className?: string;
}) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme);

  useLayoutEffect(() => {
    let initial: ThemeMode = defaultTheme;
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        initial = stored;
      }
    } catch {
      // Conserver le thème cookie serveur par défaut
    }
    setTheme(initial);
    applyDocumentTheme(initial);

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === THEME_STORAGE_KEY &&
        (event.newValue === 'dark' || event.newValue === 'light')
      ) {
        setTheme(event.newValue);
        applyDocumentTheme(event.newValue);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      // Nettoyer la classe .dark en quittant l'espace authentifié (ex: vitrine publique /)
      document.documentElement.classList.remove('dark');
    };
  }, [defaultTheme]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyDocumentTheme(nextTheme);
    persistTheme(nextTheme);
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Passer en mode clair' : 'Passer en mode sombre';
  const iconName = isDark ? 'solar:sun-2-bold-duotone' : 'solar:moon-bold-duotone';

  return (
    <button
      type="button"
      data-slot="theme-toggle"
      data-theme={theme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={toggleTheme}
      className={cn(
        'group/theme relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-slate-200/85 bg-white text-[#12476c] shadow-2xs transition-all duration-200 hover:border-[#1a5fa0]/30 hover:bg-[#1a5fa0]/[0.07] hover:text-[#1a5fa0] active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b9dd9]/40 focus-visible:ring-offset-1 dark:border-slate-700 dark:bg-slate-800/90 dark:text-[#f9a03f] dark:hover:border-slate-600 dark:hover:bg-slate-700/80 dark:hover:text-[#ffb45e]',
        className,
      )}
    >
      <Icon
        icon={iconName}
        width={19}
        height={19}
        aria-hidden="true"
        className="size-[19px] shrink-0 transition-transform duration-200 group-hover/theme:scale-105"
      />
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute top-full right-0 z-50 mt-2 whitespace-nowrap rounded-md bg-[#0f172a] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-all duration-150 group-hover/theme:visible group-hover/theme:opacity-100 group-focus-visible/theme:visible group-focus-visible/theme:opacity-100 dark:border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        {label}
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
