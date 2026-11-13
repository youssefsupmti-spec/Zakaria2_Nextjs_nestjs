'use client';

import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import '../global.css';

const MARKETING_STYLE_PATTERNS = [
  '/assets/landing/css/',
  '/fonts/wx/index.css',
  '/fonts/filament/filament/inter/index.css',
  'leaflet.css',
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const disabledLinks: HTMLLinkElement[] = [];
    const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (MARKETING_STYLE_PATTERNS.some((pattern) => href.includes(pattern))) {
        if (!link.disabled) {
          link.disabled = true;
          disabledLinks.push(link);
        }
      }
    });
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
    return () => {
      disabledLinks.forEach((link) => {
        link.disabled = false;
      });
    };
  }, []);

  useEffect(() => {
    let active = true;

    const redirectIfAuthenticated = async () => {
      try {
        const response = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (active && response.ok) {
          window.location.replace('/dashboard');
        }
      } catch {
        // Ignorer les erreurs réseau transitoires
      }
    };

    void redirectIfAuthenticated();

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void redirectIfAuthenticated();
      }
    };

    window.addEventListener('pageshow', onPageShow);
    return () => {
      active = false;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  return <>{children}</>;
}
