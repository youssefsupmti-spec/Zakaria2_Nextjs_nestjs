'use client';

import { Icon } from '@iconify/react';
import type { ActiveSessionItemDto } from '@zakaria/shared-contracts';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OPERATION_LABELS } from '@/components/ui/operation-feedback';
import '@/components/ui/solar-icons';
import { formatDateTimeFr, parseUserAgent } from './profile-types';

export function ProfileSessionsTab({
  sessions,
  isLoading,
  isRevokingOne,
  isRevokingOthers,
  onRevokeSession,
  onRevokeOtherSessions,
}: {
  sessions: ActiveSessionItemDto[];
  isLoading: boolean;
  isRevokingOne: boolean;
  isRevokingOthers: boolean;
  onRevokeSession: (sessionId: string) => void;
  onRevokeOtherSessions: () => void;
}) {
  const [confirmOthers, setConfirmOthers] = useState(false);

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-5">
      {/* Barre de synthèse & Action globale */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Sessions &amp; Appareils connectés
            </h2>
            <Badge variant="default">{sessions.length} active(s)</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Contrôlez les navigateurs et postes ayant un accès ouvert à votre compte G4D. Aucun
            jeton secret n’est affiché.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!confirmOthers ? (
            <Button
              type="button"
              variant="outline"
              disabled={otherSessionsCount === 0 || isRevokingOthers}
              onClick={() => setConfirmOthers(true)}
            >
              <Icon icon="solar:logout-3-bold-duotone" className="size-4 text-red-500" />
              Déconnecter toutes les autres sessions ({otherSessionsCount})
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 dark:border-red-900/70 dark:bg-red-950/50">
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                Confirmer la déconnexion des {otherSessionsCount} autre(s) appareil(s) ?
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isRevokingOthers}
                onClick={() => {
                  onRevokeOtherSessions();
                  setConfirmOthers(false);
                }}
              >
                {isRevokingOthers ? OPERATION_LABELS.deleting : 'Confirmer'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirmOthers(false)}
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des sessions */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {OPERATION_LABELS.loading}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Aucune session active trouvée.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sessions.map((sess) => {
            const parsed = parseUserAgent(sess.userAgent);
            const deviceIcon =
              parsed.deviceType === 'mobile'
                ? 'solar:smartphone-bold-duotone'
                : 'solar:laptop-bold-duotone';

            return (
              <div
                key={sess.id}
                className={`rounded-2xl border p-5 shadow-2xs transition-colors ${
                  sess.isCurrent
                    ? 'border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-800/70 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                        sess.isCurrent
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <Icon icon={deviceIcon} className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {parsed.label}
                        </p>
                        {sess.isCurrent ? (
                          <Badge variant="success">Cet appareil</Badge>
                        ) : (
                          <Badge variant="secondary">Autre session</Badge>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                        IP : {sess.ipAddress || 'Inconnue'} · Durée : {sess.durationCode}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={sess.isCurrent || isRevokingOne}
                    title={
                      sess.isCurrent
                        ? 'Impossible de révoquer la session active depuis cet onglet (utilisez Déconnexion).'
                        : 'Révoquer cette session à distance'
                    }
                    onClick={() => onRevokeSession(sess.id)}
                  >
                    <Icon
                      icon="solar:trash-bin-trash-bold-duotone"
                      className="size-4 text-red-500"
                    />
                    {sess.isCurrent ? 'Active' : 'Révoquer'}
                  </Button>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-200/70 pt-3 text-xs sm:grid-cols-3 dark:border-slate-800">
                  <div>
                    <dt className="text-slate-400">Connexion</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                      {formatDateTimeFr(sess.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Dernière activité</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                      {formatDateTimeFr(sess.lastActiveAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Expiration</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                      {formatDateTimeFr(sess.expiresAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
