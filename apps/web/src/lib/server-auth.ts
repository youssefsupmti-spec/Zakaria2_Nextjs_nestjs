import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthUserDto, SessionDuration } from '@zakaria/shared-contracts';

export interface ServerAuthSession {
  user: AuthUserDto;
  sessionExpiresAt: string;
  sessionDuration: SessionDuration;
}

function getInternalApiBaseUrl(): string {
  const configured = process.env.API_INTERNAL_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  return process.env.NODE_ENV === 'production'
    ? 'http://nestjsnextjs-backend-1ybpq9:3101'
    : 'http://127.0.0.1:3101';
}

export async function getServerAuthSession(): Promise<ServerAuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookies = cookieStore
    .getAll()
    .filter((c) => (c.name === '__Host-g4d.session' || c.name === 'g4d.session') && c.value);

  if (sessionCookies.length === 0) {
    return null;
  }

  const reqHeaders = await headers();
  const userAgent = reqHeaders.get('user-agent') ?? '';
  const forwardedFor = reqHeaders.get('x-forwarded-for') ?? '';

  for (const activeCookie of sessionCookies) {
    try {
      const response = await fetch(`${getInternalApiBaseUrl()}/api/v1/auth/me`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          cookie: `${activeCookie.name}=${activeCookie.value}`,
          ...(userAgent ? { 'user-agent': userAgent } : {}),
          ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
        },
      });

      if (response.ok) {
        return (await response.json()) as ServerAuthSession;
      }
    } catch {
      // Essayer le cookie suivant si disponible
    }
  }

  return null;
}

export async function requireServerAuthSession(): Promise<ServerAuthSession> {
  const session = await getServerAuthSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}
