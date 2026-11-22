import { describe, it, expect } from 'vitest';
import type { SensoryProfile } from '../../../domain/schemas';
import {
  normalizeSearchText,
  matchesSensoryThresholds,
  type SensoryThresholds,
} from '../search';

describe('normalizeSearchText (shared Wiki search helper)', () => {
  it('strips Spanish diacritics, lowercases, and trims whitespace', () => {
    expect(normalizeSearchText('  Etiopía  ')).toBe('etiopia');
    expect(normalizeSearchText('Lágrima')).toBe('lagrima');
    expect(normalizeSearchText('CAFÉ CON LECHE')).toBe('cafe con leche');
    expect(normalizeSearchText('Sifón Japonés')).toBe('sifon japones');
    expect(normalizeSearchText('España / Caña')).toBe('espana / cana');
  });

  it('handles empty and whitespace-only strings cleanly', () => {
    expect(normalizeSearchText('')).toBe('');
    expect(normalizeSearchText('   \t\n  ')).toBe('');
  });
});

describe('matchesSensoryThresholds (shared Wiki sensory filter)', () => {
  const balancedProfile: SensoryProfile = {
    acidity: 3,
    sweetness: 4,
    body: 4,
    bitterness: 2,
  };

  it('returns true when no thresholds are specified', () => {
    const empty: SensoryThresholds = {};
    expect(matchesSensoryThresholds(balancedProfile, empty)).toBe(true);
  });

  it('evaluates minAcidity inclusively', () => {
    expect(matchesSensoryThresholds(balancedProfile, { minAcidity: 3 })).toBe(true);
    expect(matchesSensoryThresholds(balancedProfile, { minAcidity: 4 })).toBe(false);
  });

  it('evaluates minSweetness inclusively', () => {
    expect(matchesSensoryThresholds(balancedProfile, { minSweetness: 4 })).toBe(true);
    expect(matchesSensoryThresholds(balancedProfile, { minSweetness: 5 })).toBe(false);
  });

  it('evaluates minBody inclusively', () => {
    expect(matchesSensoryThresholds(balancedProfile, { minBody: 4 })).toBe(true);
    expect(matchesSensoryThresholds(balancedProfile, { minBody: 5 })).toBe(false);
  });

  it('evaluates maxBitterness inclusively', () => {
    expect(matchesSensoryThresholds(balancedProfile, { maxBitterness: 2 })).toBe(true);
    expect(matchesSensoryThresholds(balancedProfile, { maxBitterness: 1 })).toBe(false);
  });

  it('requires all combined thresholds to pass simultaneously', () => {
    expect(
      matchesSensoryThresholds(balancedProfile, {
        minAcidity: 3,
        minSweetness: 4,
        minBody: 3,
        maxBitterness: 2,
      })
    ).toBe(true);

    expect(
      matchesSensoryThresholds(balancedProfile, {
        minAcidity: 3,
        minSweetness: 4,
        minBody: 3,
        maxBitterness: 1,
      })
    ).toBe(false);
  });
});
