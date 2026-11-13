'use client';

import React, { useState } from 'react';
import { FeatherIcon } from './feather-icon';
import { ParcelTracker } from './parcel-tracker';

const PILLARS = [
  { title: 'Enlèvement de colis directement chez le marchand' },
  { title: 'Livraison en mains propres avec accusé de réception' },
  { title: 'Stockage gratuit et gestion des retours incluse' },
  { title: 'Reversement de fonds sécurisé sous 24H' },
];

const SERVICE_CONTENT: Record<
  string,
  {
    prefix: string;
    keyword: string;
    suffix: string;
    items: string[];
    extras: string[];
  }
> = {
  ramassage: {
    prefix: 'Planifiez votre enlèvement en quelques clics — notre équipe gère tout ',
    keyword: 'sans vous déplacer',
    suffix: '. Idéal pour les marchands e-commerce qui veulent se concentrer sur leurs ventes.',
    items: ['Bon de ramassage automatique', 'Horaires flexibles', 'Prise en charge rapide'],
    extras: ['Tournée planifiée selon vos volumes', "Confirmation d'enlèvement en temps réel"],
  },
  livraison: {
    prefix: 'Chaque livraison est confirmée uniquement après ',
    keyword: 'validation terrain réelle',
    suffix:
      ' — pas de fausses confirmations. Vos clients reçoivent une notification à chaque mise à jour.',
    items: [
      'Remise en mains propres',
      'Accusé de réception signé',
      'Notification client automatique',
    ],
    extras: ['Suivi temps réel à chaque étape', 'Retour géré automatiquement'],
  },
  expedition: {
    prefix: "Chaque colis dispose d'un code de suivi unique et d'un ",
    keyword: 'historique consultable à tout moment',
    suffix: ' depuis votre espace. Vous ne perdez jamais le contrôle de vos expéditions.',
    items: ['Code de suivi unique', 'Logs horodatés', "Rapports d'expédition"],
    extras: ['Notifications automatiques client', "Accès depuis n'importe quel appareil"],
  },
  fonds: {
    prefix: 'Tarif fixé dès la création du colis — ',
    keyword: 'zéro frais cachés',
    suffix:
      ', zéro surprise en fin de mois. Vos fonds sont reversés régulièrement avec un relevé détaillé.',
    items: ['Reversement en 24H', 'Virements réguliers', 'Relevés détaillés'],
    extras: ['Paiements sécurisés et traçables', 'Bon de livraison inclus'],
  },
  stockage: {
    prefix: 'Un espace de stockage professionnel, entièrement gratuit et ',
    keyword: 'sans engagement de durée',
    suffix: '. Vos marchandises sont gérées, protégées et expédiées à la commande.',
    items: ['Stocks en temps réel', 'Expédition à la commande', 'Conservation optimale'],
    extras: ['Gestion intégrée à votre espace', 'Accès et visibilité immédiats'],
  },
};

const PROCESS_STEPS = [
  {
    num: '01',
    icon: 'clipboard',
    title: 'Commande',
    text: 'Votre client passe commande. G4D est notifié instantanément via votre boutique ou API.',
    connector: true,
  },
  {
    num: '02',
    icon: 'package',
    title: 'Préparation',
    text: 'Préparez votre colis. Notre système génère automatiquement le bon de livraison et le code de suivi.',
    connector: true,
  },
  {
    num: '03',
    icon: 'truck',
    title: 'Ramassage',
    text: "Notre livreur récupère le colis à votre adresse ou dans l'une de nos 472+ agences HUB.",
    connector: true,
  },
  {
    num: '04',
    icon: 'map',
    title: 'Transport',
    text: 'Le colis transite par notre réseau national. Chaque étape est documentée et visible en temps réel.',
    connector: true,
  },
  {
    num: '05',
    icon: 'check-circle',
    title: 'Livraison',
    text: 'Livraison validée chez le client. Fonds reversés J+1 sur votre compte. Retour géré automatiquement.',
    connector: false,
  },
];

export function ServicesSection() {
  const [activeServiceTab, setActiveServiceTab] = useState<string>('ramassage');

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
           ABOUT — Présentation G4D
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="about py-140 position-relative max-lg-overflow-hidden">
        <img
          src="/assets/landing/images/shapes/g4d-delivery-moto.svg"
          alt=""
          className="cursor-big about-plane position-absolute tw-start-0 top-50"
        />
        <img
          src="/assets/landing/images/shapes/key-features-dotted.png"
          alt=""
          className="position-absolute bottom-0 tw-end-0 z-n1"
        />
        <img
          src="/assets/landing/images/thumbs/g4d-delivery-vehicle.png"
          alt=""
          loading="lazy"
          className="truck-head cursor-big position-absolute tw-end-0 d-xxl-block d-none"
          style={{ width: '480px', height: 'auto', objectFit: 'contain' }}
        />

        <div className="container">
          <div className="row gy-5 flex-wrap-reverse">
            <div className="col-lg-5 pe-xl-5">
              <div className="position-relative tw-pb-11 h-100">
                <div
                  className="position-relative"
                  data-aos="zoom-in"
                  data-aos-duration="1000"
                  data-aos-delay="200"
                >
                  <img
                    src="/assets/landing/images/thumbs/about-1.png"
                    alt="G4D Livraison"
                    loading="lazy"
                    className="object-fit-cover"
                    style={{ width: '490px', height: '628px' }}
                  />
                </div>

                {/* Stats badge */}
                <div
                  className="tw-p-10 tw-pe-130-px tw--translate-x-30-px bg-main-600 position-absolute tw-start-0 tw-bottom-20 tw--ms-30-px"
                  data-aos="zoom-in"
                  data-aos-duration="1000"
                  data-aos-delay="200"
                >
                  <h1 className="text-white tw-mb-4 cursor-big">4</h1>
                  <div className="d-flex flex-column tw-gap-1 align-items-start">
                    <span className="text-white fw-medium cursor-small">Agences HUP</span>
                    <img src="/assets/landing/images/shapes/line-shape.png" alt="" />
                  </div>
                  <div className="cursor-small before-border position-relative tw-p-205 bg-white d-inline-flex align-items-start tw-gap-1 position-absolute top-0 tw-end-0 tw-mt-205 tw-me-205 z-1">
                    <span className="tw-text-xl fw-semibold text-main-600">98%</span>
                    <span className="tw-text-xl fw-semibold text-main-600 d-flex tw--translate-y-4-px">
                      <FeatherIcon name="star" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7 ps-lg-5">
              <div>
                <div className="d-flex align-items-center tw-gap-3 tw-mb-305">
                  <img
                    src="/assets/landing/images/icons/quote-two-icon.svg"
                    alt=""
                    aria-hidden="true"
                  />
                  <span className="splitTextStyleTwo cursor-small tw-text-xl fw-bold fst-italic text-decoration-underline text-main-600">
                    À PROPOS DE NOUS
                  </span>
                </div>
                <h1 className="splitTextStyleOne cursor-big tw-mb-8">G4D · Group For Delivery</h1>
                <p className="cursor-small text-neutral-900 tw-ps-205 border-start border-main-600 border-2 tw-mb-6">
                  G4D (Group For Delivery) est un prestataire logistique marocain spécialisé dans
                  l&apos;accompagnement des TPE, PME et startups e-commerce. Notre expertise couvre
                  l&apos;intégralité de la chaîne logistique : de l&apos;enlèvement de vos colis
                  directement chez vous jusqu&apos;à leur remise en mains propres au destinataire
                  final, avec un suivi rigoureux à chaque étape.
                </p>
                <p className="cursor-small text-neutral-700">
                  Grâce à notre plateforme 100% digitale, gérez et suivez toutes vos expéditions en
                  temps réel. Nous assurons également le stockage gratuit, la gestion des retours et
                  le reversement sécurisé de vos fonds sous 24H — pour une expérience logistique
                  complète, fiable et sans stress.
                </p>

                <div className="tw-mt-9 position-relative z-2">
                  <div className="row gy-4">
                    <div
                      className="col-sm-6"
                      data-aos="fade-up"
                      data-aos-duration="1000"
                      data-aos-delay="200"
                    >
                      <div className="animation-item d-flex align-items-center tw-gap-6">
                        <span className="cursor-big animate__heartBeat flex-shrink-0">
                          <FeatherIcon name="globe" className="g4d-section-icon-sm" />
                        </span>
                        <h6 className="cursor-big">
                          Couverture <br />
                          Nationale
                        </h6>
                      </div>
                      <p className="cursor-small text-neutral-1000 tw-mt-605 line-clamp-2">
                        Livraison dans plus de 472 villes à travers tout le Maroc, via notre réseau
                        d&apos;agences HUP stratégiquement implantées.
                      </p>
                    </div>
                    <div
                      className="col-sm-6"
                      data-aos="fade-up"
                      data-aos-duration="1000"
                      data-aos-delay="400"
                    >
                      <div className="animation-item d-flex align-items-center tw-gap-6">
                        <span className="cursor-big animate__heartBeat flex-shrink-0">
                          <FeatherIcon name="monitor" className="g4d-section-icon-sm" />
                        </span>
                        <h6 className="cursor-big">
                          Plateforme <br />
                          Digitale Innovante
                        </h6>
                      </div>
                      <p className="cursor-small text-neutral-1000 tw-mt-605 line-clamp-2">
                        Un espace en ligne intuitif pour créer, suivre et gérer vos expéditions
                        24h/24, depuis n&apos;importe quel appareil.
                      </p>
                    </div>
                  </div>
                </div>

                <span className="tw-my-7 border-bottom border-neutral-100 d-block"></span>

                <ul className="cursor-small d-flex flex-column tw-gap-2">
                  {PILLARS.map((pillar, idx) => (
                    <li
                      key={idx}
                      className="d-flex align-items-center tw-gap-4"
                      data-aos="fade-up"
                      data-aos-duration="1000"
                      data-aos-delay="200"
                    >
                      <span className="text-main-600 d-flex">
                        <FeatherIcon name="check-circle" />
                      </span>
                      <span className="text-neutral-1000 fw-medium">{pillar.title}</span>
                    </li>
                  ))}
                </ul>

                <div className="d-flex align-items-center tw-gap-56-px tw-mt-10 flex-wrap">
                  <a
                    href="/login"
                    className="cursor-small btn btn-main-two hover-style-two button--stroke d-inline-flex align-items-center justify-content-center tw-gap-5 group active--translate-y-2 rounded-0"
                    data-block="button"
                    data-aos="fade-up"
                    data-aos-duration="1000"
                    data-aos-delay="200"
                  >
                    <span className="button__flair"></span>
                    <span className="button__label">Démarrer avec G4D</span>
                    <span className="tw-w-7 tw-h-7 bg-main-three-600 text-white tw-text-sm tw-rounded d-flex justify-content-center align-items-center position-relative tw-duration-500">
                      <FeatherIcon name="arrow-right" />
                    </span>
                  </a>
                  <a
                    href="#services"
                    className="cursor-small d-inline-flex align-items-center tw-gap-2 text-main-two-600 fw-semibold hover-text-main-600 group active--translate-y-2"
                  >
                    Nos services
                    <span className="text-main-600 d-flex group-hover-text-main-two-600 tw-duration-200">
                      <FeatherIcon name="arrow-right-circle" />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SERVICES — Types de livraison G4D (Tabs)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="service pb-120 position-relative half-bg-white bg-neutral" id="services">
        <img
          src="/assets/landing/images/shapes/pattern-bg.png"
          alt=""
          className="position-absolute bottom-0 tw-start-0 w-100 h-50"
        />

        <div className="container">
          <div className="max-w-856-px mx-auto text-center tw-pb-16 tw-mb-6">
            <span className="splitTextStyleTwo cursor-small tw-text-xl fw-bold fst-italic text-decoration-underline text-main-600 tw-mb-305">
              Nos Services · G4D
            </span>
            <h1 className="splitTextStyleOne cursor-big">
              Votre partenaire stratégique pour la croissance
            </h1>
            <p className="cursor-small text-neutral-900 tw-mt-6">
              Nous sommes bien plus qu&apos;un simple service de livraison. G4D vous offre une suite
              intégrée de services logistiques pour répondre à vos besoins et vous permettre
              d&apos;atteindre vos objectifs commerciaux avec succès.
            </p>
          </div>
        </div>

        <div className="tw-container-1540-px mx-auto tw-px-4">
          <div className="bg-main-two-600 tw-rounded-2xl position-relative z-1 overflow-hidden">
            {/* Service background image */}
            <img
              src="/assets/landing/images/thumbs/g4d-service-background.png"
              alt=""
              loading="lazy"
              className="position-absolute tw-end-0 bottom-0 z-n1"
              style={{ opacity: 0.55 }}
            />

            {/* Overlay 1 */}
            <div
              className="position-absolute top-0 tw-start-0 w-100 h-100 z-0 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'linear-gradient(to right, #0B3D5C 0%, rgba(11,61,92,0.92) 30%, rgba(11,61,92,0.55) 60%, transparent 100%)',
              }}
            ></div>

            {/* Overlay 2 */}
            <div
              className="position-absolute bottom-0 tw-start-0 w-100 z-0 pointer-events-none"
              aria-hidden="true"
              style={{
                height: '45%',
                background: 'linear-gradient(to top, rgba(11,61,92,0.75) 0%, transparent 100%)',
              }}
            ></div>

            {/* Overlay 3 */}
            <div
              className="position-absolute top-0 tw-end-0 z-0 pointer-events-none"
              aria-hidden="true"
              style={{
                width: '320px',
                height: '320px',
                background:
                  'radial-gradient(ellipse at top right, rgba(244,123,32,0.12) 0%, transparent 70%)',
              }}
            ></div>

            <div className="container position-relative z-2">
              <div className="row gy-4 align-items-end">
                {/* Tab Nav */}
                <div
                  className="col-xl-5"
                  data-aos="zoom-in"
                  data-aos-duration="1000"
                  data-aos-delay="200"
                >
                  <div className="pt-60">
                    <div className="bg-neutral-50 px-lg-5 tw-px-6 tw-pt-10 tw-pb-8 rectangle-shape">
                      <ul
                        className="common-tab nav nav-pills d-flex flex-column tw-gap-4"
                        id="pills-tab"
                        role="tablist"
                      >
                        {[
                          {
                            key: 'ramassage',
                            icon: 'package',
                            title: 'Ramassage',
                            sub: 'Collecte à votre porte',
                          },
                          {
                            key: 'livraison',
                            icon: 'truck',
                            title: 'Livraison',
                            sub: '472+ villes couvertes',
                          },
                          {
                            key: 'expedition',
                            icon: 'send',
                            title: 'Expédition',
                            sub: 'Traçabilité complète',
                          },
                          {
                            key: 'fonds',
                            icon: 'dollar-sign',
                            title: 'Fonds & Paiements',
                            sub: 'Reversement en 24H',
                          },
                          {
                            key: 'stockage',
                            icon: 'archive',
                            title: 'Stockage',
                            sub: 'Gratuit & sans engagement',
                          },
                        ].map((tab) => {
                          const isActive = activeServiceTab === tab.key;
                          return (
                            <li className="nav-item" role="presentation" key={tab.key}>
                              <button
                                className={`g4d-svc-tab nav-link cursor-big animation-item text-main-two-600 tw-duration-300 fw-semibold tw-px-6 tw-py-3 tw-rounded-lg bg-white w-100 ${
                                  isActive ? 'active' : ''
                                }`}
                                id={`pills-${tab.key}-tab`}
                                onClick={() => setActiveServiceTab(tab.key)}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                              >
                                <span className="d-flex align-items-center tw-gap-5 text-start">
                                  <FeatherIcon
                                    name={tab.icon}
                                    className="d-sm-flex d-none g4d-svc-tab__icon"
                                  />
                                  <span className="d-flex flex-column">
                                    <span className="fw-bold">{tab.title}</span>
                                    <span className="g4d-svc-tab__sub fw-normal">{tab.sub}</span>
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="col-xl-7 ps-xl-5">
                  <div className="tab-content py-60" id="pills-tabContent">
                    {Object.entries(SERVICE_CONTENT).map(([key, svc]) => {
                      const isActive = activeServiceTab === key;
                      return (
                        <div
                          key={key}
                          className={`tab-pane fade ${isActive ? 'show active' : ''}`}
                          id={`pills-${key}`}
                          role="tabpanel"
                          tabIndex={0}
                        >
                          <div>
                            <p
                              className="bg-main-two-900 tw-py-7 tw-pe-8 tw-ps-14 tw-text-lg text-white fw-semibold border-start border-main-600 border-5 tw-mb-7 cursor-small"
                              data-aos="fade-up"
                              data-aos-duration="800"
                              data-aos-delay="100"
                            >
                              {svc.prefix}
                              <span className="text-main-three-600">{svc.keyword}</span>
                              {svc.suffix}
                            </p>

                            <div
                              className="d-flex align-items-center position-relative max-w-620-px"
                              data-aos="fade-up"
                              data-aos-duration="800"
                              data-aos-delay="200"
                            >
                              <div className="tw--me-32-px d-sm-flex d-none position-relative">
                                <img
                                  src="/assets/landing/images/thumbs/service-1.png"
                                  alt=""
                                  loading="lazy"
                                />
                              </div>

                              <div className="bg-main-600 tw-h-240-px d-flex justify-content-center align-items-center tw-pe-6 tw-ps-8 position-relative z-1 rectangle-shape-two max-w-286-px w-100">
                                <ul className="cursor-small d-flex flex-column tw-gap-4">
                                  {svc.items.map((item, i) => (
                                    <li
                                      key={i}
                                      className="d-flex align-items-center tw-gap-4"
                                      data-aos="fade-left"
                                      data-aos-duration="600"
                                      data-aos-delay={250 + i * 120}
                                    >
                                      <span className="flex-shrink-0 tw-w-20-px tw-h-20-px bg-white rounded-circle d-flex align-items-center justify-content-center">
                                        <FeatherIcon
                                          name="check"
                                          style={{
                                            color: 'var(--g4d-blue)',
                                            strokeWidth: 3,
                                            width: '.7em',
                                            height: '.7em',
                                          }}
                                        />
                                      </span>
                                      <span className="text-white fw-semibold">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <ul className="cursor-small d-flex flex-row flex-wrap tw-gap-6 tw-mt-8 position-relative z-2 mb-0">
                              {svc.extras.map((extra, j) => (
                                <li
                                  key={j}
                                  className="d-flex align-items-center tw-gap-3"
                                  data-aos="fade-up"
                                  data-aos-duration="600"
                                  data-aos-delay={200 + j * 150}
                                >
                                  <span className="text-main-600 d-flex flex-shrink-0">
                                    <FeatherIcon name="check-circle" />
                                  </span>
                                  <span className="text-white fw-medium">{extra}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SUIVI COLIS — ParcelTracker (track-order strip)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="track-order overflow-hidden position-relative z-1 g4d-track-section"
        id="suivi"
      >
        <div className="g4d-track-shapes" aria-hidden="true">
          <div className="g4d-track-dots"></div>
          <div className="g4d-track-glow g4d-track-glow--right"></div>
          <div className="g4d-track-glow g4d-track-glow--left"></div>
          <div id="g4d-particles-js" className="g4d-track-particles"></div>
          <div className="g4d-track-pulse-wrap">
            <div className="g4d-track-pulse g4d-track-pulse--1"></div>
            <div className="g4d-track-pulse g4d-track-pulse--2"></div>
            <div className="g4d-track-pulse g4d-track-pulse--3"></div>
          </div>
        </div>

        <div className="container position-relative z-1">
          <ParcelTracker />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           HOW IT WORKS — Processus G4D (5 étapes)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="how-it-work-three py-140 bg-img position-relative overflow-hidden"
        data-background-image="/assets/landing/images/shapes/how-it-work-bg.png"
        style={{
          backgroundImage: 'url(/assets/landing/images/shapes/how-it-work-bg.png)',
        }}
      >
        <img
          src="/assets/landing/images/shapes/key-features-dotted.png"
          alt=""
          className="position-absolute bottom-0 tw-end-0 z-n1"
        />
        <div className="container">
          <div
            className="max-w-856-px mx-auto text-center tw-pb-16"
            data-aos="fade-up"
            data-aos-duration="1000"
          >
            <span className="splitTextStyleTwo cursor-small tw-text-xl fw-bold fst-italic text-decoration-underline text-main-600 tw-mb-305">
              Processus Simple &amp; Transparent
            </span>
            <h2 className="splitTextStyleOne cursor-big h1">Comment fonctionne G4D ?</h2>
          </div>

          <div className="how-it-work-item-wrapper">
            <div className="row gy-4 justify-content-center">
              {PROCESS_STEPS.map((step, index) => (
                <div
                  key={step.num}
                  className="col-xl col-lg-4 col-sm-6"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay={(index + 1) * 100}
                >
                  <div className="transport-way-item transport-card style-two position-relative text-center">
                    {step.connector && (
                      <img
                        src="/assets/landing/images/icons/rocket.svg"
                        alt=""
                        className="rocket position-absolute tw-start-full bottom-0 tw-mb--88-px d-lg-block d-none"
                      />
                    )}

                    <span className="transport-way-item__icon cursor-big tw-w-95-px tw-h-95-px bg-main-600 rounded-circle tw-rounded-bl-0 d-inline-flex justify-content-center align-items-center tw-transition-all tw-duration-300 position-relative">
                      <FeatherIcon name={step.icon} />
                      <span className="g4d-process-num">{step.num}</span>
                    </span>

                    <div className="transport-way-item__content border border-neutral-50 bg-neutral-50 tw-py-15 tw-px-24-px tw-rounded tw-duration-300">
                      <h5 className="tw-mb-6 cursor-big line-clamp-1">{step.title}</h5>
                      <p className="text-neutral-1000 cursor-small line-clamp-3">{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           APERÇU PLATEFORME — Screenshot interface G4D
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-140 bg-neutral-50 position-relative overflow-hidden" id="apercu">
        <img
          src="/assets/landing/images/shapes/pattern-bg.png"
          alt=""
          className="position-absolute top-0 tw-end-0 opacity-25"
          aria-hidden="true"
        />

        <div className="container">
          {/* Section header */}
          <div
            className="max-w-700-px mx-auto text-center tw-mb-15"
            data-aos="fade-up"
            data-aos-duration="1000"
          >
            <span className="splitTextStyleTwo cursor-small tw-text-xl fw-bold fst-italic text-decoration-underline text-main-600 tw-mb-305">
              Interface G4D
            </span>
            <h2 className="splitTextStyleOne cursor-big tw-mb-6">Aperçu de la Plateforme</h2>
            <p className="cursor-small text-neutral-900 tw-text-lg">
              Un tableau de bord moderne, pensé pour la logistique e-commerce. Gérez vos ramassages,
              suivez vos colis et analysez vos performances — en temps réel.
            </p>
          </div>

          {/* 3-column key-features layout */}
          <div className="row align-items-center gy-5">
            {/* Left features */}
            <div className="col-lg-3 col-sm-6">
              <div className="d-flex flex-column tw-gap-56-px">
                <div
                  className="animation-item"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="100"
                >
                  <span className="tw-mb-6 cursor-small g4d-feat-icon-wrap">
                    <FeatherIcon name="truck" className="g4d-section-icon" />
                  </span>
                  <h5 className="splitTextStyleTwo tw-mb-5 cursor-big">Ramassage Planifié</h5>
                  <p className="text-neutral-1000 cursor-small fw-medium">
                    Votre livreur passe selon vos créneaux. Zéro attente, zéro surprise.
                  </p>
                </div>
                <div
                  className="animation-item"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="300"
                >
                  <span className="tw-mb-6 cursor-small g4d-feat-icon-wrap">
                    <FeatherIcon name="clock" className="g4d-section-icon" />
                  </span>
                  <h5 className="splitTextStyleTwo tw-mb-5 cursor-big">Alertes Temps Réel</h5>
                  <p className="text-neutral-1000 cursor-small fw-medium">
                    Chaque changement de statut notifié instantanément à votre équipe.
                  </p>
                </div>
                <div
                  className="animation-item"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="500"
                >
                  <span className="tw-mb-6 cursor-small g4d-feat-icon-wrap">
                    <FeatherIcon name="layout" className="g4d-section-icon" />
                  </span>
                  <h5 className="splitTextStyleTwo tw-mb-5 cursor-big">Multi-Agences HUP</h5>
                  <p className="text-neutral-1000 cursor-small fw-medium">
                    Centralisez toutes vos agences depuis une seule interface sécurisée.
                  </p>
                </div>
              </div>
            </div>

            {/* Center : Browser Chrome + Swiper */}
            <div className="col-lg-6 position-relative">
              {/* Stat badges flottants */}
              <div className="g4d-apercu-badge g4d-apercu-badge--tl d-none d-xl-flex">
                <div
                  className="g4d-apercu-badge__icon"
                  style={{ background: 'rgba(41,150,200,.10)' }}
                >
                  <FeatherIcon
                    name="package"
                    style={{
                      width: '14px',
                      height: '14px',
                      stroke: '#2996C8',
                      fill: 'none',
                      strokeWidth: 2,
                    }}
                  />
                </div>
                <div>
                  <div className="g4d-apercu-badge__value">247</div>
                  <div className="g4d-apercu-badge__label">Colis actifs</div>
                </div>
              </div>

              <div className="g4d-apercu-badge g4d-apercu-badge--tr d-none d-xl-flex">
                <div
                  className="g4d-apercu-badge__icon"
                  style={{ background: 'rgba(244,123,32,.10)' }}
                >
                  <FeatherIcon
                    name="trending-up"
                    style={{
                      width: '14px',
                      height: '14px',
                      stroke: '#F47B20',
                      fill: 'none',
                      strokeWidth: 2,
                    }}
                  />
                </div>
                <div>
                  <div className="g4d-apercu-badge__value">98%</div>
                  <div className="g4d-apercu-badge__label">Livraison réussie</div>
                </div>
              </div>

              <div className="g4d-apercu-badge g4d-apercu-badge--bl d-none d-xl-flex">
                <div
                  className="g4d-apercu-badge__icon"
                  style={{ background: 'rgba(21,128,61,.10)' }}
                >
                  <FeatherIcon
                    name="check-circle"
                    style={{
                      width: '14px',
                      height: '14px',
                      stroke: '#15803d',
                      fill: 'none',
                      strokeWidth: 2,
                    }}
                  />
                </div>
                <div>
                  <div className="g4d-apercu-badge__value">J+1</div>
                  <div className="g4d-apercu-badge__label">Reversement fonds</div>
                </div>
              </div>

              <div
                className="bg-white border border-neutral-200 tw-rounded-3xl overflow-hidden g4d-apercu-chrome"
                data-aos="zoom-in"
                data-aos-duration="1000"
                data-aos-delay="200"
              >
                {/* Browser bar */}
                <div className="bg-main-two-600 tw-px-4 d-flex align-items-center tw-gap-3 g4d-browser-bar">
                  <span className="rounded-circle d-inline-block g4d-browser-dot-red"></span>
                  <span className="rounded-circle d-inline-block g4d-browser-dot-amber"></span>
                  <span className="rounded-circle d-inline-block g4d-browser-dot-green"></span>
                  <div className="flex-grow-1 tw-rounded tw-mx-4 tw-px-3 tw-py-1 d-flex align-items-center tw-gap-2 g4d-browser-url">
                    <FeatherIcon
                      name="lock"
                      className="text-white opacity-50"
                      width={11}
                      height={11}
                    />
                    <span
                      id="apercu-url"
                      className="text-white opacity-50 fw-medium"
                      style={{ fontSize: '11px' }}
                    >
                      app.g4d.ma/colis
                    </span>
                  </div>
                </div>

                {/* Swiper */}
                <div className="swiper apercu-swiper position-relative">
                  <div className="swiper-wrapper">
                    {/* Slide 1 : Suivi des Colis */}
                    <div className="swiper-slide">
                      <div className="g4d-mockup-screen">
                        <div className="g4d-dash__sidebar">
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="home" />
                          </div>
                          <div className="g4d-dash__nav-item g4d-dash__nav-item--active">
                            <FeatherIcon name="package" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="alert-circle" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="map-pin" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="settings" />
                          </div>
                        </div>
                        <div className="g4d-mockup-content">
                          <div className="g4d-mockup-topbar">
                            <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                              <FeatherIcon
                                name="package"
                                className="text-main-600"
                                width={14}
                                height={14}
                              />
                              <span
                                className="fw-semibold text-main-two-600"
                                style={{ fontSize: '13px' }}
                              >
                                Suivi des Colis
                              </span>
                            </div>
                            <span className="g4d-mockup-badge-count">247 colis</span>
                          </div>
                          <div className="g4d-mockup-search-bar">
                            <FeatherIcon name="search" width={12} height={12} />
                            <span>Rechercher un colis…</span>
                          </div>
                          <table className="g4d-mockup-table w-100" suppressHydrationWarning>
                            <thead>
                              <tr>
                                <th>Référence</th>
                                <th>Destinataire</th>
                                <th className="d-none d-md-table-cell">Ville</th>
                                <th>Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>#G4D-4821</td>
                                <td>Mohamed A.</td>
                                <td className="d-none d-md-table-cell">Casablanca</td>
                                <td>
                                  <span className="g4d-status g4d-status--success">Livré</span>
                                </td>
                              </tr>
                              <tr>
                                <td>#G4D-4820</td>
                                <td>Fatima Z.</td>
                                <td className="d-none d-md-table-cell">Rabat</td>
                                <td>
                                  <span className="g4d-status g4d-status--warning">En cours</span>
                                </td>
                              </tr>
                              <tr>
                                <td>#G4D-4819</td>
                                <td>Youssef K.</td>
                                <td className="d-none d-md-table-cell">Fès</td>
                                <td>
                                  <span className="g4d-status g4d-status--info">Ramassé</span>
                                </td>
                              </tr>
                              <tr>
                                <td>#G4D-4818</td>
                                <td>Asmae B.</td>
                                <td className="d-none d-md-table-cell">Marrakech</td>
                                <td>
                                  <span className="g4d-status g4d-status--danger">Retour</span>
                                </td>
                              </tr>
                              <tr>
                                <td>#G4D-4817</td>
                                <td>Khalid M.</td>
                                <td className="d-none d-md-table-cell">Agadir</td>
                                <td>
                                  <span className="g4d-status g4d-status--success">Livré</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="g4d-mockup-footer">
                            <span>← Précédent</span>
                            <span className="g4d-mockup-page">Page 1 / 5</span>
                            <span>Suivant →</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 2 : Réclamation Client */}
                    <div className="swiper-slide">
                      <div className="g4d-mockup-screen">
                        <div className="g4d-dash__sidebar">
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="home" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="package" />
                          </div>
                          <div className="g4d-dash__nav-item g4d-dash__nav-item--active">
                            <FeatherIcon name="alert-circle" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="map-pin" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="settings" />
                          </div>
                        </div>
                        <div className="g4d-mockup-content">
                          <div className="g4d-mockup-topbar">
                            <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                              <FeatherIcon
                                name="alert-circle"
                                className="text-main-three-600"
                                width={14}
                                height={14}
                              />
                              <span
                                className="fw-semibold text-main-two-600"
                                style={{ fontSize: '13px' }}
                              >
                                Nouvelle Réclamation
                              </span>
                            </div>
                            <span className="g4d-mockup-badge-new">Nouveau</span>
                          </div>
                          <div className="g4d-mockup-form">
                            <div className="g4d-mockup-field">
                              <label>Référence colis</label>
                              <div className="g4d-mockup-input g4d-mockup-input--filled">
                                #G4D-4819
                              </div>
                            </div>
                            <div className="g4d-mockup-field">
                              <label>Client</label>
                              <div className="g4d-mockup-input g4d-mockup-input--filled">
                                Youssef Karimi — Fès
                              </div>
                            </div>
                            <div className="g4d-mockup-field">
                              <label>Type de réclamation</label>
                              <div className="g4d-mockup-input g4d-mockup-input--select">
                                Colis endommagé
                                <FeatherIcon
                                  name="chevron-down"
                                  width={11}
                                  height={11}
                                  style={{ color: '#94a3b8' }}
                                />
                              </div>
                            </div>
                            <div className="g4d-mockup-field">
                              <label>Description</label>
                              <div className="g4d-mockup-textarea">
                                Le colis est arrivé avec l&apos;emballage déchiré. Le contenu semble
                                intact mais l&apos;emballage extérieur est endommagé…
                              </div>
                            </div>
                            <div className="g4d-mockup-actions">
                              <div className="g4d-mockup-btn g4d-mockup-btn--outline">Annuler</div>
                              <div className="g4d-mockup-btn g4d-mockup-btn--primary">
                                Soumettre la réclamation
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 3 : Tracking Timeline */}
                    <div className="swiper-slide">
                      <div className="g4d-mockup-screen">
                        <div className="g4d-dash__sidebar">
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="home" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="package" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="alert-circle" />
                          </div>
                          <div className="g4d-dash__nav-item g4d-dash__nav-item--active">
                            <FeatherIcon name="map-pin" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="settings" />
                          </div>
                        </div>
                        <div className="g4d-mockup-content">
                          <div className="g4d-mockup-topbar">
                            <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                              <FeatherIcon
                                name="map-pin"
                                className="text-main-600"
                                width={14}
                                height={14}
                              />
                              <span
                                className="fw-semibold text-main-two-600"
                                style={{ fontSize: '13px' }}
                              >
                                Tracking #G4D-4821
                              </span>
                            </div>
                            <span className="g4d-status g4d-status--success">Livré</span>
                          </div>
                          <div className="g4d-mockup-tracking-info">
                            <div className="d-flex justify-content-between">
                              <div>
                                <div className="g4d-mockup-label">Expéditeur</div>
                                <div className="g4d-mockup-value">Boutique Noor — Salé</div>
                              </div>
                              <div className="text-end">
                                <div className="g4d-mockup-label">Destinataire</div>
                                <div className="g4d-mockup-value">Mohamed A. — Casa</div>
                              </div>
                            </div>
                            <div className="g4d-mockup-progress mt-2">
                              <div
                                className="g4d-mockup-progress-fill"
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                          </div>
                          <div className="g4d-mockup-timeline">
                            <div className="g4d-timeline-item g4d-timeline-item--done">
                              <div className="g4d-timeline-dot g4d-timeline-dot--done">
                                <FeatherIcon name="check" width={10} height={10} />
                              </div>
                              <div className="g4d-timeline-content">
                                <strong>Livré au destinataire</strong>
                                <small>Aujourd&apos;hui 09:42 · Casablanca</small>
                              </div>
                            </div>
                            <div className="g4d-timeline-item g4d-timeline-item--done">
                              <div className="g4d-timeline-dot g4d-timeline-dot--done">
                                <FeatherIcon name="check" width={10} height={10} />
                              </div>
                              <div className="g4d-timeline-content">
                                <strong>En transit · Hub Rabat</strong>
                                <small>Aujourd&apos;hui 07:15</small>
                              </div>
                            </div>
                            <div className="g4d-timeline-item g4d-timeline-item--done">
                              <div className="g4d-timeline-dot g4d-timeline-dot--done">
                                <FeatherIcon name="check" width={10} height={10} />
                              </div>
                              <div className="g4d-timeline-content">
                                <strong>Ramassé · Agence Salé</strong>
                                <small>Hier 16:30</small>
                              </div>
                            </div>
                            <div className="g4d-timeline-item">
                              <div className="g4d-timeline-dot">
                                <FeatherIcon
                                  name="package"
                                  width={10}
                                  height={10}
                                  style={{ color: '#94a3b8' }}
                                />
                              </div>
                              <div className="g4d-timeline-content g4d-timeline-content--pending">
                                <strong>Colis créé</strong>
                                <small>Hier 14:00 · Boutique Noor</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 4 : Dashboard KPIs */}
                    <div className="swiper-slide">
                      <div className="g4d-mockup-screen">
                        <div className="g4d-dash__sidebar">
                          <div className="g4d-dash__nav-item g4d-dash__nav-item--active">
                            <FeatherIcon name="home" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="package" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="alert-circle" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="map-pin" />
                          </div>
                          <div className="g4d-dash__nav-item">
                            <FeatherIcon name="settings" />
                          </div>
                        </div>
                        <div className="g4d-mockup-content">
                          <div className="g4d-mockup-topbar">
                            <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                              <FeatherIcon
                                name="home"
                                className="text-main-600"
                                width={14}
                                height={14}
                              />
                              <span
                                className="fw-semibold text-main-two-600"
                                style={{ fontSize: '13px' }}
                              >
                                Tableau de bord
                              </span>
                            </div>
                            <span className="g4d-mockup-badge-count">Mar 2025</span>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '8px',
                              padding: '10px 14px',
                              flexShrink: 0,
                            }}
                          >
                            <div className="g4d-kpi-card">
                              <div
                                className="g4d-kpi-card__icon"
                                style={{ background: 'rgba(41,150,200,.10)' }}
                              >
                                <FeatherIcon
                                  name="package"
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    stroke: '#2996C8',
                                    fill: 'none',
                                    strokeWidth: 2,
                                  }}
                                />
                              </div>
                              <div className="g4d-kpi-card__value">1 247</div>
                              <div className="g4d-kpi-card__label">Colis ce mois</div>
                              <div className="g4d-kpi-card__trend" style={{ color: '#15803d' }}>
                                ↑ +12%
                              </div>
                            </div>
                            <div className="g4d-kpi-card">
                              <div
                                className="g4d-kpi-card__icon"
                                style={{ background: 'rgba(244,123,32,.10)' }}
                              >
                                <FeatherIcon
                                  name="check-circle"
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    stroke: '#F47B20',
                                    fill: 'none',
                                    strokeWidth: 2,
                                  }}
                                />
                              </div>
                              <div className="g4d-kpi-card__value">98%</div>
                              <div className="g4d-kpi-card__label">Taux livraison</div>
                              <div className="g4d-kpi-card__trend" style={{ color: '#15803d' }}>
                                ↑ +2%
                              </div>
                            </div>
                            <div className="g4d-kpi-card">
                              <div
                                className="g4d-kpi-card__icon"
                                style={{ background: 'rgba(21,128,61,.10)' }}
                              >
                                <FeatherIcon
                                  name="dollar-sign"
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    stroke: '#15803d',
                                    fill: 'none',
                                    strokeWidth: 2,
                                  }}
                                />
                              </div>
                              <div className="g4d-kpi-card__value">24 800 MAD</div>
                              <div className="g4d-kpi-card__label">Versé ce mois</div>
                              <div className="g4d-kpi-card__trend" style={{ color: '#15803d' }}>
                                ↑ +8%
                              </div>
                            </div>
                            <div className="g4d-kpi-card">
                              <div
                                className="g4d-kpi-card__icon"
                                style={{ background: 'rgba(239,68,68,.08)' }}
                              >
                                <FeatherIcon
                                  name="rotate-ccw"
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    stroke: '#dc2626',
                                    fill: 'none',
                                    strokeWidth: 2,
                                  }}
                                />
                              </div>
                              <div className="g4d-kpi-card__value">23</div>
                              <div className="g4d-kpi-card__label">Retours</div>
                              <div className="g4d-kpi-card__trend" style={{ color: '#dc2626' }}>
                                ↓ -4%
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: '0 14px 10px', flex: 1 }}>
                            <div
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '.4px',
                              }}
                            >
                              Livraisons — 7 derniers jours
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '5px',
                                height: '52px',
                              }}
                            >
                              <div
                                className="g4d-mini-bar"
                                style={{ height: '55%', background: '#2996C8' }}
                              ></div>
                              <div
                                className="g4d-mini-bar"
                                style={{ height: '72%', background: '#2996C8' }}
                              ></div>
                              <div
                                className="g4d-mini-bar"
                                style={{ height: '60%', background: '#2996C8' }}
                              ></div>
                              <div
                                className="g4d-mini-bar"
                                style={{ height: '88%', background: '#2996C8' }}
                              ></div>
                              <div
                                className="g4d-mini-bar"
                                style={{ height: '70%', background: '#2996C8' }}
                              ></div>
                              <div
                                className="g4d-mini-bar"
                                style={{ height: '95%', background: '#F47B20' }}
                              ></div>
                              <div
                                className="g4d-mini-bar"
                                style={{ height: '82%', background: '#2996C8' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab labels */}
                <div className="d-flex align-items-center justify-content-center tw-gap-2 tw-px-4 tw-py-3 border-top border-neutral-100">
                  <button className="g4d-apercu-tab active" data-slide="0" type="button">
                    <FeatherIcon name="grid" width={12} height={12} /> Suivi colis
                  </button>
                  <button className="g4d-apercu-tab" data-slide="1" type="button">
                    <FeatherIcon name="alert-circle" width={12} height={12} /> Réclamation
                  </button>
                  <button className="g4d-apercu-tab" data-slide="2" type="button">
                    <FeatherIcon name="map-pin" width={12} height={12} /> Tracking
                  </button>
                  <button className="g4d-apercu-tab" data-slide="3" type="button">
                    <FeatherIcon name="bar-chart-2" width={12} height={12} /> Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Right features */}
            <div className="col-lg-3 col-sm-6">
              <div className="d-flex flex-column tw-gap-56-px">
                <div
                  className="animation-item"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="200"
                >
                  <span className="tw-mb-6 cursor-small g4d-feat-icon-wrap">
                    <FeatherIcon name="gift" className="g4d-section-icon" />
                  </span>
                  <h5 className="splitTextStyleTwo tw-mb-5 cursor-big">Gestion des Retours</h5>
                  <p className="text-neutral-1000 cursor-small fw-medium">
                    Chaque retour tracé et tarifé dès la création du colis. Aucune surprise.
                  </p>
                </div>
                <div
                  className="animation-item"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="400"
                >
                  <span className="tw-mb-6 cursor-small g4d-feat-icon-wrap">
                    <FeatherIcon name="dollar-sign" className="g4d-section-icon" />
                  </span>
                  <h5 className="splitTextStyleTwo tw-mb-5 cursor-big">Tarification Claire</h5>
                  <p className="text-neutral-1000 cursor-small fw-medium">
                    1 888 tarifs configurés. Connaissez votre coût avant l&apos;expédition.
                  </p>
                </div>
                <div
                  className="animation-item"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="600"
                >
                  <span className="tw-mb-6 cursor-small g4d-feat-icon-wrap">
                    <FeatherIcon name="bar-chart-2" className="g4d-section-icon" />
                  </span>
                  <h5 className="splitTextStyleTwo tw-mb-5 cursor-big">Exports &amp; Rapports</h5>
                  <p className="text-neutral-1000 cursor-small fw-medium">
                    Téléchargez vos données et bilans PDF en un seul clic.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            className="text-center tw-mt-14"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-delay="300"
          >
            <a
              href="/login"
              className="cursor-small btn btn-main-two hover-style-two button--stroke tw-py-405 d-inline-flex align-items-center justify-content-center tw-gap-5 group active--translate-y-2 rounded-0"
              data-block="button"
            >
              <span className="button__flair"></span>
              <span className="button__label">Accéder à la plateforme</span>
              <span className="tw-w-7 tw-h-7 bg-main-three-600 text-white tw-text-sm tw-rounded d-flex justify-content-center align-items-center position-relative group-hover-bg-main-600 group-hover-text-white tw-duration-500">
                <FeatherIcon name="arrow-right" />
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
