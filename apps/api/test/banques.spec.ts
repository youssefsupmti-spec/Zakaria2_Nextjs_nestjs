import { describe, expect, it } from 'vitest';
import { normalizeUniqueBankCodes } from '../src/modules/banques/banques.service';
import {
  extractRibPrefix3,
  normalizeRib,
} from '../src/modules/businesses/invoice-bank-resolver.service';

describe('Référentiel Banques & Codes RIB', () => {
  it('normalizeUniqueBankCodes : normalise et déduplique les préfixes RIB', () => {
    expect(normalizeUniqueBankCodes([' 007 ', '011', '007', '230'])).toEqual(['007', '011', '230']);
  });

  it('normalizeRib & extractRibPrefix3 : nettoie les espaces et extrait le préfixe bancaire à 3 chiffres', () => {
    expect(normalizeRib('007 810 0001234567890123 45')).toBe('007810000123456789012345');
    expect(extractRibPrefix3('007 810 000123')).toBe('007');
  });
});
