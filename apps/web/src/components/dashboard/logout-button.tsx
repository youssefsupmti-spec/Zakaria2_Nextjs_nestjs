'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignorer si déjà déconnecté et rediriger vers /login
    } finally {
      window.location.replace('/login');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[9px] border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-red-900/70 dark:hover:bg-red-950/60 dark:hover:text-red-400"
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      <span>{loading ? 'Déconnexion…' : 'Se déconnecter'}</span>
    </button>
  );
}
