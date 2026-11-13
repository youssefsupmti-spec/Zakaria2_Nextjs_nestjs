'use client';

import { SESSION_DURATION_OPTIONS, type AuthUserDto, type SessionDuration } from '@zakaria/shared-contracts';
import { AuthProvider, Can, useAuth } from '@/lib/client-rbac';
import { G4D_LOGO_TRIM_PATH } from '@/lib/brand';
import { LogoutButton } from './logout-button';

interface DashboardClientProps {
  user: AuthUserDto;
  sessionExpiresAt: string;
  sessionDuration: SessionDuration;
}

function DashboardContent({
  sessionExpiresAt,
  sessionDuration,
}: {
  sessionExpiresAt: string;
  sessionDuration: SessionDuration;
}) {
  const { user } = useAuth();
  const durationLabel =
    SESSION_DURATION_OPTIONS.find((opt) => opt.value === sessionDuration)?.label ??
    sessionDuration;
  const expiryFormatted = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(sessionExpiresAt));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <a href="/" aria-label="Accueil G4D">
              <img
                src={G4D_LOGO_TRIM_PATH}
                alt="G4D Express"
                className="h-10 w-auto object-contain"
              />
            </a>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
                Espace G4D Delivery
              </p>
              <h1 className="text-base font-bold text-slate-900">Tableau de bord</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm font-bold text-slate-900">{user.nomComplet}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Session authentifiée active
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
                Bienvenue, {user.nomComplet}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Identifiant utilisateur #{user.id} · Compte titulaire #{user.titulaireId}
                {user.villeName ? ` · Ville : ${user.villeName}` : ''}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Durée choisie : {durationLabel}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                Expire le {expiryFormatted}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Rôles attribués</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Permissions effectives</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {user.isSuperAdmin ? 'Accès Total (Super Admin)' : user.permissions.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Téléphone</p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {user.telephone || 'Non renseigné'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Type de compte</p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {user.parentId ? `Sous-compte de #${user.parentId}` : 'Compte principal'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Can
            permission="ViewAny:Command"
            fallback={
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-400">
                Module Colis non autorisé pour ce profil.
              </div>
            }
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold uppercase text-sky-600">Sprint 04 (À venir)</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Colis &amp; Expéditions</h3>
              <p className="mt-2 text-sm text-slate-600">
                Accès autorisé via <code className="font-mono text-xs">ViewAny:Command</code>.
              </p>
            </div>
          </Can>

          <Can
            permission="Manage:SousComptes"
            fallback={
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-400">
                Gestion des sous-comptes non autorisée pour ce profil.
              </div>
            }
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold uppercase text-amber-600">RBAC Actif</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Sous-comptes &amp; Rôles</h3>
              <p className="mt-2 text-sm text-slate-600">
                Accès autorisé via <code className="font-mono text-xs">Manage:SousComptes</code>.
              </p>
            </div>
          </Can>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase text-slate-500">Sécurité &amp; Session</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Cookie Opaque PostgreSQL</h3>
            <p className="mt-2 text-sm text-slate-600">
              Authentification vérifiée côté serveur via PostgreSQL 18 + Redis + Argon2id.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export function DashboardClient({
  user,
  sessionExpiresAt,
  sessionDuration,
}: DashboardClientProps) {
  return (
    <AuthProvider initialUser={user}>
      <DashboardContent
        sessionExpiresAt={sessionExpiresAt}
        sessionDuration={sessionDuration}
      />
    </AuthProvider>
  );
}

