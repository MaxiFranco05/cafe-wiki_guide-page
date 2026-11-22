import { duplicateRecipeAsDraft } from '../../../domain/brewing';
import type {
  BrewMethod,
  BrewPhase,
  BrewRecipe,
  CatalogBrewRecipe,
  CustomBrewRecipe,
  CustomRecipeDraft,
  WaterTempRange,
} from '../../../domain/schemas';
import { getDefaultRecipeForMethod, getRecipeById } from '../../../data/recipes';
import { interpolate, t, type TranslationParams } from '../../../i18n';
import { formatBrewNumber } from './brew-station.helpers';

type PhaseType = BrewPhase['type'];
type MethodId = BrewMethod['id'];

/** Phase types offered in the custom recipe editor per method (design decision 8). */
export const ALLOWED_PHASE_TYPES: Readonly<Record<MethodId, readonly PhaseType[]>> = {
  v60: ['bloom', 'pour', 'swirl', 'stir', 'wait', 'drawdown'],
  chemex: ['bloom', 'pour', 'swirl', 'stir', 'wait', 'drawdown'],
  melitta: ['bloom', 'pour', 'swirl', 'stir', 'wait', 'drawdown'],
  aeropress: ['bloom', 'pour', 'stir', 'swirl', 'wait', 'plunge'],
  'french-press': ['pour', 'stir', 'wait', 'plunge'],
  espresso: ['bloom', 'wait', 'espresso_shot'],
};

/* -------------------------------------------------------------------------- */
/* Phase and recipe text                                                       */
/* -------------------------------------------------------------------------- */

interface PhaseTextSource {
  readonly titleKey: string;
  readonly instructionKey: string;
  readonly customTitle?: string;
  readonly customInstruction?: string;
}

/** Title of a catalog (i18n key) or custom (user-authored) phase. */
export function resolvePhaseTitle(phase: PhaseTextSource): string {
  return phase.customTitle ?? t(phase.titleKey);
}

/** Instruction of a catalog or custom phase with `{{waterGrams}}` / `{{cumulativeWaterGrams}}` filled in. */
export function resolvePhaseInstruction(phase: PhaseTextSource, params?: TranslationParams): string {
  return phase.customInstruction !== undefined
    ? interpolate(phase.customInstruction, params)
    : t(phase.instructionKey, params);
}

export function resolveRecipeTitle(recipe: BrewRecipe): string {
  return recipe.source === 'custom' ? recipe.title : t(recipe.titleKey);
}

export type RecipeTextField = 'processSummary' | 'flavorHighlight' | 'grindNote';

/** Optional descriptive text of a recipe, or `null` when the recipe does not provide it. */
export function resolveRecipeText(recipe: BrewRecipe, field: RecipeTextField): string | null {
  if (recipe.source === 'custom') {
    const value = recipe[field]?.trim();
    return value ? value : null;
  }
  const key =
    field === 'processSummary'
      ? recipe.processSummaryKey
      : field === 'flavorHighlight'
        ? recipe.flavorHighlightKey
        : recipe.grindNoteKey;
  return key ? t(key) : null;
}

export function resolveRecipeAuthor(recipe: BrewRecipe): string {
  return recipe.source === 'custom' && recipe.authorName === 'Usuario'
    ? t('brew.recipes.card.userAuthor')
    : recipe.authorName;
}

/** The "normal" (filter) or "normale" (espresso) ratio of a recipe. */
export function getRecipeNormalRatio(recipe: BrewRecipe): number {
  return 'normale' in recipe.intensityRatios
    ? recipe.intensityRatios.normale
    : recipe.intensityRatios.normal;
}

export function getRecipeTemp(recipe: BrewRecipe, method: BrewMethod): WaterTempRange {
  return recipe.waterTempCelsius ?? method.waterTempCelsius;
}

/** `92 °C` for a single value, `92 °C (88–93 °C)` for a range. */
export function formatRecipeTemp(temp: WaterTempRange): string {
  return temp.min === temp.max
    ? t('brew.recipes.tempSingle', { recommended: temp.recommended })
    : t('brew.waterTempBadge', { recommended: temp.recommended, min: temp.min, max: temp.max });
}

/* -------------------------------------------------------------------------- */
/* Selector grouping and initial resolution                                    */
/* -------------------------------------------------------------------------- */

export interface RecipeSelectorGroups {
  readonly standard: readonly CatalogBrewRecipe[];
  readonly catalog: readonly CatalogBrewRecipe[];
  readonly mine: readonly CustomBrewRecipe[];
}

export function groupRecipesForSelector(
  catalog: readonly CatalogBrewRecipe[],
  custom: readonly CustomBrewRecipe[]
): RecipeSelectorGroups {
  return {
    standard: catalog.filter((recipe) => recipe.kind === 'standard'),
    catalog: catalog.filter((recipe) => recipe.kind !== 'standard'),
    mine: custom,
  };
}

/** Finds a catalog or custom recipe by id, only when it belongs to the given method. */
export function findRecipeForMethod(
  methodId: MethodId,
  recipeId: string | null | undefined,
  customRecipes: readonly CustomBrewRecipe[]
): BrewRecipe | undefined {
  if (!recipeId) return undefined;
  const found = getRecipeById(recipeId) ?? customRecipes.find((recipe) => recipe.id === recipeId);
  return found && found.methodId === methodId ? found : undefined;
}

export interface InitialRecipeSources {
  readonly queryRecipeId?: string | null;
  readonly storedRecipeId?: string | null;
  readonly customRecipes: readonly CustomBrewRecipe[];
}

/** Priority: valid `?recipe` → valid remembered recipe → the method's standard recipe. */
export function resolveInitialRecipe(method: BrewMethod, sources: InitialRecipeSources): BrewRecipe {
  return (
    findRecipeForMethod(method.id, sources.queryRecipeId, sources.customRecipes) ??
    findRecipeForMethod(method.id, sources.storedRecipeId, sources.customRecipes) ??
    getDefaultRecipeForMethod(method.id)
  );
}

/** Appends `-2`, `-3`… until the id does not collide with an existing one. */
export function uniqueRecipeId(baseId: string, existingIds: readonly string[]): string {
  const taken = new Set(existingIds);
  if (!taken.has(baseId)) return baseId;
  let suffix = 2;
  while (taken.has(`${baseId}-${suffix}`)) suffix += 1;
  return `${baseId}-${suffix}`;
}

/* -------------------------------------------------------------------------- */
/* Editor form                                                                 */
/* -------------------------------------------------------------------------- */

export interface EditorPhaseForm {
  readonly key: string;
  readonly type: PhaseType;
  readonly title: string;
  readonly instruction?: string;
  readonly durationSeconds: string;
  readonly waterMl: string;
}

export interface EditorForm {
  /** Present when editing an existing custom recipe (saved over the same id). */
  readonly id?: string;
  readonly methodId: MethodId;
  readonly title: string;
  readonly doseGrams: string;
  readonly ratio: string;
  readonly tempCelsius: string;
  /** Source temperature range kept when the recommended value is not changed. */
  readonly sourceTemp?: WaterTempRange;
  readonly processSummary: string;
  readonly flavorHighlight: string;
  readonly grindNote: string;
  readonly phases: readonly EditorPhaseForm[];
}

let phaseKeySeed = 0;
export function newPhaseKey(): string {
  phaseKeySeed += 1;
  return `phase-${phaseKeySeed}`;
}

function phaseTypeLabel(type: PhaseType): string {
  return t(`brew.recipes.editor.phaseTypes.${type}`);
}

/** A new phase row for the editor (defaults to the method's first water-carrying type). */
export function createEditorPhase(methodId: MethodId, waterMl = 0): EditorPhaseForm {
  const type: PhaseType = methodId === 'espresso' ? 'espresso_shot' : 'pour';
  return { key: newPhaseKey(), type, title: phaseTypeLabel(type), durationSeconds: '30', waterMl: String(waterMl) };
}

function defaultPhasePlan(method: BrewMethod, totalWater: number): Array<[PhaseType, number, number]> {
  const bloom = Math.round(method.defaultDoseGrams * 3);
  switch (method.id) {
    case 'espresso':
      return [['espresso_shot', 28, totalWater]];
    case 'aeropress':
      return [['pour', 10, totalWater], ['wait', 80, 0], ['plunge', 30, 0]];
    case 'french-press':
      return [['pour', 30, totalWater], ['wait', 210, 0], ['plunge', 30, 0]];
    default:
      return [['bloom', 45, bloom], ['pour', 90, Math.max(0, totalWater - bloom)], ['drawdown', 45, 0]];
  }
}

/** Blank editor for creating a recipe from scratch, prefilled from the method's standard recipe. */
export function createEmptyEditorForm(method: BrewMethod): EditorForm {
  const ratio = getRecipeNormalRatio(getDefaultRecipeForMethod(method.id));
  const totalWater = Math.round(method.defaultDoseGrams * ratio);
  return {
    methodId: method.id,
    title: '',
    doseGrams: formatBrewNumber(method.defaultDoseGrams),
    ratio: formatBrewNumber(ratio),
    tempCelsius: '',
    processSummary: '',
    flavorHighlight: '',
    grindNote: '',
    phases: defaultPhasePlan(method, totalWater).map(([type, seconds, water]) => ({
      key: newPhaseKey(),
      type,
      title: phaseTypeLabel(type),
      durationSeconds: String(seconds),
      waterMl: formatBrewNumber(water),
    })),
  };
}

/**
 * Editor form from an existing recipe. `duplicate` wraps `duplicateRecipeAsDraft` and resolves
 * catalog phase texts in Spanish; `edit` keeps the custom recipe's id. Water shares become ml for
 * the reference dose (`share × dose × normal ratio`).
 */
export function editorFormFromRecipe(
  recipe: BrewRecipe,
  method: BrewMethod,
  mode: 'duplicate' | 'edit',
  referenceDoseGrams?: number
): EditorForm {
  const title = resolveRecipeTitle(recipe);
  const draft = duplicateRecipeAsDraft(
    recipe,
    mode === 'duplicate' ? t('brew.recipes.editor.copyName', { title }) : title
  );
  const dose = referenceDoseGrams ?? recipe.defaultDoseGrams ?? method.defaultDoseGrams;
  const ratio = getRecipeNormalRatio(recipe);
  const totalWater = dose * ratio;

  return {
    ...(mode === 'edit' ? { id: recipe.id } : {}),
    methodId: method.id,
    title: draft.title,
    doseGrams: formatBrewNumber(dose),
    ratio: formatBrewNumber(ratio),
    tempCelsius: recipe.waterTempCelsius ? String(recipe.waterTempCelsius.recommended) : '',
    ...(recipe.waterTempCelsius ? { sourceTemp: { ...recipe.waterTempCelsius } } : {}),
    processSummary: resolveRecipeText(recipe, 'processSummary') ?? '',
    flavorHighlight: resolveRecipeText(recipe, 'flavorHighlight') ?? '',
    grindNote: resolveRecipeText(recipe, 'grindNote') ?? '',
    phases: recipe.phases.map((phase, index) => {
      const draftPhase = draft.phases[index]!;
      return {
        key: newPhaseKey(),
        type: phase.type,
        title: resolvePhaseTitle(phase),
        instruction: phase.customInstruction ?? t(phase.instructionKey),
        durationSeconds: String(draftPhase.durationSeconds),
        waterMl: formatBrewNumber(phase.waterShare * totalWater),
      };
    }),
  };
}

function parseDecimal(raw: string): number | null {
  const normalized = raw.trim().replaceAll(',', '.');
  if (normalized.length === 0) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export interface EditorSummary {
  readonly durationSeconds: number;
  readonly waterMl: number;
  /** Implicit ratio (water / dose), or `null` when it cannot be computed. */
  readonly ratio: number | null;
}

/** Live totals shown in the editor while typing. */
export function summarizeEditorForm(form: EditorForm): EditorSummary {
  let durationSeconds = 0;
  let waterMl = 0;
  for (const phase of form.phases) {
    const seconds = parseDecimal(phase.durationSeconds);
    const water = parseDecimal(phase.waterMl);
    if (seconds !== null && seconds > 0) durationSeconds += seconds;
    if (water !== null && water > 0) waterMl += water;
  }
  const dose = parseDecimal(form.doseGrams);
  waterMl = Math.round(waterMl * 10) / 10;
  return {
    durationSeconds,
    waterMl,
    ratio: dose && dose > 0 && waterMl > 0 ? Math.round((waterMl / dose) * 10) / 10 : null,
  };
}

export type EditorErrorKey = `brew.recipes.editor.errors.${string}`;

export interface EditorPhaseErrors {
  title?: EditorErrorKey;
  type?: EditorErrorKey;
  durationSeconds?: EditorErrorKey;
  waterMl?: EditorErrorKey;
}

export interface EditorErrors {
  title?: EditorErrorKey;
  doseGrams?: EditorErrorKey;
  ratio?: EditorErrorKey;
  tempCelsius?: EditorErrorKey;
  phases?: EditorErrorKey;
  phaseFields: Record<number, EditorPhaseErrors>;
}

export type EditorValidationResult =
  | { readonly ok: true; readonly draft: CustomRecipeDraft }
  | { readonly ok: false; readonly errors: EditorErrors; readonly errorCount: number };

const ERR = (name: string): EditorErrorKey => `brew.recipes.editor.errors.${name}`;

/** UI-level validation with Spanish i18n keys per field, producing a draft for `buildCustomRecipe`. */
export function validateEditorForm(form: EditorForm, method: BrewMethod): EditorValidationResult {
  const errors: EditorErrors = { phaseFields: {} };
  let errorCount = 0;
  const flag = (): void => {
    errorCount += 1;
  };

  const title = form.title.trim();
  if (title.length === 0) {
    errors.title = ERR('titleRequired');
    flag();
  }

  const dose = parseDecimal(form.doseGrams);
  if (dose === null || dose <= 0) {
    errors.doseGrams = ERR('doseInvalid');
    flag();
  }

  const ratio = parseDecimal(form.ratio);
  if (ratio === null || ratio <= 0) {
    errors.ratio = ERR('ratioInvalid');
    flag();
  }

  const temp = parseDecimal(form.tempCelsius);
  if (form.tempCelsius.trim().length > 0 && (temp === null || temp < 60 || temp > 100)) {
    errors.tempCelsius = ERR('tempInvalid');
    flag();
  }

  const allowed = ALLOWED_PHASE_TYPES[method.id];
  const phases: CustomRecipeDraft['phases'][number][] = [];

  form.phases.forEach((phase, index) => {
    const phaseErrors: EditorPhaseErrors = {};
    const phaseTitle = phase.title.trim();
    if (phaseTitle.length === 0) phaseErrors.title = ERR('phaseTitleRequired');
    if (!allowed.includes(phase.type)) phaseErrors.type = ERR('typeInvalid');
    const seconds = parseDecimal(phase.durationSeconds);
    if (seconds === null || seconds <= 0 || !Number.isInteger(seconds)) {
      phaseErrors.durationSeconds = ERR('durationInvalid');
    }
    const water = phase.waterMl.trim().length === 0 ? 0 : parseDecimal(phase.waterMl);
    if (water === null || water < 0) phaseErrors.waterMl = ERR('waterInvalid');

    const count = Object.keys(phaseErrors).length;
    if (count > 0) {
      errors.phaseFields[index] = phaseErrors;
      errorCount += count;
      return;
    }
    phases.push({
      id: `phase-${index + 1}`,
      type: phase.type,
      title: phaseTitle,
      ...(phase.instruction && phase.instruction.trim().length > 0
        ? { instruction: phase.instruction.trim().slice(0, 240) }
        : {}),
      durationSeconds: seconds ?? 1,
      waterAmount: water ?? 0,
    });
  });

  if (form.phases.every((phase) => (parseDecimal(phase.waterMl) ?? 0) <= 0)) {
    errors.phases = ERR('noWater');
    flag();
  }

  if (errorCount > 0 || dose === null || ratio === null) {
    return { ok: false, errors, errorCount };
  }

  let waterTempCelsius: WaterTempRange | undefined;
  if (temp !== null) {
    waterTempCelsius =
      form.sourceTemp && form.sourceTemp.recommended === temp
        ? { ...form.sourceTemp }
        : { min: temp, max: temp, recommended: temp };
  }

  const optional = (value: string, max: number): string | undefined => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, max) : undefined;
  };
  const processSummary = optional(form.processSummary, 300);
  const flavorHighlight = optional(form.flavorHighlight, 200);
  const grindNote = optional(form.grindNote, 120);

  return {
    ok: true,
    draft: {
      ...(form.id ? { id: form.id } : {}),
      methodId: method.id,
      title: title.slice(0, 80),
      ...(processSummary ? { processSummary } : {}),
      ...(flavorHighlight ? { flavorHighlight } : {}),
      ...(grindNote ? { grindNote } : {}),
      defaultDoseGrams: dose,
      ...(waterTempCelsius ? { waterTempCelsius } : {}),
      baseRatio: ratio,
      phases,
    },
  };
}
