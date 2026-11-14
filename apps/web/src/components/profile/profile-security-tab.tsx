'use client';

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Lock,
  LogOut,
  MonitorSmartphone,
  Shield,
  ShieldCheck,
  SquarePen,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  evaluatePasswordStrength,
  formatDateTimeFr,
  formatSecurityEvent,
  parseUserAgent,
  type ProfileUser,
  type SecurityLogItem,
} from './profile-types';

export function ProfileSecurityTab({
  profile,
  securityLogs,
  isChangingPassword,
  onChangePassword,
}: {
  profile: ProfileUser;
  securityLogs: SecurityLogItem[];
  isChangingPassword: boolean;
  onChangePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
    revokeOtherSessions: boolean;
  }) => Promise<boolean>;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = evaluatePasswordStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === newPasswordConfirmation;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onChangePassword({
      currentPassword,
      newPassword,
      newPasswordConfirmation,
      revokeOtherSessions,
    });
    if (ok) {
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Carte Changement de mot de passe */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Mot de passe &amp; Protection
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vérification stricte du mot de passe actuel et hachage Argon2id.
            </p>
          </div>
          <Badge variant="outline">{profile.passwordAlgo.toUpperCase()}</Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Dernier changement de mot de passe
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {profile.passwordResetAt
              ? formatDateTimeFr(profile.passwordResetAt)
              : 'Historique antérieur à la migration'}
          </span>
        </div>

        <div className="space-y-4">
          {/* Mot de passe actuel */}
          <div>
            <Label htmlFor="sec-current">Mot de passe actuel *</Label>
            <div className="relative mt-1.5">
              <Input
                id="sec-current"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showCurrent ? 'Masquer' : 'Afficher'}
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sec-new">Nouveau mot de passe *</Label>
              <span className={`text-xs font-bold ${strength.textClass}`}>
                Robustesse : {strength.label}
              </span>
            </div>
            <div className="relative mt-1.5">
              <Input
                id="sec-new"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showNew ? 'Masquer' : 'Afficher'}
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Jauge 4 barres */}
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-colors ${
                    strength.score >= step ? strength.barClass : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Checklist 4 critères */}
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
              {[
                { ok: strength.checks.minLength, text: '8 caractères minimum' },
                { ok: strength.checks.hasUpperAndLower, text: 'Majuscules & minuscules' },
                { ok: strength.checks.hasNumber, text: 'Au moins un chiffre' },
                { ok: strength.checks.hasSpecial, text: 'Caractère spécial (!@#$…)' },
              ].map((item) => (
                <li
                  key={item.text}
                  className={`flex items-center gap-1.5 ${
                    item.ok
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    className={`size-3.5 shrink-0 ${
                      item.ok ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confirmation */}
          <div>
            <Label htmlFor="sec-confirm">Confirmer le nouveau mot de passe *</Label>
            <div className="relative mt-1.5">
              <Input
                id="sec-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={newPasswordConfirmation}
                onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {newPasswordConfirmation.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                Les deux nouveaux mots de passe ne correspondent pas.
              </p>
            )}
          </div>

          {/* Option révocation autres appareils */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <input
              type="checkbox"
              checked={revokeOtherSessions}
              onChange={(e) => setRevokeOtherSessions(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>
              <strong className="block text-slate-800 dark:text-slate-100">
                Déconnecter automatiquement mes autres appareils
              </strong>
              <span className="text-slate-500 dark:text-slate-400">
                Recommandé après un changement de mot de passe. Votre session actuelle reste
                ouverte.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button type="submit" disabled={isChangingPassword || !passwordsMatch}>
            <Shield className="size-4" />
            {isChangingPassword ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </Button>
        </div>
      </form>

      {/* Colonne droite : Journal d'activité & MFA */}
      <div className="space-y-6 lg:col-span-6">
        {/* Encart Double Authentification (évolution planifiée transparente) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Double authentification (MFA / 2FA)
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  La vérification par application TOTP sera activée dans une prochaine mise à jour
                  de gouvernance. Votre compte bénéficie déjà des jetons opaques HttpOnly, de la
                  protection CSRF double-submit et du hachage Argon2id.
                </p>
              </div>
            </div>
            <Badge variant="secondary">Évolution prévue</Badge>
          </div>
        </div>

        {/* Journal des derniers événements */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Activité de sécurité récente
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12 derniers événements enregistrés sur votre compte.
              </p>
            </div>
            <Badge variant="outline">{securityLogs.length}</Badge>
          </div>

          {securityLogs.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Aucun événement de sécurité récent.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {securityLogs.map((log) => {
                const meta = formatSecurityEvent(log.event);
                const parsedUa = parseUserAgent(log.userAgent);
                const iconMap: Record<ReturnType<typeof formatSecurityEvent>['icon'], LucideIcon> =
                  {
                    shield_check: ShieldCheck,
                    logout: LogOut,
                    key: KeyRound,
                    lock: Lock,
                    user: UserCheck,
                    camera: Camera,
                    edit: SquarePen,
                    devices: MonitorSmartphone,
                    alert: AlertTriangle,
                    history: History,
                  };
                const SecurityEventIcon = iconMap[meta.icon];
                return (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.toneClass}`}
                      >
                        <SecurityEventIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {meta.label}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {parsedUa.label}
                          {log.ipAddress ? ` · IP ${log.ipAddress}` : ''}
                        </p>
                        {log.location && (
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            {log.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-slate-400 tabular-nums">
                      {formatDateTimeFr(log.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
