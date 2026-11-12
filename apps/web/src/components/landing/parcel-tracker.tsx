'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface TimelineEvent {
  status: string;
  status_label: string;
  status_color: string;
  timestamp: string;
}

interface TrackResult {
  code: string;
  status: string;
  status_label: string;
  status_color: string;
  city: string;
  recipient: string;
}

const DEMO_PARCELS: Record<
  string,
  { result: TrackResult; timeline: TimelineEvent[] }
> = {
  'G4D-4821': {
    result: {
      code: 'G4D-4821',
      status: 'Livré',
      status_label: 'Livré',
      status_color: '#16a34a',
      city: 'Casablanca',
      recipient: 'Mo***',
    },
    timeline: [
      {
        status: 'Nouveau Colis',
        status_label: 'Nouveau Colis',
        status_color: '#64748b',
        timestamp: '10/04/2026 14:00',
      },
      {
        status: 'Ramassé',
        status_label: 'Ramassé · Agence Salé',
        status_color: '#2996C8',
        timestamp: '10/04/2026 16:30',
      },
      {
        status: 'Expédié',
        status_label: 'En transit · Hub Casablanca',
        status_color: '#0284c7',
        timestamp: '11/04/2026 07:15',
      },
      {
        status: 'Mise en distribution',
        status_label: 'Mise en distribution',
        status_color: '#F47B20',
        timestamp: '11/04/2026 08:45',
      },
      {
        status: 'Livré',
        status_label: 'Livré',
        status_color: '#16a34a',
        timestamp: '11/04/2026 09:42',
      },
    ],
  },
  'G4D-4820': {
    result: {
      code: 'G4D-4820',
      status: 'Mise en distribution',
      status_label: 'Mise en distribution',
      status_color: '#F47B20',
      city: 'Rabat',
      recipient: 'Fa***',
    },
    timeline: [
      {
        status: 'Nouveau Colis',
        status_label: 'Nouveau Colis',
        status_color: '#64748b',
        timestamp: '11/04/2026 10:15',
      },
      {
        status: 'Ramassé',
        status_label: 'Ramassé · Agence Salé',
        status_color: '#2996C8',
        timestamp: '11/04/2026 15:20',
      },
      {
        status: 'Mise en distribution',
        status_label: 'Mise en distribution · Rabat Agdal',
        status_color: '#F47B20',
        timestamp: '12/04/2026 09:10',
      },
    ],
  },
  'G4D-4819': {
    result: {
      code: 'G4D-4819',
      status: 'Ramassé',
      status_label: 'Ramassé',
      status_color: '#2996C8',
      city: 'Fès',
      recipient: 'Yo***',
    },
    timeline: [
      {
        status: 'Nouveau Colis',
        status_label: 'Nouveau Colis',
        status_color: '#64748b',
        timestamp: '11/04/2026 11:30',
      },
      {
        status: 'Ramassé',
        status_label: 'Ramassé · Agence Salé',
        status_color: '#2996C8',
        timestamp: '11/04/2026 17:05',
      },
    ],
  },
};

export function ParcelTracker() {
  const [trackingCode, setTrackingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const showModal = useCallback(() => {
    setOpen(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const hideModal = useCallback(() => {
    setOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        hideModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [open, hideModal]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = trackingCode.trim();
    if (!trimmed) {
      setErrorMessage('Veuillez saisir un code de suivi.');
      return;
    }
    if (trimmed.length < 3) {
      setErrorMessage('Le code de suivi est trop court.');
      return;
    }
    if (trimmed.length > 60) {
      setErrorMessage('Le code de suivi est trop long.');
      return;
    }
    if (!/^[A-Za-z0-9-]+$/.test(trimmed)) {
      setErrorMessage(
        'Format de code invalide. Utilisez uniquement des lettres, chiffres et tirets.'
      );
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 280));

    const normalized = trimmed.toUpperCase().replace(/^#/, '');
    const match = DEMO_PARCELS[normalized];

    setSearched(true);
    if (match) {
      setFound(true);
      setResult(match.result);
      setTimeline(match.timeline);
    } else {
      setFound(false);
      setResult(null);
      setTimeline([]);
    }
    setLoading(false);
    showModal();
  };

  return (
    <div>
      {/* ════════════════════════════════════════════════════════════════════
           FORM — 2 colonnes (identique parcel-tracker.blade.php)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="row align-items-center g-4 g-lg-5 tw-py-15">
        {/* ── Gauche : badge + titre + description ──────────────────────── */}
        <div className="col-lg-5">
          <div
            className="d-inline-flex align-items-center gap-2 mb-4"
            style={{
              background: 'rgba(244,123,32,.13)',
              border: '1px solid rgba(244,123,32,.28)',
              borderRadius: '6px',
              padding: '6px 14px',
            }}
          >
            <i
              className="fas fa-shipping-fast"
              style={{ color: 'var(--g4d-orange)', fontSize: '.8rem' }}
            ></i>
            <span
              style={{
                color: 'var(--g4d-orange)',
                fontSize: '.72rem',
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
              }}
            >
              Suivi en temps réel
            </span>
          </div>

          <h2
            className="text-white fw-bold mb-3"
            style={{
              fontSize: 'clamp(1.45rem,2.8vw,2rem)',
              lineHeight: 1.22,
            }}
          >
            Où est votre colis
            <br />
            <span style={{ color: 'var(--g4d-orange)' }}>en ce moment ?</span>
          </h2>

          <p
            className="mb-0"
            style={{
              color: 'rgba(255,255,255,.55)',
              fontSize: '.88rem',
              maxWidth: '340px',
              lineHeight: 1.65,
            }}
          >
            Entrez votre code G4D pour localiser votre livraison et consulter
            l&apos;historique complet de ses statuts.
          </p>
        </div>

        {/* ── Droite : formulaire ────────────────────────────────────────── */}
        <div className="col-lg-7">
          <form onSubmit={handleTrack} noValidate>
            <div className="d-flex align-items-stretch gap-2">
              <div className="position-relative flex-grow-1">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ps-3"
                  style={{ pointerEvents: 'none', zIndex: 2 }}
                >
                  <i
                    className="fas fa-box"
                    style={{ color: 'var(--g4d-blue)', fontSize: '.85rem' }}
                  ></i>
                </span>
                <input
                  type="text"
                  id="g4d-track-input"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className={`form-control border-0 ${
                    errorMessage ? 'is-invalid' : ''
                  }`}
                  placeholder="Code de suivi — ex : G4D-2025-XXXXX"
                  maxLength={60}
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    height: '54px',
                    paddingLeft: '2.75rem',
                    borderRadius: '8px',
                    fontSize: '.9rem',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn fw-semibold flex-shrink-0"
                disabled={loading}
                style={{
                  background: 'var(--g4d-orange)',
                  color: '#fff',
                  borderRadius: '8px',
                  height: '54px',
                  minWidth: '128px',
                  fontSize: '.9rem',
                  border: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {!loading ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '.5rem',
                    }}
                  >
                    <i className="fas fa-search"></i>
                    Suivre
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '.5rem',
                    }}
                  >
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Recherche…
                  </span>
                )}
              </button>
            </div>

            {errorMessage && (
              <div
                className="d-flex align-items-center gap-2 mt-2"
                style={{ color: '#fca5a5', fontSize: '.82rem' }}
              >
                <i className="fas fa-exclamation-circle"></i>
                {errorMessage}
              </div>
            )}

            <div
              className="d-flex align-items-center gap-2 mt-2"
              style={{ color: 'rgba(255,255,255,.38)', fontSize: '.73rem' }}
            >
              <i className="fas fa-lock" style={{ fontSize: '.65rem' }}></i>
              Connexion sécurisée — aucune donnée personnelle enregistrée
            </div>
          </form>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
           MODAL (identique parcel-tracker.blade.php)
      ════════════════════════════════════════════════════════════════════ */}
      {open && (
        <div>
          {/* Backdrop */}
          <div
            onClick={hideModal}
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1050,
              background: 'rgba(0,0,0,.50)',
            }}
          ></div>

          {/* Dialogue centré */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) hideModal();
            }}
            className="g4d-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Suivi de colis"
          >
            <div
              style={{
                width: '100%',
                maxWidth: '560px',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(11,31,53,.28)',
                background: '#fff',
              }}
            >
              {/* FOUND — colis trouvé */}
              {searched && found && result && (
                <div>
                  {/* Header navy */}
                  <div
                    className="d-flex align-items-start gap-3 px-5 py-4"
                    style={{ background: 'var(--g4d-blue-deeper)' }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: 'rgba(244,123,32,.18)',
                      }}
                    >
                      <i
                        className="fas fa-box"
                        style={{
                          color: 'var(--g4d-orange)',
                          fontSize: '.9rem',
                        }}
                      ></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div
                        className="fw-bold text-white text-truncate"
                        style={{ fontSize: '.95rem', letterSpacing: '.04em' }}
                      >
                        {result.code}
                      </div>
                      <div
                        style={{
                          color: 'rgba(255,255,255,.42)',
                          fontSize: '.7rem',
                          marginTop: '1px',
                        }}
                      >
                        Résultat du suivi
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-1">
                      <span
                        className="badge px-3 py-2 text-white"
                        style={{
                          backgroundColor: result.status_color || '#6c757d',
                          fontSize: '.75rem',
                        }}
                      >
                        {result.status_label}
                      </span>
                      <button
                        type="button"
                        onClick={hideModal}
                        className="btn btn-link p-0 ms-1 d-flex align-items-center justify-content-center"
                        aria-label="Fermer"
                        style={{
                          color: 'rgba(255,255,255,.40)',
                          fontSize: '1.1rem',
                          textDecoration: 'none',
                          width: '24px',
                          height: '24px',
                          lineHeight: 1,
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>

                  {/* Info bar : ville + destinataire */}
                  <div
                    className="d-flex flex-wrap align-items-center gap-3 px-5 py-3 border-bottom"
                    style={{ background: '#f6f8fc' }}
                  >
                    {result.city && result.city !== '—' && (
                      <div
                        className="d-flex align-items-center gap-2"
                        style={{ fontSize: '.84rem', color: '#374151' }}
                      >
                        <i
                          className="fas fa-map-marker-alt"
                          style={{
                            color: 'var(--g4d-blue)',
                            fontSize: '.78rem',
                          }}
                        ></i>
                        <span className="fw-medium">{result.city}</span>
                        <span style={{ color: '#d1d5db' }}>|</span>
                      </div>
                    )}
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{ fontSize: '.84rem', color: '#374151' }}
                    >
                      <i
                        className="fas fa-user"
                        style={{ color: 'var(--g4d-blue)', fontSize: '.78rem' }}
                      ></i>
                      <span>
                        Destinataire :&nbsp;
                        <strong>{result.recipient}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Body : timeline */}
                  <div className="px-5 py-4">
                    {timeline && timeline.length > 0 ? (
                      <div>
                        <p
                          className="text-uppercase fw-bold mb-4"
                          style={{
                            fontSize: '.68rem',
                            letterSpacing: '.13em',
                            color: 'var(--g4d-blue)',
                          }}
                        >
                          Historique des statuts
                        </p>
                        <div
                          className="position-relative"
                          style={{ paddingLeft: '1.5rem' }}
                        >
                          <div
                            className="position-absolute top-0 bottom-0"
                            style={{
                              left: '5px',
                              width: '2px',
                              background:
                                'linear-gradient(to bottom,var(--g4d-blue) 0%,rgba(41,150,200,.10) 100%)',
                              borderRadius: '2px',
                            }}
                          ></div>
                          <div className="d-flex flex-column gap-4">
                            {timeline.map((event, i) => (
                              <div
                                key={i}
                                className="d-flex align-items-start gap-3"
                              >
                                <div
                                  className="position-absolute rounded-circle border border-white border-2"
                                  style={{
                                    backgroundColor:
                                      event.status_color || '#6c757d',
                                    width: '13px',
                                    height: '13px',
                                    marginTop: '3px',
                                    left: 0,
                                    marginLeft: '-1px',
                                    flexShrink: 0,
                                  }}
                                ></div>
                                <div>
                                  <div
                                    className="fw-semibold"
                                    style={{
                                      fontSize: '.875rem',
                                      color: 'var(--g4d-blue-deeper)',
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {event.status_label}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '.75rem',
                                      color: '#6b7280',
                                      marginTop: '2px',
                                    }}
                                  >
                                    <i
                                      className="fas fa-clock me-1"
                                      style={{ fontSize: '.65rem' }}
                                    ></i>
                                    <span>{event.timestamp}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <i
                          className="fas fa-history d-block mb-3 mx-auto"
                          style={{
                            color: 'var(--g4d-blue)',
                            fontSize: '1.75rem',
                            opacity: 0.6,
                          }}
                        ></i>
                        <p
                          className="mb-0"
                          style={{ fontSize: '.875rem', color: '#6b7280' }}
                        >
                          Aucun historique disponible pour ce colis.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="d-flex justify-content-end px-5 py-3 border-top"
                    style={{ background: '#f6f8fc' }}
                  >
                    <button
                      type="button"
                      onClick={hideModal}
                      className="btn btn-sm fw-semibold px-4"
                      style={{
                        background: 'var(--g4d-orange)',
                        color: '#fff',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '.84rem',
                      }}
                    >
                      <i className="fas fa-times me-1"></i>
                      Fermer
                    </button>
                  </div>
                </div>
              )}

              {/* NOT FOUND — colis introuvable */}
              {searched && !found && (
                <div>
                  <div
                    className="d-flex align-items-center justify-content-between px-5 py-3"
                    style={{ background: 'var(--g4d-blue-deeper)' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i
                        className="fas fa-search"
                        style={{
                          color: 'rgba(255,255,255,.35)',
                          fontSize: '.85rem',
                        }}
                      ></i>
                      <span
                        className="text-white fw-semibold"
                        style={{ fontSize: '.85rem' }}
                      >
                        Suivi de colis
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={hideModal}
                      className="btn btn-link p-0 d-flex align-items-center justify-content-center"
                      aria-label="Fermer"
                      style={{
                        color: 'rgba(255,255,255,.40)',
                        fontSize: '1.1rem',
                        textDecoration: 'none',
                        width: '24px',
                        height: '24px',
                        lineHeight: 1,
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="text-center px-5 py-5">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                      style={{
                        width: '72px',
                        height: '72px',
                        background: '#fff4ef',
                        border: '2px solid rgba(244,123,32,.22)',
                      }}
                    >
                      <i
                        className="fas fa-search"
                        style={{
                          color: 'var(--g4d-orange)',
                          fontSize: '1.5rem',
                        }}
                      ></i>
                    </div>
                    <h5
                      className="fw-bold mb-2"
                      style={{
                        color: 'var(--g4d-blue-deeper)',
                        fontSize: '1.05rem',
                      }}
                    >
                      Colis introuvable
                    </h5>
                    <p
                      className="mb-4"
                      style={{
                        fontSize: '.875rem',
                        color: '#6b7280',
                        maxWidth: '320px',
                        marginInline: 'auto',
                        lineHeight: 1.65,
                      }}
                    >
                      Aucun colis actif ne correspond au code{' '}
                      <strong style={{ color: 'var(--g4d-blue-deeper)' }}>
                        {trackingCode.toUpperCase()}
                      </strong>
                      . Vérifiez le code sur votre bon de livraison et
                      réessayez.
                    </p>
                    <button
                      type="button"
                      onClick={hideModal}
                      className="btn btn-sm fw-semibold px-4"
                      style={{
                        background: 'var(--g4d-orange)',
                        color: '#fff',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '.84rem',
                      }}
                    >
                      <i className="fas fa-redo me-1"></i>
                      Réessayer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

