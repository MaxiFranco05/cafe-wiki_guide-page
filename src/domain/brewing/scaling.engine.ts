import type { BrewMethod, BrewPhase, RecipeProfile } from '../schemas';
import {
  evaluateRangeThresholds,
  resolveGrindTip,
  type GrindTipResult,
  type ThresholdEvaluationResult,
} from '../thresholds';

export const GRAMS_PER_TABLESPOON = 7.5;

export interface ScalingInput {
  readonly coffeeGrams?: number;
  readonly waterMl?: number;
}

export interface ScaledBrewPhase extends BrewPhase {
  readonly phaseWaterGrams: number;
  readonly targetCumulativeGrams: number;
}

export interface ScaledRecipeResult {
  readonly methodId: BrewMethod['id'];
  readonly profileId: RecipeProfile['id'];
  readonly scalingMode: BrewMethod['scalingMode'];
  readonly ratio: number;
  readonly coffeeGrams: number;
  readonly totalWaterMl: number;
  readonly tablespoons: number;
  readonly totalDurationSeconds: number;
  readonly waterTempCelsius: BrewMethod['waterTempCelsius'];
  readonly phases: readonly ScaledBrewPhase[];
  readonly thresholdEvaluation: ThresholdEvaluationResult;
  readonly grindTip: GrindTipResult;
}

export interface EspressoTargetWindow {
  readonly min: number;
  readonly max: number;
}

export interface EspressoStyleResult {
  readonly profileId: 'ristretto' | 'normale' | 'lungo';
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly ratio: number;
  readonly doseGrams: number;
  readonly yieldGrams: number;
  readonly targetWindowSeconds: EspressoTargetWindow;
  readonly totalDurationSeconds: number;
  readonly phases: readonly ScaledBrewPhase[];
}

const ESPRESSO_TARGET_WINDOWS: Readonly<
  Record<'ristretto' | 'normale' | 'lungo', EspressoTargetWindow>
> = {
  ristretto: { min: 20, max: 25 },
  normale: { min: 25, max: 30 },
  lungo: { min: 30, max: 35 },
};

/**
 * Rounds a floating-point number to 1 decimal place safely avoiding IEEE 754 drift.
 */
export function roundToOneDecimal(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/**
 * Converts dry coffee weight in grams into orientative tablespoons (7.5 g standard, SU-01).
 */
export function estimateTablespoons(coffeeGrams: number): number {
  if (!Number.isFinite(coffeeGrams) || coffeeGrams <= 0) {
    return 0;
  }
  return roundToOneDecimal(coffeeGrams / GRAMS_PER_TABLESPOON);
}

function resolveActiveProfile(
  method: BrewMethod,
  requestedProfileId: RecipeProfile['id']
): RecipeProfile {
  const exact = method.profiles.find((p) => p.id === requestedProfileId);
  if (exact) return exact;

  const defaultId = method.scalingMode === 'espresso_yield_ratio' ? 'normale' : 'normal';
  const fallback = method.profiles.find((p) => p.id === defaultId) ?? method.profiles[0];
  if (!fallback) {
    throw new Error(`BrewMethod "${method.id}" contains no recipe profiles.`);
  }
  return fallback;
}

function scalePhasesWithReconciliation(
  phases: readonly BrewPhase[],
  totalAmount: number,
  isEspresso: boolean
): readonly ScaledBrewPhase[] {
  if (totalAmount <= 0 || !Number.isFinite(totalAmount)) {
    return phases.map((phase) => ({
      ...phase,
      phaseWaterGrams: 0,
      targetCumulativeGrams: 0,
    }));
  }

  let lastPourIndex = -1;
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (phase && phase.waterShare > 0) {
      lastPourIndex = i;
    }
  }

  let distributedBeforeLastPour = 0;
  let cumulative = 0;

  return phases.map((phase, index) => {
    let phaseWaterGrams = 0;

    if (phase.waterShare > 0) {
      if (index === lastPourIndex) {
        const residual = totalAmount - distributedBeforeLastPour;
        phaseWaterGrams = isEspresso
          ? roundToOneDecimal(residual)
          : Math.round(residual);
      } else {
        phaseWaterGrams = isEspresso
          ? roundToOneDecimal(totalAmount * phase.waterShare)
          : Math.round(totalAmount * phase.waterShare);
        distributedBeforeLastPour += phaseWaterGrams;
      }
    }

    cumulative = isEspresso
      ? roundToOneDecimal(cumulative + phaseWaterGrams)
      : cumulative + phaseWaterGrams;

    return {
      ...phase,
      phaseWaterGrams,
      targetCumulativeGrams: cumulative,
    };
  });
}

function isPositiveFinite(val: number | undefined): val is number {
  return val !== undefined && Number.isFinite(val) && val > 0;
}

/**
 * Bidirectionally scales dry coffee <-> water for a method and profile (RN-BR-01..03).
 */
export function calculateScaledRecipe(
  method: BrewMethod,
  profileId: RecipeProfile['id'],
  input?: ScalingInput
): ScaledRecipeResult {
  const profile = resolveActiveProfile(method, profileId);
  const isEspresso = method.scalingMode === 'espresso_yield_ratio';

  let coffeeGrams = 0;
  let totalWaterMl = 0;
  let evalCoffee = 0;
  let evalWater: number | undefined;

  if (input && input.coffeeGrams !== undefined) {
    evalCoffee = input.coffeeGrams;
    if (isPositiveFinite(input.coffeeGrams)) {
      coffeeGrams = roundToOneDecimal(input.coffeeGrams);
      totalWaterMl = isEspresso
        ? roundToOneDecimal(coffeeGrams * profile.ratio)
        : Math.round(coffeeGrams * profile.ratio);
      evalWater = isEspresso ? undefined : totalWaterMl;
    }
  } else if (input && input.waterMl !== undefined) {
    evalWater = input.waterMl;
    if (isPositiveFinite(input.waterMl)) {
      totalWaterMl = isEspresso ? roundToOneDecimal(input.waterMl) : Math.round(input.waterMl);
      coffeeGrams = roundToOneDecimal(totalWaterMl / profile.ratio);
      evalCoffee = coffeeGrams;
    } else {
      evalCoffee = method.defaultDoseGrams;
    }
  } else {
    coffeeGrams = roundToOneDecimal(method.defaultDoseGrams);
    totalWaterMl = isEspresso
      ? roundToOneDecimal(coffeeGrams * profile.ratio)
      : Math.round(coffeeGrams * profile.ratio);
    evalCoffee = coffeeGrams;
    evalWater = isEspresso ? undefined : totalWaterMl;
  }

  const thresholdEvaluation = evaluateRangeThresholds(method.thresholds, evalCoffee, evalWater);
  if (!thresholdEvaluation.isValidInput) {
    coffeeGrams = 0;
    totalWaterMl = 0;
  }

  const phases = scalePhasesWithReconciliation(profile.phases, totalWaterMl, isEspresso);
  const grindTip = resolveGrindTip(method, coffeeGrams);

  return {
    methodId: method.id,
    profileId: profile.id,
    scalingMode: method.scalingMode,
    ratio: profile.ratio,
    coffeeGrams,
    totalWaterMl,
    tablespoons: estimateTablespoons(coffeeGrams),
    totalDurationSeconds: profile.totalDurationSeconds,
    waterTempCelsius: method.waterTempCelsius,
    phases,
    thresholdEvaluation,
    grindTip,
  };
}

/**
 * Computes Ristretto (1:1.5), Normale (1:2.0), and Lungo (1:3.0) espresso yields simultaneously (RN-BR-06).
 */
export function calculateEspressoStyles(
  method: BrewMethod,
  doseGrams: number = method.defaultDoseGrams
): readonly EspressoStyleResult[] {
  const safeDose = isPositiveFinite(doseGrams) ? roundToOneDecimal(doseGrams) : 0;
  const styleOrder: readonly ('ristretto' | 'normale' | 'lungo')[] = [
    'ristretto',
    'normale',
    'lungo',
  ];

  return styleOrder.map((styleId) => {
    const profile = resolveActiveProfile(method, styleId);
    const yieldGrams = safeDose > 0 ? roundToOneDecimal(safeDose * profile.ratio) : 0;
    const phases = scalePhasesWithReconciliation(profile.phases, yieldGrams, true);

    return {
      profileId: styleId,
      labelKey: profile.labelKey,
      descriptionKey: profile.descriptionKey,
      ratio: profile.ratio,
      doseGrams: safeDose,
      yieldGrams,
      targetWindowSeconds: ESPRESSO_TARGET_WINDOWS[styleId],
      totalDurationSeconds: profile.totalDurationSeconds,
      phases,
    };
  });
}
