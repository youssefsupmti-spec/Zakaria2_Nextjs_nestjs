'use client';

import React from 'react';
import { FeatherIcon } from './feather-icon';
import { G4D_LOGO_PATH } from '@/lib/brand';

const TESTIMONIALS = [
  {
    title: 'Service logistique de référence',
    content:
      'G4D a transformé notre chaîne de livraison. Le suivi en temps réel nous permet de rassurer nos clients instantanément et le taux de livraison confirmée est passé à 98 %.',
    author: 'Youssef Benali',
    position: 'Directeur e-commerce',
    company: 'MaMode.ma',
  },
  {
    title: 'Traçabilité sans faille',
    content:
      'Avant G4D, nous avions 15 % de litiges sur les livraisons. Ce chiffre est tombé à moins de 2 %. La validation terrain réelle change tout pour nos clients cosmétiques.',
    author: 'Fatima Zahra',
    position: 'CEO',
    company: 'Cosmétic Bio',
  },
  {
    title: 'Visibilité totale pour scaler',
    content:
      'Le tableau de bord G4D nous donne une visibilité complète sur chaque expédition. Idéal pour monter en volume sans perdre le contrôle opérationnel.',
    author: 'Karim Tazi',
    position: 'Operations Manager',
    company: 'TechStore Maroc',
  },
  {
    title: 'Retours devenus un avantage',
    content:
      'Tarif retour fixé dès la création, historique complet, zéro surprise en fin de mois. La gestion des retours G4D est devenue un argument de vente pour nous.',
    author: 'Nadia Alaoui',
    position: 'Fondatrice',
    company: 'DécoMaroc',
  },
];

export function Footer({ mapReady }: { mapReady: boolean }) {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
           TÉMOIGNAGES — Swiper Carousel
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="testimonials-brand pb-140 tw-mt-9 position-relative z-1">
        <img
          src="/assets/landing/images/shapes/testimonials-brand-bg.png"
          alt=""
          className="position-absolute bottom-0 tw-start-0 tw-end-0 z-n1 w-100 h-75"
        />
        <img
          src="/assets/landing/images/shapes/moon-shape.png"
          alt=""
          className="moon-shape position-absolute bottom-0 tw-start-0 z-n1 tw-mb-17"
        />

        <div className="tw-container-1380-px tw-px-4 mx-auto">
          <div className="max-w-632-px mx-auto text-center tw-mb-15">
            <span className="cursor-small tw-text-xl fw-bold fst-italic text-decoration-underline text-main-600 tw-mb-305">
              Témoignages
            </span>
            <h2 className="cursor-big tw-mb-8 h1">Ce que disent nos clients</h2>
          </div>

          <div className="testimonials-box bg-white">
            <div className="testimonials-slider swiper">
              <div className="swiper-wrapper">
                {TESTIMONIALS.map((t, idx) => (
                  <div className="swiper-slide bg-white" key={idx}>
                    <div className="row gy-4">
                      <div className="col-md-8 offset-md-2">
                        <div className="tw-p-10">
                          <p className="xl-tw-text-3xl tw-text-xl fw-bold text-main-two-600 cursor-big">
                            {t.content}
                          </p>
                          <span className="tw-my-10 border-bottom border-neutral-100 d-block"></span>
                          <div className="d-flex align-items-center justify-content-between flex-wrap tw-gap-2">
                            <div>
                              <h5 className="tw-mb-2 cursor-big">{t.author}</h5>
                              <span className="text-neutral-900 cursor-small">
                                {t.position} · {t.company}
                              </span>
                            </div>
                            <ul className="d-flex align-items-center tw-gap-2 cursor-small">
                              {[0, 1, 2, 3, 4].map((s) => (
                                <li key={s} className="text-star tw-text-base">
                                  <FeatherIcon name="star" />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           COUVERTURE — Map Leaflet (#g4d-coverage-map)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="get-in-touch py-140 position-relative overflow-hidden"
        id="couverture"
      >
        <div className="container">
          <div className="row gy-5 align-items-center">
            <div
              className="col-lg-5"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="100"
            >
              <span className="splitTextStyleTwo cursor-small tw-text-xl fw-bold fst-italic text-decoration-underline text-main-600 tw-mb-305">
                Couverture Nationale
              </span>
              <h1 className="splitTextStyleOne cursor-big tw-mb-8">
                Notre réseau couvre tout le Maroc
              </h1>
              <p className="cursor-small text-neutral-900 tw-ps-205 border-start border-main-600 border-3">
                Des zones de livraison stratégiquement organisées. 472+ villes
                et communes accessibles. Un réseau qui s&apos;étend chaque mois.
              </p>
              <div className="tw-mt-10 d-flex flex-wrap align-items-center tw-gap-7">
                <a
                  href="/login"
                  className="cursor-small btn btn-main-two rounded-0 tw-py-405 tw-px-12 d-inline-flex align-items-center tw-gap-4"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="300"
                >
                  <span>Rejoindre le réseau G4D</span>
                  <FeatherIcon name="arrow-right" />
                </a>
                <a
                  href="mailto:Contact@g4d.ma"
                  className="cursor-small fw-bold text-main-600 d-inline-flex align-items-center tw-gap-3 hover--translate-x-05 tw-transition-all"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay="400"
                >
                  <FeatherIcon name="mail" />
                  Contact@g4d.ma
                </a>
              </div>
            </div>

            <div
              className="col-lg-7"
              data-aos="zoom-in"
              data-aos-duration="1000"
              data-aos-delay="200"
            >
              <div className="position-relative">
                {!mapReady && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#eaf2f7',
                      zIndex: 5,
                      borderRadius: '16px',
                    }}
                  >
                    <div className="spinner-border text-main-600" role="status">
                      <span className="visually-hidden">
                        Chargement de la carte…
                      </span>
                    </div>
                  </div>
                )}
                <div
                  id="g4d-coverage-map"
                  className="common-shadow-two"
                  style={{
                    height: '460px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    zIndex: 1,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           CTA — Call To Action Final
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="d-xl-flex">
        <div className="w-100 xl-w-50 position-relative">
          <div className="d-flex h-100">
            <div className="position-relative d-sm-block d-none w-50 flex-shrink-0">
              <img
                src="/assets/landing/images/thumbs/footer-2.png"
                alt="Livreur G4D"
                loading="lazy"
                className="w-100 h-100 object-fit-cover d-block"
              />
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(to right,transparent 35%,var(--g4d-blue-deeper) 100%)',
                }}
              ></div>
            </div>
            <div className="text-center animation-item bg-main-two-600 tw-py-12 tw-px-6 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
              <span className="cursor-big tw-mb-6">
                <img
                  src="/assets/landing/images/icons/conact-us-icon1.svg"
                  alt=""
                />
              </span>
              <h2 className="splitTextStyleOne text-white tw-mb-8 cursor-big">
                Prêt à démarrer ?
              </h2>
              <p className="text-white opacity-75 cursor-small tw-mb-8">
                Inscription gratuite. Sans engagement. Support inclus.
              </p>
              <a
                href="/login"
                className="cursor-small btn btn-main rounded-0 tw-py-405 tw-px-10"
              >
                Créer mon compte gratuitement
              </a>
            </div>
          </div>
        </div>
        <div className="w-100 xl-w-50 position-relative">
          <div className="d-sm-flex h-100">
            <div className="position-relative flex-grow-1">
              <img
                src="/assets/landing/images/thumbs/footer-1.png"
                alt="Équipe G4D"
                loading="lazy"
                className="w-100 h-100 object-fit-cover"
              />
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(to right,transparent 35%,var(--g4d-blue) 100%)',
                }}
              ></div>
            </div>
            <div
              className="text-center animation-item bg-main-600 tw-py-12 tw-px-6 flex-shrink-0 d-flex flex-column justify-content-center align-items-center"
              style={{ minWidth: '240px' }}
            >
              <span className="cursor-big tw-mb-6">
                <img
                  src="/assets/landing/images/icons/conact-us-icon2.svg"
                  alt=""
                />
              </span>
              <h2 className="splitTextStyleOne text-white tw-mb-8 cursor-big">
                Contacter notre équipe
              </h2>
              <a
                href="mailto:Contact@g4d.ma"
                className="cursor-small fw-bold text-white d-inline-flex align-items-center tw-gap-5 hover-text-main-two-600"
              >
                Contact@g4d.ma
                <img
                  src="/assets/landing/images/icons/arrow-right.svg"
                  alt=""
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           FOOTER G4D
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="footer bg-main-two-600 position-relative z-1 mt-auto pt-140">
        <div className="container">
          {/* Footer Header */}
          <div className="d-flex flex-wrap justify-content-between tw-gap-10 border-bottom border-neutral-1100 tw-pb-13">
            <h3
              className="text-white max-w-548-px cursor-big"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="200"
            >
              Livraison nationale <span className="text-main-600">fiable</span>,
              tracée &amp; validée terrain
            </h3>
            <div
              className="d-flex align-items-center tw-gap-40-px tw-p-2 max-w-520-px bg-white-01 rounded-pill"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="400"
            >
              <span className="tw-w-85-px tw-h-85-px bg-white rounded-circle d-flex justify-content-center align-items-center cursor-big flex-shrink-0">
                <img
                  src="/assets/landing/images/icons/message-icon.svg"
                  alt=""
                />
              </span>
              <h6 className="text-white tw-pe-10 fw-medium cursor-small">
                Nous contacter sur{' '}
                <a
                  href="mailto:Contact@g4d.ma"
                  className="text-main-600 text-decoration-underline cursor-big"
                >
                  Contact@g4d.ma
                </a>
              </h6>
            </div>
          </div>

          {/* Footer Body */}
          <div className="tw-pt-84-px tw-pb-84-px">
            <div className="row gy-5">
              {/* Brand */}
              <div
                className="col-xl-4 pe-xxl-5"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay="100"
              >
                <div className="tw-mb-8">
                  <img
                    src={G4D_LOGO_PATH}
                    alt="G4D — Group For Delivery"
                    className="g4d-logo g4d-logo-white"
                  />
                </div>
                <p className="text-neutral-500 fw-semibold cursor-small tw-mb-6">
                  Solution de livraison de colis en ligne au maroc
                </p>
                <ul className="d-flex align-items-center tw-gap-4">
                  <li>
                    <a
                      href="#pourquoi"
                      className="tw-w-11 tw-h-11 border border-neutral-1100 rounded-circle text-neutral-500 tw-text-xl d-flex justify-content-center align-items-center hover-bg-main-600 hover-text-white hover-border-main-600 tw-duration-200"
                    >
                      <FeatherIcon name="facebook" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pourquoi"
                      className="tw-w-11 tw-h-11 border border-neutral-1100 rounded-circle text-neutral-500 tw-text-xl d-flex justify-content-center align-items-center hover-bg-main-600 hover-text-white hover-border-main-600 tw-duration-200"
                    >
                      <FeatherIcon name="instagram" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pourquoi"
                      className="tw-w-11 tw-h-11 border border-neutral-1100 rounded-circle text-neutral-500 tw-text-xl d-flex justify-content-center align-items-center hover-bg-main-600 hover-text-white hover-border-main-600 tw-duration-200"
                    >
                      <FeatherIcon name="twitter" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pourquoi"
                      className="tw-w-11 tw-h-11 border border-neutral-1100 rounded-circle text-neutral-500 tw-text-xl d-flex justify-content-center align-items-center hover-bg-main-600 hover-text-white hover-border-main-600 tw-duration-200"
                    >
                      <FeatherIcon name="message-circle" />
                    </a>
                  </li>
                </ul>
              </div>

              {/* Plateforme */}
              <div
                className="col-xl-2 col-md-4"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay="200"
              >
                <h5 className="text-white tw-mb-6 cursor-big splitTextStyleTwo">
                  Plateforme
                </h5>
                <ul className="d-flex flex-column tw-gap-4">
                  <li>
                    <a
                      href="#pourquoi"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Pourquoi G4D
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Services
                    </a>
                  </li>
                  <li>
                    <a
                      href="#apercu"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Aperçu plateforme
                    </a>
                  </li>
                  <li>
                    <a
                      href="#tarification"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Tarification
                    </a>
                  </li>
                  <li>
                    <a
                      href="#suivi"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Suivi colis
                    </a>
                  </li>
                  <li>
                    <a
                      href="#couverture"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Couverture
                    </a>
                  </li>
                </ul>
              </div>

              {/* Accès Rapide */}
              <div
                className="col-xl-2 col-md-4"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay="300"
              >
                <h5 className="text-white tw-mb-6 cursor-big splitTextStyleTwo">
                  Accès Rapide
                </h5>
                <ul className="d-flex flex-column tw-gap-4">
                  <li>
                    <a
                      href="/login"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Espace client
                    </a>
                  </li>
                  <li>
                    <a
                      href="/login"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      S&apos;inscrire
                    </a>
                  </li>
                  <li>
                    <a
                      href="/login"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Compte client
                    </a>
                  </li>
                  <li>
                    <a
                      href="/login"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Devenir livreur
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div
                className="col-xl-3 col-md-4"
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay="400"
              >
                <h5 className="text-white tw-mb-6 cursor-big">Contact</h5>
                <div className="d-flex flex-column tw-gap-4">
                  <div className="d-flex align-items-center tw-gap-3 cursor-small">
                    <span className="text-main-600 d-flex tw-text-lg">
                      <FeatherIcon name="mail" />
                    </span>
                    <a
                      href="mailto:Contact@g4d.ma"
                      className="cursor-small hover--translate-x-2 position-relative text-neutral-500 hover-text-main-600 fw-semibold"
                    >
                      Contact@g4d.ma
                    </a>
                  </div>
                  <div className="d-flex align-items-center tw-gap-3 cursor-small">
                    <span className="text-main-600 d-flex tw-text-lg">
                      <FeatherIcon name="map-pin" />
                    </span>
                    <span className="text-neutral-500 fw-semibold">
                      Avenue moulay, rachid hay linbiat, Salé
                    </span>
                  </div>
                  <div className="d-flex align-items-center tw-gap-3 cursor-small">
                    <span className="text-main-600 d-flex tw-text-lg">
                      <FeatherIcon name="clock" />
                    </span>
                    <span className="text-neutral-500 fw-semibold">
                      Lundi - samedi 9h - 21h
                      <br />
                      Dimanche Fermé
                    </span>
                  </div>
                </div>
                <a
                  href="/login"
                  className="cursor-small hover--translate-x-2 tw-mt-6 d-block fw-semibold text-main-600 tw-text-2xl hover-text-main-600"
                >
                  Démarrer gratuitement →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="container">
          <div className="border-top border-dashed border-neutral-1100 tw-py-8">
            <div className="d-flex align-items-center justify-content-between tw-gap-6 flex-wrap">
              <div>
                <img
                  src={G4D_LOGO_PATH}
                  alt="G4D — Group For Delivery"
                  className="g4d-logo-sm g4d-logo-white"
                />
              </div>
              <p className="text-neutral-500 fw-normal cursor-small">
                &copy; 2026 G4D — Group For Delivery. Tous droits réservés.
              </p>
              <div className="d-flex align-items-center tw-gap-6">
                <span className="fw-semibold text-neutral-500 cursor-small">
                  Propulsé par Next.js 16 · NestJS 11 · Fastify 5
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

