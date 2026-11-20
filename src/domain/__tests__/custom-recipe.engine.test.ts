import { describe, it, expect } from 'vitest';
import {
  calculateScaledRecipe,
  buildCustomRecipe,
  duplicateRecipeAsDraft,
  exportCustomRecipeJson,
  importCustomRecipeJson,
} from '../brewing';
import { METHODS_CATALOG, getMethodBySlug } from '../../data/methods';
import { getRecipeById } from '../../data/recipes';
import { CustomBrewRecipeSchema } from '../schemas';

describe('Multi-Recipe Scaling & Custom Recipe Engine (Block 3)', () => {
  const v60 = getMethodBySlug('v60')!;
  const espresso = getMethodBySlug('espresso')!;
  const kasuya = getRecipeById('v60-kasuya-4-6')!;
  const hoffmannV60 = getRecipeById('v60-hoffmann-1cup')!;
  const turboShot = getRecipeById('espresso-turbo-shot')!;

  it('scales any author or custom recipe via calculateScaledRecipe while preserving 3-arg compatibility', () => {
    // 3-arg legacy call
    const legacy = calculateScaledRecipe(v60, 'normal', { coffeeGrams: 15 });
    expect(legacy.totalWaterMl).toBe(250);
    expect(legacy.phases.length).toBeGreaterThan(0);

    // 4-arg author recipe call (Kasuya 4:6 -> ratio 15, 20g -> 300ml, 5 pours of 60g, 92 C, 210s)
    const scaledKasuya = calculateScaledRecipe(v60, 'normal', { coffeeGrams: 20 }, kasuya);
    expect(scaledKasuya.recipeId).toBe('v60-kasuya-4-6');
    expect(scaledKasuya.ratio).toBe(15);
    expect(scaledKasuya.totalWaterMl).toBe(300);
    expect(scaledKasuya.totalDurationSeconds).toBe(210);
    expect(scaledKasuya.waterTempCelsius.recommended).toBe(92);
    expect(scaledKasuya.phases.map((p) => p.phaseWaterGrams)).toEqual([60, 60, 60, 60, 60]);
    expect(scaledKasuya.phases.map((p) => p.targetCumulativeGrams)).toEqual([
      60, 120, 180, 240, 300,
    ]);

    // 4-arg espresso author recipe (Turbo Shot -> lungo 1:3, 15g -> 45g yield, 15s, 92 C)
    const scaledTurbo = calculateScaledRecipe(espresso, 'lungo', { coffeeGrams: 15 }, turboShot);
    expect(scaledTurbo.recipeId).toBe('espresso-turbo-shot');
    expect(scaledTurbo.totalWaterMl).toBe(45);
    expect(scaledTurbo.totalDurationSeconds).toBe(15);
    expect(scaledTurbo.waterTempCelsius.recommended).toBe(92);
  });

  it('builds a valid CustomBrewRecipe normalizing waterShare from absolute ml, chaining durations, and deriving svgDirective', () => {
    const result = buildCustomRecipe(
      {
        methodId: 'v60',
        title: 'Mi V60 Balanceado',
        processSummary: 'Bloom corto y dos vertidos tranquilos.',
        flavorHighlight: 'Dulzor a panela y naranja.',
        baseRatio: 16,
        phases: [
          { type: 'bloom', title: 'Bloom', durationSeconds: 45, waterAmount: 50 },
          { type: 'pour', title: 'Vertido 1', durationSeconds: 60, waterAmount: 120 },
          { type: 'pour', title: 'Vertido 2', durationSeconds: 45, waterAmount: 80 },
          { type: 'drawdown', title: 'Drawdown', durationSeconds: 30, waterAmount: 0 },
        ],
      },
      v60,
      { nowIso: '2026-11-19T23:30:00.000Z' }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { recipe } = result;
    expect(CustomBrewRecipeSchema.safeParse(recipe).success).toBe(true);
    expect(recipe.totalDurationSeconds).toBe(180);
    expect(recipe.phases.map((p) => [p.startTimeSeconds, p.endTimeSeconds])).toEqual([
      [0, 45],
      [45, 105],
      [105, 150],
      [150, 180],
    ]);
    expect(recipe.phases.map((p) => p.waterShare)).toEqual([0.2, 0.48, 0.32, 0]);
    expect(recipe.phases.every((p) => p.svgDirective.vesselType === 'cone_v60')).toBe(true);
    expect(recipe.phases[3]!.svgDirective.liquidFillEndRatio).toBe(1);

    // Can immediately be scaled by calculateScaledRecipe
    const scaled = calculateScaledRecipe(v60, 'normal', { coffeeGrams: 15 }, recipe);
    expect(scaled.totalWaterMl).toBe(240);
    expect(scaled.phases.reduce((acc, p) => acc + p.phaseWaterGrams, 0)).toBe(240);
  });

  it('duplicates a catalog recipe as an editable CustomRecipeDraft that builds cleanly', () => {
    const draft = duplicateRecipeAsDraft(hoffmannV60, 'Mi Hoffmann Diario');
    expect(draft.methodId).toBe('v60');
    expect(draft.title).toBe('Mi Hoffmann Diario');
    expect(draft.phases).toHaveLength(hoffmannV60.phases.length);
    expect(draft.waterTempCelsius).toEqual(hoffmannV60.waterTempCelsius);

    const built = buildCustomRecipe(draft, v60);
    expect(built.ok).toBe(true);
    if (built.ok) {
      expect(built.recipe.totalDurationSeconds).toBe(hoffmannV60.totalDurationSeconds);
    }
  });

  it('exports and imports a CustomBrewRecipe via versioned JSON envelope without data loss', () => {
    const built = buildCustomRecipe(
      {
        methodId: 'v60',
        title: 'Receta Compartible',
        baseRatio: 16.5,
        phases: [
          { type: 'bloom', title: 'Bloom', durationSeconds: 40, waterAmount: 20 },
          { type: 'pour', title: 'Vertido', durationSeconds: 110, waterAmount: 80 },
        ],
      },
      v60
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const exported = exportCustomRecipeJson(built.recipe, '2026-11-19T23:40:00.000Z');
    const imported = importCustomRecipeJson(exported);

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.recipe).toEqual(built.recipe);
    }
  });

  it('rejects malformed JSON, unsupported schemaVersion, or invalid phases on import without throwing', () => {
    const badJson = importCustomRecipeJson('{not-valid-json');
    expect(badJson.ok).toBe(false);
    if (!badJson.ok) {
      expect(badJson.errorCode).toBe('invalid_json');
    }

    const wrongVersion = importCustomRecipeJson(
      JSON.stringify({ schemaVersion: 99, exportedAtIso: '2026-11-19', recipe: {} })
    );
    expect(wrongVersion.ok).toBe(false);
    if (!wrongVersion.ok) {
      expect(wrongVersion.errorCode).toBe('invalid_schema');
      expect(wrongVersion.issues.length).toBeGreaterThan(0);
    }
  });

  it('works cleanly across all 6 brewing methods with exact vesselType and derived intensityRatios', () => {
    const expectedVessels = {
      v60: 'cone_v60',
      chemex: 'hourglass_chemex',
      melitta: 'wedge_melitta',
      aeropress: 'cylinder_aeropress',
      'french-press': 'beaker_french_press',
      espresso: 'portafilter_espresso',
    } as const;

    for (const method of METHODS_CATALOG) {
      const built = buildCustomRecipe(
        {
          methodId: method.id,
          title: `Custom ${method.id}`,
          baseRatio: method.id === 'espresso' ? 2.0 : 16.0,
          phases:
            method.id === 'espresso'
              ? [{ type: 'espresso_shot', title: 'Shot', durationSeconds: 27, waterAmount: 36 }]
              : method.id === 'aeropress'
                ? [
                    { type: 'pour', title: 'Vertido', durationSeconds: 20, waterAmount: 200 },
                    { type: 'wait', title: 'Reposo', durationSeconds: 80, waterAmount: 0 },
                    { type: 'plunge', title: 'Prensado', durationSeconds: 30, waterAmount: 0 },
                  ]
                : [
                    { type: 'bloom', title: 'Bloom', durationSeconds: 45, waterAmount: 45 },
                    { type: 'stir', title: 'Agitación', durationSeconds: 10, waterAmount: 0 },
                    { type: 'pour', title: 'Vertido', durationSeconds: 90, waterAmount: 205 },
                    { type: 'drawdown', title: 'Final', durationSeconds: 45, waterAmount: 0 },
                  ],
        },
        method
      );
      expect(built.ok, `Failed building custom recipe for ${method.id}`).toBe(true);
      if (!built.ok) continue;

      expect(
        built.recipe.phases.every((p) => p.svgDirective.vesselType === expectedVessels[method.id])
      ).toBe(true);

      if (method.id === 'espresso') {
        expect('ristretto' in built.recipe.intensityRatios).toBe(true);
      } else {
        expect('normal' in built.recipe.intensityRatios).toBe(true);
      }

      if (method.id === 'aeropress') {
        const last = built.recipe.phases[built.recipe.phases.length - 1]!;
        expect(last.svgDirective.plungerState).toBe('pressing');
        expect(last.svgDirective.liquidFillEndRatio).toBe(0);
      }
    }
  });

  it('rejects drafts with zero total water or mismatched methodId', () => {
    const zeroWater = buildCustomRecipe(
      {
        methodId: 'v60',
        title: 'Sin agua',
        phases: [{ type: 'wait', title: 'Espera', durationSeconds: 30, waterAmount: 0 }],
      },
      v60
    );
    expect(zeroWater.ok).toBe(false);
    if (!zeroWater.ok) {
      expect(zeroWater.errorCode).toBe('zero_total_water');
    }

    const mismatch = buildCustomRecipe(
      {
        methodId: 'chemex',
        title: 'Equivocado',
        phases: [{ type: 'pour', title: 'Vertido', durationSeconds: 30, waterAmount: 100 }],
      },
      v60
    );
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) {
      expect(mismatch.errorCode).toBe('method_mismatch');
    }
  });
});
