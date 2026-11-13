'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Handshake, KeyRound, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { G4D_LOGO_TRIM_PATH } from '@/lib/brand';
import { useAuth } from '@/lib/client-rbac';
import { cn } from '@/lib/utils';
import { LogoutButton } from '../dashboard/logout-button';

const MARKETING_STYLE_PATTERNS = [
  '/assets/landing/css/',
  '/fonts/wx/index.css',
  '/fonts/filament/filament/inter/index.css',
  'leaflet.css',
];

export function AppShell({ children }: { children: ReactNode }) {
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

  const isPlatformAdmin = Boolean(
    ctx?.isPlatformAdmin || user.isSuperAdmin || user.roles.includes('admin'),
  );
  const hasAgenceAccess = isPlatformAdmin || (ctx?.agenceMemberships.length ?? 0) > 0;
  const hasPartenaireAccess =
    isPlatformAdmin ||
    (ctx?.agenceMemberships.length ?? 0) > 0 ||
    (ctx?.partenaireMemberships.length ?? 0) > 0;
  const canManageTeam =
    isPlatformAdmin ||
    (ctx?.managedAgenceIds.length ?? 0) > 0 ||
    user.parentId === null ||
    Boolean(ctx?.partenaireMemberships.some((p) => p.role === 'admin_partenaire'));

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, visible: true },
    { href: '/agences', label: 'Agences & Zones', icon: Building2, visible: hasAgenceAccess },
    {
      href: '/partenaires',
      label: 'Partenaires & API',
      icon: Handshake,
      visible: hasPartenaireAccess,
    },
    { href: '/users', label: 'Utilisateurs', icon: Users, visible: canManageTeam },
    { href: '/roles', label: 'Rôles & Permissions', icon: ShieldCheck, visible: canManageTeam },
    { href: '/account/sessions', label: 'Sessions actives', icon: KeyRound, visible: true },
  ].filter((item) => item.visible);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:flex lg:w-68 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={G4D_LOGO_TRIM_PATH} alt="G4D Express" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                Portail G4D
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Portée : {ctx?.primaryScope ?? 'client'}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-wrap gap-1 p-3 lg:flex-col lg:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                  active
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-sky-600' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-slate-100 p-4 lg:block">
          <p className="truncate text-sm font-bold text-slate-900">{user.nomComplet}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Titulaire #{user.titulaireId} · ID #{user.id}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Connecté ({ctx?.primaryScope ?? 'client'})
              </span>
              {(ctx?.agenceMemberships.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="agency-switcher" className="text-xs font-semibold text-slate-500">
                    Agence :
                  </label>
                  <select
                    id="agency-switcher"
                    value={selectedAgenceId ?? ''}
                    onChange={(e) => setSelectedAgenceId(Number(e.target.value) || null)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    {ctx?.agenceMemberships.map((m) => (
                      <option key={m.agenceId} value={m.agenceId}>
                        [{m.agenceCode}] {m.agenceNom} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">{user.nomComplet}</p>
                <p className="text-xs text-slate-500">{user.roles.join(', ')}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
