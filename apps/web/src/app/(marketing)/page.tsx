'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { ServicesSection } from '@/components/landing/services-section';
import { PricingCalculator } from '@/components/landing/pricing-calculator';
import { Footer } from '@/components/landing/footer';
import { bootLandingInteractions } from '@/components/landing/landing-interactions';

export default function LandingPage() {
  const [preloaderHidden, setPreloaderHidden] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [authUser, setAuthUser] = useState<{ nomComplet?: string; email?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (!cancelled) {
          if (res.ok) {
            const data = (await res.json().catch(() => null)) as {
              user?: { nomComplet?: string; email?: string };
            } | null;
            setAuthUser(data?.user ?? {});
          } else {
            setAuthUser(null);
          }
        }
      } catch {
        // Ignorer si l'API n'est pas joignable
      }
    };

    void checkAuth();

    const onPageShow = () => {
      void checkAuth();
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    let unmounted = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const checkCssReady = (): boolean => {
      const bannerEl = document.querySelector('.banner');
      if (!bannerEl) return false;
      const style = window.getComputedStyle(bannerEl);
      return style.position === 'relative' && style.overflow === 'hidden';
    };

    if (checkCssReady()) {
      setPreloaderHidden(true);
    } else {
      pollTimer = setInterval(() => {
        if (unmounted) return;
        if (checkCssReady()) {
          setPreloaderHidden(true);
          if (pollTimer) clearInterval(pollTimer);
        }
      }, 25);
    }

    const maxFallbackTimer = setTimeout(() => {
      if (!unmounted) {
        setPreloaderHidden(true);
        if (pollTimer) clearInterval(pollTimer);
      }
    }, 600);

    bootLandingInteractions(() => {
      if (!unmounted) {
        setMapReady(true);
      }
    }).then((cleanup) => {
      if (unmounted) {
        cleanup();
      } else {
        cleanupFn = cleanup;
      }
    });

    return () => {
      unmounted = true;
      if (pollTimer) clearInterval(pollTimer);
      clearTimeout(maxFallbackTimer);
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, []);

  const isAuthenticated = authUser !== null;

  return (
    <div>
      <Navbar preloaderHidden={preloaderHidden} authUser={authUser} />
      <HeroSection isAuthenticated={isAuthenticated} />
      <ServicesSection isAuthenticated={isAuthenticated} />

      {/* ══════════════════════════════════════════════════════════════════════
           TARIFICATION — PricingCalculator
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-140 bg-img position-relative overflow-hidden"
        id="tarification"
        data-background-image="/assets/landing/images/shapes/thrree-sections-bg.png"
        style={{
          backgroundImage: 'url(/assets/landing/images/shapes/thrree-sections-bg.png)',
        }}
      >
        <div className="container">
          <div
            className="max-w-632-px mx-auto text-center tw-mb-15"
            data-aos="fade-up"
            data-aos-duration="1000"
          >
            <span className="splitTextStyleTwo cursor-small tw-text-xl fw-bold fst-italic text-decoration-underline text-main-600 tw-mb-305">
              Transparence totale
            </span>
            <h1 className="splitTextStyleOne cursor-big tw-mb-8">Consultez votre tarif en ligne</h1>
            <p className="text-neutral-1000 cursor-small">
              Recherchez votre ville de destination. Votre tarif s&apos;affiche instantanément, sans
              appel commercial.
            </p>
          </div>

          <div className="bg-white border border-neutral-100 tw-rounded-2xl common-shadow-two p-4 p-lg-5">
            <PricingCalculator />
          </div>
        </div>
      </section>

      <Footer mapReady={mapReady} isAuthenticated={isAuthenticated} />
    </div>
  );
}
