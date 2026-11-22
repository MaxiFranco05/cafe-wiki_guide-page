import { describe, it, expect } from 'vitest';
import { CatalogBrewRecipeSchema, type BrewMethod } from '../schemas';
import {
  RECIPES_CATALOG,
  RECIPES_BY_ID,
  getRecipesByMethod,
  getDefaultRecipeForMethod,
  getRecipeById,
} from '../../data/recipes';
import { METHODS_CATALOG } from '../../data/methods';
import { t } from '../../i18n';

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

describe('Verified 19-Recipe Extraction Catalog (Block 2)', () => {
  const allMethodIds: readonly BrewMethod['id'][] = [
    'v60',
    'chemex',
    'melitta',
    'aeropress',
    'french-press',
    'espresso',
  ];

  it('contains 19 globally unique, frozen catalog recipes validated by CatalogBrewRecipeSchema', () => {
    expect(RECIPES_CATALOG).toHaveLength(19);
    expect(Object.keys(RECIPES_BY_ID)).toHaveLength(19);
    expect(Object.isFrozen(RECIPES_CATALOG)).toBe(true);
    expect(Object.isFrozen(RECIPES_BY_ID)).toBe(true);

    for (const recipe of RECIPES_CATALOG) {
      const parsed = CatalogBrewRecipeSchema.safeParse(recipe);
      expect(parsed.success, `Recipe ${recipe.id} failed schema validation`).toBe(true);
      expect(RECIPES_BY_ID[recipe.id]).toBe(recipe);
      expect(getRecipeById(recipe.id)).toBe(recipe);
      expect(Object.isFrozen(recipe)).toBe(true);
    }
  });

  it('provides exactly one default standard recipe per method plus verified author/classic recipes', () => {
    const expectedCounts: Record<BrewMethod['id'], number> = {
      v60: 4,
      chemex: 3,
      melitta: 2,
      aeropress: 4,
      'french-press': 3,
      espresso: 3,
    };

    for (const methodId of allMethodIds) {
      const methodRecipes = getRecipesByMethod(methodId);
      expect(methodRecipes, `Unexpected count for ${methodId}`).toHaveLength(
        expectedCounts[methodId]
      );

      const defaults = methodRecipes.filter((r) => r.isDefault);
      expect(defaults, `${methodId} must have exactly 1 default recipe`).toHaveLength(1);
      expect(defaults[0]!.kind).toBe('standard');
      expect(getDefaultRecipeForMethod(methodId)).toBe(defaults[0]);
    }
  });

  it('preserves verified documented parameters for all author recipes', () => {
    const hoffmannV60 = getRecipeById('v60-hoffmann-1cup');
    expect(hoffmannV60?.authorName).toBe('James Hoffmann');
    expect(hoffmannV60?.phases.filter((p) => p.waterShare > 0)).toHaveLength(5);
    expect(hoffmannV60?.waterTempCelsius?.recommended).toBe(95);
    expect(hoffmannV60?.totalDurationSeconds).toBe(180);

    const kasuya = getRecipeById('v60-kasuya-4-6');
    expect(kasuya?.authorName).toBe('Tetsu Kasuya');
    expect(kasuya?.phases.filter((p) => p.waterShare > 0)).toHaveLength(5);
    expect(kasuya?.intensityRatios).toEqual({ light: 16.0, normal: 15.0, strong: 13.5 });
    expect(kasuya?.waterTempCelsius?.recommended).toBe(92);
    expect(kasuya?.totalDurationSeconds).toBe(210);

    const rao = getRecipeById('v60-scott-rao');
    expect(rao?.authorName).toBe('Scott Rao');
    expect(rao?.phases.filter((p) => p.waterShare > 0).map((p) => p.waterShare)).toEqual([
      0.18,
      0.82,
    ]);
    expect(rao?.waterTempCelsius?.recommended).toBe(96);

    const hoffmannChemex = getRecipeById('chemex-hoffmann');
    expect(hoffmannChemex?.authorName).toBe('James Hoffmann');
    expect(hoffmannChemex?.phases.filter((p) => p.waterShare > 0).map((p) => p.waterShare)).toEqual(
      [0.15, 0.45, 0.4]
    );
    expect(hoffmannChemex?.totalDurationSeconds).toBe(240);

    const hoffmannAero = getRecipeById('aeropress-hoffmann-ultimate');
    expect(hoffmannAero?.authorName).toBe('James Hoffmann');
    expect(hoffmannAero?.defaultDoseGrams).toBe(11);
    expect(hoffmannAero?.totalDurationSeconds).toBe(180);

    const adler = getRecipeById('aeropress-alan-adler');
    expect(adler?.authorName).toBe('Alan Adler');
    expect(adler?.waterTempCelsius?.recommended).toBe(80);
    expect(adler?.totalDurationSeconds).toBe(50);

    const hoffmannFp = getRecipeById('french-press-hoffmann');
    expect(hoffmannFp?.authorName).toBe('James Hoffmann');
    expect(hoffmannFp?.totalDurationSeconds).toBe(585);

    const turbo = getRecipeById('espresso-turbo-shot');
    expect(turbo?.authorName).toContain('Christopher Hendon');
    expect(turbo?.totalDurationSeconds).toBe(15);
    expect(turbo?.waterTempCelsius?.recommended).toBe(92);
  });

  it('keeps contiguous carafe liquid fill ratios ending at 1.0 for all pour-over recipes', () => {
    for (const methodId of ['v60', 'chemex', 'melitta'] as const) {
      for (const recipe of getRecipesByMethod(methodId)) {
        const last = recipe.phases[recipe.phases.length - 1]!;
        expect(last.svgDirective.liquidFillEndRatio, `${recipe.id} must finish at 1.0`).toBe(1);
        for (let i = 1; i < recipe.phases.length; i++) {
          expect(
            recipe.phases[i]!.svgDirective.liquidFillStartRatio,
            `${recipe.id} phase ${i} must continue previous fill`
          ).toBe(recipe.phases[i - 1]!.svgDirective.liquidFillEndRatio);
        }
      }
    }
  });

  it('resolves 100% of recipe i18n keys in es/recipes.json with interpolation and zero emojis', () => {
    for (const recipe of RECIPES_CATALOG) {
      const topKeys = [
        recipe.titleKey,
        recipe.processSummaryKey,
        recipe.flavorHighlightKey,
        ...(recipe.grindNoteKey ? [recipe.grindNoteKey] : []),
      ];

      for (const key of topKeys) {
        const val = t(key);
        expect(val, `Unresolved key ${key}`).not.toBe(key);
        expect(val.trim().length).toBeGreaterThan(0);
        expect(EMOJI_REGEX.test(val), `Emoji found in ${key}`).toBe(false);
      }

      for (const phase of recipe.phases) {
        const title = t(phase.titleKey);
        expect(title, `Unresolved phase titleKey ${phase.titleKey}`).not.toBe(phase.titleKey);
        expect(EMOJI_REGEX.test(title)).toBe(false);

        const instruction = t(phase.instructionKey, {
          waterGrams: 50,
          cumulativeWaterGrams: 100,
        });
        expect(instruction, `Unresolved phase instructionKey ${phase.instructionKey}`).not.toBe(
          phase.instructionKey
        );
        expect(instruction).not.toContain('{waterGrams}');
        expect(instruction).not.toContain('{cumulativeWaterGrams}');
        if (phase.waterShare > 0) {
          expect(
            instruction.includes('50 g') || instruction.includes('100 g'),
            `Pour phase ${recipe.id}/${phase.id} must interpolate water weights`
          ).toBe(true);
        }
        expect(EMOJI_REGEX.test(instruction)).toBe(false);
      }
    }

    expect(getRecipeById('nonexistent-recipe')).toBeUndefined();
  });

  it('removes misattributed author names from base METHODS_CATALOG standard profiles', () => {
    for (const method of METHODS_CATALOG) {
      for (const profile of method.profiles) {
        expect(profile.referenceAuthor).not.toBe('Tetsu Kasuya');
        expect(profile.referenceAuthor).not.toBe('Alan Adler');
        expect(profile.referenceAuthor).not.toBe('James Hoffmann');
      }
    }
  });
});
