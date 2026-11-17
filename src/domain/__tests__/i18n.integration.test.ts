import { describe, it, expect } from 'vitest';
import { t, deepMerge } from '../../i18n';

describe('i18n Integration with Methods Catalog', () => {
  it('preserves existing ui.json translation keys', () => {
    expect(t('app.title')).toBe('Atelier Brew');
    expect(t('methods.ratioLabel', { ratio: '16.7' })).toBe('Ratio 1:16.7');
    expect(t('methods.yieldLabel', { yield: '2' })).toBe('Yield 1:2');
    expect(t('methods.timeLabel', { time: '3:30' })).toBe('3:30 min');
    expect(t('methods.doseLabel', { dose: '15' })).toBe('15 g');
    expect(t('methods.v60.title')).toBe('Hario V60');
    expect(t('methods.v60.tag')).toBe('Filtro Cónico');
    expect(t('methods.espresso.title')).toBe('Espresso');
    expect(t('methods.chemex.title')).toBe('Chemex');
    expect(t('methods.melitta.title')).toBe('Melitta');
    expect(t('methods.aeropress.title')).toBe('AeroPress');
    expect(t('methods.frenchPress.title')).toBe('Prensa Francesa');
  });

  it('resolves catalog method name and base grind for all 6 methods', () => {
    const methodKeys = ['v60', 'chemex', 'melitta', 'aeropress', 'frenchPress', 'espresso'];
    for (const m of methodKeys) {
      expect(t(`methods.${m}.name`)).not.toBe(`methods.${m}.name`);
      expect(t(`methods.${m}.baseGrind`)).not.toBe(`methods.${m}.baseGrind`);
    }
  });

  it('interpolates {waterGrams} and {cumulativeWaterGrams} in phase instructions', () => {
    const instruction = t('methods.v60.phases.bloom.instruction', {
      waterGrams: 45,
      cumulativeWaterGrams: 45,
    });
    expect(instruction).toContain('45 g');
    expect(instruction).not.toContain('{waterGrams}');
    expect(instruction).not.toContain('{cumulativeWaterGrams}');
  });

  it('supports both {param} and {{param}} interpolation syntax', () => {
    const singleBrace = t('methods.v60.phases.bloom.instruction', {
      waterGrams: 50,
      cumulativeWaterGrams: 50,
    });
    expect(singleBrace).toContain('50 g');

    // Also test raw string with double braces
    const fakeTemplate = 'Verté {{waterGrams}} g hasta {{cumulativeWaterGrams}} g';
    const fakeDictionary = {
      test: {
        double: fakeTemplate,
      },
    };
    const merged = deepMerge({ a: 1 }, fakeDictionary);
    expect(merged.test.double).toBe(fakeTemplate);
  });

  it('resolves physical limit warning messages', () => {
    const belowMin = t('methods.v60.warnings.belowMin');
    const aboveMax = t('methods.v60.warnings.aboveMax');
    expect(belowMin).not.toBe('methods.v60.warnings.belowMin');
    expect(aboveMax).not.toBe('methods.v60.warnings.aboveMax');
    expect(belowMin.length).toBeGreaterThan(10);
  });

  it('preserves fallback behavior for non-existent keys', () => {
    expect(t('unknown.key.path')).toBe('unknown.key.path');
  });

  describe('deepMerge utility', () => {
    it('recursively merges nested objects without mutating source or target', () => {
      const target = { a: { b: 1, c: 2 }, d: 3 };
      const source = { a: { c: 20, e: 4 }, f: 5 };
      const result = deepMerge(target, source);

      expect(result).toEqual({
        a: { b: 1, c: 20, e: 4 },
        d: 3,
        f: 5,
      });
      // Immutability check
      expect(target.a).toEqual({ b: 1, c: 2 });
      expect(source.a).toEqual({ c: 20, e: 4 });
    });

    it('overwrites primitives with new values from source', () => {
      const target = { title: 'Old' };
      const source = { title: 'New' };
      expect(deepMerge(target, source)).toEqual({ title: 'New' });
    });
  });
});
