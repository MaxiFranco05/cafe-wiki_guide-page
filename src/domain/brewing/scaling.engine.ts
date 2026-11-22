import type {
  BrewMethod,
  BrewPhase,
  BrewRecipe,
  BrewRecipePhase,
  RecipeProfile,
} from '../schemas';
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

export interface ScaledBrewPhase extends BrewRecipePhase {
  readonly phaseWaterGrams: number;
  readonly targetCumulativeGrams: number;
}

export interface ScaledRecipeResult {
  readonly methodId: BrewMethod['id'];
  readonly profileId: RecipeProfile['id'];
  readonly recipeId?: string;
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

function resolveRecipeRatio(
  recipe: BrewRecipe,
  requestedProfileId: RecipeProfile['id'],
  isEspresso: boolean
): { readonly profileId: RecipeProfile['id']; readonly ratio: number } {
  const ratios = recipe.intensityRatios;
  if ('ristretto' in ratios) {
    if (
      requestedProfileId === 'ristretto' ||
      requestedProfileId === 'normale' ||
      requestedProfileId === 'lungo'
    ) {
      return { profileId: requestedProfileId, ratio: ratios[requestedProfileId] };
    }
    return { profileId: 'normale', ratio: ratios.normale };
  }

  if (
    requestedProfileId === 'light' ||
    requestedProfileId === 'normal' ||
    requestedProfileId === 'strong'
  ) {
    return { profileId: requestedProfileId, ratio: ratios[requestedProfileId] };
  }
  return {
    profileId: isEspresso ? 'normale' : 'normal',
    ratio: ratios.normal,
  };
}

function scalePhasesWithReconciliation(
  phases: readonly (BrewPhase | BrewRecipePhase)[],
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
 * Bidirectionally scales dry coffee <-> water for a method, intensity profile,
 * and optional catalog/custom BrewRecipe (RN-BR-01..03).
 */
export function calculateScaledRecipe(
  method: BrewMethod,
  profileId: RecipeProfile['id'],
  input?: ScalingInput,
  recipe?: BrewRecipe
): ScaledRecipeResult {
  const isEspresso = method.scalingMode === 'espresso_yield_ratio';

  let activeProfileId: RecipeProfile['id'];
  let activeRatio: number;
  let activePhases: readonly (BrewPhase | BrewRecipePhase)[];
  let activeDurationSeconds: number;
  let activeWaterTemp: BrewMethod['waterTempCelsius'];
  let activeDefaultDose: number;

  if (recipe) {
    const resolved = resolveRecipeRatio(recipe, profileId, isEspresso);
    activeProfileId = resolved.profileId;
    activeRatio = resolved.ratio;
    activePhases = recipe.phases;
    activeDurationSeconds = recipe.totalDurationSeconds;
    activeWaterTemp = recipe.waterTempCelsius ?? method.waterTempCelsius;
    activeDefaultDose = recipe.defaultDoseGrams ?? method.defaultDoseGrams;
  } else {
    const profile = resolveActiveProfile(method, profileId);
    activeProfileId = profile.id;
    activeRatio = profile.ratio;
    activePhases = profile.phases;
    activeDurationSeconds = profile.totalDurationSeconds;
    activeWaterTemp = method.waterTempCelsius;
    activeDefaultDose = method.defaultDoseGrams;
  }

  let coffeeGrams = 0;
  let totalWaterMl = 0;
  let evalCoffee = 0;
  let evalWater: number | undefined;

  if (input && input.coffeeGrams !== undefined) {
    evalCoffee = input.coffeeGrams;
    if (isPositiveFinite(input.coffeeGrams)) {
      coffeeGrams = roundToOneDecimal(input.coffeeGrams);
      totalWaterMl = isEspresso
        ? roundToOneDecimal(coffeeGrams * activeRatio)
        : Math.round(coffeeGrams * activeRatio);
      evalWater = isEspresso ? undefined : totalWaterMl;
    }
  } else if (input && input.waterMl !== undefined) {
    evalWater = input.waterMl;
    if (isPositiveFinite(input.waterMl)) {
      totalWaterMl = isEspresso ? roundToOneDecimal(input.waterMl) : Math.round(input.waterMl);
      coffeeGrams = roundToOneDecimal(totalWaterMl / activeRatio);
      evalCoffee = coffeeGrams;
    } else {
      evalCoffee = activeDefaultDose;
    }
  } else {
    coffeeGrams = roundToOneDecimal(activeDefaultDose);
    totalWaterMl = isEspresso
      ? roundToOneDecimal(coffeeGrams * activeRatio)
      : Math.round(coffeeGrams * activeRatio);
    evalCoffee = coffeeGrams;
    evalWater = isEspresso ? undefined : totalWaterMl;
  }

  const thresholdEvaluation = evaluateRangeThresholds(method.thresholds, evalCoffee, evalWater);
  if (!thresholdEvaluation.isValidInput) {
    coffeeGrams = 0;
    totalWaterMl = 0;
  }

  const phases = scalePhasesWithReconciliation(activePhases, totalWaterMl, isEspresso);
  const grindTip = resolveGrindTip(method, coffeeGrams);

  return {
    methodId: method.id,
    profileId: activeProfileId,
    ...(recipe ? { recipeId: recipe.id } : {}),
    scalingMode: method.scalingMode,
    ratio: activeRatio,
    coffeeGrams,
    totalWaterMl,
    tablespoons: estimateTablespoons(coffeeGrams),
    totalDurationSeconds: activeDurationSeconds,
    waterTempCelsius: activeWaterTemp,
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
  doseGrams: number = method.defaultDoseGrams,
  recipe?: BrewRecipe
): readonly EspressoStyleResult[] {
  const safeDose = isPositiveFinite(doseGrams) ? roundToOneDecimal(doseGrams) : 0;
  const styleOrder: readonly ('ristretto' | 'normale' | 'lungo')[] = [
    'ristretto',
    'normale',
    'lungo',
  ];

  return styleOrder.map((styleId) => {
    const profile = resolveActiveProfile(method, styleId);
    const ratio =
      recipe && 'ristretto' in recipe.intensityRatios
        ? recipe.intensityRatios[styleId]
        : profile.ratio;
    const activePhases = recipe ? recipe.phases : profile.phases;
    const totalDurationSeconds = recipe ? recipe.totalDurationSeconds : profile.totalDurationSeconds;
    const yieldGrams = safeDose > 0 ? roundToOneDecimal(safeDose * ratio) : 0;
    const phases = scalePhasesWithReconciliation(activePhases, yieldGrams, true);

    return {
      profileId: styleId,
      labelKey: profile.labelKey,
      descriptionKey: profile.descriptionKey,
      ratio,
      doseGrams: safeDose,
      yieldGrams,
      targetWindowSeconds: ESPRESSO_TARGET_WINDOWS[styleId],
      totalDurationSeconds,
      phases,
    };
  });
}
