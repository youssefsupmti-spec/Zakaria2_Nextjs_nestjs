'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActiveSessionItemDto, VilleOptionDto } from '@zakaria/shared-contracts';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileInfoTab } from '@/components/profile/profile-info-tab';
import { ProfileOverviewTab } from '@/components/profile/profile-overview-tab';
import { ProfilePreferencesTab } from '@/components/profile/profile-preferences-tab';
import { ProfileSecurityTab } from '@/components/profile/profile-security-tab';
import { ProfileSessionsTab } from '@/components/profile/profile-sessions-tab';
import {
  resolvePrimaryProfileRole,
  type ProfileResponse,
  type ProfileTabKey,
} from '@/components/profile/profile-types';
import '@/components/ui/solar-icons';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

const PROFILE_TABS: Array<{
  key: ProfileTabKey;
  label: string;
  icon: string;
}> = [
  { key: 'apercu', label: 'Aperçu & Périmètre', icon: 'solar:widget-2-bold-duotone' },
  { key: 'informations', label: 'Informations & Coordonnées', icon: 'solar:user-id-bold-duotone' },
  { key: 'securite', label: 'Sécurité du compte', icon: 'solar:shield-keyhole-bold-duotone' },
  { key: 'sessions', label: 'Sessions & Appareils', icon: 'solar:devices-bold-duotone' },
  { key: 'preferences', label: 'Préférences & Apparence', icon: 'solar:palette-2-bold-duotone' },
];

export default function ProfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ProfileTabKey>('apercu');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('tab') as ProfileTabKey | null;
    if (param && PROFILE_TABS.some((t) => t.key === param)) {
      setActiveTab(param);
    }
  }, []);

  const handleSelectTab = (tab: ProfileTabKey) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const profileQuery = useQuery({
    queryKey: ['own-profile'],
    queryFn: () => apiFetch<ProfileResponse>('/auth/profile'),
  });

  const villesQuery = useQuery({
    queryKey: ['public-villes'],
    queryFn: () => apiFetch<{ villes: VilleOptionDto[] }>('/auth/villes'),
  });

  const sessionsQuery = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => apiFetch<{ sessions: ActiveSessionItemDto[] }>('/auth/sessions'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: {
      nomComplet: string;
      civilite: string | null;
      villeId: number | null;
      cin: string;
      sav: string;
      lienLocalisationMaps: string;
    }) =>
      apiFetch<{ message: string }>('/auth/profile', {
        method: 'PATCH',
        body: payload,
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
      router.refresh();
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur de mise à jour du profil.',
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (payload: { dataUrl: string; filename: string }) =>
      apiFetch<{ message: string }>('/auth/profile/avatar', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors du changement de photo.',
      });
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: () => apiFetch<{ message: string }>('/auth/profile/avatar', { method: 'DELETE' }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Impossible de supprimer la photo.',
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: {
      currentPassword: string;
      newPassword: string;
      newPasswordConfirmation: string;
      revokeOtherSessions: boolean;
    }) =>
      apiFetch<{ message: string }>('/auth/profile/password', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Échec du changement de mot de passe.',
      });
    },
  });

  const requestContactMutation = useMutation({
    mutationFn: (payload: {
      type: 'email' | 'telephone' | 'sav' | 'ville';
      nouvelleValeur: string;
      motif: string;
    }) =>
      apiFetch<{ message: string }>('/auth/profile/contact-change', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Impossible d’enregistrer la demande.',
      });
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<{ ok: boolean }>(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setFeedback({ type: 'ok', text: 'La session distante a bien été révoquée.' });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la révocation de session.',
      });
    },
  });

  const revokeOtherSessionsMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean; message: string }>('/auth/sessions/revoke-others', {
        method: 'POST',
      }),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message });
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la déconnexion globale.',
      });
    },
  });

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-12 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">
        {profileQuery.error instanceof Error
          ? profileQuery.error.message
          : 'Impossible de charger les données de votre profil.'}
      </div>
    );
  }

  const { profile, roleSummary, contactChangeRequests, securityLogs } = profileQuery.data;
  const sessions = sessionsQuery.data?.sessions ?? [];
  const primaryRole = resolvePrimaryProfileRole(
    roleSummary.roles.map((r) => r.name).length > 0
      ? roleSummary.roles.map((r) => r.name)
      : user.roles,
    user.isSuperAdmin,
    roleSummary,
  );

  return (
    <div className="space-y-6">
      {/* A. En-tête Exécutif du Profil */}
      <ProfileHeader
        profile={profile}
        roleSummary={roleSummary}
        roleNames={user.roles}
        activeSessionsCount={sessions.length}
        isUploadingAvatar={uploadAvatarMutation.isPending}
        onUploadAvatar={(dataUrl, filename) => uploadAvatarMutation.mutate({ dataUrl, filename })}
        onSelectTab={handleSelectTab}
      />

      {/* Notification retour action */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer rounded-md p-1 opacity-75 hover:opacity-100"
            aria-label="Fermer la notification"
          >
            <Icon icon="solar:close-circle-bold-duotone" className="size-4" />
          </button>
        </div>
      )}

      {/* Navigation par 5 onglets */}
      <div
        role="tablist"
        aria-label="Sections du profil et de la sécurité"
        className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
      >
        {PROFILE_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectTab(tab.key)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-[13px] ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon
                icon={tab.icon}
                className={`size-4 shrink-0 ${isActive ? 'text-white' : 'text-primary'}`}
              />
              <span>{tab.label}</span>
              {tab.key === 'sessions' && sessions.length > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {sessions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenu actif */}
      <div role="tabpanel">
        {activeTab === 'apercu' && (
          <ProfileOverviewTab
            primaryRole={primaryRole}
            profile={profile}
            roleSummary={roleSummary}
            activeSessionsCount={sessions.length}
            onSelectTab={handleSelectTab}
          />
        )}

        {activeTab === 'informations' && (
          <ProfileInfoTab
            profile={profile}
            villes={villesQuery.data?.villes ?? []}
            isSuperAdmin={user.isSuperAdmin}
            contactChangeRequests={contactChangeRequests}
            isSavingProfile={updateProfileMutation.isPending}
            isDeletingAvatar={deleteAvatarMutation.isPending}
            isRequestingContact={requestContactMutation.isPending}
            onSaveProfile={(payload) => updateProfileMutation.mutate(payload)}
            onDeleteAvatar={() => deleteAvatarMutation.mutate()}
            onSubmitContactRequest={async (payload) => {
              try {
                await requestContactMutation.mutateAsync(payload);
                return true;
              } catch {
                return false;
              }
            }}
          />
        )}

        {activeTab === 'securite' && (
          <ProfileSecurityTab
            profile={profile}
            securityLogs={securityLogs}
            isChangingPassword={changePasswordMutation.isPending}
            onChangePassword={async (payload) => {
              try {
                await changePasswordMutation.mutateAsync(payload);
                return true;
              } catch {
                return false;
              }
            }}
          />
        )}

        {activeTab === 'sessions' && (
          <ProfileSessionsTab
            sessions={sessions}
            isLoading={sessionsQuery.isLoading}
            isRevokingOne={revokeSessionMutation.isPending}
            isRevokingOthers={revokeOtherSessionsMutation.isPending}
            onRevokeSession={(sessionId) => revokeSessionMutation.mutate(sessionId)}
            onRevokeOtherSessions={() => revokeOtherSessionsMutation.mutate()}
          />
        )}

        {activeTab === 'preferences' && <ProfilePreferencesTab />}
      </div>
    </div>
  );
}
