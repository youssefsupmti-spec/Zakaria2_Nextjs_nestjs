'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/client-rbac';
import { LogoutButton } from '../dashboard/logout-button';
import { AppSidebar } from './app-sidebar';

const MARKETING_STYLE_PATTERNS = [
  '/assets/landing/css/',
  '/fonts/wx/index.css',
  '/fonts/filament/filament/inter/index.css',
  'leaflet.css',
];

const ROUTE_TITLES: Record<string, { section: string; page: string }> = {
  '/dashboard': { section: 'Plateforme', page: 'Tableau de bord' },
  '/agences': { section: 'Plateforme', page: 'Agences & Zones' },
  '/partenaires': { section: 'Plateforme', page: 'Partenaires & API' },
  '/users': { section: 'Administration', page: 'Utilisateurs' },
  '/roles': { section: 'Administration', page: 'Rôles & Permissions' },
  '/account/sessions': { section: 'Mon compte', page: 'Sessions actives' },
};

function resolveBreadcrumb(pathname: string): { section: string; page: string } {
  const exact = ROUTE_TITLES[pathname];
  if (exact) return exact;
  const matchedKey = Object.keys(ROUTE_TITLES).find((key) => pathname.startsWith(`${key}/`));
  return matchedKey ? ROUTE_TITLES[matchedKey] : { section: 'Portail G4D', page: 'Espace' };
}

export function AppShell({
  children,
  defaultSidebarOpen = true,
}: {
  children: ReactNode;
  defaultSidebarOpen?: boolean;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const ctx = user.accessContext;

  const [selectedAgenceId, setSelectedAgenceId] = useState<number | null>(
    ctx?.selectedAgenceId ?? ctx?.agenceMemberships[0]?.agenceId ?? null,
  );

  useLayoutEffect(() => {
    const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (MARKETING_STYLE_PATTERNS.some((pattern) => href.includes(pattern))) {
        link.disabled = true;
      }
    });
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
  }, []);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      try {
        const res = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (active && (res.status === 401 || res.status === 403)) {
          const next = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/login?next=${encodeURIComponent(next)}`);
        }
      } catch {
        // Ignorer les erreurs réseau transitoires
      }
    };

    void verifySession();

    const onPageShow = () => {
      void verifySession();
    };
    const onFocus = () => {
      void verifySession();
    };

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname]);

  const breadcrumb = resolveBreadcrumb(pathname);

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar selectedAgenceId={selectedAgenceId} onSelectAgence={setSelectedAgenceId} />

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden text-slate-500 sm:inline">{breadcrumb.section}</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="truncate font-semibold text-slate-900">{breadcrumb.page}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant="success" className="hidden sm:inline-flex">
              Connecté ({ctx?.primaryScope ?? 'client'})
            </Badge>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
