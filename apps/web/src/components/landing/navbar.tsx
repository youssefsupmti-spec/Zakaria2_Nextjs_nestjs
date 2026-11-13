'use client';

import React from 'react';
import Link from 'next/link';
import { FeatherIcon } from './feather-icon';
import { G4D_LOGO_PATH } from '@/lib/brand';

export function Navbar({ preloaderHidden }: { preloaderHidden: boolean }) {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
           PRELOADER G4D (layouts/landing/preloader.blade.php)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        id="g4d-preloader"
        className={preloaderHidden ? 'g4d-preloader--hidden' : ''}
        aria-label="Chargement G4D"
        role="status"
        style={{
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          pointerEvents: 'none',
        }}
      >
        <div className="g4d-preloader__glow" aria-hidden="true"></div>

        <div className="g4d-preloader__content">
          <div className="g4d-preloader__logo-wrap">
            <div className="g4d-preloader__lines" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <img
              src={G4D_LOGO_PATH}
              alt="G4D — Group For Delivery"
              className="g4d-preloader__logo"
            />
          </div>

          <div className="g4d-preloader__bar-wrap" aria-hidden="true">
            <div className="g4d-preloader__bar"></div>
          </div>

          <p className="g4d-preloader__tagline">Le Meilleur Dans Le Domaine</p>
        </div>
      </div>

      {/* Overlays */}
      <div className="overlay"></div>
      <div className="side-overlay"></div>

      {/* ── Scroll To Top ──────────────────────────────────────────────────── */}
      <div className="progress-wrap cursor-big">
        <svg
          className="progress-circle svg-content"
          width="100%"
          height="100%"
          viewBox="-1 -1 102 102"
        >
          <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98" />
        </svg>
      </div>

      {/* ── Custom Cursor ──────────────────────────────────────────────────── */}
      <div className="cursor"></div>
      <span className="dot"></span>

      {/* ══════════════════════════════════════════════════════════════════════
           OFFCANVAS SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="offcanvas-sidebar tw-p-8 bg-white position-fixed top-0 end-0 tw-max-h-screen tw-z-999 max-w-400-px w-100 tw-translate-x-full overflow-y-auto">
        <button
          type="button"
          className="cursor-small offcanvas-sidebar__close border border-main-600 tw-w-10 tw-h-10 text-main-600 rounded-circle d-flex justify-content-center align-items-center tw-text-xl hover-bg-main-600 hover-text-white position-absolute tw-mt-8 top-0 tw-end-0 tw-me-8 z-1"
        >
          <FeatherIcon name="x" />
        </button>
        <div className="d-flex flex-column tw-gap-8">
          <div>
            <Link href="/" className="cursor-big">
              <img src={G4D_LOGO_PATH} alt="G4D — Group For Delivery" className="g4d-logo" />
            </Link>
          </div>
          <div>
            <h4 className="cursor-big tw-mb-5">À propos de G4D</h4>
            <p className="cursor-small text-neutral-950">
              Solution de livraison de colis en ligne au maroc
            </p>
          </div>
          <div>
            <h4 className="cursor-big tw-mb-5">Contact</h4>
            <div className="d-flex flex-column tw-gap-6">
              <div className="cursor-small d-flex align-items-center tw-gap-5">
                <span className="tw-w-10 tw-h-10 flex-shrink-0 bg-main-600 rounded-circle text-white tw-text-xl d-flex justify-content-center align-items-center">
                  <FeatherIcon name="mail" />
                </span>
                <a
                  href="mailto:Contact@g4d.ma"
                  className="text-main-two-600 hover-text-main-600 fw-medium"
                >
                  Contact@g4d.ma
                </a>
              </div>
              <div className="cursor-small d-flex align-items-center tw-gap-5">
                <span className="tw-w-10 tw-h-10 flex-shrink-0 bg-main-600 rounded-circle text-white tw-text-xl d-flex justify-content-center align-items-center">
                  <FeatherIcon name="telephone" />
                </span>
                <a href="tel:+212623344607" className="text-main-two-600 fw-medium">
                  (+212)6 23 34 46 07
                </a>
              </div>
              <div className="cursor-small d-flex align-items-center tw-gap-5">
                <span className="tw-w-10 tw-h-10 flex-shrink-0 bg-main-600 rounded-circle text-white tw-text-xl d-flex justify-content-center align-items-center">
                  <FeatherIcon name="map-pin" />
                </span>
                <span className="text-main-two-600 fw-medium">
                  Avenue moulay, rachid hay linbiat, Salé
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           MOBILE MENU
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="mobile-menu d-lg-none d-block scroll-sm position-fixed bg-white tw-w-300-px tw-h-screen overflow-y-auto tw-p-6 tw-z-999 tw--translate-x-full tw-pb-68">
        <button
          type="button"
          className="close-button position-absolute tw-end-0 top-0 tw-me-2 tw-mt-2 tw-w-605 tw-h-605 rounded-circle d-flex justify-content-center align-items-center text-main-two-600 bg-neutral-200 hover-bg-main-two-600 hover-text-white"
        >
          <FeatherIcon name="x" />
        </button>
        <div className="mobile-menu__inner">
          <Link href="/" className="mobile-menu__logo d-block tw-mb-8">
            <img src={G4D_LOGO_PATH} alt="G4D — Group For Delivery" className="g4d-logo-sm" />
          </Link>
          <div className="mobile-menu__menu">
            <ul className="nav-menu cursor-small d-block nav-menu--mobile tw-mt-8">
              <li className="nav-menu__item">
                <a
                  href="#pourquoi"
                  className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium w-100"
                >
                  Pourquoi G4D
                </a>
              </li>
              <li className="nav-menu__item">
                <a
                  href="#services"
                  className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium w-100"
                >
                  Services
                </a>
              </li>
              <li className="nav-menu__item">
                <a
                  href="#tarification"
                  className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium w-100"
                >
                  Tarification
                </a>
              </li>
              <li className="nav-menu__item">
                <a
                  href="#suivi"
                  className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium w-100"
                >
                  Suivi colis
                </a>
              </li>
              <li className="nav-menu__item">
                <a
                  href="#apercu"
                  className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium w-100"
                >
                  Plateforme
                </a>
              </li>
              <li className="nav-menu__item">
                <a
                  href="#couverture"
                  className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium w-100"
                >
                  Couverture
                </a>
              </li>
            </ul>
            <div className="d-flex flex-column tw-gap-4 tw-mt-8">
              <a href="/login" className="btn btn-main-two rounded-0 tw-py-4 text-center">
                Se connecter
              </a>
              <a href="/login" className="btn btn-main rounded-0 tw-py-4 text-center">
                Devenir client
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           HEADER TOP BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-50 position-relative z-1 d-sm-block d-none header-top-bg">
        <div className="container tw-container-1554-px">
          <div className="d-flex align-items-center justify-content-between tw-gap-6">
            <div className="d-flex align-items-center tw-gap-6">
              <div className="cursor-small d-flex align-items-center tw-gap-2 tw-py-205">
                <span className="text-main-600 d-flex">
                  <FeatherIcon name="map-pin" />
                </span>
                <span className="text-black xl-tw-text-sm tw-text-xs fw-medium">
                  Avenue moulay, rachid hay linbiat, Salé
                </span>
              </div>
              <div className="cursor-small d-flex align-items-center tw-gap-2 tw-py-205">
                <span className="text-main-600 d-flex">
                  <FeatherIcon name="mail" />
                </span>
                <a
                  href="mailto:Contact@g4d.ma"
                  className="text-black xl-tw-text-sm tw-text-xs fw-medium hover--translate-x-05 hover-text-main-600 tw-transition-all"
                >
                  Contact@g4d.ma
                </a>
              </div>
              <div className="cursor-small d-flex align-items-center tw-gap-2 tw-py-205">
                <span className="text-main-600 d-flex">
                  <FeatherIcon name="telephone" />
                </span>
                <a
                  href="tel:+212623344607"
                  className="text-black xl-tw-text-sm tw-text-xs fw-medium hover--translate-x-05 hover-text-main-600 tw-transition-all"
                >
                  (+212)6 23 34 46 07
                </a>
              </div>
            </div>
            <div className="d-md-flex d-none align-items-center tw-gap-6">
              <div className="cursor-small d-flex align-items-center tw-gap-2 tw-py-205">
                <span className="text-main-600 d-flex">
                  <FeatherIcon name="truck" />
                </span>
                <span className="text-black xl-tw-text-sm tw-text-xs fw-medium">
                  472+ villes couvertes
                </span>
              </div>
              <div className="cursor-small d-lg-flex d-none align-items-center tw-py-205 tw-gap-6 tw-ps-10 clip-path position-relative">
                <span className="text-white d-flex">
                  <FeatherIcon name="star" />
                </span>
                <span className="text-white xl-tw-text-sm tw-text-xs fw-medium">
                  98% de satisfaction client
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           HEADER — Navigation principale G4D
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="header bg-white transition-all">
        <div className="tw-container-1742-px tw-ps-4 pe-lg-0 pe-3 tw-ms-auto">
          <nav className="header-inner bg-white d-flex justify-content-between">
            <div className="d-flex align-items-center">
              {/* Logo Desktop */}
              <div className="logo-mask-bg cursor-big position-relative d-lg-flex d-none z-1 tw-w-156-px d-flex justify-content-center align-items-center">
                <Link href="/" className="tw-mt-7">
                  <img src={G4D_LOGO_PATH} alt="G4D — Group For Delivery" className="g4d-logo" />
                </Link>
              </div>
              {/* Logo Mobile */}
              <div className="position-relative d-lg-none d-inline-block z-1">
                <Link href="/" className="cursor-big">
                  <img src={G4D_LOGO_PATH} alt="G4D — Group For Delivery" className="g4d-logo-sm" />
                </Link>
              </div>

              {/* Desktop Nav */}
              <div className="header-menu d-lg-block d-none ps-108-px">
                <ul className="nav-menu cursor-small d-lg-flex align-items-center xl-tw-gap-12 tw-gap-6">
                  <li className="nav-menu__item">
                    <a
                      href="#pourquoi"
                      className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium"
                    >
                      Pourquoi G4D
                    </a>
                  </li>
                  <li className="nav-menu__item">
                    <a
                      href="#services"
                      className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium"
                    >
                      Services
                    </a>
                  </li>
                  <li className="nav-menu__item">
                    <a
                      href="#tarification"
                      className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium"
                    >
                      Tarification
                    </a>
                  </li>
                  <li className="nav-menu__item">
                    <a
                      href="#suivi"
                      className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium"
                    >
                      Suivi colis
                    </a>
                  </li>
                  <li className="nav-menu__item">
                    <a
                      href="#apercu"
                      className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium"
                    >
                      Plateforme
                    </a>
                  </li>
                  <li className="nav-menu__item">
                    <a
                      href="#couverture"
                      className="nav-menu__link hover--translate-y-1 text-main-two-600 tw-py-9 fw-medium"
                    >
                      Couverture
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Header Right: CTA + Social */}
            <div className="header-four-right d-flex gap-xxl-5 gap-3">
              <div className="d-flex align-items-center xl-tw-gap-7 tw-gap-6 flex-shrink-0">
                <span className="line h-100 d-lg-block d-none"></span>
                <button
                  type="button"
                  className="offcanvas-bar-icon cursor-small hover--translate-y-1 active--translate-y-05 tw-duration-150 d-lg-block d-none"
                >
                  <img src="/assets/landing/images/icons/bars.svg" alt="" />
                </button>
              </div>

              {/* CTA Buttons Desktop */}
              <div className="d-lg-flex d-none align-items-center tw-gap-4 tw-px-6">
                <a
                  href="/login"
                  className="cursor-small fw-semibold text-main-two-600 hover-text-main-600 tw-duration-200"
                >
                  Se connecter
                </a>
                <a
                  href="/login"
                  className="cursor-small btn btn-main-two rounded-0 tw-py-305 tw-px-8"
                >
                  Devenir client
                </a>
              </div>

              {/* Social Icons Desktop */}
              <ul className="d-lg-grid d-none grid-cols-2 bg-main-two-600 h-100 tw-w-200-px header-four-social">
                <li className="border-bottom border-neutral-1100 border-end">
                  <a
                    href="#pourquoi"
                    className="hover-scale-20 cursor-small text-white tw-text-base w-100 h-100 d-flex justify-content-center align-items-center"
                  >
                    <FeatherIcon name="facebook" />
                  </a>
                </li>
                <li className="border-bottom border-neutral-1100">
                  <a
                    href="#pourquoi"
                    className="hover-scale-20 cursor-small text-white tw-text-base w-100 h-100 d-flex justify-content-center align-items-center"
                  >
                    <FeatherIcon name="instagram" />
                  </a>
                </li>
                <li className="border-end border-neutral-1100">
                  <a
                    href="#pourquoi"
                    className="hover-scale-20 cursor-small text-white tw-text-base w-100 h-100 d-flex justify-content-center align-items-center"
                  >
                    <FeatherIcon name="twitter" />
                  </a>
                </li>
                <li>
                  <a
                    href="#pourquoi"
                    className="hover-scale-20 cursor-small text-white tw-text-base w-100 h-100 d-flex justify-content-center align-items-center"
                  >
                    <FeatherIcon name="message-circle" />
                  </a>
                </li>
              </ul>

              {/* Mobile menu toggle */}
              <button
                type="button"
                className="toggle-mobileMenu leading-none d-lg-none text-main-two-600 tw-text-9"
              >
                <FeatherIcon name="menu" />
              </button>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
