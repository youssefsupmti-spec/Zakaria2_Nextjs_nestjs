'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AuthUserDto } from '@zakaria/shared-contracts';

interface AuthContextValue {
  user: AuthUserDto;
  hasPermission: (permission: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUserDto;
  children: ReactNode;
}) {
  const value = useMemo<AuthContextValue>(() => {
    const permissionSet = new Set(initialUser.permissions);
    return {
      user: initialUser,
      hasPermission: (required) => {
        if (initialUser.isSuperAdmin) return true;
        if (Array.isArray(required)) {
          return required.every((perm) => permissionSet.has(perm));
        }
        return permissionSet.has(required);
      },
    };
  }, [initialUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() doit être utilisé à l’intérieur de <AuthProvider>.');
  }
  return ctx;
}

export function usePermission(permission: string | string[]): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = usePermission(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

