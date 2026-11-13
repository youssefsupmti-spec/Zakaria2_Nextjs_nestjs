'use client';

import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { PanelLeftIcon, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Separator } from './separator';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean | ((value: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export function useSidebar(): SidebarContextProps {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar doit être utilisé dans un SidebarProvider.');
  }
  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
      return;
    }
    setOpen((prev) => !prev);
  }, [isMobile, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          'group/sidebar-wrapper flex min-h-svh w-full bg-slate-50 has-data-[variant=inset]:bg-sidebar',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'icon',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        {openMobile && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
              onClick={() => setOpenMobile(false)}
              aria-hidden="true"
            />
            <div
              data-sidebar="sidebar"
              data-slot="sidebar"
              data-mobile="true"
              style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
              className={cn(
                'relative z-10 flex h-full w-(--sidebar-width) flex-col bg-gradient-to-b from-[var(--sidebar-gradient-from)] via-sidebar to-[var(--sidebar-gradient-to)] text-sidebar-foreground shadow-xl',
                side === 'right' ? 'ml-auto' : 'mr-auto',
              )}
            >
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                aria-label="Fermer le menu latéral"
                className="absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
              <div className="flex h-full w-full flex-col">{children}</div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-0 z-20 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l border-sidebar-border',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex h-full w-full flex-col bg-gradient-to-b from-[var(--sidebar-gradient-from)] via-sidebar to-[var(--sidebar-gradient-to)] group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('size-7 rounded-md', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
      <span className="sr-only">Basculer la barre latérale</span>
    </Button>
  );
}

export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Basculer la barre latérale"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Réduire / Déplier la barre latérale (Ctrl+B)"
      className={cn(
        'hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarInset({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn(
        'relative flex min-w-0 flex-1 flex-col bg-slate-50',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-lg md:peer-data-[variant=inset]:shadow-xs md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('mx-2 w-auto bg-sidebar-border', className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'flex h-7 shrink-0 items-center rounded-md px-2.5 text-[11px] font-semibold tracking-tight text-slate-500 outline-none transition-[margin,opacity] duration-200 ease-linear',
        'group-data-[collapsible=icon]:-mt-7 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  'peer/menu-button relative flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 outline-none transition-all duration-150 ease-out hover:bg-white/65 hover:text-slate-900 [&:hover>svg]:text-[var(--g4d-blue)] focus-visible:ring-2 focus-visible:ring-sidebar-ring active:bg-white/80 disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-white data-[active=true]:font-semibold data-[active=true]:text-[var(--g4d-blue-dark)] data-[active=true]:shadow-[0_1px_2px_rgba(12,30,44,0.06)] data-[active=true]:ring-1 data-[active=true]:ring-sidebar-border/90 [&[data-active=true]>svg]:text-[var(--g4d-blue)] data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-[var(--g4d-blue)] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:data-[active=true]:before:hidden [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-slate-500 [&>svg]:transition-colors cursor-pointer',
  {
    variants: {
      variant: {
        default: '',
        outline:
          'bg-white/80 ring-1 ring-sidebar-border/90 shadow-2xs hover:bg-white hover:text-slate-900',
      },
      size: {
        default: 'h-9 text-[13px]',
        sm: 'h-8 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export function SidebarMenuButton({
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & {
  isActive?: boolean;
  tooltip?: string;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  const showTooltip = Boolean(tooltip && state === 'collapsed' && !isMobile);

  return (
    <button
      type="button"
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      title={showTooltip ? tooltip : undefined}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarMenuLink({
  href,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string;
  isActive?: boolean;
  tooltip?: string;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const showTooltip = Boolean(tooltip && state === 'collapsed' && !isMobile);

  return (
    <Link
      href={href}
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      title={showTooltip ? tooltip : undefined}
      onClick={(event) => {
        props.onClick?.(event);
        if (isMobile) {
          setOpenMobile(false);
        }
      }}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'ml-4 mt-1 flex min-w-0 flex-col gap-0.5 border-l border-sidebar-border py-0.5 pl-2.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  );
}

export function SidebarMenuSubButton({
  href,
  size = 'md',
  isActive = false,
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string;
  size?: 'sm' | 'md';
  isActive?: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Link
      href={href}
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      onClick={(event) => {
        onClick?.(event);
        if (isMobile) {
          setOpenMobile(false);
        }
      }}
      className={cn(
        'relative flex h-8 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2.5 font-medium text-slate-600 outline-none transition-all duration-150 hover:bg-white/60 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-slate-400 [&>svg]:transition-colors [&:hover>svg]:text-[var(--g4d-blue)] data-[active=true]:bg-white data-[active=true]:font-semibold data-[active=true]:text-[var(--g4d-blue-dark)] data-[active=true]:shadow-[0_1px_2px_rgba(12,30,44,0.05)] data-[active=true]:ring-1 data-[active=true]:ring-sidebar-border/80 [&[data-active=true]>svg]:text-[var(--g4d-blue)] data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5 data-[active=true]:before:w-[2.5px] data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-[var(--g4d-blue)]',
        size === 'sm' ? 'text-xs' : 'text-[12.5px]',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}
