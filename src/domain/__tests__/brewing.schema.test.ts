import { describe, it, expect } from 'vitest';
import {
  RangeThresholdSchema,
  SvgStageDirectiveSchema,
  BrewPhaseSchema,
  RecipeProfileSchema,
  BrewMethodSchema,
  type RangeThreshold,
  type SvgStageDirective,
  type BrewPhase,
  type RecipeProfile,
  type BrewMethod,
} from '../schemas';

describe('Brewing Domain Schemas', () => {
  const validThresholds: RangeThreshold = {
    minCoffeeGrams: 10,
    maxCoffeeGrams: 36,
    minWaterMl: 150,
    maxWaterMl: 600,
    smallDoseGrindTipThresholdGrams: 12,
    largeDoseGrindTipThresholdGrams: 30,
    warningMessageKeys: {
      belowMinKey: 'methods.v60.warnings.belowMin',
      aboveMaxKey: 'methods.v60.warnings.aboveMax',
    },
  };

  const validSvgDirective: SvgStageDirective = {
    vesselType: 'cone_v60',
    pourStream: 'spiral',
    agitator: 'none',
    plungerState: 'none',
    liquidFillStartRatio: 0,
    liquidFillEndRatio: 0.2,
    coffeeBedTurbulence: 'bubbling_bloom',
  };

  const validBloomPhase: BrewPhase = {
    id: 'bloom',
    order: 1,
    type: 'bloom',
    titleKey: 'methods.v60.phases.bloom.title',
    instructionKey: 'methods.v60.phases.bloom.instruction',
    startTimeSeconds: 0,
    endTimeSeconds: 45,
    waterShare: 0.2,
    svgDirective: validSvgDirective,
  };

  const validPourPhase: BrewPhase = {
    id: 'pour_1',
    order: 2,
    type: 'pour',
    titleKey: 'methods.v60.phases.pour1.title',
    instructionKey: 'methods.v60.phases.pour1.instruction',
    startTimeSeconds: 45,
    endTimeSeconds: 120,
    waterShare: 0.5,
    svgDirective: {
      ...validSvgDirective,
      pourStream: 'steady',
      liquidFillStartRatio: 0.2,
      liquidFillEndRatio: 0.7,
      coffeeBedTurbulence: 'active_slurry',
    },
  };

  const validDrawdownPhase: BrewPhase = {
    id: 'drawdown',
    order: 3,
    type: 'drawdown',
    titleKey: 'methods.v60.phases.drawdown.title',
    instructionKey: 'methods.v60.phases.drawdown.instruction',
    startTimeSeconds: 120,
    endTimeSeconds: 210,
    waterShare: 0.3,
    svgDirective: {
      ...validSvgDirective,
      pourStream: 'none',
      liquidFillStartRatio: 0.7,
      liquidFillEndRatio: 1.0,
      coffeeBedTurbulence: 'settled',
    },
  };

  const validProfileNormal: RecipeProfile = {
    id: 'normal',
    labelKey: 'methods.v60.profiles.normal.label',
    descriptionKey: 'methods.v60.profiles.normal.description',
    ratio: 16.67,
    referenceAuthor: 'James Hoffmann',
    totalDurationSeconds: 210,
    phases: [validBloomPhase, validPourPhase, validDrawdownPhase],
  };

  const validProfileLight: RecipeProfile = {
    ...validProfileNormal,
    id: 'light',
    labelKey: 'methods.v60.profiles.light.label',
    descriptionKey: 'methods.v60.profiles.light.description',
    ratio: 17,
  };

  const validProfileStrong: RecipeProfile = {
    ...validProfileNormal,
    id: 'strong',
    labelKey: 'methods.v60.profiles.strong.label',
    descriptionKey: 'methods.v60.profiles.strong.description',
    ratio: 15,
  };

  const validV60Method: BrewMethod = {
    id: 'v60',
    nameKey: 'methods.v60.name',
    category: 'pour_over',
    scalingMode: 'filter_water_ratio',
    defaultDoseGrams: 15,
    baseGrindKey: 'methods.v60.baseGrind',
    waterTempCelsius: { min: 90, max: 96, recommended: 93 },
    thresholds: validThresholds,
    profiles: [validProfileLight, validProfileNormal, validProfileStrong],
  };

  describe('RangeThresholdSchema', () => {
    it('parses valid range thresholds', () => {
      const result = RangeThresholdSchema.safeParse(validThresholds);
      expect(result.success).toBe(true);
    });

    it('rejects negative coffee grams', () => {
      const result = RangeThresholdSchema.safeParse({
        ...validThresholds,
        minCoffeeGrams: -5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects maxCoffeeGrams less than minCoffeeGrams', () => {
      const result = RangeThresholdSchema.safeParse({
        ...validThresholds,
        minCoffeeGrams: 30,
        maxCoffeeGrams: 20,
      });
      expect(result.success).toBe(false);
    });

    it('rejects maxWaterMl less than minWaterMl', () => {
      const result = RangeThresholdSchema.safeParse({
        ...validThresholds,
        minWaterMl: 500,
        maxWaterMl: 400,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SvgStageDirectiveSchema', () => {
    it('parses a valid SVG stage directive', () => {
      const result = SvgStageDirectiveSchema.safeParse(validSvgDirective);
      expect(result.success).toBe(true);
    });

    it('rejects liquid ratio greater than 1', () => {
      const result = SvgStageDirectiveSchema.safeParse({
        ...validSvgDirective,
        liquidFillEndRatio: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('BrewPhaseSchema', () => {
    it('parses a valid brew phase', () => {
      const result = BrewPhaseSchema.safeParse(validBloomPhase);
      expect(result.success).toBe(true);
    });

    it('rejects waterShare greater than 1', () => {
      const result = BrewPhaseSchema.safeParse({
        ...validBloomPhase,
        waterShare: 1.2,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RecipeProfileSchema', () => {
    it('parses a valid recipe profile', () => {
      const result = RecipeProfileSchema.safeParse(validProfileNormal);
      expect(result.success).toBe(true);
    });

    it('rejects profiles with non-contiguous phase timeline', () => {
      const brokenPhase: BrewPhase = {
        ...validPourPhase,
        startTimeSeconds: 50, // gap: bloom ended at 45
      };
      const result = RecipeProfileSchema.safeParse({
        ...validProfileNormal,
        phases: [validBloomPhase, brokenPhase, validDrawdownPhase],
      });
      expect(result.success).toBe(false);
    });

    it('rejects filter profiles where waterShare sum does not equal 1.0', () => {
      const brokenPhase: BrewPhase = {
        ...validDrawdownPhase,
        waterShare: 0.1, // sum becomes 0.2 + 0.5 + 0.1 = 0.8
      };
      const result = RecipeProfileSchema.safeParse({
        ...validProfileNormal,
        phases: [validBloomPhase, validPourPhase, brokenPhase],
      });
      expect(result.success).toBe(false);
    });

    it('tolerates floating-point precision when waterShare sum is within 1e-6 of 1.0', () => {
      // 0.2 + 0.5 + 0.3 in IEEE 754 is slightly off exact 1.0
      const phases: BrewPhase[] = [
        { ...validBloomPhase, waterShare: 0.2 },
        { ...validPourPhase, waterShare: 0.5 },
        { ...validDrawdownPhase, waterShare: 0.3 },
      ];
      const result = RecipeProfileSchema.safeParse({
        ...validProfileNormal,
        phases,
      });
      expect(result.success).toBe(true);
    });

    it('rejects waterShare sum outside 1e-6 tolerance (e.g. 1.0001 or 0.9999)', () => {
      const phases: BrewPhase[] = [
        { ...validBloomPhase, waterShare: 0.2 },
        { ...validPourPhase, waterShare: 0.5 },
        { ...validDrawdownPhase, waterShare: 0.3001 },
      ];
      const result = RecipeProfileSchema.safeParse({
        ...validProfileNormal,
        phases,
      });
      expect(result.success).toBe(false);
    });

    it('rejects profiles where first phase does not start at 0', () => {
      const delayedBloom: BrewPhase = {
        ...validBloomPhase,
        startTimeSeconds: 5,
        endTimeSeconds: 45,
      };
      const result = RecipeProfileSchema.safeParse({
        ...validProfileNormal,
        phases: [delayedBloom, validPourPhase, validDrawdownPhase],
      });
      expect(result.success).toBe(false);
    });

    it('rejects phases where endTime is less than or equal to startTime', () => {
      const negativeDurationPhase: BrewPhase = {
        ...validBloomPhase,
        startTimeSeconds: 0,
        endTimeSeconds: 0,
      };
      const result = RecipeProfileSchema.safeParse({
        ...validProfileNormal,
        phases: [negativeDurationPhase, validPourPhase, validDrawdownPhase],
      });
      expect(result.success).toBe(false);
    });

    it('rejects profiles where last phase endTime does not match totalDurationSeconds', () => {
      const result = RecipeProfileSchema.safeParse({
        ...validProfileNormal,
        totalDurationSeconds: 300, // phases end at 210
      });
      expect(result.success).toBe(false);
    });
  });

  describe('BrewMethodSchema & Invariants', () => {
    it('parses a valid method configuration', () => {
      const result = BrewMethodSchema.safeParse(validV60Method);
      expect(result.success).toBe(true);
    });

    it('accepts defaultDoseGrams exactly at minCoffeeGrams or maxCoffeeGrams boundary', () => {
      const atMin = BrewMethodSchema.safeParse({
        ...validV60Method,
        defaultDoseGrams: 10,
      });
      expect(atMin.success).toBe(true);

      const atMax = BrewMethodSchema.safeParse({
        ...validV60Method,
        defaultDoseGrams: 36,
      });
      expect(atMax.success).toBe(true);
    });

    it('rejects defaultDoseGrams slightly below min or above max', () => {
      const belowMin = BrewMethodSchema.safeParse({
        ...validV60Method,
        defaultDoseGrams: 9.9,
      });
      expect(belowMin.success).toBe(false);

      const aboveMax = BrewMethodSchema.safeParse({
        ...validV60Method,
        defaultDoseGrams: 36.1,
      });
      expect(aboveMax.success).toBe(false);
    });

    it('rejects methods with fewer than 3 profiles', () => {
      const result = BrewMethodSchema.safeParse({
        ...validV60Method,
        profiles: [validProfileLight, validProfileNormal],
      });
      expect(result.success).toBe(false);
    });

    it('rejects methods with duplicate profile IDs', () => {
      const result = BrewMethodSchema.safeParse({
        ...validV60Method,
        profiles: [validProfileLight, validProfileNormal, validProfileNormal],
      });
      expect(result.success).toBe(false);
    });

    it('rejects defaultDoseGrams outside [minCoffeeGrams, maxCoffeeGrams]', () => {
      const result = BrewMethodSchema.safeParse({
        ...validV60Method,
        defaultDoseGrams: 40, // max is 36
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('defaultDoseGrams'))).toBe(true);
      }
    });

    it('rejects invalid category', () => {
      const result = BrewMethodSchema.safeParse({
        ...validV60Method,
        category: 'percolator',
      });
      expect(result.success).toBe(false);
    });

    it('rejects methods with non-conforming profile taxonomy', () => {
      const invalidMethod: unknown = {
        ...validV60Method,
        profiles: [
          validProfileLight,
          validProfileNormal,
          { ...validProfileStrong, id: 'custom_strong' },
        ],
      };
      const result = BrewMethodSchema.safeParse(invalidMethod);
      expect(result.success).toBe(false);
    });

    it('requires espresso taxonomy for espresso methods', () => {
      const espressoMethod: BrewMethod = {
        id: 'espresso',
        nameKey: 'methods.espresso.name',
        category: 'pressure',
        scalingMode: 'espresso_yield_ratio',
        defaultDoseGrams: 18,
        baseGrindKey: 'methods.espresso.baseGrind',
        waterTempCelsius: { min: 90, max: 94, recommended: 93 },
        thresholds: {
          minCoffeeGrams: 14,
          maxCoffeeGrams: 22,
          smallDoseGrindTipThresholdGrams: 15,
          largeDoseGrindTipThresholdGrams: 20,
          warningMessageKeys: {
            belowMinKey: 'methods.espresso.warnings.belowMin',
            aboveMaxKey: 'methods.espresso.warnings.aboveMax',
          },
        },
        profiles: [
          {
            id: 'ristretto',
            labelKey: 'methods.espresso.profiles.ristretto.label',
            descriptionKey: 'methods.espresso.profiles.ristretto.description',
            ratio: 1.5,
            referenceAuthor: 'Italian Standard',
            totalDurationSeconds: 22,
            phases: [
              {
                id: 'shot',
                order: 1,
                type: 'espresso_shot',
                titleKey: 'methods.espresso.phases.shot.title',
                instructionKey: 'methods.espresso.phases.shot.instruction',
                startTimeSeconds: 0,
                endTimeSeconds: 22,
                waterShare: 1.0,
                svgDirective: {
                  ...validSvgDirective,
                  vesselType: 'portafilter_espresso',
                },
              },
            ],
          },
          {
            id: 'normale',
            labelKey: 'methods.espresso.profiles.normale.label',
            descriptionKey: 'methods.espresso.profiles.normale.description',
            ratio: 2.0,
            referenceAuthor: 'SCA Standard',
            totalDurationSeconds: 28,
            phases: [
              {
                id: 'shot',
                order: 1,
                type: 'espresso_shot',
                titleKey: 'methods.espresso.phases.shot.title',
                instructionKey: 'methods.espresso.phases.shot.instruction',
                startTimeSeconds: 0,
                endTimeSeconds: 28,
                waterShare: 1.0,
                svgDirective: {
                  ...validSvgDirective,
                  vesselType: 'portafilter_espresso',
                },
              },
            ],
          },
          {
            id: 'lungo',
            labelKey: 'methods.espresso.profiles.lungo.label',
            descriptionKey: 'methods.espresso.profiles.lungo.description',
            ratio: 3.0,
            referenceAuthor: 'SCA Standard',
            totalDurationSeconds: 34,
            phases: [
              {
                id: 'shot',
                order: 1,
                type: 'espresso_shot',
                titleKey: 'methods.espresso.phases.shot.title',
                instructionKey: 'methods.espresso.phases.shot.instruction',
                startTimeSeconds: 0,
                endTimeSeconds: 34,
                waterShare: 1.0,
                svgDirective: {
                  ...validSvgDirective,
                  vesselType: 'portafilter_espresso',
                },
              },
            ],
          },
        ],
      };

      const result = BrewMethodSchema.safeParse(espressoMethod);
      expect(result.success).toBe(true);

      const invalidEspresso = {
        ...espressoMethod,
        profiles: [validProfileLight, validProfileNormal, validProfileStrong],
      };
      const invalidResult = BrewMethodSchema.safeParse(invalidEspresso);
      expect(invalidResult.success).toBe(false);
    });
  });
});
