import { describe, expect, it } from 'vitest';
import { METHODS_CATALOG } from '../../../data/methods';
import { FLAVOR_WHEEL_TREE } from '../../../data/flavor-wheel';
import { getDrinkBySlug } from '../../../data/wiki-drinks';
import { t } from '../../../i18n';
import {
  FLAVOR_FAMILY_TOKEN,
  capAliases,
  cardProfile,
  getNoteFamilyId,
  profileFiltersToThresholds,
  shortProfileLabel,
  vesselSpec,
} from '../utils/wiki-ui.helpers';

describe('shortProfileLabel', () => {
  it('keeps only the name before the parenthesis for every catalog profile', () => {
    for (const method of METHODS_CATALOG) {
      for (const profile of method.profiles) {
        const label = shortProfileLabel(t(profile.labelKey));
        expect(label.length, `${method.id}/${profile.id}`).toBeGreaterThan(0);
        expect(label).not.toContain('(');
      }
    }
    expect(shortProfileLabel('Liviano (Claridad Floral)')).toBe('Liviano');
    expect(shortProfileLabel('Normal')).toBe('Normal');
  });
});

describe('cardProfile', () => {
  it('lists attributes >= 4 from highest to lowest', () => {
    expect(cardProfile({ acidity: 5, sweetness: 4, body: 4, bitterness: 1 }).map((a) => [a.key, a.value])).toEqual([
      ['acidity', 5],
      ['sweetness', 4],
      ['body', 4],
    ]);
  });

  it('falls back to the highest attribute(s) when none reaches 4', () => {
    expect(cardProfile({ acidity: 3, sweetness: 3, body: 2, bitterness: 1 }).map((a) => a.key)).toEqual(['acidity', 'sweetness']);
  });
});

describe('flavor families', () => {
  it('maps every root family to a design token', () => {
    for (const root of FLAVOR_WHEEL_TREE) {
      expect(FLAVOR_FAMILY_TOKEN[root.id], root.id).toMatch(/^--flavor-/);
    }
  });

  it('resolves the root family of a note', () => {
    expect(getNoteFamilyId('fruity.berry.blackberry')).toBe('fruity');
    expect(getNoteFamilyId('does.not.exist')).toBe('other');
  });
});

describe('profileFiltersToThresholds', () => {
  it('maps quick filters to sensory thresholds', () => {
    expect(profileFiltersToThresholds(['acidez', 'amargor'])).toEqual({ minAcidity: 4, maxBitterness: 2 });
    expect(profileFiltersToThresholds([])).toEqual({});
  });
});

describe('vesselSpec', () => {
  it('picks the vessel by served volume and family', () => {
    expect(vesselSpec(getDrinkBySlug('ristretto')!)).toMatchObject({ kind: 'demitasse', capacityMl: 110 });
    expect(vesselSpec(getDrinkBySlug('cappuccino')!)).toMatchObject({ kind: 'medium', capacityMl: 200 });
    expect(vesselSpec(getDrinkBySlug('latte')!)).toMatchObject({ kind: 'large', capacityMl: 320 });
    expect(vesselSpec(getDrinkBySlug('cold-brew')!)).toMatchObject({ kind: 'tall', ice: true });
  });

  it('fills to the average served volume, within visible bounds', () => {
    const ristretto = vesselSpec(getDrinkBySlug('ristretto')!);
    const lungo = vesselSpec(getDrinkBySlug('lungo')!);
    expect(ristretto.fillRatio).toBeLessThan(lungo.fillRatio);
    expect(ristretto.fillRatio).toBeGreaterThanOrEqual(0.16);
    expect(lungo.fillRatio).toBeLessThanOrEqual(0.92);
  });
});

describe('capAliases', () => {
  it('shows at most three aliases and counts the rest', () => {
    expect(capAliases('A, B, C, D, E')).toEqual({ shown: ['A', 'B', 'C'], hidden: ['D', 'E'] });
    expect(capAliases('A, B')).toEqual({ shown: ['A', 'B'], hidden: [] });
  });
});
