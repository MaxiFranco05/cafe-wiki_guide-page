import { describe, it, expect } from 'vitest';
import {
  GRAMS_PER_TABLESPOON,
  roundToOneDecimal,
  estimateTablespoons,
  calculateScaledRecipe,
  calculateEspressoStyles,
} from '../brewing/scaling.engine';
import {
  METHODS_CATALOG,
  v60Method,
  chemexMethod,
  melittaMethod,
  aeropressMethod,
  frenchPressMethod,
  espressoMethod,
} from '../../data/methods';

describe('scaling.engine (RN-BR-01..06 & SU-01)', () => {
  describe('roundToOneDecimal & estimateTablespoons', () => {
    it('rounds numbers safely to 1 decimal place mitigating IEEE 754 drift', () => {
      expect(roundToOneDecimal(1.005 * 2)).toBe(2.0);
      expect(roundToOneDecimal(25.5)).toBe(25.5);
      expect(roundToOneDecimal(22 / 7.5)).toBe(2.9);
    });

    it('estimates tablespoons using calibrated 7.5 g standard', () => {
      expect(GRAMS_PER_TABLESPOON).toBe(7.5);
      expect(estimateTablespoons(15)).toBe(2);
      expect(estimateTablespoons(18)).toBe(2.4);
      expect(estimateTablespoons(22)).toBe(2.9);
      expect(estimateTablespoons(0)).toBe(0);
      expect(estimateTablespoons(-5)).toBe(0);
      expect(estimateTablespoons(Number.NaN)).toBe(0);
    });
  });

  describe('calculateScaledRecipe (Bidirectional Scaling & Phase Reconciliation)', () => {
    it('scales water from coffeeGrams and defaults to method.defaultDoseGrams when input omitted', () => {
      const defaultV60 = calculateScaledRecipe(v60Method, 'normal');
      expect(defaultV60.methodId).toBe('v60');
      expect(defaultV60.profileId).toBe('normal');
      expect(defaultV60.coffeeGrams).toBe(15);
      expect(defaultV60.totalWaterMl).toBe(250);
      expect(defaultV60.tablespoons).toBe(2);
      expect(defaultV60.thresholdEvaluation.status).toBe('ok');
      expect(defaultV60.grindTip.adjustment).toBe('standard');

      const scaledV60 = calculateScaledRecipe(v60Method, 'normal', { coffeeGrams: 22 });
      expect(scaledV60.coffeeGrams).toBe(22);
      expect(scaledV60.totalWaterMl).toBe(367);
    });

    it('scales dry coffee from waterMl rounded to 0.1 g', () => {
      const fromWaterV60 = calculateScaledRecipe(v60Method, 'normal', { waterMl: 367 });
      expect(fromWaterV60.totalWaterMl).toBe(367);
      expect(fromWaterV60.coffeeGrams).toBe(22.0);

      const fromWaterChemex = calculateScaledRecipe(chemexMethod, 'normal', { waterMl: 250 });
      expect(fromWaterChemex.totalWaterMl).toBe(250);
      expect(fromWaterChemex.coffeeGrams).toBe(15.6);
    });

    it('reconciles ±1 g rounding drift on the final pour phase so sum(phaseWaterGrams) === totalWaterMl', () => {
      for (const method of [
        v60Method,
        chemexMethod,
        melittaMethod,
        aeropressMethod,
        frenchPressMethod,
      ]) {
        for (const profile of method.profiles) {
          for (const dose of [11, 13, 17, 22, 23, 31, 47]) {
            const res = calculateScaledRecipe(method, profile.id, { coffeeGrams: dose });
            const sumPhases = res.phases.reduce((acc, p) => acc + p.phaseWaterGrams, 0);
            expect(sumPhases).toBe(res.totalWaterMl);

            // Wait/drawdown/plunge phases (waterShare === 0) must keep 0 water added and maintain cumulative water
            const zeroSharePhases = res.phases.filter((p) => p.waterShare === 0);
            for (const p of zeroSharePhases) {
              expect(p.phaseWaterGrams).toBe(0);
              expect(p.targetCumulativeGrams).toBe(res.totalWaterMl);
            }

            const lastPhase = res.phases[res.phases.length - 1];
            expect(lastPhase?.targetCumulativeGrams).toBe(res.totalWaterMl);
          }
        }
      }
    });

    it('preserves fixed phase timestamps (startTimeSeconds, endTimeSeconds, totalDurationSeconds)', () => {
      const baseNormal = v60Method.profiles.find((p) => p.id === 'normal');
      const small = calculateScaledRecipe(v60Method, 'normal', { coffeeGrams: 12 });
      const large = calculateScaledRecipe(v60Method, 'normal', { coffeeGrams: 32 });

      expect(small.totalDurationSeconds).toBe(210);
      expect(large.totalDurationSeconds).toBe(210);
      expect(small.phases.map((p) => [p.startTimeSeconds, p.endTimeSeconds])).toEqual(
        baseNormal?.phases.map((p) => [p.startTimeSeconds, p.endTimeSeconds])
      );
      expect(large.phases.map((p) => [p.startTimeSeconds, p.endTimeSeconds])).toEqual(
        baseNormal?.phases.map((p) => [p.startTimeSeconds, p.endTimeSeconds])
      );
    });

    it('sanitizes invalid inputs to zero without throwing and marks invalid_input', () => {
      for (const bad of [
        { coffeeGrams: 0 },
        { coffeeGrams: -5 },
        { coffeeGrams: Number.NaN },
        { waterMl: 0 },
        { waterMl: -100 },
      ]) {
        const res = calculateScaledRecipe(v60Method, 'normal', bad);
        expect(res.coffeeGrams).toBe(0);
        expect(res.totalWaterMl).toBe(0);
        expect(res.tablespoons).toBe(0);
        expect(res.thresholdEvaluation.status).toBe('invalid_input');
        expect(res.thresholdEvaluation.isValidInput).toBe(false);
        expect(res.phases.every((p) => p.phaseWaterGrams === 0)).toBe(true);
      }
    });

    it('falls back safely to default profile when unknown profileId is supplied', () => {
      const res = calculateScaledRecipe(v60Method, 'nonexistent' as never, { coffeeGrams: 15 });
      expect(res.profileId).toBe('normal');
      expect(res.totalWaterMl).toBe(250);
    });

    it('keeps catalog objects completely immutable (Object.isFrozen compatibility)', () => {
      const frozenMethod = Object.freeze({ ...v60Method });
      const res = calculateScaledRecipe(frozenMethod, 'normal', { coffeeGrams: 18 });
      expect(res.coffeeGrams).toBe(18);
      expect(METHODS_CATALOG).toHaveLength(6);
    });
  });

  describe('calculateEspressoStyles (RN-BR-06 & DD-03)', () => {
    it('computes Ristretto (1:1.5), Normale (1:2.0), and Lungo (1:3.0) simultaneously for 18 g', () => {
      const styles = calculateEspressoStyles(espressoMethod, 18);
      expect(styles).toHaveLength(3);

      const [ristretto, normale, lungo] = styles;
      expect(ristretto).toMatchObject({
        profileId: 'ristretto',
        ratio: 1.5,
        doseGrams: 18,
        yieldGrams: 27,
        targetWindowSeconds: { min: 20, max: 25 },
      });
      expect(normale).toMatchObject({
        profileId: 'normale',
        ratio: 2.0,
        doseGrams: 18,
        yieldGrams: 36,
        targetWindowSeconds: { min: 25, max: 30 },
      });
      expect(lungo).toMatchObject({
        profileId: 'lungo',
        ratio: 3.0,
        doseGrams: 18,
        yieldGrams: 54,
        targetWindowSeconds: { min: 30, max: 35 },
      });

      expect(ristretto?.phases[0]?.targetCumulativeGrams).toBe(27);
      expect(normale?.phases[0]?.targetCumulativeGrams).toBe(36);
      expect(lungo?.phases[0]?.targetCumulativeGrams).toBe(54);
    });

    it('preserves 1 decimal precision on odd espresso doses like 17 g (25.5 g yield)', () => {
      const [ristretto, normale, lungo] = calculateEspressoStyles(espressoMethod, 17);
      expect(ristretto?.yieldGrams).toBe(25.5);
      expect(ristretto?.phases[0]?.phaseWaterGrams).toBe(25.5);
      expect(normale?.yieldGrams).toBe(34);
      expect(lungo?.yieldGrams).toBe(51);
    });

    it('sanitizes invalid doseGrams <= 0 to 0 yield', () => {
      const styles = calculateEspressoStyles(espressoMethod, 0);
      expect(styles.every((s) => s.doseGrams === 0 && s.yieldGrams === 0)).toBe(true);
    });
  });
});
