'use client';

import React, { useEffect } from 'react';
import { FeatherIcon } from './feather-icon';

export function HeroSection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--g4d-banner-h', '820px');
  }, []);

  const authHref = isAuthenticated ? '/dashboard' : '/login';

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
           HERO — Vidéo Background Full-Screen
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="banner position-relative overflow-hidden">
        {/* Shapes */}
        <img
          src="/assets/landing/images/shapes/triangle-shape.svg"
          alt=""
          className="position-absolute bottom-0 tw-start-0 z-2 d-lg-block d-none"
        />

        <div className="banner-slider">
          <div className="swiper-wrapper">
            {/* Slide 1 : Vidéo */}
            <div className="swiper-slide">
              <video
                className="g4d-hero-video"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/assets/landing/images/thumbs/banner-img1.png"
                aria-hidden="true"
              >
                <source src="/assets/vedio/hero-vedio.mp4" type="video/mp4" />
                <img src="/assets/landing/images/thumbs/banner-img1.png" alt="G4D Livraison" />
              </video>
              <div className="g4d-hero-overlay" aria-hidden="true"></div>

              <div className="banner-item z-2 position-relative">
                <div className="tw-container-1540-px mx-auto tw-px-4">
                  <div className="position-relative">
                    <div className="container">
                      <div className="row">
                        <div className="col-lg-8">
                          <span className="splitTextStyleTwo cursor-small text-main-600 fw-bold fst-italic tw-text-lg text-decoration-underline tw-mb-5">
                            Livraison Nationale · Fiabilité Locale
                          </span>
                          <h1 className="splitTextStyleOne cursor-big text-white tw-text-80-px">
                            Livraison nationale rapide &amp; traçable
                          </h1>
                          <p className="text-white tw-text-lg tw-mt-6 tw-mb-10 opacity-75 max-w-600-px cursor-small">
                            G4D connecte vos commandes e-commerce à un réseau de livraison
                            structuré, tracé et validé terrain. Du HUP au client final, chaque étape
                            est documentée.
                          </p>
                          <div className="d-flex tw-gap-11 flex-wrap">
                            <a
                              href={authHref}
                              className="cursor-small btn btn-main-two hover-style-two button--stroke tw-py-405 d-inline-flex align-items-center justify-content-center tw-gap-5 group active--translate-y-2"
                              data-block="button"
                            >
                              <span className="button__flair"></span>
                              <span className="button__label">
                                {isAuthenticated ? 'Accéder à mon espace' : 'Démarrer gratuitement'}
                              </span>
                              <span className="tw-w-7 tw-h-7 bg-main-three-600 text-white tw-text-sm tw-rounded d-flex justify-content-center align-items-center position-relative group-hover-bg-main-600 group-hover-text-white tw-duration-500">
                                <FeatherIcon name="arrow-right" />
                              </span>
                            </a>
                            <a
                              href="#suivi"
                              className="cursor-small d-inline-flex align-items-center tw-gap-2 text-white fw-semibold hover-text-main-600 group active--translate-y-2"
                            >
                              Suivre mon colis
                              <span className="text-main-600 d-flex group-hover-text-white tw-duration-200 tw-text-base">
                                <FeatherIcon name="arrow-right-circle" />
                              </span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trust signals card */}
                    <div className="cursor-big bg-blur-one tw-rounded-lg max-w-520-px px-xxl-5 px-lg-4 px-3 py-lg-5 py-4 tw-ms-auto tw-mt-3">
                      <span className="triangle-shape tw-w-10 tw-h-10 bg-main-600 position-absolute tw-start-0 bottom-0"></span>
                      <div className="d-flex align-items-center tw-gap-6 flex-wrap">
                        <div className="d-flex align-items-center tw-gap-2 text-white cursor-small">
                          <FeatherIcon name="shield" className="text-main-600" />
                          <span>Données sécurisées</span>
                        </div>
                        <div className="d-flex align-items-center tw-gap-2 text-white cursor-small">
                          <FeatherIcon name="trending-up" className="text-main-600" />
                          <span>Suivi temps réel</span>
                        </div>
                        <div className="d-flex align-items-center tw-gap-2 text-white cursor-small">
                          <FeatherIcon name="map-pin" className="text-main-600" />
                          <span>472+ villes couvertes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2 : Plateforme e-commerce */}
            <div className="swiper-slide">
              <img
                src="/assets/landing/images/thumbs/image700.png"
                alt=""
                loading="lazy"
                className="scale-bg position-absolute top-0 tw-start-0 z-n1 w-100 h-100 object-fit-cover"
              />
              <div className="g4d-hero-overlay" aria-hidden="true"></div>
              <div className="banner-item z-2 position-relative">
                <div className="tw-container-1540-px mx-auto tw-px-4">
                  <div className="container">
                    <div className="row">
                      <div className="col-lg-8">
                        <span className="splitTextStyleTwo cursor-small text-main-600 fw-bold fst-italic tw-text-lg text-decoration-underline tw-mb-5">
                          Plateforme Logistique · E-commerce Marocain
                        </span>
                        <h1 className="splitTextStyleOne cursor-big text-white tw-text-80-px">
                          Gérez vos expéditions en toute simplicité
                        </h1>
                        <p className="text-white tw-text-lg tw-mt-6 tw-mb-10 opacity-75 max-w-600-px cursor-small">
                          Tableau de bord intuitif, suivi temps réel, retours automatisés et
                          remboursement J+1. G4D simplifie la logistique pour que vous puissiez vous
                          concentrer sur la vente.
                        </p>
                        <div className="d-flex tw-gap-11 flex-wrap">
                          <a
                            href={authHref}
                            className="cursor-small btn btn-main-two hover-style-two button--stroke tw-py-405 d-inline-flex align-items-center justify-content-center tw-gap-5 group active--translate-y-2"
                            data-block="button"
                          >
                            <span className="button__flair"></span>
                            <span className="button__label">
                              {isAuthenticated ? 'Mon Espace' : 'Créer mon compte'}
                            </span>
                            <span className="tw-w-7 tw-h-7 bg-main-three-600 text-white tw-text-sm tw-rounded d-flex justify-content-center align-items-center position-relative group-hover-bg-main-600 group-hover-text-white tw-duration-500">
                              <FeatherIcon name="check" />
                            </span>
                          </a>
                          <a
                            href="#apercu"
                            className="cursor-small d-inline-flex align-items-center tw-gap-2 text-white fw-semibold hover-text-main-600 group active--translate-y-2"
                          >
                            Voir la plateforme
                            <span className="text-main-600 d-flex group-hover-text-white tw-duration-200 tw-text-base">
                              <FeatherIcon name="arrow-right-circle" />
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 3 : Support Client */}
            <div className="swiper-slide">
              <img
                src="/assets/landing/images/thumbs/hero slide.png"
                alt=""
                loading="lazy"
                className="scale-bg position-absolute top-0 tw-start-0 z-n1 w-100 h-100 object-fit-cover"
              />
              <div className="g4d-hero-overlay" aria-hidden="true"></div>
              <div className="banner-item z-2 position-relative">
                <div className="tw-container-1540-px mx-auto tw-px-4">
                  <div className="container">
                    <div className="row">
                      <div className="col-lg-8">
                        <span className="splitTextStyleTwo cursor-small text-main-600 fw-bold fst-italic tw-text-lg text-decoration-underline tw-mb-5">
                          Support Client · Assistance Dédiée
                        </span>
                        <h1 className="splitTextStyleOne cursor-big text-white tw-text-80-px">
                          Une équipe à votre écoute, chaque jour
                        </h1>
                        <p className="text-white tw-text-lg tw-mt-6 tw-mb-10 opacity-75 max-w-600-px cursor-small">
                          Nos conseillers G4D répondent à chaque demande rapidement et efficacement.
                          Questions sur une livraison, réclamation ou partenariat — nous sommes là
                          pour vous.
                        </p>
                        <div className="d-flex tw-gap-11 flex-wrap">
                          <a
                            href="mailto:Contact@g4d.ma"
                            className="cursor-small btn btn-main-two hover-style-two button--stroke tw-py-405 d-inline-flex align-items-center justify-content-center tw-gap-5 group active--translate-y-2"
                            data-block="button"
                          >
                            <span className="button__flair"></span>
                            <span className="button__label">Nous contacter</span>
                            <span className="tw-w-7 tw-h-7 bg-main-three-600 text-white tw-text-sm tw-rounded d-flex justify-content-center align-items-center position-relative group-hover-bg-main-600 group-hover-text-white tw-duration-500">
                              <FeatherIcon name="mail" />
                            </span>
                          </a>
                          <a
                            href="#suivi"
                            className="cursor-small d-inline-flex align-items-center tw-gap-2 text-white fw-semibold hover-text-main-600 group active--translate-y-2"
                          >
                            Suivre mon colis
                            <span className="text-main-600 d-flex group-hover-text-white tw-duration-200 tw-text-base">
                              <FeatherIcon name="arrow-right-circle" />
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Swiper Pagination */}
          <div className="container w-0">
            <div className="position-relative w-0">
              <div className="pagination-style-one text-start swiper-pagination banner-pagination cursor-big"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           FEATURES STRIP — 4 avantages G4D
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="features bg-neutral-50 bg-img"
        data-background-image="/assets/landing/images/shapes/features-bg.png"
        style={{
          backgroundImage: 'url(/assets/landing/images/shapes/features-bg.png)',
        }}
        id="pourquoi"
      >
        <div className="row g-0 features-item-wrapper">
          <div
            className="col-lg-3 col-sm-6 col-xs-6"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-delay="100"
          >
            <div className="features-item animation-item p-80-px tw-duration-300 position-relative h-100">
              <span className="fw-bold tw-text-xl text-main-two-600 position-absolute top-0 tw-end-0 tw-mt-12 tw-me-12 font-heading cursor-small">
                01
              </span>
              <span className="pb-60-px cursor-big animate__wobble">
                <img
                  src="/assets/landing/images/icons/g4d-fiabilite.svg"
                  alt="Fiabilité"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                  }}
                />
              </span>
              <h5 className="tw-mb-7 cursor-big splitTextStyleTwo">Fiabilité</h5>
              <p className="text-neutral-1000 cursor-small">
                Nous nous engageons à garantir à vos clients la réception de leurs colis en parfait
                état.
              </p>
            </div>
          </div>
          <div
            className="col-lg-3 col-sm-6 col-xs-6"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-delay="200"
          >
            <div className="features-item animation-item p-80-px tw-duration-300 position-relative h-100 bg-white common-shadow-two">
              <span className="fw-bold tw-text-xl text-main-two-600 position-absolute top-0 tw-end-0 tw-mt-12 tw-me-12 font-heading cursor-small">
                02
              </span>
              <span className="pb-60-px cursor-big animate__wobble">
                <img
                  src="/assets/landing/images/icons/g4d-tracabilite.svg"
                  alt="Traçabilité"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                  }}
                />
              </span>
              <h5 className="tw-mb-7 cursor-big splitTextStyleTwo">Traçabilité</h5>
              <p className="text-neutral-1000 cursor-small">
                Suivez vos colis en temps réel sur notre plateforme.
              </p>
            </div>
          </div>
          <div
            className="col-lg-3 col-sm-6 col-xs-6"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-delay="300"
          >
            <div className="features-item animation-item p-80-px tw-duration-300 position-relative h-100">
              <span className="fw-bold tw-text-xl text-main-two-600 position-absolute top-0 tw-end-0 tw-mt-12 tw-me-12 font-heading cursor-small">
                03
              </span>
              <span className="pb-60-px cursor-big animate__wobble">
                <img
                  src="/assets/landing/images/icons/g4d-rapidite.svg"
                  alt="Rapidité"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                  }}
                />
              </span>
              <h5 className="tw-mb-7 cursor-big splitTextStyleTwo">Rapidité</h5>
              <p className="text-neutral-1000 cursor-small">
                Nous assurons les meilleurs délais de livraison et de contre-remboursement.
              </p>
            </div>
          </div>
          <div
            className="col-lg-3 col-sm-6 col-xs-6"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-delay="400"
          >
            <div className="features-item animation-item p-80-px tw-duration-300 position-relative h-100">
              <span className="fw-bold tw-text-xl text-main-two-600 position-absolute top-0 tw-end-0 tw-mt-12 tw-me-12 font-heading cursor-small">
                04
              </span>
              <span className="pb-60-px cursor-big animate__wobble">
                <img
                  src="/assets/landing/images/icons/g4d-practicite.svg"
                  alt="Praticité"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                  }}
                />
              </span>
              <h5 className="tw-mb-7 cursor-big splitTextStyleTwo">Praticité</h5>
              <p className="text-neutral-1000 cursor-small">
                Nous récupérons vos colis directement chez vous.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
