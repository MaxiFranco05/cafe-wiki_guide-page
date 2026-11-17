import type { BrewMethod, RangeThreshold } from '../schemas';

export type ThresholdStatus = 'ok' | 'below_min' | 'above_max' | 'invalid_input';

export type ThresholdBreachReason =
  | 'invalid_input'
  | 'coffee_below_min'
  | 'coffee_above_max'
  | 'water_below_min'
  | 'water_above_max';

export interface ThresholdEvaluationResult {
  readonly status: ThresholdStatus;
  readonly isValidInput: boolean;
  readonly warningKey: string | null;
  readonly breachedReasons: readonly ThresholdBreachReason[];
}

export type GrindTipAdjustment = 'finer' | 'standard' | 'coarser';

export interface GrindTipResult {
  readonly adjustment: GrindTipAdjustment;
  readonly tipKey: string;
  readonly baseGrindKey: string;
}

/**
 * Evaluates dry coffee weight and optional water volume against a method's
 * physical thresholds (RN-RG-01..03) without blocking calculations.
 */
export function evaluateRangeThresholds(
  thresholds: RangeThreshold,
  coffeeGrams: number,
  waterMl?: number
): ThresholdEvaluationResult {
  const isCoffeeValid = Number.isFinite(coffeeGrams) && coffeeGrams > 0;
  const isWaterValid = waterMl === undefined || (Number.isFinite(waterMl) && waterMl > 0);

  if (!isCoffeeValid || !isWaterValid) {
    return {
      status: 'invalid_input',
      isValidInput: false,
      warningKey: 'brew.warnings.invalidInput',
      breachedReasons: ['invalid_input'],
    };
  }

  const belowReasons: ThresholdBreachReason[] = [];
  if (coffeeGrams < thresholds.minCoffeeGrams) {
    belowReasons.push('coffee_below_min');
  }
  if (
    waterMl !== undefined &&
    thresholds.minWaterMl !== undefined &&
    waterMl < thresholds.minWaterMl
  ) {
    belowReasons.push('water_below_min');
  }

  if (belowReasons.length > 0) {
    return {
      status: 'below_min',
      isValidInput: true,
      warningKey: thresholds.warningMessageKeys.belowMinKey,
      breachedReasons: belowReasons,
    };
  }

  const aboveReasons: ThresholdBreachReason[] = [];
  if (coffeeGrams > thresholds.maxCoffeeGrams) {
    aboveReasons.push('coffee_above_max');
  }
  if (
    waterMl !== undefined &&
    thresholds.maxWaterMl !== undefined &&
    waterMl > thresholds.maxWaterMl
  ) {
    aboveReasons.push('water_above_max');
  }

  if (aboveReasons.length > 0) {
    return {
      status: 'above_max',
      isValidInput: true,
      warningKey: thresholds.warningMessageKeys.aboveMaxKey,
      breachedReasons: aboveReasons,
    };
  }

  return {
    status: 'ok',
    isValidInput: true,
    warningKey: null,
    breachedReasons: [],
  };
}

/**
 * Resolves a localized grind adjustment recommendation according to hydraulic bed depth (RN-BR-04).
 */
export function resolveGrindTip(
  method: Pick<BrewMethod, 'baseGrindKey' | 'thresholds'>,
  coffeeGrams: number
): GrindTipResult {
  if (
    Number.isFinite(coffeeGrams) &&
    coffeeGrams > 0 &&
    coffeeGrams < method.thresholds.smallDoseGrindTipThresholdGrams
  ) {
    return {
      adjustment: 'finer',
      tipKey: 'brew.grindTips.finer',
      baseGrindKey: method.baseGrindKey,
    };
  }

  if (
    Number.isFinite(coffeeGrams) &&
    coffeeGrams > method.thresholds.largeDoseGrindTipThresholdGrams
  ) {
    return {
      adjustment: 'coarser',
      tipKey: 'brew.grindTips.coarser',
      baseGrindKey: method.baseGrindKey,
    };
  }

  return {
    adjustment: 'standard',
    tipKey: method.baseGrindKey,
    baseGrindKey: method.baseGrindKey,
  };
}
