import { describe, it, expect } from 'vitest';
import {
  evaluateRangeThresholds,
  resolveGrindTip,
} from '../thresholds/threshold.validator';
import { METHODS_CATALOG, v60Method, espressoMethod } from '../../data/methods';
import { t } from '../../i18n';

describe('threshold.validator (RN-RG-01..03 & RN-BR-04)', () => {
  describe('evaluateRangeThresholds', () => {
    it('prioritizes invalid_input when coffee or water is non-positive, NaN, or Infinity', () => {
      const zeroCoffee = evaluateRangeThresholds(v60Method.thresholds, 0, 250);
      expect(zeroCoffee.status).toBe('invalid_input');
      expect(zeroCoffee.isValidInput).toBe(false);
      expect(zeroCoffee.warningKey).toBe('brew.warnings.invalidInput');
      expect(zeroCoffee.breachedReasons).toContain('invalid_input');

      const negWater = evaluateRangeThresholds(v60Method.thresholds, 15, -10);
      expect(negWater.status).toBe('invalid_input');
      expect(negWater.isValidInput).toBe(false);

      const nanCoffee = evaluateRangeThresholds(v60Method.thresholds, Number.NaN, 250);
      expect(nanCoffee.status).toBe('invalid_input');

      const infWater = evaluateRangeThresholds(v60Method.thresholds, 15, Number.POSITIVE_INFINITY);
      expect(infWater.status).toBe('invalid_input');
    });

    it('triggers below_min warning non-blockingly when coffee or water falls under minimum', () => {
      const belowCoffee = evaluateRangeThresholds(v60Method.thresholds, 9.9, 250);
      expect(belowCoffee.status).toBe('below_min');
      expect(belowCoffee.isValidInput).toBe(true);
      expect(belowCoffee.warningKey).toBe('methods.v60.warnings.belowMin');
      expect(belowCoffee.breachedReasons).toContain('coffee_below_min');

      const belowWater = evaluateRangeThresholds(v60Method.thresholds, 12, 149);
      expect(belowWater.status).toBe('below_min');
      expect(belowWater.isValidInput).toBe(true);
      expect(belowWater.warningKey).toBe('methods.v60.warnings.belowMin');
      expect(belowWater.breachedReasons).toContain('water_below_min');
    });

    it('triggers above_max warning non-blockingly when coffee or water exceeds maximum', () => {
      const aboveCoffee = evaluateRangeThresholds(v60Method.thresholds, 36.1, 500);
      expect(aboveCoffee.status).toBe('above_max');
      expect(aboveCoffee.isValidInput).toBe(true);
      expect(aboveCoffee.warningKey).toBe('methods.v60.warnings.aboveMax');
      expect(aboveCoffee.breachedReasons).toContain('coffee_above_max');

      const aboveWater = evaluateRangeThresholds(v60Method.thresholds, 35, 601);
      expect(aboveWater.status).toBe('above_max');
      expect(aboveWater.isValidInput).toBe(true);
      expect(aboveWater.warningKey).toBe('methods.v60.warnings.aboveMax');
      expect(aboveWater.breachedReasons).toContain('water_above_max');
    });

    it('accepts exact boundary min and max values across all 6 MVP methods as ok', () => {
      for (const method of METHODS_CATALOG) {
        const minRes = evaluateRangeThresholds(
          method.thresholds,
          method.thresholds.minCoffeeGrams,
          method.thresholds.minWaterMl
        );
        expect(minRes).toEqual({
          status: 'ok',
          isValidInput: true,
          warningKey: null,
          breachedReasons: [],
        });

        const maxRes = evaluateRangeThresholds(
          method.thresholds,
          method.thresholds.maxCoffeeGrams,
          method.thresholds.maxWaterMl
        );
        expect(maxRes).toEqual({
          status: 'ok',
          isValidInput: true,
          warningKey: null,
          breachedReasons: [],
        });
      }
    });

    it('handles espresso without minWaterMl/maxWaterMl cleanly', () => {
      expect(evaluateRangeThresholds(espressoMethod.thresholds, 14)).toEqual({
        status: 'ok',
        isValidInput: true,
        warningKey: null,
        breachedReasons: [],
      });
      expect(evaluateRangeThresholds(espressoMethod.thresholds, 13.9).status).toBe('below_min');
      expect(evaluateRangeThresholds(espressoMethod.thresholds, 22.1).status).toBe('above_max');
    });
  });

  describe('resolveGrindTip', () => {
    it('resolves finer, standard, and coarser adjustments based on hydraulic bed thresholds', () => {
      const finer = resolveGrindTip(v60Method, 11.5);
      expect(finer).toEqual({
        adjustment: 'finer',
        tipKey: 'brew.grindTips.finer',
        baseGrindKey: 'methods.v60.baseGrind',
      });

      const minEdge = resolveGrindTip(v60Method, 12);
      expect(minEdge.adjustment).toBe('standard');
      expect(minEdge.tipKey).toBe('methods.v60.baseGrind');

      const midRange = resolveGrindTip(v60Method, 15);
      expect(midRange).toEqual({
        adjustment: 'standard',
        tipKey: 'methods.v60.baseGrind',
        baseGrindKey: 'methods.v60.baseGrind',
      });

      const maxEdge = resolveGrindTip(v60Method, 30);
      expect(maxEdge.adjustment).toBe('standard');

      const coarser = resolveGrindTip(v60Method, 31);
      expect(coarser).toEqual({
        adjustment: 'coarser',
        tipKey: 'brew.grindTips.coarser',
        baseGrindKey: 'methods.v60.baseGrind',
      });
    });

    it('resolves all returned warningKey and tipKey values against Spanish dictionary', () => {
      for (const method of METHODS_CATALOG) {
        const below = evaluateRangeThresholds(method.thresholds, method.thresholds.minCoffeeGrams - 1);
        const above = evaluateRangeThresholds(method.thresholds, method.thresholds.maxCoffeeGrams + 1);
        const invalid = evaluateRangeThresholds(method.thresholds, 0);

        if (below.warningKey) expect(t(below.warningKey)).not.toBe(below.warningKey);
        if (above.warningKey) expect(t(above.warningKey)).not.toBe(above.warningKey);
        if (invalid.warningKey) expect(t(invalid.warningKey)).not.toBe(invalid.warningKey);

        for (const dose of [1, method.defaultDoseGrams, 100]) {
          const tip = resolveGrindTip(method, dose);
          expect(t(tip.tipKey)).not.toBe(tip.tipKey);
          expect(t(tip.baseGrindKey)).not.toBe(tip.baseGrindKey);
        }
      }
      expect(t('brew.grindTips.standard')).not.toBe('brew.grindTips.standard');
    });
  });
});
