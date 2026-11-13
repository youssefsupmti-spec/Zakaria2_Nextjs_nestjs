'use client';

const HUBS = [
  { city: 'Casablanca', lat: 33.5731, lng: -7.5898, primary: true },
  { city: 'Rabat', lat: 34.0209, lng: -6.8416, primary: true },
  { city: 'Tanger', lat: 35.7595, lng: -5.834, primary: true },
  { city: 'Marrakech', lat: 31.6295, lng: -7.9811, primary: true },
  { city: 'Fès', lat: 34.0181, lng: -5.0078, primary: true },
  { city: 'Agadir', lat: 30.4278, lng: -9.5981, primary: true },
  { city: 'Meknès', lat: 33.8935, lng: -5.5473, primary: false },
  { city: 'Oujda', lat: 34.6814, lng: -1.9086, primary: false },
  { city: 'Tétouan', lat: 35.5785, lng: -5.3684, primary: false },
  { city: 'Kénitra', lat: 34.261, lng: -6.5802, primary: false },
  { city: 'El Jadida', lat: 33.2316, lng: -8.5007, primary: false },
  { city: 'Nador', lat: 35.1681, lng: -2.9335, primary: false },
  { city: 'Safi', lat: 32.2994, lng: -9.2372, primary: false },
  { city: 'Béni Mellal', lat: 32.3373, lng: -6.3498, primary: false },
  { city: 'Laâyoune', lat: 27.1253, lng: -13.1625, primary: false },
  { city: 'Khouribga', lat: 32.8811, lng: -6.9063, primary: false },
  { city: 'Settat', lat: 33.001, lng: -7.6166, primary: false },
  { city: 'Ouarzazate', lat: 30.9335, lng: -6.937, primary: false },
  { city: 'Taza', lat: 34.21, lng: -4.01, primary: false },
  { city: 'Dakhla', lat: 23.6848, lng: -15.957, primary: false },
];

interface SwiperInstance {
  realIndex: number;
  autoplay?: { stop: () => void; start: () => void };
  slideToLoop: (index: number) => void;
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
}

type SwiperConstructor = new (selector: string, options: Record<string, unknown>) => SwiperInstance;

interface SwiperHostElement extends Element {
  swiper?: SwiperInstance;
}

interface GsapTimeline {
  from: (target: unknown, vars: Record<string, unknown>) => GsapTimeline;
  fromTo: (
    target: unknown,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ) => GsapTimeline;
}

interface GsapInstance {
  registerPlugin: (...plugins: unknown[]) => void;
  config: (vars: Record<string, unknown>) => void;
  to: (target: unknown, vars: Record<string, unknown>) => void;
  killTweensOf: (target: unknown) => void;
  quickSetter: (target: unknown, property: string) => (value: number) => void;
  timeline: (vars?: Record<string, unknown>) => GsapTimeline;
  utils: {
    clamp: (min: number, max: number, value: number) => number;
    mapRange: (
      inMin: number,
      inMax: number,
      outMin: number,
      outMax: number,
      value: number,
    ) => number;
  };
}

interface SplitTextConstructor {
  new (element: Element, vars: Record<string, unknown>): { chars: unknown };
}

interface LeafletLayer {
  addTo: (map: LeafletMapInstance) => LeafletLayer;
  bindPopup: (html: string) => LeafletLayer;
}

interface LeafletMapInstance {
  invalidateSize: () => void;
  remove: () => void;
}

interface LeafletNamespace {
  map: (el: HTMLElement, options: Record<string, unknown>) => LeafletMapInstance;
  tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (coords: [number, number], options: Record<string, unknown>) => LeafletLayer;
}

interface LeafletHostElement extends HTMLElement {
  _leaflet_id?: number;
}

interface LandingWindow {
  AOS?: { init: (options: Record<string, unknown>) => void };
  Swiper?: SwiperConstructor;
  gsap?: GsapInstance;
  ScrollTrigger?: unknown;
  SplitText?: SplitTextConstructor;
  particlesJS?: (id: string, config: Record<string, unknown>) => void;
  L?: LeafletNamespace;
}

const scriptCache = new Map<string, Promise<void>>();
const styleCache = new Map<string, Promise<void>>();

function loadScriptOnce(src: string): Promise<void> {
  if (scriptCache.has(src)) {
    return scriptCache.get(src)!;
  }
  const promise = new Promise<void>((resolve) => {
    const existing = document.querySelector(`script[data-g4d-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-g4d-src', src);
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
  scriptCache.set(src, promise);
  return promise;
}

function loadStylesheetOnce(href: string, integrity?: string): Promise<void> {
  if (styleCache.has(href)) {
    return styleCache.get(href)!;
  }
  const promise = new Promise<void>((resolve) => {
    const existing = document.querySelector(`link[data-g4d-href="${href}"]`);
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (integrity) {
      link.integrity = integrity;
      link.crossOrigin = '';
    }
    link.setAttribute('data-g4d-href', href);
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  styleCache.set(href, promise);
  return promise;
}

export async function bootLandingInteractions(onMapReady: () => void): Promise<() => void> {
  const cleanups: Array<() => void> = [];
  let disposed = false;

  // Groupe 1 : Chargement parallèle ultra-rapide des moteurs critiques (Swiper + GSAP + AOS)
  await Promise.all([
    loadScriptOnce('/assets/landing/js/swiper-bundle.min.js'),
    loadScriptOnce('/assets/landing/js/gsap.min.js'),
    loadScriptOnce('/assets/landing/js/aos.js'),
  ]);

  if (disposed) return () => {};

  // Groupe 2 : Plugins GSAP (SplitText + ScrollTrigger) en parallèle
  await Promise.all([
    loadScriptOnce('/assets/landing/js/SplitText.min.js'),
    loadScriptOnce('/assets/landing/js/ScrollTrigger.min.js'),
  ]);

  if (disposed) return () => {};

  const win = window as unknown as LandingWindow;

  // ── 1. Initialisation AOS ──────────────────────────────────────────────────
  if (win.AOS && typeof win.AOS.init === 'function') {
    win.AOS.init({
      duration: 800,
      once: true,
      offset: 40,
    });
  }

  // ── 2. Sticky Header & Scroll-to-Top SVG Progress ──────────────────────────
  const headerEl = document.querySelector('.header');
  const progressWrap = document.querySelector('.progress-wrap');
  const progressPath = document.querySelector('.progress-wrap path') as SVGPathElement | null;

  let pathLength = 0;
  if (progressPath) {
    try {
      pathLength = progressPath.getTotalLength();
      progressPath.style.transition = 'none';
      progressPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
      progressPath.style.strokeDashoffset = `${pathLength}`;
      progressPath.getBoundingClientRect();
      progressPath.style.transition = 'stroke-dashoffset 10ms linear';
    } catch {
      // ignore
    }
  }

  const onWindowScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (headerEl) {
      if (scrollTop >= 460) {
        headerEl.classList.add('fixed-header');
      } else {
        headerEl.classList.remove('fixed-header');
      }
    }
    if (progressWrap) {
      if (scrollTop > 50) {
        progressWrap.classList.add('active-progress');
      } else {
        progressWrap.classList.remove('active-progress');
      }
    }
    if (progressPath && pathLength > 0) {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0) {
        const progress = pathLength - (scrollTop * pathLength) / height;
        progressPath.style.strokeDashoffset = `${progress}`;
      }
    }
  };

  window.addEventListener('scroll', onWindowScroll, { passive: true });
  onWindowScroll();
  cleanups.push(() => window.removeEventListener('scroll', onWindowScroll));

  if (progressWrap) {
    const onProgressClick = (e: Event) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    progressWrap.addEventListener('click', onProgressClick);
    cleanups.push(() => progressWrap.removeEventListener('click', onProgressClick));
  }

  // ── 3. Swipers (Banner + Aperçu Plateforme + Témoignages) ──────────────────
  if (win.Swiper) {
    const Swiper = win.Swiper;

    // 3a. Hero Banner Slider
    const bannerEl = document.querySelector('.banner-slider') as SwiperHostElement | null;
    if (bannerEl && !bannerEl.swiper) {
      const bannerMenu = ['Livraison Nationale', 'Plateforme E-commerce', 'Support Client'];
      const bannerSwiper = new Swiper('.banner-slider', {
        loop: true,
        speed: 800,
        slidesPerView: 1,
        grabCursor: true,
        watchOverflow: false,
        effect: 'fade',
        autoplay: {
          delay: 4500,
          disableOnInteraction: false,
        },
        pagination: {
          el: '.banner-pagination',
          clickable: true,
          renderBullet: (index: number, className: string) =>
            `<span class="${className}">${bannerMenu[index] || ''}</span>`,
        },
      });
      const onEnter = () => bannerSwiper.autoplay?.stop();
      const onLeave = () => bannerSwiper.autoplay?.start();
      bannerEl.addEventListener('mouseenter', onEnter);
      bannerEl.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        bannerEl.removeEventListener('mouseenter', onEnter);
        bannerEl.removeEventListener('mouseleave', onLeave);
        try {
          bannerSwiper.destroy(true, true);
        } catch {
          // ignore
        }
      });
    }

    // 3b. Aperçu Plateforme Swiper
    const apercuEl = document.querySelector('.apercu-swiper') as SwiperHostElement | null;
    if (apercuEl && !apercuEl.swiper) {
      const apercuSwiper = new Swiper('.apercu-swiper', {
        loop: true,
        speed: 700,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        on: {
          slideChange: function (this: SwiperInstance) {
            const idx = this.realIndex;
            const urls = [
              'app.g4d.ma/colis',
              'app.g4d.ma/reclamations/nouveau',
              'app.g4d.ma/tracking/G4D-4821',
              'app.g4d.ma/dashboard',
            ];
            const urlEl = document.getElementById('apercu-url');
            if (urlEl) {
              urlEl.textContent = urls[idx] || urls[0];
            }
            document.querySelectorAll('.g4d-apercu-tab').forEach((tab, i) => {
              tab.classList.toggle('active', i === idx);
            });
          },
        },
      });

      const tabButtons = Array.from(document.querySelectorAll('.g4d-apercu-tab'));
      tabButtons.forEach((tab) => {
        const onClick = () => {
          const idx = parseInt((tab as HTMLElement).dataset.slide || '0', 10);
          apercuSwiper.slideToLoop(idx);
        };
        tab.addEventListener('click', onClick);
        cleanups.push(() => tab.removeEventListener('click', onClick));
      });

      cleanups.push(() => {
        try {
          apercuSwiper.destroy(true, true);
        } catch {
          // ignore
        }
      });
    }

    // 3c. Testimonials Slider
    const testiEl = document.querySelector('.testimonials-slider') as SwiperHostElement | null;
    if (testiEl && !testiEl.swiper) {
      const testiSwiper = new Swiper('.testimonials-slider', {
        grabCursor: true,
        effect: 'creative',
        speed: 1500,
        autoplay: {
          delay: 2500,
          disableOnInteraction: false,
        },
        loop: true,
        creativeEffect: {
          prev: {
            shadow: true,
            translate: ['-20%', 0, -1],
          },
          next: {
            translate: ['100%', 0, 0],
          },
        },
      });
      const onEnter = () => testiSwiper.autoplay?.stop();
      const onLeave = () => testiSwiper.autoplay?.start();
      testiEl.addEventListener('mouseenter', onEnter);
      testiEl.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        testiEl.removeEventListener('mouseenter', onEnter);
        testiEl.removeEventListener('mouseleave', onLeave);
        try {
          testiSwiper.destroy(true, true);
        } catch {
          // ignore
        }
      });
    }
  }

  // ── 4. Hover Effects (Features Cards & How-It-Works Cards) ─────────────────
  const featureItems = Array.from(document.querySelectorAll('.features-item'));
  featureItems.forEach((item) => {
    const onEnter = () => {
      featureItems.forEach((el) => el.classList.remove('bg-white', 'common-shadow-two'));
      item.classList.add('bg-white', 'common-shadow-two');
    };
    item.addEventListener('mouseenter', onEnter);
    cleanups.push(() => item.removeEventListener('mouseenter', onEnter));
  });

  const transportItems = Array.from(document.querySelectorAll('.transport-way-item'));
  transportItems.forEach((item) => {
    const onEnter = () => {
      transportItems.forEach((el) => {
        el.querySelector('.transport-way-item__icon')?.classList.remove('bg-main-two-600');
        const content = el.querySelector('.transport-way-item__content');
        content?.classList.remove('border-main-two-600');
        content?.classList.add('border-neutral-50');
      });
      item.querySelector('.transport-way-item__icon')?.classList.add('bg-main-two-600');
      const activeContent = item.querySelector('.transport-way-item__content');
      activeContent?.classList.remove('border-neutral-50');
      activeContent?.classList.add('border-main-two-600');
    };
    item.addEventListener('mouseenter', onEnter);
    cleanups.push(() => item.removeEventListener('mouseenter', onEnter));
  });

  // ── 5. GSAP Animations (Custom Cursor, Offcanvas, Mobile Menu, SplitText, ScrollTrigger, Button Flair) ──
  if (win.gsap) {
    const gsap = win.gsap;
    if (win.ScrollTrigger && win.SplitText) {
      gsap.registerPlugin(win.ScrollTrigger, win.SplitText);
    }
    gsap.config({ nullTargetWarn: false });

    // 5a. Custom Cursor
    const cursor = document.querySelector('.cursor');
    const dot = document.querySelector('.dot');
    if (cursor && dot) {
      const onMouseMove = (event: MouseEvent) => {
        gsap.to(cursor, {
          x: event.clientX,
          y: event.clientY,
          duration: 2,
          delay: 0.1,
          visibility: 'visible',
          ease: 'expo.out',
          overwrite: 'auto',
        });
        gsap.to(dot, {
          x: event.clientX,
          y: event.clientY,
          duration: 1.5,
          visibility: 'visible',
          ease: 'expo.out',
          overwrite: 'auto',
        });
      };
      document.body.addEventListener('mousemove', onMouseMove, {
        passive: true,
      });
      cleanups.push(() => document.body.removeEventListener('mousemove', onMouseMove));
    }

    // 5b. Offcanvas Sidebar & Mobile Menu
    const sideOverlay = document.querySelector('.side-overlay') as HTMLElement | null;
    const offcanvasSidebar = document.querySelector('.offcanvas-sidebar') as HTMLElement | null;
    const offcanvasOpenBtn = document.querySelector('.offcanvas-bar-icon');
    const offcanvasCloseBtn = document.querySelector('.offcanvas-sidebar__close');

    const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement | null;
    const mobileOpenBtn = document.querySelector('.toggle-mobileMenu');
    const mobileCloseBtn = document.querySelector('.close-button');

    const openOffcanvas = () => {
      if (!sideOverlay || !offcanvasSidebar) return;
      document.body.style.overflow = 'hidden';
      gsap.to(sideOverlay, { duration: 0.3, visibility: 'visible', opacity: 1 });
      gsap.to(offcanvasSidebar, { x: 0, duration: 0.3, delay: 0.1 });
    };

    const closeAllMenus = () => {
      document.body.style.overflow = '';
      document.body.style.paddingInlineEnd = '';
      if (sideOverlay) {
        gsap.to(sideOverlay, {
          duration: 0.25,
          opacity: 0,
          onComplete: () => {
            sideOverlay.style.visibility = 'hidden';
          },
        });
      }
      if (offcanvasSidebar) {
        gsap.to(offcanvasSidebar, { x: '100%', duration: 0.25 });
      }
      if (mobileMenu) {
        gsap.to(mobileMenu, { x: '-100%', duration: 0.25 });
      }
    };

    const openMobile = () => {
      if (!sideOverlay || !mobileMenu) return;
      document.body.style.overflow = 'hidden';
      gsap.to(sideOverlay, { duration: 0.3, visibility: 'visible', opacity: 1 });
      gsap.to(mobileMenu, { x: 0, duration: 0.3 });
    };

    offcanvasOpenBtn?.addEventListener('click', openOffcanvas);
    offcanvasCloseBtn?.addEventListener('click', closeAllMenus);
    mobileOpenBtn?.addEventListener('click', openMobile);
    mobileCloseBtn?.addEventListener('click', closeAllMenus);
    sideOverlay?.addEventListener('click', closeAllMenus);

    cleanups.push(() => {
      offcanvasOpenBtn?.removeEventListener('click', openOffcanvas);
      offcanvasCloseBtn?.removeEventListener('click', closeAllMenus);
      mobileOpenBtn?.removeEventListener('click', openMobile);
      mobileCloseBtn?.removeEventListener('click', closeAllMenus);
      sideOverlay?.removeEventListener('click', closeAllMenus);
    });

    // 5c. Position-Aware Button Flair ([data-block="button"])
    const buttonElements = Array.from(document.querySelectorAll('[data-block="button"]'));
    buttonElements.forEach((buttonEl) => {
      const flair = buttonEl.querySelector('.button__flair');
      if (!flair) return;
      const xSet = gsap.quickSetter(flair, 'xPercent');
      const ySet = gsap.quickSetter(flair, 'yPercent');

      const getXY = (e: MouseEvent) => {
        const { left, top, width, height } = buttonEl.getBoundingClientRect();
        const x = gsap.utils.clamp(0, 100, gsap.utils.mapRange(0, width, 0, 100, e.clientX - left));
        const y = gsap.utils.clamp(0, 100, gsap.utils.mapRange(0, height, 0, 100, e.clientY - top));
        return { x, y };
      };

      const onEnter = (e: Event) => {
        const { x, y } = getXY(e as MouseEvent);
        xSet(x);
        ySet(y);
        gsap.to(flair, { scale: 1, duration: 0.9, ease: 'power2.out' });
      };

      const onLeave = (e: Event) => {
        const { x, y } = getXY(e as MouseEvent);
        gsap.killTweensOf(flair);
        gsap.to(flair, {
          xPercent: x > 90 ? x + 20 : x < 10 ? x - 20 : x,
          yPercent: y > 90 ? y + 20 : y < 10 ? y - 20 : y,
          scale: 0,
          duration: 0.9,
          ease: 'power2.out',
        });
      };

      const onMove = (e: Event) => {
        const { x, y } = getXY(e as MouseEvent);
        gsap.to(flair, {
          xPercent: x,
          yPercent: y,
          duration: 0.9,
          ease: 'power2',
        });
      };

      buttonEl.addEventListener('mouseenter', onEnter);
      buttonEl.addEventListener('mouseleave', onLeave);
      buttonEl.addEventListener('mousemove', onMove);

      cleanups.push(() => {
        buttonEl.removeEventListener('mouseenter', onEnter);
        buttonEl.removeEventListener('mouseleave', onLeave);
        buttonEl.removeEventListener('mousemove', onMove);
      });
    });

    // 5d. SplitText & ScrollTrigger Parallax (.splitTextStyleOne, .about-plane, .truck-head, .moon-shape)
    const SplitTextCtor = win.SplitText;
    if (SplitTextCtor && win.ScrollTrigger) {
      const splitHeadings = Array.from(
        document.querySelectorAll('.splitTextStyleOne:not([data-g4d-split])'),
      );
      splitHeadings.forEach((heading) => {
        heading.setAttribute('data-g4d-split', '1');
        try {
          const split = new SplitTextCtor(heading, {
            type: 'chars, words',
            lineThreshold: 0.5,
          });
          gsap
            .timeline({
              scrollTrigger: {
                trigger: heading,
                start: 'top 90%',
                end: 'bottom 60%',
                scrub: false,
                markers: false,
                toggleActions: 'play none none none',
              },
            })
            .from(split.chars, {
              autoAlpha: 0,
              y: 40,
              duration: 0.5,
              opacity: 0,
              stagger: 0.04,
              ease: 'back.out(1.7)',
            });
        } catch {
          // ignore
        }
      });

      if (document.querySelector('.about-plane')) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '.about-plane',
              start: 'top 80%',
              end: 'bottom 20%',
              scrub: 2,
            },
          })
          .fromTo('.about-plane', { x: -260 }, { x: 260, y: -380, rotate: -40, duration: 1.6 });
      }

      if (document.querySelector('.truck-head')) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '.truck-head',
              start: 'top 50%',
              end: 'bottom 10%',
              scrub: 2,
            },
          })
          .fromTo('.truck-head', { y: -280 }, { y: 0, duration: 1.6 });
      }

      if (document.querySelector('.moon-shape')) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '.moon-shape',
              start: 'top 50%',
              end: 'bottom 10%',
              scrub: 2,
            },
          })
          .fromTo('.moon-shape', { y: -280 }, { y: 0, duration: 1.6 });
      }
    }
  }

  // ── 6. Chargement différé intelligent (IntersectionObserver : Particles.js & Carte Leaflet) ──
  const initParticles = () => {
    loadScriptOnce('/assets/landing/js/particles.min.js').then(() => {
      if (disposed) return;
      if (typeof win.particlesJS !== 'undefined' && document.getElementById('g4d-particles-js')) {
        try {
          win.particlesJS('g4d-particles-js', {
            particles: {
              number: { value: 48, density: { enable: true, value_area: 800 } },
              color: { value: '#ffffff' },
              shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
              opacity: {
                value: 0.45,
                random: true,
                anim: {
                  enable: true,
                  speed: 0.8,
                  opacity_min: 0.1,
                  sync: false,
                },
              },
              size: {
                value: 3,
                random: true,
                anim: { enable: false, speed: 40, size_min: 0.1, sync: false },
              },
              line_linked: {
                enable: true,
                distance: 150,
                color: '#ffffff',
                opacity: 0.28,
                width: 1,
              },
              move: {
                enable: true,
                speed: 1.6,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
              },
            },
            interactivity: {
              detect_on: 'canvas',
              events: {
                onhover: { enable: true, mode: 'grab' },
                onclick: { enable: false, mode: 'push' },
                resize: true,
              },
              modes: {
                grab: { distance: 140, line_linked: { opacity: 0.75 } },
                push: { particles_nb: 2 },
              },
            },
            retina_detect: true,
          });
        } catch {
          // ignore
        }
      }
    });
  };

  const initCoverageMap = () => {
    Promise.all([
      loadStylesheetOnce(
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
      ),
      loadScriptOnce('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'),
    ]).then(() => {
      if (disposed) return;
      if (win.L) {
        const mapEl = document.getElementById('g4d-coverage-map') as LeafletHostElement | null;
        if (mapEl && !mapEl._leaflet_id) {
          const L = win.L;
          const map = L.map(mapEl, {
            center: [29.5, -8.5],
            zoom: 5,
            minZoom: 5,
            maxZoom: 11,
            scrollWheelZoom: false,
            zoomControl: true,
          });

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19,
          }).addTo(map);

          HUBS.forEach((h) => {
            const cls = h.primary ? 'g4d-map-dot g4d-map-dot--hub' : 'g4d-map-dot';
            const sz = h.primary ? 18 : 11;
            const icon = L.divIcon({
              className: '',
              html: `<div class="${cls}"></div>`,
              iconSize: [sz, sz],
              iconAnchor: [sz / 2, sz / 2],
              popupAnchor: [0, -(sz / 2 + 4)],
            });

            L.marker([h.lat, h.lng], { icon })
              .addTo(map)
              .bindPopup(
                `<div class="g4d-map-popup"><strong>${h.city}</strong><span>${
                  h.primary ? 'Hub régional G4D' : 'Ville desservie'
                }</span></div>`,
              );
          });

          onMapReady();
          setTimeout(() => map.invalidateSize(), 200);
          cleanups.push(() => {
            try {
              map.remove();
            } catch {
              // ignore
            }
          });
        } else {
          onMapReady();
        }
      }
    });
  };

  if (typeof IntersectionObserver !== 'undefined') {
    const suiviEl = document.getElementById('suivi');
    if (suiviEl) {
      const obsParticles = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            obsParticles.disconnect();
            initParticles();
          }
        },
        { rootMargin: '500px 0px' },
      );
      obsParticles.observe(suiviEl);
      cleanups.push(() => obsParticles.disconnect());
    } else {
      initParticles();
    }

    const couvertureEl = document.getElementById('couverture');
    if (couvertureEl) {
      const obsMap = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            obsMap.disconnect();
            initCoverageMap();
          }
        },
        { rootMargin: '600px 0px' },
      );
      obsMap.observe(couvertureEl);
      cleanups.push(() => obsMap.disconnect());
    } else {
      initCoverageMap();
    }
  } else {
    initParticles();
    initCoverageMap();
  }

  return () => {
    disposed = true;
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
    cleanups.forEach((fn) => fn());
  };
}
