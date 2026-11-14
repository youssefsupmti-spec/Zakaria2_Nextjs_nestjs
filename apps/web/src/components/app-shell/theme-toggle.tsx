'use client';

import { Icon } from '@iconify/react';
import { useLayoutEffect, useState } from 'react';
import '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'g4d-theme';
const THEME_COOKIE_NAME = 'g4d_theme';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function applyDocumentTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

export function persistTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignorer si localStorage est bloqué par le navigateur
  }
  document.cookie = `${THEME_COOKIE_NAME}=${mode}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent<ThemeMode>('g4d-theme-changed', { detail: mode }));
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

    const onCustomThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === 'dark' || detail === 'light') {
        setTheme(detail);
        applyDocumentTheme(detail);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('g4d-theme-changed', onCustomThemeChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('g4d-theme-changed', onCustomThemeChange);
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
        'group/theme relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-slate-200/85 bg-white text-primary shadow-2xs transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.08] hover:text-primary active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 dark:border-slate-700 dark:bg-slate-800/90 dark:text-primary dark:hover:border-primary/40 dark:hover:bg-primary/[0.12] dark:hover:text-primary',
        className,
      )}
    >
      <Icon
        icon={iconName}
        width={19}
        height={19}
        aria-hidden="true"
        className="size-[19px] shrink-0 text-primary transition-transform duration-200 group-hover/theme:scale-105"
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
