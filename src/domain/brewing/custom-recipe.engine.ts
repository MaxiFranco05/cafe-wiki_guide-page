import {
  CUSTOM_RECIPE_EXPORT_SCHEMA_VERSION,
  CustomBrewRecipeSchema,
  CustomRecipeDraftSchema,
  CustomRecipeExportEnvelopeSchema,
  type BrewMethod,
  type BrewPhase,
  type BrewRecipe,
  type BrewRecipePhase,
  type CustomBrewRecipe,
  type CustomRecipeDraft,
  type IntensityRatios,
  type SvgStageDirective,
} from '../schemas';
import { roundToOneDecimal } from './scaling.engine';

const METHOD_VESSEL_MAP: Readonly<Record<BrewMethod['id'], SvgStageDirective['vesselType']>> = {
  v60: 'cone_v60',
  chemex: 'hourglass_chemex',
  melitta: 'wedge_melitta',
  aeropress: 'cylinder_aeropress',
  'french-press': 'beaker_french_press',
  espresso: 'portafilter_espresso',
};

export interface BuildCustomRecipeOptions {
  readonly nowIso?: string;
  readonly id?: string;
}

export type BuildCustomRecipeResult =
  | { readonly ok: true; readonly recipe: CustomBrewRecipe }
  | {
      readonly ok: false;
      readonly errorCode: 'invalid_draft' | 'method_mismatch' | 'zero_total_water';
      readonly issues: readonly string[];
    };

export type ImportCustomRecipeResult =
  | { readonly ok: true; readonly recipe: CustomBrewRecipe }
  | {
      readonly ok: false;
      readonly errorCode: 'invalid_json' | 'invalid_schema';
      readonly issues: readonly string[];
    };

function slugifyTitle(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug.slice(0, 48) : 'receta';
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function deriveIntensityRatios(
  draft: CustomRecipeDraft,
  method: BrewMethod
): IntensityRatios {
  if (draft.intensityRatios) {
    const isEspresso = method.id === 'espresso';
    const hasEspresso = 'ristretto' in draft.intensityRatios;
    if (isEspresso === hasEspresso) {
      return draft.intensityRatios;
    }
  }

  if (method.id === 'espresso') {
    const base = draft.baseRatio ?? 2.0;
    return {
      ristretto: roundToOneDecimal(Math.max(1.0, base * 0.75)),
      normale: roundToOneDecimal(base),
      lungo: roundToOneDecimal(base * 1.5),
    };
  }

  const base = draft.baseRatio ?? 16.0;
  return {
    light: roundToOneDecimal(base * 1.06),
    normal: roundToOneDecimal(base),
    strong: roundToOneDecimal(Math.max(5.0, base * 0.92)),
  };
}

function deriveSvgDirective(
  methodId: BrewMethod['id'],
  phaseType: BrewPhase['type'],
  fillStart: number,
  fillEnd: number
): SvgStageDirective {
  const vesselType = METHOD_VESSEL_MAP[methodId];

  const pourStream: SvgStageDirective['pourStream'] =
    phaseType === 'bloom'
      ? 'spiral'
      : phaseType === 'pour' || phaseType === 'espresso_shot'
        ? 'steady'
        : 'none';

  const agitator: SvgStageDirective['agitator'] =
    phaseType === 'stir' ? 'spoon_stir' : phaseType === 'swirl' ? 'vessel_swirl' : 'none';

  const plungerState: SvgStageDirective['plungerState'] =
    phaseType === 'plunge'
      ? 'pressing'
      : vesselType === 'cylinder_aeropress' && phaseType === 'wait'
        ? 'up'
        : 'none';

  const coffeeBedTurbulence: SvgStageDirective['coffeeBedTurbulence'] =
    phaseType === 'bloom'
      ? 'bubbling_bloom'
      : phaseType === 'pour' ||
          phaseType === 'stir' ||
          phaseType === 'swirl' ||
          phaseType === 'espresso_shot'
        ? 'active_slurry'
        : phaseType === 'drawdown'
          ? 'settled'
          : 'calm';

  const adjustedEnd =
    vesselType === 'cylinder_aeropress' && phaseType === 'plunge' ? 0 : fillEnd;

  return {
    vesselType,
    pourStream,
    agitator,
    plungerState,
    liquidFillStartRatio: clampUnit(fillStart),
    liquidFillEndRatio: clampUnit(adjustedEnd),
    coffeeBedTurbulence,
  };
}

/**
 * Pure normalizer that converts a user draft into a strictly validated CustomBrewRecipe.
 * Computes exact waterShare summing to 1.0, chains contiguous timestamps, and derives SVG directives.
 */
export function buildCustomRecipe(
  draft: CustomRecipeDraft,
  method: BrewMethod,
  options?: BuildCustomRecipeOptions
): BuildCustomRecipeResult {
  const parsedDraft = CustomRecipeDraftSchema.safeParse(draft);
  if (!parsedDraft.success) {
    return {
      ok: false,
      errorCode: 'invalid_draft',
      issues: parsedDraft.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }

  const validDraft = parsedDraft.data;
  if (validDraft.methodId !== method.id) {
    return {
      ok: false,
      errorCode: 'method_mismatch',
      issues: [`Draft methodId "${validDraft.methodId}" does not match method "${method.id}"`],
    };
  }

  const totalWaterAmount = validDraft.phases.reduce((sum, p) => sum + p.waterAmount, 0);
  if (totalWaterAmount <= 0) {
    return {
      ok: false,
      errorCode: 'zero_total_water',
      issues: ['At least one phase must have a positive waterAmount'],
    };
  }

  let lastPourIndex = -1;
  for (let i = 0; i < validDraft.phases.length; i++) {
    if (validDraft.phases[i]!.waterAmount > 0) {
      lastPourIndex = i;
    }
  }

  const isPourOver = method.id === 'v60' || method.id === 'chemex' || method.id === 'melitta';
  const hasTrailingNonPour = lastPourIndex < validDraft.phases.length - 1;
  const maxPourFill = isPourOver && hasTrailingNonPour ? 0.85 : 1.0;

  let accumulatedShare = 0;
  let currentSeconds = 0;
  let currentFill = 0;

  const builtPhases: BrewRecipePhase[] = validDraft.phases.map((draftPhase, index) => {
    let waterShare = 0;
    if (draftPhase.waterAmount > 0) {
      if (index === lastPourIndex) {
        waterShare = Math.max(0, Math.round((1 - accumulatedShare) * 1_000_000) / 1_000_000);
      } else {
        waterShare = Math.round((draftPhase.waterAmount / totalWaterAmount) * 1_000_000) / 1_000_000;
        accumulatedShare += waterShare;
      }
    }

    const startTimeSeconds = currentSeconds;
    const endTimeSeconds = currentSeconds + draftPhase.durationSeconds;
    currentSeconds = endTimeSeconds;

    const fillStart = currentFill;
    let fillEnd = fillStart;
    if (waterShare > 0) {
      fillEnd = Math.min(maxPourFill, fillStart + waterShare * maxPourFill);
    } else if (index === validDraft.phases.length - 1 && isPourOver) {
      fillEnd = 1.0;
    }
    currentFill = fillEnd;

    const phaseId = draftPhase.id ?? `phase-${index + 1}`;
    const instruction =
      draftPhase.instruction && draftPhase.instruction.trim().length > 0
        ? draftPhase.instruction.trim()
        : draftPhase.waterAmount > 0
          ? 'Verté {{waterGrams}} g hasta alcanzar {{cumulativeWaterGrams}} g.'
          : `${draftPhase.title} durante ${draftPhase.durationSeconds} s.`;

    return {
      id: phaseId,
      order: index + 1,
      type: draftPhase.type,
      titleKey: 'custom',
      instructionKey: 'custom',
      customTitle: draftPhase.title,
      customInstruction: instruction,
      startTimeSeconds,
      endTimeSeconds,
      waterShare,
      svgDirective: deriveSvgDirective(method.id, draftPhase.type, fillStart, fillEnd),
    };
  });

  const nowIso = options?.nowIso ?? new Date().toISOString();
  const recipeId =
    options?.id ?? validDraft.id ?? `custom-${method.id}-${slugifyTitle(validDraft.title)}`;

  const candidate: CustomBrewRecipe = {
    id: recipeId,
    methodId: method.id,
    source: 'custom',
    kind: 'custom',
    isDefault: false,
    authorName: validDraft.authorName ?? 'Usuario',
    difficulty: 'universal',
    title: validDraft.title,
    ...(validDraft.processSummary ? { processSummary: validDraft.processSummary } : {}),
    ...(validDraft.flavorHighlight ? { flavorHighlight: validDraft.flavorHighlight } : {}),
    ...(validDraft.grindNote ? { grindNote: validDraft.grindNote } : {}),
    defaultDoseGrams: validDraft.defaultDoseGrams ?? method.defaultDoseGrams,
    waterTempCelsius: validDraft.waterTempCelsius ?? method.waterTempCelsius,
    intensityRatios: deriveIntensityRatios(validDraft, method),
    totalDurationSeconds: currentSeconds,
    phases: builtPhases,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };

  const validated = CustomBrewRecipeSchema.safeParse(candidate);
  if (!validated.success) {
    return {
      ok: false,
      errorCode: 'invalid_draft',
      issues: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }

  return { ok: true, recipe: validated.data };
}

/**
 * Clones any catalog or custom recipe into an editable CustomRecipeDraft.
 */
export function duplicateRecipeAsDraft(
  recipe: BrewRecipe,
  newTitle: string
): CustomRecipeDraft {
  const baseRatio =
    'normale' in recipe.intensityRatios
      ? recipe.intensityRatios.normale
      : recipe.intensityRatios.normal;

  return {
    methodId: recipe.methodId,
    title: newTitle.trim() || 'Mi receta',
    authorName: 'Usuario',
    ...(recipe.source === 'custom' && recipe.processSummary
      ? { processSummary: recipe.processSummary }
      : {}),
    ...(recipe.source === 'custom' && recipe.flavorHighlight
      ? { flavorHighlight: recipe.flavorHighlight }
      : {}),
    ...(recipe.source === 'custom' && recipe.grindNote ? { grindNote: recipe.grindNote } : {}),
    ...(recipe.defaultDoseGrams !== undefined ? { defaultDoseGrams: recipe.defaultDoseGrams } : {}),
    ...(recipe.waterTempCelsius ? { waterTempCelsius: { ...recipe.waterTempCelsius } } : {}),
    baseRatio,
    intensityRatios: { ...recipe.intensityRatios },
    phases: recipe.phases.map((phase) => ({
      id: phase.id,
      type: phase.type,
      title: phase.customTitle ?? phase.id,
      ...(phase.customInstruction ? { instruction: phase.customInstruction } : {}),
      durationSeconds: Math.max(1, Math.round(phase.endTimeSeconds - phase.startTimeSeconds)),
      waterAmount: Math.round(phase.waterShare * 1000) / 10,
    })),
  };
}

/**
 * Serializes a CustomBrewRecipe into a versioned JSON string suitable for sharing or backup.
 */
export function exportCustomRecipeJson(
  recipe: CustomBrewRecipe,
  exportedAtIso: string = new Date().toISOString()
): string {
  const envelope = {
    schemaVersion: CUSTOM_RECIPE_EXPORT_SCHEMA_VERSION,
    exportedAtIso,
    recipe,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parses and validates a shared custom recipe JSON string safely without throwing.
 */
export function importCustomRecipeJson(rawJson: string): ImportCustomRecipeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      ok: false,
      errorCode: 'invalid_json',
      issues: [err instanceof Error ? err.message : 'Malformed JSON string'],
    };
  }

  const envelope = CustomRecipeExportEnvelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    return {
      ok: false,
      errorCode: 'invalid_schema',
      issues: envelope.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }

  return {
    ok: true,
    recipe: envelope.data.recipe,
  };
}
