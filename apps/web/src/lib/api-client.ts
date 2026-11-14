'use client';

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const existing = readCookie('g4d.csrf');
    if (existing && existing.includes('.')) {
      return existing;
    }
  }
  const res = await fetch('/api/v1/security/csrf', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as { csrfToken?: string } | null;
  return body?.csrfToken ?? readCookie('g4d.csrf');
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Client HTTP centralisé G4D avec injection automatique du jeton CSRF double-submit
 * (`X-CSRF-Token`) sur toute mutation POST / PUT / PATCH / DELETE.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = normalizedPath.startsWith('/api/v1') ? normalizedPath : `/api/v1${normalizedPath}`;

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  let serializedBody: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData || typeof options.body === 'string') {
      serializedBody = options.body;
    } else {
      headers.set('Content-Type', 'application/json');
      serializedBody = JSON.stringify(options.body);
    }
  }

  const isMutating = MUTATING_METHODS.has(method);
  if (isMutating) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  let response = await fetch(url, {
    ...options,
    method,
    credentials: 'include',
    headers,
    body: serializedBody,
  });

  // Si le jeton g4d.csrf en cookie est obsolète/rotatif, renouveler et réessayer une fois
  if (isMutating && response.status === 403) {
    const refreshedToken = await ensureCsrfToken(true);
    if (refreshedToken) {
      headers.set('X-CSRF-Token', refreshedToken);
      response = await fetch(url, {
        ...options,
        method,
        credentials: 'include',
        headers,
        body: serializedBody,
      });
    }
  }

  const payload = (await response.json().catch(() => null)) as
    ({ message?: string | string[]; details?: unknown } & T) | null;

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      const p = window.location.pathname;
      const isPublicPage =
        p === '/' ||
        p === '/login' ||
        p === '/register' ||
        p === '/forgot-password' ||
        p === '/reset-password';
      if (!isPublicPage) {
        const next = `${p}${window.location.search}`;
        window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    }
    const rawMsg = payload && 'message' in payload ? payload.message : undefined;
    const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg || `Erreur API (${response.status})`;
    throw new ApiClientError(msg, response.status, payload?.details);
  }

  return payload as T;
}
