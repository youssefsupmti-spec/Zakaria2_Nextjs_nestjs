'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Coordonnées officielles G4D */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#1B9DD9]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0E86C2]">
              Contact &amp; Ouverture de Compte
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
              Prêt à Expédier Vos Colis avec G4D ?
            </h2>

            <p className="text-base text-slate-600 leading-relaxed">
              Notre équipe commerciale et support vous accompagne du lundi au samedi pour ouvrir
              votre compte marchand et configurer vos ramassages.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1B9DD9]/15 text-[#0E86C2]">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Téléphone &amp; WhatsApp
                  </p>
                  <a
                    href="tel:+212623344607"
                    className="text-base font-extrabold text-[#0F172A] hover:text-[#1B9DD9] tabular-nums"
                  >
                    (+212) 6 23 34 46 07
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F9A03F]/15 text-[#E08A2B]">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Email Officiel
                  </p>
                  <a
                    href="mailto:Contact@g4d.ma"
                    className="text-base font-extrabold text-[#0F172A] hover:text-[#1B9DD9]"
                  >
                    Contact@g4d.ma
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3FB4E8]/15 text-[#1B9DD9]">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Siège &amp; Hub Logistique
                  </p>
                  <p className="text-sm font-bold text-[#0F172A]">
                    Avenue moulay, rachid hay linbiat, Salé
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Horaires d&apos;ouverture
                  </p>
                  <p className="text-sm font-bold text-[#0F172A]">Lundi - samedi 9h - 21h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de demande d'ouverture de compte */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 shadow-xl">
              <h3 className="text-2xl font-extrabold text-[#0F172A]">
                Demander l&apos;ouverture d&apos;un compte marchand
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                Remplissez ce formulaire et un conseiller G4D vous recontacte sous 24h.
              </p>

              {submitted ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <h4 className="text-base font-extrabold">
                      Votre demande a bien été prise en compte !
                    </h4>
                  </div>
                  <p className="mt-2 text-sm text-emerald-800">
                    Notre équipe commerciale G4D vous contactera très rapidement au numéro indiqué
                    pour activer votre accès Espace Client.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name">Nom complet / Boutique</Label>
                      <Input
                        id="contact-name"
                        required
                        placeholder="Ex: Boutique Atlas E-Com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-phone">Téléphone (WhatsApp)</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        required
                        placeholder="Ex: 06 61 00 00 00"
                        className="tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">Adresse e-mail</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        placeholder="contact@votre-boutique.ma"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-city">Ville de ramassage</Label>
                      <Input
                        id="contact-city"
                        required
                        placeholder="Ex: Salé, Rabat, Casablanca..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">Volume mensuel estimé &amp; besoins</Label>
                    <textarea
                      id="contact-message"
                      rows={3}
                      placeholder="Précisez votre volume moyen de colis par jour et vos besoins (Ramassage, Stockage, API...)"
                      className="flex w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#1B9DD9] focus-visible:ring-3 focus-visible:ring-[#1B9DD9]/15"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    <Send className="h-4 w-4" />
                    <span>Envoyer ma demande d&apos;inscription</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

