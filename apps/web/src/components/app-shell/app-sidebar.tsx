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
  const isCommercialRoute =
    pathname.startsWith('/inscriptions') ||
    pathname.startsWith('/businesses') ||
    pathname.startsWith('/banques');
  const isAdminRoute = pathname.startsWith('/users') || pathname.startsWith('/roles');

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [networkExpanded, setNetworkExpanded] = useState(isNetworkRoute);
  const [commercialExpanded, setCommercialExpanded] = useState(isCommercialRoute);
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
  const isClientAccount =
    !isPlatformAdmin &&
    (ctx?.primaryScope ? ctx.primaryScope === 'client' : user.roles.includes('client'));
  const canViewInscriptions =
    !isClientAccount &&
    (isPlatformAdmin ||
      (ctx?.managedAgenceIds.length ?? 0) > 0 ||
      (ctx?.agenceMemberships.length ?? 0) > 0 ||
      user.permissions.includes('Approve:DemandeInscription') ||
      user.permissions.includes('Reject:DemandeInscription') ||
      user.permissions.includes('View:PendingClientsAlert'));
  const canViewBusinesses =
    isClientAccount ||
    isPlatformAdmin ||
    (ctx?.agenceMemberships.length ?? 0) > 0 ||
    user.permissions.includes('ViewAny:Business') ||
    user.permissions.includes('View:BusinessesAdministration');
  const canViewBanques =
    !isClientAccount && (isPlatformAdmin || user.permissions.includes('ViewAny:Banque'));
  const hasCommercialAccess = canViewInscriptions || canViewBusinesses || canViewBanques;
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
      <SidebarHeader className="relative h-20 items-center justify-center px-4 group-data-[collapsible=icon]:h-16 group-data-[collapsible=icon]:px-1.5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 inset-y-2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_72%)] group-data-[collapsible=icon]:inset-1"
        />
        <img
          src={G4D_LOGO_TRIM_PATH}
          alt="G4D Express"
          className="relative h-15 w-auto max-w-[175px] object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.22)] transition-all duration-200 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:max-w-[46px]"
        />
      </SidebarHeader>

      <SidebarSeparator className="mx-4 bg-white/10 group-data-[collapsible=icon]:mx-2.5" />

      {/* Navigation principale & sous-menus */}
      <SidebarContent className="px-1.5 pt-1 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupLabel>Pilotage &amp; réseau</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuLink
                href="/dashboard"
                isActive={pathname === '/dashboard'}
                tooltip="Tableau de bord"
              >
                <Icon
                  icon="solar:widget-5-bold-duotone"
                  width={20}
                  height={20}
                  className="size-5 shrink-0"
                  aria-hidden="true"
                />
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
                          icon="solar:buildings-2-bold-duotone"
                          width={20}
                          height={20}
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
                          icon="solar:hand-shake-bold-duotone"
                          width={20}
                          height={20}
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
                    <Icon
                      icon="solar:delivery-bold-duotone"
                      width={20}
                      height={20}
                      aria-hidden="true"
                    />
                    <span>Réseau Logistique</span>
                    <Icon
                      icon="solar:alt-arrow-down-bold-duotone"
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
                            <span>Partenaires &amp; API</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}

            {hasCommercialAccess &&
              (isCollapsed ? (
                <>
                  {canViewInscriptions && (
                    <SidebarMenuItem>
                      <SidebarMenuLink
                        href="/inscriptions"
                        isActive={pathname.startsWith('/inscriptions')}
                        tooltip="Demandes d’inscription"
                      >
                        <Icon
                          icon="solar:user-plus-bold-duotone"
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                        <span>Demandes d&apos;inscription</span>
                      </SidebarMenuLink>
                    </SidebarMenuItem>
                  )}
                  {canViewBusinesses && (
                    <SidebarMenuItem>
                      <SidebarMenuLink
                        href="/businesses"
                        isActive={pathname.startsWith('/businesses')}
                        tooltip={isClientAccount ? 'Mes Business' : 'Enseignes & Business'}
                      >
                        <Icon
                          icon="solar:shop-2-bold-duotone"
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                        <span>{isClientAccount ? 'Mes Business' : 'Enseignes & Business'}</span>
                      </SidebarMenuLink>
                    </SidebarMenuItem>
                  )}
                  {canViewBanques && (
                    <SidebarMenuItem>
                      <SidebarMenuLink
                        href="/banques"
                        isActive={pathname.startsWith('/banques')}
                        tooltip="Banques & Codes RIB"
                      >
                        <Icon
                          icon="solar:banknote-2-bold-duotone"
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                        <span>Banques &amp; Codes RIB</span>
                      </SidebarMenuLink>
                    </SidebarMenuItem>
                  )}
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={!commercialExpanded && isCommercialRoute}
                    aria-expanded={commercialExpanded}
                    onClick={() => setCommercialExpanded((prev) => !prev)}
                    className={cn(
                      commercialExpanded &&
                        isCommercialRoute &&
                        'bg-white/[0.08] font-semibold text-white [&>svg:first-child]:text-white',
                    )}
                  >
                    <Icon
                      icon="solar:shop-2-bold-duotone"
                      width={20}
                      height={20}
                      aria-hidden="true"
                    />
                    <span>Vendeurs &amp; Enseignes</span>
                    <Icon
                      icon="solar:alt-arrow-down-bold-duotone"
                      width={16}
                      height={16}
                      aria-hidden="true"
                      className={cn(
                        'ml-auto size-4! shrink-0 text-white/60 transition-transform duration-200',
                        commercialExpanded ? 'rotate-0 text-white' : '-rotate-90',
                      )}
                    />
                  </SidebarMenuButton>
                  {commercialExpanded && (
                    <SidebarMenuSub>
                      {canViewInscriptions && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            href="/inscriptions"
                            isActive={pathname.startsWith('/inscriptions')}
                          >
                            <span>Demandes d&apos;inscription</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {canViewBusinesses && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            href="/businesses"
                            isActive={pathname.startsWith('/businesses')}
                          >
                            <span>{isClientAccount ? 'Mes Business' : 'Enseignes & Business'}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {canViewBanques && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            href="/banques"
                            isActive={pathname.startsWith('/banques')}
                          >
                            <span>Banques &amp; Codes RIB</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-0.5 bg-white/10 group-data-[collapsible=icon]:mx-2.5 group-data-[collapsible=icon]:my-1" />

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
                      <Icon
                        icon="solar:user-id-bold-duotone"
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
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
                        icon="solar:shield-keyhole-bold-duotone"
                        width={20}
                        height={20}
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
                      icon="solar:users-group-rounded-bold-duotone"
                      width={20}
                      height={20}
                      aria-hidden="true"
                    />
                    <span>Accès &amp; Équipe</span>
                    <Icon
                      icon="solar:alt-arrow-down-bold-duotone"
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
                          <span>Utilisateurs &amp; Comptes</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/roles"
                          isActive={pathname.startsWith('/roles')}
                        >
                          <span>Rôles &amp; Permissions</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}

            <SidebarMenuItem>
              <SidebarMenuLink
                href="/profil"
                isActive={pathname.startsWith('/profil')}
                tooltip="Mon Profil"
              >
                <Icon
                  icon="solar:user-circle-bold-duotone"
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
                <span>Mon Profil</span>
              </SidebarMenuLink>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuLink
                href="/account/sessions"
                isActive={pathname.startsWith('/account/sessions')}
                tooltip="Sessions & Appareils"
              >
                <Icon icon="solar:devices-bold-duotone" width={20} height={20} aria-hidden="true" />
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
                className="rounded-[6px] border border-white/14 bg-white/[0.08] px-2.5 py-2 text-left transition-all duration-200 hover:border-white/22 hover:bg-white/[0.13] group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:overflow-visible! group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:ring-0!"
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
                  icon="solar:alt-arrow-down-bold-duotone"
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
                'z-50 min-w-56 rounded-[11px] border border-slate-200/90 bg-white p-1.5 text-slate-900 shadow-xl dark:border-slate-700/90 dark:bg-slate-900 dark:text-slate-100',
                isCollapsed ? 'fixed bottom-3 left-16' : 'absolute bottom-full left-0 mb-2 w-full',
              )}
            >
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#16517f]/12 text-xs font-bold text-[#12476c] ring-1 ring-[#16517f]/25 dark:bg-[#1a5fa0]/30 dark:text-sky-300 dark:ring-sky-400/25">
                  {getUserInitials(user.nomComplet)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {user.nomComplet}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Titulaire #{user.titulaireId} · ID #{user.id}
                  </p>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/profil"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-[#16517f] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                >
                  <Icon
                    icon="solar:user-circle-bold-duotone"
                    width={17}
                    height={17}
                    className="text-[#1a5fa0] dark:text-sky-400"
                    aria-hidden="true"
                  />
                  <span>Mon Profil</span>
                </Link>
                <Link
                  href="/account/sessions"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-[#16517f] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                >
                  <Icon
                    icon="solar:devices-bold-duotone"
                    width={17}
                    height={17}
                    className="text-[#1a5fa0] dark:text-sky-400"
                    aria-hidden="true"
                  />
                  <span>Sessions &amp; Appareils</span>
                </Link>
                <a
                  href="/"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-[#16517f] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                >
                  <Icon
                    icon="solar:global-bold-duotone"
                    width={17}
                    height={17}
                    className="text-[#1a5fa0] dark:text-sky-400"
                    aria-hidden="true"
                  />
                  <span>Vitrine publique G4D</span>
                </a>
              </div>

              <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  <Icon
                    icon="solar:logout-2-bold-duotone"
                    width={17}
                    height={17}
                    aria-hidden="true"
                  />
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
