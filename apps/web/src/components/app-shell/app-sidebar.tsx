'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ChevronRight,
  ChevronsUpDown,
  Globe,
  Handshake,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuLink,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { apiFetch } from '@/lib/api-client';
import { G4D_LOGO_TRIM_PATH } from '@/lib/brand';
import { useAuth } from '@/lib/client-rbac';
import { cn } from '@/lib/utils';

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'G4';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const ctx = user.accessContext;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [networkExpanded, setNetworkExpanded] = useState(
    pathname.startsWith('/agences') || pathname.startsWith('/partenaires'),
  );
  const [adminExpanded, setAdminExpanded] = useState(
    pathname.startsWith('/users') || pathname.startsWith('/roles'),
  );
  const [loggingOut, setLoggingOut] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isPlatformAdmin = Boolean(
    ctx?.isPlatformAdmin || user.isSuperAdmin || user.roles.includes('admin'),
  );
  const hasAgenceAccess = isPlatformAdmin || (ctx?.agenceMemberships.length ?? 0) > 0;
  const hasPartenaireAccess =
    isPlatformAdmin ||
    (ctx?.agenceMemberships.length ?? 0) > 0 ||
    (ctx?.partenaireMemberships.length ?? 0) > 0;
  const hasNetworkAccess = hasAgenceAccess || hasPartenaireAccess;
  const canManageTeam =
    isPlatformAdmin ||
    (ctx?.managedAgenceIds.length ?? 0) > 0 ||
    user.parentId === null ||
    Boolean(ctx?.partenaireMemberships.some((p) => p.role === 'admin_partenaire'));

  const isCollapsed = state === 'collapsed' && !isMobile;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignorer et rediriger vers /login
    } finally {
      window.location.replace('/login');
    }
  };

  return (
    <Sidebar collapsible="icon">
      {/* Haut de sidebar : Logo image simple G4D, grand et clair, sans bouton */}
      <SidebarHeader className="items-center justify-center px-4 py-4 group-data-[collapsible=icon]:px-1.5 group-data-[collapsible=icon]:py-3">
        <img
          src={G4D_LOGO_TRIM_PATH}
          alt="G4D Express"
          className="h-14 w-auto max-w-[195px] object-contain drop-shadow-[0_2px_8px_rgba(27,157,217,0.16)] transition-all duration-200 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
        />
      </SidebarHeader>

      <SidebarSeparator />

      {/* Contenu principal : Menus & Sous-menus adaptés à G4D avec icônes */}
      <SidebarContent className="pt-1">
        <SidebarGroup>
          <SidebarGroupLabel>Pilotage &amp; Réseau</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLink
                href="/dashboard"
                isActive={pathname === '/dashboard'}
                tooltip="Tableau de bord"
              >
                <LayoutDashboard />
                <span>Tableau de bord</span>
              </SidebarMenuLink>
            </SidebarMenuItem>

            {hasNetworkAccess &&
              (isCollapsed ? (
                <>
                  {hasAgenceAccess && (
                    <SidebarMenuItem>
                      <SidebarMenuLink
                        href="/agences"
                        isActive={pathname.startsWith('/agences')}
                        tooltip="Agences & Zones"
                      >
                        <MapPin />
                        <span>Agences &amp; Zones</span>
                      </SidebarMenuLink>
                    </SidebarMenuItem>
                  )}
                  {hasPartenaireAccess && (
                    <SidebarMenuItem>
                      <SidebarMenuLink
                        href="/partenaires"
                        isActive={pathname.startsWith('/partenaires')}
                        tooltip="Partenaires & API"
                      >
                        <Handshake />
                        <span>Partenaires &amp; API</span>
                      </SidebarMenuLink>
                    </SidebarMenuItem>
                  )}
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={
                      !networkExpanded &&
                      (pathname.startsWith('/agences') || pathname.startsWith('/partenaires'))
                    }
                    onClick={() => setNetworkExpanded((prev) => !prev)}
                  >
                    <Building2 />
                    <span>Réseau Logistique</span>
                    <ChevronRight
                      className={cn(
                        'ml-auto size-4 transition-transform duration-200',
                        networkExpanded && 'rotate-90',
                      )}
                    />
                  </SidebarMenuButton>
                  {networkExpanded && (
                    <SidebarMenuSub>
                      {hasAgenceAccess && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            href="/agences"
                            isActive={pathname.startsWith('/agences')}
                          >
                            <MapPin />
                            <span>Agences &amp; Zones</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {hasPartenaireAccess && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            href="/partenaires"
                            isActive={pathname.startsWith('/partenaires')}
                          >
                            <Handshake />
                            <span>Partenaires &amp; API</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gouvernance &amp; Sécurité</SidebarGroupLabel>
          <SidebarMenu>
            {canManageTeam &&
              (isCollapsed ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuLink
                      href="/users"
                      isActive={pathname.startsWith('/users')}
                      tooltip="Utilisateurs & Comptes"
                    >
                      <UserCog />
                      <span>Utilisateurs &amp; Comptes</span>
                    </SidebarMenuLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuLink
                      href="/roles"
                      isActive={pathname.startsWith('/roles')}
                      tooltip="Rôles & Permissions"
                    >
                      <ShieldCheck />
                      <span>Rôles &amp; Permissions</span>
                    </SidebarMenuLink>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={
                      !adminExpanded &&
                      (pathname.startsWith('/users') || pathname.startsWith('/roles'))
                    }
                    onClick={() => setAdminExpanded((prev) => !prev)}
                  >
                    <Users />
                    <span>Accès &amp; Équipe</span>
                    <ChevronRight
                      className={cn(
                        'ml-auto size-4 transition-transform duration-200',
                        adminExpanded && 'rotate-90',
                      )}
                    />
                  </SidebarMenuButton>
                  {adminExpanded && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/users"
                          isActive={pathname.startsWith('/users')}
                        >
                          <UserCog />
                          <span>Utilisateurs &amp; Comptes</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/roles"
                          isActive={pathname.startsWith('/roles')}
                        >
                          <ShieldCheck />
                          <span>Rôles &amp; Permissions</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}

            <SidebarMenuItem>
              <SidebarMenuLink
                href="/account/sessions"
                isActive={pathname.startsWith('/account/sessions')}
                tooltip="Sessions & Appareils"
              >
                <KeyRound />
                <span>Sessions &amp; Appareils</span>
              </SidebarMenuLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Pied de sidebar : NavUser épuré */}
      <SidebarFooter className="border-t border-sidebar-border/80 bg-white/40">
        <div ref={userMenuRef} className="relative">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                variant="outline"
                tooltip={`${user.nomComplet} — Mon compte`}
                onClick={() => setUserMenuOpen((prev) => !prev)}
              >
                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#1B9DD9] to-[#0E86C2] text-xs font-bold text-white shadow-2xs">
                  {getUserInitials(user.nomComplet)}
                  <span
                    className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border border-white bg-emerald-500"
                    aria-hidden="true"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-slate-900">{user.nomComplet}</span>
                  <span className="truncate text-xs text-slate-500">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {userMenuOpen && (
            <div
              className={cn(
                'z-50 min-w-56 rounded-md border border-[#D3E7F5] bg-white p-1 shadow-lg',
                isCollapsed
                  ? 'fixed bottom-3 left-14'
                  : 'absolute bottom-full left-0 mb-1.5 w-full',
              )}
            >
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-2.5 py-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#1B9DD9] to-[#0E86C2] text-xs font-bold text-white">
                  {getUserInitials(user.nomComplet)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{user.nomComplet}</p>
                  <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Titulaire #{user.titulaireId} · ID #{user.id}
                  </p>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/account/sessions"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-[#0B6E99]"
                >
                  <KeyRound className="size-3.5 text-[#1B9DD9]" />
                  <span>Sessions &amp; Appareils</span>
                </Link>
                <a
                  href="/"
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-[#0B6E99]"
                >
                  <Globe className="size-3.5 text-[#1B9DD9]" />
                  <span>Vitrine publique G4D</span>
                </a>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <LogOut className="size-3.5" />
                  <span>{loggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
