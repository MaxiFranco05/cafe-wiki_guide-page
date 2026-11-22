import { describe, it, expect } from 'vitest';
import { buildCustomRecipe } from '../../../domain/brewing';
import type { CustomBrewRecipe } from '../../../domain/schemas';
import { getMethodBySlug } from '../../../data/methods';
import { RECIPES_CATALOG, getRecipeById, getRecipesByMethod } from '../../../data/recipes';
import { esUi } from '../../../i18n';
import {
  ALLOWED_PHASE_TYPES,
  createEmptyEditorForm,
  editorFormFromRecipe,
  formatRecipeTemp,
  getRecipeNormalRatio,
  groupRecipesForSelector,
  resolveInitialRecipe,
  resolvePhaseInstruction,
  resolvePhaseTitle,
  resolveRecipeText,
  resolveRecipeTitle,
  summarizeEditorForm,
  uniqueRecipeId,
  validateEditorForm,
  type EditorForm,
} from '../utils/recipe-display.helpers';

const v60 = getMethodBySlug('v60')!;
const kasuya = getRecipeById('v60-kasuya-4-6')!;

function buildMyV60(): CustomBrewRecipe {
  const result = buildCustomRecipe(
    {
      methodId: 'v60',
      title: 'Mi V60',
      baseRatio: 16,
      phases: [
        { type: 'bloom', title: 'Bloom', durationSeconds: 45, waterAmount: 50 },
        { type: 'pour', title: 'Vertido', durationSeconds: 60, waterAmount: 120 },
        { type: 'pour', title: 'Vertido final', durationSeconds: 45, waterAmount: 80 },
        { type: 'drawdown', title: 'Drenaje', durationSeconds: 30, waterAmount: 0 },
      ],
    },
    v60,
    { nowIso: '2026-11-20T00:00:00.000Z' }
  );
  if (!result.ok) throw new Error(result.issues.join('\n'));
  return result.recipe;
}

describe('phase text resolution (catalog vs custom)', () => {
  it('resolves catalog phase titles and instructions through i18n with interpolation', () => {
    const phase = kasuya.phases[1]!;
    expect(resolvePhaseTitle(phase)).toBe('Vertido 2 (40% · Balance)');
    expect(resolvePhaseInstruction(phase, { waterGrams: '60', cumulativeWaterGrams: '120' })).toContain('120 g');
  });

  it('uses the user-authored title and interpolates the default custom instruction', () => {
    const recipe = buildMyV60();
    const pour = recipe.phases[1]!;
    expect(resolvePhaseTitle(pour)).toBe('Vertido');
    expect(resolvePhaseInstruction(pour, { waterGrams: '120', cumulativeWaterGrams: '170' })).toBe(
      'Verté 120 g hasta alcanzar 170 g.'
    );
    expect(resolvePhaseTitle(pour)).not.toBe('custom');
  });
});

describe('recipe metadata resolution', () => {
  it('resolves catalog titles and notes via i18n and custom ones verbatim', () => {
    expect(resolveRecipeTitle(kasuya)).toBe('Método 4:6 (WBrC 2016)');
    expect(resolveRecipeText(kasuya, 'flavorHighlight')).toMatch(/dulzor/);
    const mine = buildMyV60();
    expect(resolveRecipeTitle(mine)).toBe('Mi V60');
    expect(resolveRecipeText(mine, 'processSummary')).toBeNull();
  });

  it('reads the normal ratio for filter and espresso recipes', () => {
    expect(getRecipeNormalRatio(kasuya)).toBe(15);
    const espresso = getRecipesByMethod('espresso')[0]!;
    expect(getRecipeNormalRatio(espresso)).toBeGreaterThan(1);
  });

  it('formats a single temperature or the recommended value with range', () => {
    expect(formatRecipeTemp({ min: 92, max: 92, recommended: 92 })).toBe('92 °C');
    expect(formatRecipeTemp({ min: 88, max: 93, recommended: 92 })).toBe('92 °C (88–93 °C)');
  });
});

describe('groupRecipesForSelector', () => {
  it('splits V60 recipes into standard, author/classic and custom groups', () => {
    const mine = buildMyV60();
    const groups = groupRecipesForSelector(getRecipesByMethod('v60'), [mine]);
    expect(groups.standard.map((r) => r.id)).toEqual(['v60-standard']);
    expect(groups.catalog.map((r) => r.id)).toContain('v60-kasuya-4-6');
    expect(groups.catalog.every((r) => r.kind !== 'standard')).toBe(true);
    expect(groups.mine).toEqual([mine]);
  });
});

describe('resolveInitialRecipe', () => {
  const mine = buildMyV60();

  it('prefers a valid ?recipe id for the method', () => {
    expect(
      resolveInitialRecipe(v60, { queryRecipeId: 'v60-kasuya-4-6', storedRecipeId: mine.id, customRecipes: [mine] }).id
    ).toBe('v60-kasuya-4-6');
  });

  it('falls back to the remembered recipe when the query id is unknown or from another method', () => {
    expect(
      resolveInitialRecipe(v60, { queryRecipeId: 'aeropress-alan-adler', storedRecipeId: mine.id, customRecipes: [mine] }).id
    ).toBe(mine.id);
    expect(resolveInitialRecipe(v60, { queryRecipeId: 'nope', storedRecipeId: mine.id, customRecipes: [mine] }).id).toBe(
      mine.id
    );
  });

  it('falls back to the standard recipe when the remembered one was deleted', () => {
    expect(resolveInitialRecipe(v60, { storedRecipeId: mine.id, customRecipes: [] }).id).toBe('v60-standard');
  });

  it('uses the standard recipe without any preference', () => {
    expect(resolveInitialRecipe(v60, { customRecipes: [] }).id).toBe('v60-standard');
  });
});

describe('editor form helpers', () => {
  it('limits phase types per method', () => {
    expect(ALLOWED_PHASE_TYPES.espresso).toEqual(['bloom', 'wait', 'espresso_shot']);
    expect(ALLOWED_PHASE_TYPES.v60).toContain('drawdown');
    expect(ALLOWED_PHASE_TYPES['french-press']).not.toContain('bloom');
  });

  it('duplicates Kasuya 4:6 with Spanish titles, ml for the reference dose and a copy name', () => {
    const form = editorFormFromRecipe(kasuya, v60, 'duplicate', 20);
    expect(form.title).toBe('Método 4:6 (WBrC 2016) (copia)');
    expect(form.id).toBeUndefined();
    expect(form.ratio).toBe('15');
    expect(form.tempCelsius).toBe('92');
    expect(form.doseGrams).toBe('20');
    expect(form.phases).toHaveLength(5);
    expect(form.phases[0]!.title).toBe('Vertido 1 (40% · Base)');
    expect(form.phases.map((p) => p.waterMl)).toEqual(['60', '60', '60', '60', '60']);
    expect(summarizeEditorForm(form)).toMatchObject({ durationSeconds: 210, waterMl: 300, ratio: 15 });
  });

  it('duplicates every catalog recipe into a form that validates and builds', () => {
    for (const recipe of RECIPES_CATALOG) {
      const method = getMethodBySlug(recipe.methodId)!;
      const result = validateEditorForm(editorFormFromRecipe(recipe, method, 'duplicate'), method);
      expect(result.ok, recipe.id).toBe(true);
      if (result.ok) expect(buildCustomRecipe(result.draft, method).ok, recipe.id).toBe(true);
    }
  });

  it('keeps id and title when editing a custom recipe', () => {
    const mine = buildMyV60();
    const form = editorFormFromRecipe(mine, v60, 'edit');
    expect(form.id).toBe(mine.id);
    expect(form.title).toBe('Mi V60');
    expect(form.phases.map((p) => p.title)).toEqual(['Bloom', 'Vertido', 'Vertido final', 'Drenaje']);
  });

  it('builds a valid empty form for every method', () => {
    for (const methodId of ['v60', 'chemex', 'melitta', 'aeropress', 'french-press', 'espresso'] as const) {
      const method = getMethodBySlug(methodId)!;
      const result = validateEditorForm({ ...createEmptyEditorForm(method), title: 'X' }, method);
      expect(result.ok, methodId).toBe(true);
    }
  });

  it('flags a missing name and phases without water with i18n error keys', () => {
    const form: EditorForm = {
      ...createEmptyEditorForm(v60),
      title: '  ',
      phases: [
        { key: 'a', type: 'bloom', title: 'Bloom', durationSeconds: '45', waterMl: '0' },
        { key: 'b', type: 'wait', title: 'Esperar', durationSeconds: '0', waterMl: '-3' },
      ],
    };
    const result = validateEditorForm(form, v60);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.title).toBe('brew.recipes.editor.errors.titleRequired');
    expect(result.errors.phases).toBe('brew.recipes.editor.errors.noWater');
    expect(result.errors.phaseFields[1]).toMatchObject({
      durationSeconds: 'brew.recipes.editor.errors.durationInvalid',
      waterMl: 'brew.recipes.editor.errors.waterInvalid',
    });
    expect(result.errorCount).toBe(4);
  });

  it('converts a valid form into a draft with absolute water and an explicit temperature', () => {
    const form: EditorForm = { ...editorFormFromRecipe(kasuya, v60, 'duplicate', 20), title: 'Mi 4:6' };
    const result = validateEditorForm(form, v60);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.baseRatio).toBe(15);
    expect(result.draft.defaultDoseGrams).toBe(20);
    expect(result.draft.waterTempCelsius).toEqual({ min: 88, max: 93, recommended: 92 });
    expect(result.draft.phases.map((p) => p.waterAmount)).toEqual([60, 60, 60, 60, 60]);
  });

  it('generates unique custom ids', () => {
    expect(uniqueRecipeId('custom-v60-mi-v60', ['custom-v60-mi-v60', 'custom-v60-mi-v60-2'])).toBe('custom-v60-mi-v60-3');
    expect(uniqueRecipeId('custom-v60-x', [])).toBe('custom-v60-x');
  });
});

describe('brew.recipes dictionary', () => {
  it('contains only non-empty strings without emojis', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    const walk = (node: unknown, path: string): void => {
      if (typeof node === 'string') {
        expect(node.trim().length, path).toBeGreaterThan(0);
        expect(emoji.test(node), path).toBe(false);
        return;
      }
      expect(node && typeof node === 'object', path).toBe(true);
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) walk(value, `${path}.${key}`);
    };
    walk(esUi.brew.recipes, 'brew.recipes');
  });
});
