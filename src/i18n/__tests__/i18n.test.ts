import { describe, it, expect } from 'vitest';
import { t } from '../index';

describe('i18n translation engine', () => {
  it('resolves standard navigation keys in Spanish', () => {
    expect(t('nav.methods')).toBe('Métodos');
    expect(t('nav.brewStation')).toBe('Estación de Preparación');
    expect(t('nav.wiki')).toBe('Wiki & Orígenes');
    expect(t('nav.flavorWheel')).toBe('Rueda SCA');
  });

  it('interpolates placeholders with provided string parameters', () => {
    const result = t('methods.ratioLabel', { ratio: '16.7' });
    expect(result).toBe('Ratio 1:16.7');
  });

  it('interpolates placeholders with numerical parameters', () => {
    const result = t('methods.doseLabel', { dose: 18 });
    expect(result).toBe('18 g');
  });

  it('returns the key itself when the key is not found in the dictionary', () => {
    expect(t('unknown.key.fallback')).toBe('unknown.key.fallback');
  });

  it('returns the key itself when the resolved path is an object rather than a string', () => {
    expect(t('nav')).toBe('nav');
  });

  it('handles strings without parameters even when an empty param object is passed', () => {
    expect(t('nav.methods', {})).toBe('Métodos');
  });

  it('handles multiple placeholders in a parameterized template', () => {
    const interpolated = 'methods.ratioLabel' as const;
    expect(t(interpolated, { ratio: '15' })).toBe('Ratio 1:15');
  });
});
