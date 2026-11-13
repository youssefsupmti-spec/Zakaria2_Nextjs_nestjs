'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Globe,
  Handshake,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
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

export function AppSidebar({
  selectedAgenceId,
  onSelectAgence,
}: {
  selectedAgenceId: number | null;
  onSelectAgence: (id: number | null) => void;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const ctx = user.accessContext;

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(
    pathname.startsWith('/users') || pathname.startsWith('/roles'),
  );
  const [loggingOut, setLoggingOut] = useState(false);

  const teamMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (teamMenuRef.current && !teamMenuRef.current.contains(target)) {
        setTeamMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTeamMenuOpen(false);
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
  const canManageTeam =
    isPlatformAdmin ||
    (ctx?.managedAgenceIds.length ?? 0) > 0 ||
    user.parentId === null ||
    Boolean(ctx?.partenaireMemberships.some((p) => p.role === 'admin_partenaire'));

  const memberships = ctx?.agenceMemberships ?? [];
  const activeMembership =
    memberships.find((m) => m.agenceId === selectedAgenceId) ?? memberships[0] ?? null;

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
      {/* SidebarHeader — TeamSwitcher G4D style sidebar-07 */}
      <SidebarHeader>
        <div ref={teamMenuRef} className="relative">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={
                  activeMembership ? `${activeMembership.agenceNom} (G4D)` : 'Portail G4D Express'
                }
                onClick={() => {
                  if (memberships.length > 0) {
                    setTeamMenuOpen((prev) => !prev);
                  }
                }}
                className="data-[state=open]:bg-sidebar-accent"
              >
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md border border-sky-100 bg-sky-50/70 p-1">
                  <img
                    src={G4D_LOGO_TRIM_PATH}
                    alt="G4D Express"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-slate-900">G4D Express</span>
                  <span className="truncate text-xs font-medium text-slate-500">
                    {activeMembership
                      ? `[${activeMembership.agenceCode}] ${activeMembership.agenceNom}`
                      : `Portée : ${ctx?.primaryScope ?? 'client'}`}
                  </span>
                </div>
                {memberships.length > 0 && (
                  <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {teamMenuOpen && memberships.length > 0 && (
            <div
              className={cn(
                'z-50 min-w-56 rounded-md border border-slate-200 bg-white p-1 shadow-md',
                isCollapsed ? 'fixed top-3 left-14' : 'absolute top-full left-0 mt-1 w-full',
              )}
            >
              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Agences rattachées
              </div>
              {memberships.map((m) => {
                const selected = m.agenceId === activeMembership?.agenceId;
                return (
                  <button
                    key={m.agenceId}
                    type="button"
                    onClick={() => {
                      onSelectAgence(m.agenceId);
                      setTeamMenuOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <span className="truncate">
                      <span className="font-bold text-slate-900">[{m.agenceCode}]</span>{' '}
                      {m.agenceNom}
                    </span>
                    {selected && <Check className="size-3.5 shrink-0 text-[#1B9DD9]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* SidebarContent — Navigation principale & Administration */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plateforme</SidebarGroupLabel>
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

            {hasAgenceAccess && (
              <SidebarMenuItem>
                <SidebarMenuLink
                  href="/agences"
                  isActive={pathname.startsWith('/agences')}
                  tooltip="Agences & Zones"
                >
                  <Building2 />
                  <span>Agences & Zones</span>
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
                  <span>Partenaires & API</span>
                </SidebarMenuLink>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administration & Sécurité</SidebarGroupLabel>
          <SidebarMenu>
            {canManageTeam && (
              <SidebarMenuItem>
                {isCollapsed ? (
                  <>
                    <SidebarMenuLink
                      href="/users"
                      isActive={pathname.startsWith('/users')}
                      tooltip="Utilisateurs"
                    >
                      <Users />
                      <span>Utilisateurs</span>
                    </SidebarMenuLink>
                  </>
                ) : (
                  <>
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/users') || pathname.startsWith('/roles')}
                      onClick={() => setAdminExpanded((prev) => !prev)}
                    >
                      <Users />
                      <span>Accès & Équipe</span>
                      <ChevronRight
                        className={cn(
                          'ml-auto transition-transform duration-200',
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
                            <span>Utilisateurs</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            href="/roles"
                            isActive={pathname.startsWith('/roles')}
                          >
                            <span>Rôles & Permissions</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </>
                )}
              </SidebarMenuItem>
            )}

            {canManageTeam && isCollapsed && (
              <SidebarMenuItem>
                <SidebarMenuLink
                  href="/roles"
                  isActive={pathname.startsWith('/roles')}
                  tooltip="Rôles & Permissions"
                >
                  <ShieldCheck />
                  <span>Rôles & Permissions</span>
                </SidebarMenuLink>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuLink
                href="/account/sessions"
                isActive={pathname.startsWith('/account/sessions')}
                tooltip="Sessions actives"
              >
                <KeyRound />
                <span>Sessions actives</span>
              </SidebarMenuLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* SidebarFooter — NavUser style sidebar-07 */}
      <SidebarFooter>
        <div ref={userMenuRef} className="relative">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={`${user.nomComplet} — Mon compte`}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="data-[state=open]:bg-sidebar-accent"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#0F172A] text-xs font-bold text-white">
                  {getUserInitials(user.nomComplet)}
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
                'z-50 min-w-56 rounded-md border border-slate-200 bg-white p-1 shadow-lg',
                isCollapsed
                  ? 'fixed bottom-3 left-14'
                  : 'absolute bottom-full left-0 mb-1.5 w-full',
              )}
            >
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-2.5 py-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#1B9DD9] text-xs font-bold text-white">
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
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <KeyRound className="size-3.5 text-slate-500" />
                  <span>Sessions actives</span>
                </Link>
                <a
                  href="/"
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Globe className="size-3.5 text-slate-500" />
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
