'use client';

import React, { useState, useMemo } from 'react';

interface CityFee {
  id: number;
  name_fr: string;
  frais_livraison: number;
  frais_retour: number;
  delay: string;
}

const CITY_FEES: CityFee[] = [
  { id: 1, name_fr: 'Agadir', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 2, name_fr: 'Ain Harrouda', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 3, name_fr: 'Ait Melloul', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 4, name_fr: 'Al Hoceïma', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 5, name_fr: 'Assilah', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 6, name_fr: 'Azemmour', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 7, name_fr: 'Azrou', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 8, name_fr: 'Ben Guerir', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 9, name_fr: 'Béni Mellal', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 10, name_fr: 'Benslimane', frais_livraison: 30, frais_retour: 0, delay: '24h' },
  { id: 11, name_fr: 'Berkane', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 12, name_fr: 'Berrechid', frais_livraison: 30, frais_retour: 0, delay: '24h' },
  { id: 13, name_fr: 'Boujdour', frais_livraison: 45, frais_retour: 0, delay: '48h - 72h' },
  { id: 14, name_fr: 'Bouskoura', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 15, name_fr: 'Bouznika', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 16, name_fr: 'Casablanca', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 17, name_fr: 'Chefchaouen', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 18, name_fr: 'Dakhla', frais_livraison: 45, frais_retour: 0, delay: '48h - 72h' },
  { id: 19, name_fr: 'Dar Bouazza', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  {
    id: 20,
    name_fr: 'Dcheira El Jihadia',
    frais_livraison: 35,
    frais_retour: 0,
    delay: '24h - 48h',
  },
  { id: 21, name_fr: 'El Hajeb', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 22, name_fr: 'El Jadida', frais_livraison: 35, frais_retour: 0, delay: '24h' },
  {
    id: 23,
    name_fr: 'El Kelaa des Sraghna',
    frais_livraison: 35,
    frais_retour: 0,
    delay: '24h - 48h',
  },
  { id: 24, name_fr: 'Errachidia', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 25, name_fr: 'Essaouira', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 26, name_fr: 'Fès', frais_livraison: 35, frais_retour: 0, delay: '24h' },
  { id: 27, name_fr: 'Fnideq', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 28, name_fr: 'Fquih Ben Salah', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 29, name_fr: 'Guelmim', frais_livraison: 40, frais_retour: 0, delay: '48h' },
  { id: 30, name_fr: 'Guercif', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 31, name_fr: 'Harhoura', frais_livraison: 20, frais_retour: 0, delay: '24h' },
  { id: 32, name_fr: 'Ifrane', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 33, name_fr: 'Inezgane', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 34, name_fr: 'Kénitra', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 35, name_fr: 'Khémisset', frais_livraison: 30, frais_retour: 0, delay: '24h' },
  { id: 36, name_fr: 'Khénifra', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 37, name_fr: 'Khouribga', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 38, name_fr: 'Ksar El Kébir', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 39, name_fr: 'Laâyoune', frais_livraison: 45, frais_retour: 0, delay: '48h - 72h' },
  { id: 40, name_fr: 'Larache', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 41, name_fr: 'Marrakech', frais_livraison: 35, frais_retour: 0, delay: '24h' },
  { id: 42, name_fr: 'Martil', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 43, name_fr: "M'diq", frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 44, name_fr: 'Médiouna', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 45, name_fr: 'Meknès', frais_livraison: 35, frais_retour: 0, delay: '24h' },
  { id: 46, name_fr: 'Midelt', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 47, name_fr: 'Mohammédia', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 48, name_fr: 'Nador', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 49, name_fr: 'Nouaceur', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 50, name_fr: 'Ouarzazate', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 51, name_fr: 'Oazzane', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 52, name_fr: 'Oued Zem', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 53, name_fr: 'Oujda', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 54, name_fr: 'Rabat', frais_livraison: 20, frais_retour: 0, delay: '24h' },
  { id: 55, name_fr: 'Safi', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 56, name_fr: 'Salé', frais_livraison: 15, frais_retour: 0, delay: '24h' },
  { id: 57, name_fr: 'Sefrou', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 58, name_fr: 'Settat', frais_livraison: 30, frais_retour: 0, delay: '24h' },
  { id: 59, name_fr: 'Sidi Bennour', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 60, name_fr: 'Sidi Kacem', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 61, name_fr: 'Sidi Slimane', frais_livraison: 30, frais_retour: 0, delay: '24h' },
  { id: 62, name_fr: 'Skhirat', frais_livraison: 20, frais_retour: 0, delay: '24h' },
  { id: 63, name_fr: 'Souk El Arbaa', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 64, name_fr: 'Tamesna', frais_livraison: 20, frais_retour: 0, delay: '24h' },
  { id: 65, name_fr: 'Tan-Tan', frais_livraison: 45, frais_retour: 0, delay: '48h' },
  { id: 66, name_fr: 'Tanger', frais_livraison: 35, frais_retour: 0, delay: '24h' },
  { id: 67, name_fr: 'Taourirt', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 68, name_fr: 'Taroudant', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 69, name_fr: 'Taza', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 70, name_fr: 'Témara', frais_livraison: 20, frais_retour: 0, delay: '24h' },
  { id: 71, name_fr: 'Tétouan', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 72, name_fr: 'Tiflet', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 73, name_fr: 'Tinghir', frais_livraison: 40, frais_retour: 0, delay: '48h' },
  { id: 74, name_fr: 'Tit Mellil', frais_livraison: 25, frais_retour: 0, delay: '24h' },
  { id: 75, name_fr: 'Tiznit', frais_livraison: 40, frais_retour: 0, delay: '24h - 48h' },
  { id: 76, name_fr: 'Youssoufia', frais_livraison: 35, frais_retour: 0, delay: '24h - 48h' },
  { id: 77, name_fr: 'Zagora', frais_livraison: 45, frais_retour: 0, delay: '48h' },
];

const PER_PAGE = 10;
const TOTAL_CITIES = 472;
const TOTAL_ZONES = 4;

function formatAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

export function PricingCalculator() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredFees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CITY_FEES;
    return CITY_FEES.filter((f) => f.name_fr.toLowerCase().includes(q));
  }, [search]);

  const totalCount = search.trim() ? filteredFees.length : TOTAL_CITIES;
  const lastPage = Math.max(1, Math.ceil(filteredFees.length / PER_PAGE));
  const safePage = Math.min(currentPage, lastPage);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PER_PAGE;
    return filteredFees.slice(start, start + PER_PAGE);
  }, [filteredFees, safePage]);

  const firstItem = filteredFees.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const lastItem = Math.min(safePage * PER_PAGE, filteredFees.length);

  const pages = useMemo(() => {
    const set = new Set<number>([1]);
    for (let p = Math.max(2, safePage - 1); p <= Math.min(lastPage - 1, safePage + 1); p++) {
      set.add(p);
    }
    if (lastPage > 1) set.add(lastPage);
    return Array.from(set).sort((a, b) => a - b);
  }, [safePage, lastPage]);

  return (
    <div>
      {/* ══ EN-TÊTE + STATS BAR (identique pricing-calculator.blade.php) ══ */}
      <div className="pb-4 mb-5 border-bottom border-neutral-100">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
          <div className="d-flex align-items-center tw-gap-3">
            <span className="tw-w-12 tw-h-12 bg-main-600 text-white rounded-circle d-flex justify-content-center align-items-center tw-text-xl flex-shrink-0">
              <i className="fas fa-truck-fast" aria-hidden="true"></i>
            </span>
            <div>
              <h5 className="fw-bold mb-0 text-main-two-600 cursor-big">Tarifs de livraison</h5>
              <p className="text-neutral-700 small mb-0 cursor-small">
                Recherchez votre ville de destination, votre tarif s&apos;affiche instantanément
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar — 3 métriques */}
        <div className="d-flex flex-wrap gap-2">
          <div className="g4d-pc-stat">
            <i className="fas fa-map-location-dot g4d-pc-stat__icon" aria-hidden="true"></i>
            <span className="g4d-pc-stat__num">{TOTAL_CITIES}</span>
            <span className="g4d-pc-stat__label">villes tarifées</span>
          </div>
          <div className="g4d-pc-stat">
            <i className="fas fa-layer-group g4d-pc-stat__icon" aria-hidden="true"></i>
            <span className="g4d-pc-stat__num">{TOTAL_ZONES}</span>
            <span className="g4d-pc-stat__label">zones de livraison</span>
          </div>
          <div className="g4d-pc-stat">
            <i className="fas fa-clock g4d-pc-stat__icon" aria-hidden="true"></i>
            <span className="g4d-pc-stat__num">Lun – Sam</span>
            <span className="g4d-pc-stat__label">08h30 – 22h30</span>
          </div>
        </div>
      </div>

      {/* ══ TABLEAU DES TARIFS PAR VILLE ══ */}
      <div className="g4d-tarifs-card">
        <div className="g4d-tarifs-card__header">
          <span className="g4d-tarifs-card__header-icon">
            <i className="fas fa-tags" aria-hidden="true"></i>
          </span>
          <div className="flex-grow-1 min-w-0">
            <div className="text-white fw-semibold lh-sm cursor-big">
              Grille tarifaire nationale
            </div>
            <div className="text-white small cursor-small g4d-tarifs-card__subtitle">
              {totalCount} villes disponibles
            </div>
          </div>
          {lastPage > 1 && (
            <span className="g4d-tarifs-card__page-badge cursor-small">
              {safePage}&nbsp;/&nbsp;{lastPage}
            </span>
          )}
        </div>

        <div className="g4d-tarifs-card__search-zone">
          <div className="input-group g4d-tarifs-search">
            <span className="input-group-text g4d-tarifs-search__icon">
              <i className="fas fa-magnifying-glass" aria-hidden="true"></i>
            </span>
            <input
              type="text"
              className="form-control g4d-tarifs-search__input"
              placeholder="Rechercher une ville…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Rechercher une ville de destination"
            />
            {search && (
              <button
                className="btn g4d-tarifs-search__clear"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                type="button"
                aria-label="Effacer la recherche"
              >
                <i className="fas fa-xmark" aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>

        <div className="g4d-tarifs-card__table-zone">
          {pageItems.length > 0 ? (
            <div className="g4d-tarifs-card__table-wrap">
              <table className="g4d-tarifs-table" suppressHydrationWarning>
                <thead className="g4d-tarifs-table__head">
                  <tr>
                    <th className="g4d-tarifs-table__th">Ville de destination</th>
                    <th className="g4d-tarifs-table__th g4d-tarifs-table__th--end">Livraison</th>
                    <th className="g4d-tarifs-table__th g4d-tarifs-table__th--end">Retour</th>
                    <th className="g4d-tarifs-table__th g4d-tarifs-table__th--end">Délai</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((fee) => (
                    <tr className="g4d-tarifs-table__tr" key={fee.id}>
                      <td className="g4d-tarifs-table__td-city">{fee.name_fr}</td>
                      <td className="g4d-tarifs-table__td-amount g4d-tarifs-table__td-amount--end">
                        <span className="g4d-tarifs-table__price g4d-tarifs-table__price--livraison">
                          {formatAmount(fee.frais_livraison)}&nbsp;DH
                        </span>
                      </td>
                      <td className="g4d-tarifs-table__td-amount g4d-tarifs-table__td-amount--end">
                        <span className="g4d-tarifs-table__price g4d-tarifs-table__price--retour">
                          {formatAmount(fee.frais_retour)}&nbsp;DH
                        </span>
                      </td>
                      <td className="g4d-tarifs-table__td-amount g4d-tarifs-table__td-amount--end">
                        <span className="text-neutral-700 cursor-small">{fee.delay || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="g4d-tarifs-card__empty">
              <div className="g4d-tarifs-card__empty-icon">
                <i className="fas fa-magnifying-glass" aria-hidden="true"></i>
              </div>
              <p className="fw-semibold text-main-two-600 mb-1 cursor-big">Aucune ville trouvée</p>
              <p className="text-neutral-500 small mb-0 cursor-small">
                Aucun résultat pour <strong>«&nbsp;{search}&nbsp;»</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {lastPage > 1 && (
        <div className="g4d-pc__pag">
          <span className="g4d-pc__pag-info">
            Affichage{' '}
            <strong>
              {firstItem}–{lastItem}
            </strong>{' '}
            sur <strong>{filteredFees.length}</strong> villes
          </span>

          <div className="g4d-pc__pag-btns">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn g4d-pc__pag-nav"
              disabled={safePage <= 1}
              aria-label="Page précédente"
            >
              <span>
                <i className="fas fa-arrow-left"></i>
              </span>
            </button>

            {pages.map((page, idx) => {
              const prev = idx > 0 ? pages[idx - 1] : null;
              return (
                <React.Fragment key={page}>
                  {prev !== null && page - prev > 1 && (
                    <span className="g4d-pc__pag-ellipsis">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`btn g4d-pc__pag-page ${
                      page === safePage ? 'g4d-pc__pag-page--active' : ''
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              className="btn g4d-pc__pag-nav"
              disabled={safePage >= lastPage}
              aria-label="Page suivante"
            >
              <span>
                <i className="fas fa-arrow-right"></i>
              </span>
            </button>
          </div>
        </div>
      )}

      <p className="text-neutral-400 small text-center mt-3 mb-0 cursor-small">
        Tarifs standards HT &middot; Hors assurance &middot; Valables jusqu&apos;à modification
      </p>
    </div>
  );
}
