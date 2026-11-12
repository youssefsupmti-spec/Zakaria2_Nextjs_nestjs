'use client';

import { useEffect, useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { G4D_LOGO_TRIM_PATH } from '@/lib/brand';

const CURRENT_YEAR = 2026;

const CAROUSEL_SLIDES = [
  {
    title: 'Livraison Express 24h',
    text: 'Livraison garantie en 24–48h dans tout le Maroc, 7j/7.',
    variant: 'g4d-ico-blue',
    icon: (
      <svg className="g4d-card-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
        <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
        <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
      </svg>
    ),
  },
  {
    title: 'Suivi en Temps Réel',
    text: 'Localisez vos colis et livreurs en direct depuis votre dashboard.',
    variant: 'g4d-ico-blue',
    icon: (
      <svg className="g4d-card-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: 'Support Client 24h/7',
    text: 'Un gestionnaire dédié disponible à tout moment pour vous accompagner.',
    variant: 'g4d-ico-orange',
    icon: (
      <svg className="g4d-card-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: 'Gestion Complète',
    text: 'Expéditions, paiements et rapports centralisés en un seul endroit.',
    variant: 'g4d-ico-orange',
    icon: (
      <svg className="g4d-card-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="g4d-auth-root">
      <style>{`
        .g4d-auth-root, .g4d-auth-root *, .g4d-auth-root *::before, .g4d-auth-root *::after {
          box-sizing: border-box;
        }
        .g4d-auth-root {
          --g4d-blue: #1B9DD9;
          --g4d-blue-light: #3FB4E8;
          --g4d-blue-dark: #0E86C2;
          --g4d-orange: #F9A03F;
          --g4d-navy: #0F172A;
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: #fff;
          color: #111827;
          font-family: "Inter Variable", ui-sans-serif, system-ui, -apple-system, sans-serif;
          line-height: 1.5;
        }
        .g4d-auth-aside {
          position: relative;
          width: 45%;
          flex-shrink: 0;
          overflow: hidden;
          background-color: var(--g4d-navy);
          background-size: cover;
          background-position: center;
          background-image: url('/images/auth-aside-bg.webp');
        }
        .g4d-auth-aside::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          z-index: 3;
          background: linear-gradient(90deg, var(--g4d-orange) 0%, var(--g4d-blue) 100%);
        }
        .g4d-aside-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(135deg,
            rgba(15, 23, 42, 0.97) 0%,
            rgba(15, 23, 42, 0.88) 45%,
            rgba(27, 157, 217, 0.32) 100%
          );
        }
        .g4d-aside-content {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3rem 2.5rem 4.5rem;
        }
        .g4d-logo-img {
          height: 100px;
          width: auto;
          max-width: 280px;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(27, 157, 217, 0.4)) drop-shadow(0 0 50px rgba(27, 157, 217, 0.15));
          margin-bottom: 2.5rem;
          display: block;
        }
        .g4d-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 50px;
          background: rgba(255,255,255,.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.2);
          margin-bottom: 1.25rem;
        }
        .g4d-badge-text {
          color: #fff;
          font-weight: 600;
          font-size: .63rem;
          letter-spacing: .11em;
          text-transform: uppercase;
          opacity: .9;
        }
        .g4d-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--g4d-orange);
          position: relative;
          display: inline-block;
        }
        .g4d-pulse-dot::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: rgba(242,101,34,.45);
          animation: g4d-pulse-ring 1.9s ease-out infinite;
        }
        @keyframes g4d-pulse-ring {
          0% { transform: scale(.6); opacity: 1; }
          80%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes g4d-drift1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -15px); }
        }
        @keyframes g4d-drift2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 15px); }
        }
        .g4d-headline {
          font-family: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 0 0 2rem 0;
          font-size: clamp(1.8rem, 2.5vw, 2.3rem);
          text-transform: uppercase;
          background: linear-gradient(135deg, #FFFFFF 40%, rgba(63, 180, 232, 0.9) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .g4d-carousel { width: 100%; max-width: 320px; }
        .g4d-slides { position: relative; min-height: 110px; }
        .g4d-slide { transition: opacity .45s ease, transform .45s ease; }
        .g4d-slide-hidden { opacity: 0; transform: translateY(8px); position: absolute; inset: 0; pointer-events: none; }
        .g4d-slide-visible { opacity: 1; transform: translateY(0); }
        .g4d-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 16px;
          text-align: left;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        }
        .g4d-card-ico-wrap {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .g4d-ico-blue { background: rgba(27, 157, 217, 0.18); border: 1px solid rgba(27, 157, 217, 0.3); }
        .g4d-ico-orange { background: rgba(249, 160, 63, 0.18); border: 1px solid rgba(249, 160, 63, 0.3); }
        .g4d-card-ico { width: 24px; height: 24px; }
        .g4d-ico-blue .g4d-card-ico { color: var(--g4d-blue-light); }
        .g4d-ico-orange .g4d-card-ico { color: var(--g4d-orange); }
        .g4d-card-title { color: #fff; font-weight: 700; font-size: .8rem; margin-bottom: 2px; }
        .g4d-card-text { color: rgba(255,255,255,.5); font-size: .72rem; line-height: 1.5; }
        .g4d-dots { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 1rem; }
        .g4d-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.25); cursor: pointer; transition: all .3s ease; border: 0; padding: 0; }
        .g4d-dot-active { width: 24px; border-radius: 4px; background: var(--g4d-blue); }
        .g4d-copyright { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; padding-bottom: 1.25rem; z-index: 2; }
        .g4d-copyright p { color: rgba(255,255,255,.35); font-size: .66rem; letter-spacing: .03em; margin: 0; }
        .g4d-auth-main { flex: 1 1 auto; display: flex; flex-direction: column; background: #fff; }
        .g4d-main-inner { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; padding: 2.5rem 1.25rem; }

        /* Blindage CSS autonome du panneau droit (immunisé contre tout conflit de layer) */
        .g4d-auth-card {
          width: 100%;
          max-width: 440px;
          padding: 40px 40px 34px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #E5E9F0;
          box-shadow: 0 1px 2px rgba(13, 38, 59, 0.04), 0 20px 48px -24px rgba(13, 38, 59, 0.18);
        }
        .g4d-auth-card-logo {
          display: block;
          height: 64px;
          width: auto;
          object-fit: contain;
          margin: 0 auto 24px;
        }
        .g4d-auth-title {
          margin: 0 0 7px 0;
          text-align: center;
          font-weight: 800;
          font-size: 28px;
          letter-spacing: -0.5px;
          color: #0D263B;
          line-height: 1.25;
        }
        .g4d-auth-subtitle {
          margin: 0 0 30px 0;
          text-align: center;
          font-weight: 500;
          font-size: 14.5px;
          line-height: 1.5;
          color: #64748B;
        }
        .g4d-auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .g4d-auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 0;
        }
        .g4d-auth-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .g4d-auth-label-text {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }
        .g4d-auth-forgot {
          font-size: 12.5px;
          font-weight: 700;
          color: #1B9DD9;
          text-decoration: none;
        }
        .g4d-auth-forgot:hover {
          text-decoration: underline;
        }
        .g4d-auth-input-wrap {
          position: relative;
          display: block;
        }
        .g4d-auth-input {
          width: 100%;
          height: 50px;
          padding: 0 16px;
          font-size: 15px;
          font-weight: 500;
          font-family: inherit;
          color: #0D263B;
          background: #F1F5F9;
          border: 1.5px solid #E5E9F0;
          border-radius: 0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .g4d-auth-input--pw {
          padding-right: 48px;
        }
        .g4d-auth-input::placeholder {
          color: #94A3B8;
        }
        .g4d-auth-input:focus {
          border-color: #1B9DD9;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(27, 157, 217, 0.12);
        }
        .g4d-auth-input--error {
          border-color: #EF4444;
        }
        .g4d-auth-pw-toggle {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          background: transparent;
          border: 0;
          border-radius: 9px;
          cursor: pointer;
          color: #94A3B8;
        }
        .g4d-auth-pw-toggle:hover {
          color: #1B9DD9;
        }
        .g4d-auth-remember {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          margin: -2px 0 0 0;
        }
        .g4d-auth-checkbox {
          width: 19px;
          height: 19px;
          margin: 0;
          cursor: pointer;
          accent-color: #1B9DD9;
          flex-shrink: 0;
        }
        .g4d-auth-submit {
          margin-top: 5px;
          height: 52px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: 15.5px;
          font-weight: 800;
          font-family: inherit;
          letter-spacing: 0.3px;
          color: #ffffff;
          border: 0;
          border-radius: 13px;
          cursor: pointer;
          background: linear-gradient(135deg, #3FB4E8 0%, #1B9DD9 55%, #0E86C2 100%);
          box-shadow: 0 12px 24px -10px rgba(27, 157, 217, 0.55);
          transition: filter 0.15s, transform 0.15s;
        }
        .g4d-auth-submit:hover:not(:disabled) {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
        .g4d-auth-submit:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .g4d-auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 18px;
        }
        .g4d-auth-divider-line {
          height: 1px;
          flex: 1;
          background: #EEF2F6;
        }
        .g4d-auth-divider-text {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94A3B8;
        }
        .g4d-auth-google-btn {
          height: 50px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 14.5px;
          font-weight: 700;
          color: #334155 !important;
          background: #ffffff;
          border: 1.5px solid #E5E9F0;
          border-radius: 0;
          text-decoration: none !important;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .g4d-auth-google-btn:hover {
          border-color: #1B9DD9;
          background: #F8FAFC;
          box-shadow: 0 0 0 4px rgba(27, 157, 217, 0.10);
        }
        .g4d-auth-footer-block {
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid #EEF2F6;
          text-align: center;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748B;
        }
        .g4d-auth-support-block {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #EEF2F6;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748B;
        }
        .g4d-auth-link {
          color: #1B9DD9 !important;
          font-weight: 800;
          text-decoration: none !important;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .g4d-auth-link:hover {
          text-decoration: underline !important;
        }
        @media (max-width: 991px) {
          .g4d-auth-aside { display: none; }
          .g4d-auth-card { padding: 32px 24px 28px; }
        }
      `}</style>

      {/* ══ Panneau gauche illustré (1:1 Zakaria2) ══ */}
      <aside className="g4d-auth-aside">
        <div className="g4d-aside-overlay" />
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '-60px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27, 157, 217, 0.32), transparent 70%)',
            filter: 'blur(8px)',
            animation: '16s ease-in-out 0s infinite normal none running g4d-drift1',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '22%',
            right: '-40px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244, 124, 32, 0.22), transparent 70%)',
            filter: 'blur(8px)',
            animation: '19s ease-in-out 0s infinite normal none running g4d-drift2',
            pointerEvents: 'none',
          }}
        />

        <div className="g4d-aside-content">
          <a href="/" aria-label="Accueil G4D">
            <img
              src={G4D_LOGO_TRIM_PATH}
              alt="G4D Express"
              className="g4d-logo-img"
              decoding="async"
            />
          </a>

          <div className="g4d-badge">
            <span className="g4d-pulse-dot" />
            <span className="g4d-badge-text">Plateforme Logistique SaaS</span>
          </div>

          <h2 className="g4d-headline">
            Livraison Rapide
            <br />
            &amp; Fiable
          </h2>

          {/* Carrousel 4 slides */}
          <div className="g4d-carousel">
            <div className="g4d-slides">
              {CAROUSEL_SLIDES.map((slide, i) => (
                <div
                  key={slide.title}
                  className={`g4d-slide ${idx === i ? 'g4d-slide-visible' : 'g4d-slide-hidden'}`}
                >
                  <div className="g4d-card">
                    <div className={`g4d-card-ico-wrap ${slide.variant}`}>{slide.icon}</div>
                    <div>
                      <div className="g4d-card-title">{slide.title}</div>
                      <div className="g4d-card-text">{slide.text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="g4d-dots">
              {CAROUSEL_SLIDES.map((slide, i) => (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={`g4d-dot ${idx === i ? 'g4d-dot-active' : ''}`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="g4d-copyright">
          <p>© {CURRENT_YEAR} G4D — Tous droits réservés.</p>
        </div>
      </aside>

      {/* ══ Panneau droit : formulaire (1:1 Zakaria2) ══ */}
      <main className="g4d-auth-main">
        <div className="g4d-main-inner">
          <div className="g4d-auth-card w-full max-w-[440px] px-10 pt-10 pb-[34px] rounded-[22px] bg-white border border-[#E5E9F0]">
            <a href="/" aria-label="Accueil G4D">
              <img
                src={G4D_LOGO_TRIM_PATH}
                alt="G4D Express"
                decoding="async"
                className="g4d-auth-card-logo block h-[64px] w-auto object-contain mx-auto mb-[24px]"
              />
            </a>

            <h1 className="g4d-auth-title m-0 mb-[7px] text-center font-extrabold text-[28px] tracking-[-0.5px] text-[#0D263B]">
              Connexion
            </h1>
            <p className="g4d-auth-subtitle mx-0 mt-0 mb-[30px] text-center font-medium text-[14.5px] leading-[1.5] text-[#64748B]">
              Accédez à votre espace logistique G4D
            </p>

            <LoginForm />

            {/* Séparateur « ou » */}
            <div className="g4d-auth-divider flex items-center gap-3 mt-[22px] mb-[18px]">
              <span className="g4d-auth-divider-line h-px flex-1 bg-[#EEF2F6]" />
              <span className="g4d-auth-divider-text text-[12px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                ou
              </span>
              <span className="g4d-auth-divider-line h-px flex-1 bg-[#EEF2F6]" />
            </div>

            {/* Connexion Google (OAuth) — logo Google officiel 4 couleurs */}
            <a
              href="#google-oauth"
              onClick={(e) => e.preventDefault()}
              className="g4d-auth-google-btn h-[50px] flex items-center justify-center gap-3 text-[14.5px] font-bold text-[#334155] bg-white border-[1.5px] border-[#E5E9F0] rounded-none no-underline"
            >
              <svg className="w-[19px] h-[19px] shrink-0" width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              Continuer avec Google
            </a>

            {/* Pas encore client ? → page d'inscription « Devenir client » */}
            <div className="g4d-auth-footer-block mt-[22px] pt-5 border-t border-[#EEF2F6] text-center text-[13.5px] font-semibold text-[#64748B]">
              Vous n&apos;avez pas de compte&nbsp;?{' '}
              <a
                href="/#couverture"
                className="g4d-auth-link text-[#1B9DD9] font-extrabold no-underline hover:underline"
              >
                Créer un compte
              </a>
            </div>

            {/* Footer : aide / support */}
            <div className="g4d-auth-support-block mt-[18px] pt-[18px] border-t border-[#EEF2F6] flex items-center justify-center gap-[6px] text-[13.5px] font-semibold text-[#64748B]">
              <span>Besoin d&apos;aide&nbsp;?</span>
              <a
                href="mailto:Contact@g4d.ma"
                className="g4d-auth-link inline-flex items-center gap-[5px] text-[#1B9DD9] font-extrabold no-underline hover:underline"
              >
                <svg
                  className="w-[14px] h-[14px]"
                  width="14"
                  height="14"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
                    clipRule="evenodd"
                  />
                </svg>
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
