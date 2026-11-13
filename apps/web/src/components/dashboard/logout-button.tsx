'use client';

import { useState } from 'react';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      window.location.assign('/login');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
    >
      {loading ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  );
}

