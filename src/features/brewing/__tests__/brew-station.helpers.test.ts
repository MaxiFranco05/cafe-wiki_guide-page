import { describe, it, expect } from 'vitest';
import {
  METHODS_CATALOG,
  v60Method,
  espressoMethod,
  chemexMethod,
} from '../../../data/methods';
import {
  resolveInitialProfileId,
  parseSanitizedBrewInput,
  getMethodVisualAsset,
  formatBrewNumber,
  formatMinutesSeconds,
  formatPaddedClock,
  getMethodVesselType,
} from '../utils/brew-station.helpers';

describe('brew-station.helpers (C-05 Pure Helpers)', () => {
  describe('resolveInitialProfileId', () => {
    it('returns default profile ("normal" or "normale") when query param is null or empty', () => {
      expect(resolveInitialProfileId(v60Method, null)).toBe('normal');
      expect(resolveInitialProfileId(v60Method, '')).toBe('normal');
      expect(resolveInitialProfileId(espressoMethod, null)).toBe('normale');
      expect(resolveInitialProfileId(chemexMethod, null)).toBe('normal');
    });

    it('accepts a whitelisted profile matching the method scaling mode', () => {
      expect(resolveInitialProfileId(v60Method, 'light')).toBe('light');
      expect(resolveInitialProfileId(v60Method, 'strong')).toBe('strong');
      expect(resolveInitialProfileId(espressoMethod, 'ristretto')).toBe('ristretto');
      expect(resolveInitialProfileId(espressoMethod, 'lungo')).toBe('lungo');
    });

    it('rejects cross-method or unrecognized ?profile values and falls back safely', () => {
      expect(resolveInitialProfileId(v60Method, 'ristretto')).toBe('normal');
      expect(resolveInitialProfileId(v60Method, 'invalid-tier')).toBe('normal');
      expect(resolveInitialProfileId(espressoMethod, 'light')).toBe('normale');
      expect(resolveInitialProfileId(espressoMethod, '<script>')).toBe('normale');
    });
  });

  describe('parseSanitizedBrewInput', () => {
    it('returns positive finite numbers up to 2000 with 1 decimal precision', () => {
      expect(parseSanitizedBrewInput('15')).toEqual({ isValid: true, value: 15 });
      expect(parseSanitizedBrewInput('15.5')).toEqual({ isValid: true, value: 15.5 });
      expect(parseSanitizedBrewInput('15,5')).toEqual({ isValid: true, value: 15.5 });
      expect(parseSanitizedBrewInput('0.5')).toEqual({ isValid: true, value: 0.5 });
      expect(parseSanitizedBrewInput(' 22.36 ')).toEqual({ isValid: true, value: 22.4 });
    });

    it('clamps excessively large values above 2000 to 2000 safely', () => {
      expect(parseSanitizedBrewInput('2500')).toEqual({ isValid: true, value: 2000 });
      expect(parseSanitizedBrewInput('999999')).toEqual({ isValid: true, value: 2000 });
    });

    it('returns isValid: false for empty, zero, negative, or non-finite input', () => {
      expect(parseSanitizedBrewInput('')).toEqual({ isValid: false, value: 0 });
      expect(parseSanitizedBrewInput('   ')).toEqual({ isValid: false, value: 0 });
      expect(parseSanitizedBrewInput('0')).toEqual({ isValid: false, value: 0 });
      expect(parseSanitizedBrewInput('-10')).toEqual({ isValid: false, value: 0 });
      expect(parseSanitizedBrewInput('abc')).toEqual({ isValid: false, value: 0 });
      expect(parseSanitizedBrewInput('NaN')).toEqual({ isValid: false, value: 0 });
      expect(parseSanitizedBrewInput('Infinity')).toEqual({ isValid: false, value: 0 });
    });
  });

  describe('getMethodVisualAsset', () => {
    it('resolves valid visual asset metadata for all 6 methods in catalog', () => {
      for (const method of METHODS_CATALOG) {
        const asset = getMethodVisualAsset(method.id);
        expect(asset.imageSrc).toMatch(/^\/images\/coffee\/.+\.jpg$/);
      }
      expect(getMethodVisualAsset('melitta').objectPosition).toBe('center bottom');
    });
  });

  describe('formatBrewNumber', () => {
    it('formats integers without trailing .0 and keeps single decimals cleanly', () => {
      expect(formatBrewNumber(15)).toBe('15');
      expect(formatBrewNumber(15.0)).toBe('15');
      expect(formatBrewNumber(16.7)).toBe('16.7');
      expect(formatBrewNumber(0)).toBe('0');
    });
  });

  describe('clock formatting & vessel mapping', () => {
    it('formats unpadded timeline markers and zero-padded benchtop clock consistently', () => {
      expect(formatMinutesSeconds(0)).toBe('0:00');
      expect(formatMinutesSeconds(45)).toBe('0:45');
      expect(formatMinutesSeconds(210)).toBe('3:30');
      expect(formatPaddedClock(22)).toBe('00:22');
      expect(formatPaddedClock(210)).toBe('03:30');
      expect(formatPaddedClock(-5)).toBe('00:00');
    });

    it('maps each brew method to its primary SVG vessel type', () => {
      expect(getMethodVesselType(v60Method)).toBe('cone_v60');
      expect(getMethodVesselType(espressoMethod)).toBe('portafilter_espresso');
      expect(getMethodVesselType(chemexMethod)).toBe('hourglass_chemex');
    });
  });
});
