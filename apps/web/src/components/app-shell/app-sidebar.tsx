'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
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
import '@/components/ui/solar-icons';
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

  const isNetworkRoute = pathname.startsWith('/agences') || pathname.startsWith('/partenaires');
  const isAdminRoute = pathname.startsWith('/users') || pathname.startsWith('/roles');

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [networkExpanded, setNetworkExpanded] = useState(isNetworkRoute);
  const [adminExpanded, setAdminExpanded] = useState(isAdminRoute);
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
      {/* Zone dédiée au logo G4D centré avec halo subtil sur le dégradé bleu */}
      <SidebarHeader className="relative h-20 items-center justify-center px-4 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:px-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 inset-y-2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_72%)] group-data-[collapsible=icon]:inset-1"
        />
        <img
          src={G4D_LOGO_TRIM_PATH}
          alt="G4D Express"
          className="relative h-11 w-auto max-w-[175px] object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.22)] transition-all duration-200 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7"
        />
      </SidebarHeader>

      <SidebarSeparator className="mx-4 bg-white/10" />

      {/* Navigation principale & sous-menus */}
      <SidebarContent className="px-1.5 pt-1">
        <SidebarGroup>
          <SidebarGroupLabel>Pilotage &amp; réseau</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLink
                href="/dashboard"
                isActive={pathname === '/dashboard'}
                tooltip="Tableau de bord"
              >
                <Icon icon="solar:widget-2-linear" width={21} height={21} aria-hidden="true" />
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
                        <Icon
                          icon="solar:buildings-2-linear"
                          width={21}
                          height={21}
                          aria-hidden="true"
                        />
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
                        <Icon
                          icon="solar:hand-shake-linear"
                          width={21}
                          height={21}
                          aria-hidden="true"
                        />
                        <span>Partenaires &amp; API</span>
                      </SidebarMenuLink>
                    </SidebarMenuItem>
                  )}
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={!networkExpanded && isNetworkRoute}
                    aria-expanded={networkExpanded}
                    onClick={() => setNetworkExpanded((prev) => !prev)}
                    className={cn(
                      networkExpanded &&
                        isNetworkRoute &&
                        'bg-white/[0.08] font-semibold text-white [&>svg:first-child]:text-white',
                    )}
                  >
                    <Icon icon="solar:delivery-linear" width={21} height={21} aria-hidden="true" />
                    <span>Réseau Logistique</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      width={16}
                      height={16}
                      aria-hidden="true"
                      className={cn(
                        'ml-auto size-4! shrink-0 text-white/60 transition-transform duration-200',
                        networkExpanded ? 'rotate-0 text-white' : '-rotate-90',
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
                            <Icon
                              icon="solar:buildings-2-linear"
                              width={19}
                              height={19}
                              aria-hidden="true"
                            />
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
                            <Icon
                              icon="solar:hand-shake-linear"
                              width={19}
                              height={19}
                              aria-hidden="true"
                            />
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

        <SidebarSeparator className="mx-4 my-0.5 bg-white/10 group-data-[collapsible=icon]:hidden" />

        <SidebarGroup>
          <SidebarGroupLabel>Gouvernance &amp; sécurité</SidebarGroupLabel>
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
                      <Icon icon="solar:user-id-linear" width={21} height={21} aria-hidden="true" />
                      <span>Utilisateurs &amp; Comptes</span>
                    </SidebarMenuLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuLink
                      href="/roles"
                      isActive={pathname.startsWith('/roles')}
                      tooltip="Rôles & Permissions"
                    >
                      <Icon
                        icon="solar:shield-keyhole-linear"
                        width={21}
                        height={21}
                        aria-hidden="true"
                      />
                      <span>Rôles &amp; Permissions</span>
                    </SidebarMenuLink>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={!adminExpanded && isAdminRoute}
                    aria-expanded={adminExpanded}
                    onClick={() => setAdminExpanded((prev) => !prev)}
                    className={cn(
                      adminExpanded &&
                        isAdminRoute &&
                        'bg-white/[0.08] font-semibold text-white [&>svg:first-child]:text-white',
                    )}
                  >
                    <Icon
                      icon="solar:users-group-rounded-linear"
                      width={21}
                      height={21}
                      aria-hidden="true"
                    />
                    <span>Accès &amp; Équipe</span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      width={16}
                      height={16}
                      aria-hidden="true"
                      className={cn(
                        'ml-auto size-4! shrink-0 text-white/60 transition-transform duration-200',
                        adminExpanded ? 'rotate-0 text-white' : '-rotate-90',
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
                          <Icon
                            icon="solar:user-id-linear"
                            width={19}
                            height={19}
                            aria-hidden="true"
                          />
                          <span>Utilisateurs &amp; Comptes</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/roles"
                          isActive={pathname.startsWith('/roles')}
                        >
                          <Icon
                            icon="solar:shield-keyhole-linear"
                            width={19}
                            height={19}
                            aria-hidden="true"
                          />
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
                <Icon icon="solar:devices-linear" width={21} height={21} aria-hidden="true" />
                <span>Sessions &amp; Appareils</span>
              </SidebarMenuLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer / Carte profil utilisateur translucide sur fond dégradé */}
      <SidebarFooter className="border-t border-white/10 p-3 group-data-[collapsible=icon]:p-2">
        <div ref={userMenuRef} className="relative">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                variant="outline"
                tooltip={`${user.nomComplet} — Mon compte`}
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="rounded-[11px] border border-white/14 bg-white/[0.08] px-2.5 py-2 text-left transition-all duration-200 hover:border-white/22 hover:bg-white/[0.13] group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0"
              >
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-white/16 text-xs font-bold text-white ring-1 ring-white/25">
                  {getUserInitials(user.nomComplet)}
                  <span
                    className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-[#12476c] bg-emerald-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-[13px] font-semibold text-white">
                    {user.nomComplet}
                  </span>
                  <span className="truncate text-[11px] text-white/65">{user.email}</span>
                </div>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  width={16}
                  height={16}
                  aria-hidden="true"
                  className={cn(
                    'ml-auto size-4! shrink-0 text-white/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden',
                    userMenuOpen && 'rotate-180 text-white',
                  )}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {userMenuOpen && (
            <div
              className={cn(
                'z-50 min-w-56 rounded-[11px] border border-slate-200/90 bg-white p-1.5 text-slate-900 shadow-xl',
                isCollapsed ? 'fixed bottom-3 left-14' : 'absolute bottom-full left-0 mb-2 w-full',
              )}
            >
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-2.5 py-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#16517f]/12 text-xs font-bold text-[#12476c] ring-1 ring-[#16517f]/25">
                  {getUserInitials(user.nomComplet)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{user.nomComplet}</p>
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
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-[#16517f]"
                >
                  <Icon
                    icon="solar:devices-linear"
                    width={17}
                    height={17}
                    className="text-[#1a5fa0]"
                    aria-hidden="true"
                  />
                  <span>Sessions &amp; Appareils</span>
                </Link>
                <a
                  href="/"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-[#16517f]"
                >
                  <Icon
                    icon="solar:global-linear"
                    width={17}
                    height={17}
                    className="text-[#1a5fa0]"
                    aria-hidden="true"
                  />
                  <span>Vitrine publique G4D</span>
                </a>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 disabled:opacity-60"
                >
                  <Icon icon="solar:logout-2-linear" width={17} height={17} aria-hidden="true" />
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
