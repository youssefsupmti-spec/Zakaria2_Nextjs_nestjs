'use client';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BUSINESS_ACTIVITY_TYPES,
  CIVILITE_VALUES,
  RegisterClientSchema,
  type VilleOptionDto,
} from '@zakaria/shared-contracts';
import { ApiClientError, apiFetch } from '@/lib/api-client';

interface DuplicateEntry {
  field: 'email' | 'telephone';
  message: string;
  email: string;
}

export function RegisterForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [villes, setVilles] = useState<VilleOptionDto[]>([]);
  const [loadingVilles, setLoadingVilles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Étape 1 — Informations vendeur
  const [civilite, setCivilite] = useState<string>('M.');
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [sav, setSav] = useState('');
  const [villeId, setVilleId] = useState<string>('');
  const [cin, setCin] = useState('');
  const [lienLocalisationMaps, setLienLocalisationMaps] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Étape 2 — Première enseigne / business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<string>(BUSINESS_ACTIVITY_TYPES[0]);
  const [businessTelephone, setBusinessTelephone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessVilleId, setBusinessVilleId] = useState<string>('');
  const [businessAdresse, setBusinessAdresse] = useState('');
  const [businessIce, setBusinessIce] = useState('');
  const [businessRc, setBusinessRc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [doublons, setDoublons] = useState<DuplicateEntry[]>([]);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    restored: boolean;
    businessName: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<{ villes: VilleOptionDto[] }>('/auth/villes')
      .then((res) => {
        if (active) {
          setVilles(res.villes ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setErrorMessage('Impossible de charger la liste des villes pour le moment.');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingVilles(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleNextStep = () => {
    setErrorMessage(null);
    setDoublons([]);

    if (nomComplet.trim().length < 2) {
      setErrorMessage('Veuillez saisir votre nom complet (minimum 2 caractères).');
      return;
    }
    if (!email.trim().includes('@')) {
      setErrorMessage('Veuillez saisir une adresse e-mail valide.');
      return;
    }
    if (telephone.trim().length < 8) {
      setErrorMessage('Veuillez saisir un numéro de téléphone valide (min. 8 caractères).');
      return;
    }
    if (!villeId) {
      setErrorMessage('Veuillez sélectionner votre ville principale.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== passwordConfirmation) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (!businessVilleId) {
      setBusinessVilleId(villeId);
    }
    if (!businessTelephone.trim()) {
      setBusinessTelephone(telephone.trim());
    }
    if (!businessEmail.trim()) {
      setBusinessEmail(email.trim());
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDoublons([]);

    const payload = {
      nomComplet: nomComplet.trim(),
      civilite: (civilite || null) as 'M.' | 'Mme' | 'Mlle' | null,
      email: email.trim(),
      telephone: telephone.trim(),
      sav: sav.trim(),
      villeId: Number(villeId),
      cin: cin.trim(),
      lienLocalisationMaps: lienLocalisationMaps.trim(),
      password,
      passwordConfirmation,
      businessName: businessName.trim(),
      businessType: businessType || null,
      businessTelephone: businessTelephone.trim() || null,
      businessEmail: businessEmail.trim() || '',
      businessAdresse: businessAdresse.trim() || null,
      businessVilleId: businessVilleId ? Number(businessVilleId) : Number(villeId),
      businessIce: businessIce.trim() || null,
      businessRc: businessRc.trim() || null,
    };

    const parsed = RegisterClientSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Formulaire invalide.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{
        ok: boolean;
        restored: boolean;
        message: string;
      }>('/auth/register', {
        method: 'POST',
        body: parsed.data,
      });

      setSuccessInfo({
        message: res.message,
        restored: Boolean(res.restored),
        businessName: parsed.data.businessName,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (Array.isArray(error.details) && error.details.length > 0) {
          setDoublons(error.details as DuplicateEntry[]);
          setStep(1);
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erreur réseau lors de l'envoi de votre demande d'inscription.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <div className="space-y-5 py-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-slate-900">
            Demande d&apos;inscription enregistrée
          </h2>
          <p className="text-sm text-slate-600">{successInfo.message}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-left text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-500">Enseigne déclarée</span>
            <span className="font-bold text-slate-900">{successInfo.businessName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-500">Statut initial</span>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              En attente de validation
            </span>
          </div>
          {successInfo.restored && (
            <p className="pt-1 text-[11px] font-medium text-sky-700">
              Votre précédent dossier a été réouvert avec cette nouvelle demande.
            </p>
          )}
        </div>

        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B9DD9] via-[#0284C7] to-[#0369A1] px-6 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:brightness-105"
        >
          <span>Retour à la connexion</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicateur 2 étapes */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/90 bg-slate-100/70 p-1">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
            step === 1
              ? 'bg-white text-[#0369a1] shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>1. Compte vendeur</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (step === 1) handleNextStep();
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
            step === 2
              ? 'bg-white text-[#0369a1] shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>2. Enseigne / Business</span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 space-y-1">
          <div className="flex items-start gap-2 font-semibold">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
          {doublons.length > 0 && (
            <ul className="ml-6 list-disc space-y-0.5 text-[11px] font-medium text-red-600">
              {doublons.map((d, idx) => (
                <li key={`${d.field}-${idx}`}>
                  {d.message} ({d.field})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {step === 1 ? (
          <>
            <div className="grid grid-cols-[100px_1fr] gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Civilité</label>
                <select
                  value={civilite}
                  onChange={(e) => setCivilite(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                >
                  {CIVILITE_VALUES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nom complet *
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nomComplet}
                    onChange={(e) => setNomComplet(e.target.value)}
                    placeholder="Ex: Ahmed Benali"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Adresse e-mail professionnelle *
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendeur@boutique.ma"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Téléphone principal *
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Téléphone SAV / Secondaire
                </label>
                <input
                  type="tel"
                  value={sav}
                  onChange={(e) => setSav(e.target.value)}
                  placeholder="Optionnel"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Ville principale *
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    required
                    disabled={loadingVilles}
                    value={villeId}
                    onChange={(e) => setVilleId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">
                      {loadingVilles ? 'Chargement des villes…' : 'Choisir une ville'}
                    </option>
                    {villes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nameFr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  N° CIN (optionnel)
                </label>
                <input
                  type="text"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  placeholder="Ex: A123456"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Lien Google Maps (point de ramassage)
              </label>
              <input
                type="url"
                value={lienLocalisationMaps}
                onChange={(e) => setLienLocalisationMaps(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Confirmation *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Répéter le mot de passe"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="mt-1 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B9DD9] via-[#0284C7] to-[#0369A1] px-6 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:brightness-105"
            >
              <span>Continuer vers votre enseigne</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nom commercial de l&apos;enseigne *
              </label>
              <div className="relative">
                <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Maison Atlas E-Shop"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Type d&apos;activité
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  >
                    {BUSINESS_ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Ville de ramassage *
                </label>
                <select
                  value={businessVilleId}
                  onChange={(e) => setBusinessVilleId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="">Identique à ma ville</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nameFr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Téléphone boutique
                </label>
                <input
                  type="tel"
                  value={businessTelephone}
                  onChange={(e) => setBusinessTelephone(e.target.value)}
                  placeholder="06XXXXXXXX"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  E-mail boutique
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="contact@boutique.ma"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Adresse complète du dépôt / magasin
              </label>
              <input
                type="text"
                value={businessAdresse}
                onChange={(e) => setBusinessAdresse(e.target.value)}
                placeholder="Quartier, rue, N°..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ICE (optionnel)
                </label>
                <input
                  type="text"
                  value={businessIce}
                  onChange={(e) => setBusinessIce(e.target.value)}
                  placeholder="00XXXXXXXXXXXXX"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Registre de commerce (RC)
                </label>
                <input
                  type="text"
                  value={businessRc}
                  onChange={(e) => setBusinessRc(e.target.value)}
                  placeholder="Optionnel"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Étape 1</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B9DD9] via-[#0284C7] to-[#0369A1] px-6 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:brightness-105 disabled:opacity-65"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{submitting ? 'Envoi en cours…' : "Soumettre l'inscription"}</span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
