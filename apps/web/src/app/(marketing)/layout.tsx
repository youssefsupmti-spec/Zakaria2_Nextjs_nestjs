import type { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/fonts/filament/filament/inter/index.css" />
      <link rel="stylesheet" href="/fonts/wx/index.css" />
      <link rel="stylesheet" href="/assets/landing/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/assets/landing/css/swiper-bundle.min.css" />
      <link rel="stylesheet" href="/assets/landing/css/aos.css" />
      <link rel="stylesheet" href="/assets/landing/css/main.css" />
      <link rel="stylesheet" href="/assets/landing/css/font-awesome.min.css" />
      <link
        rel="stylesheet"
        href="/assets/landing/css/landing.css?v=20261112-5"
      />
      <link
        rel="stylesheet"
        href="/assets/landing/css/landing.css?v=20261112-6"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --wx-police: 'Inter', sans-serif;
              --body-font: var(--wx-police);
              --heading-font: var(--wx-police);
              --g4d-banner-h: 820px;
            }
            .g4d-logo {
              height: 68px;
              width: auto;
              object-fit: contain;
            }
            .g4d-logo-sm {
              height: 38px;
              width: auto;
              object-fit: contain;
            }
            @media (min-width: 992px) {
              .banner {
                height: var(--g4d-banner-h, 820px) !important;
                min-height: 520px !important;
                max-height: none !important;
              }
              .banner-slider,
              .banner-slider .swiper-wrapper,
              .banner-slider .swiper-slide {
                height: var(--g4d-banner-h, 820px) !important;
                min-height: 520px !important;
              }
              .banner-item {
                height: var(--g4d-banner-h, 820px) !important;
                min-height: 520px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                padding-top: clamp(28px, 4.5vh, 72px) !important;
                padding-bottom: clamp(72px, 9.5vh, 104px) !important;
              }
              .banner-item > .tw-container-1540-px {
                width: 100% !important;
                margin-top: auto !important;
                margin-bottom: auto !important;
              }
              .banner-item .splitTextStyleTwo.tw-mb-5 {
                display: inline-block !important;
                margin-bottom: clamp(0.5rem, 1.2vh, 1rem) !important;
              }
              .banner-item h1.tw-text-80-px {
                font-size: clamp(2.4rem, min(4vw, 6vh), 4.25rem) !important;
                line-height: 1.12 !important;
              }
              .banner-item p.tw-mt-6.tw-mb-10 {
                margin-top: clamp(0.75rem, 1.6vh, 1.25rem) !important;
                margin-bottom: clamp(1rem, 2.2vh, 1.75rem) !important;
                font-size: clamp(0.95rem, 1.8vh, 1.125rem) !important;
              }
              .banner-item .bg-blur-one {
                margin-top: clamp(0.5rem, 1.2vh, 1.25rem) !important;
                padding-top: clamp(0.9rem, 2vh, 1.75rem) !important;
                padding-bottom: clamp(0.9rem, 2vh, 1.75rem) !important;
              }
              .banner-pagination.swiper-pagination .swiper-pagination-bullet {
                padding-top: clamp(14px, 2vh, 22px) !important;
                padding-bottom: clamp(14px, 2vh, 22px) !important;
              }
            }
            @media (min-width: 992px) {
              .banner {
                height: var(--g4d-banner-h, calc(100dvh - 124px)) !important;
                min-height: 520px !important;
                max-height: none !important;
              }
              .banner-slider,
              .banner-slider .swiper-wrapper,
              .banner-slider .swiper-slide {
                height: var(--g4d-banner-h, calc(100dvh - 124px)) !important;
                min-height: 520px !important;
              }
              .banner-item {
                height: var(--g4d-banner-h, calc(100dvh - 124px)) !important;
                min-height: 520px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                padding-top: clamp(28px, 4.5vh, 72px) !important;
                padding-bottom: clamp(72px, 9.5vh, 104px) !important;
              }
              .banner-item > .tw-container-1540-px {
                width: 100% !important;
                margin-top: auto !important;
                margin-bottom: auto !important;
              }
              .banner-item .splitTextStyleTwo.tw-mb-5 {
                display: inline-block !important;
                margin-bottom: clamp(0.5rem, 1.2vh, 1rem) !important;
              }
              .banner-item h1.tw-text-80-px {
                font-size: clamp(2.4rem, min(4vw, 6vh), 4.25rem) !important;
                line-height: 1.12 !important;
              }
              .banner-item p.tw-mt-6.tw-mb-10 {
                margin-top: clamp(0.75rem, 1.6vh, 1.25rem) !important;
                margin-bottom: clamp(1rem, 2.2vh, 1.75rem) !important;
                font-size: clamp(0.95rem, 1.8vh, 1.125rem) !important;
              }
              .banner-item .bg-blur-one {
                margin-top: clamp(0.5rem, 1.2vh, 1.25rem) !important;
                padding-top: clamp(0.9rem, 2vh, 1.75rem) !important;
                padding-bottom: clamp(0.9rem, 2vh, 1.75rem) !important;
              }
              .banner-pagination.swiper-pagination .swiper-pagination-bullet {
                padding-top: clamp(14px, 2vh, 22px) !important;
                padding-bottom: clamp(14px, 2vh, 22px) !important;
              }
            }
          `,
        }}
      />
      {children}
    </>
  );
}
