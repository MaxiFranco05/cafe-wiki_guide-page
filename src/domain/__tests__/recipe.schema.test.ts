import { describe, it, expect } from 'vitest';
import {
  BrewRecipeSchema,
  CatalogBrewRecipeSchema,
  CustomBrewRecipeSchema,
  CustomRecipeDraftSchema,
  CustomRecipeExportEnvelopeSchema,
  type CatalogBrewRecipe,
  type CustomBrewRecipe,
  type CustomRecipeDraft,
  type CustomRecipeExportEnvelope,
} from '../schemas';

const baseSvgDirective = {
  vesselType: 'cone_v60' as const,
  pourStream: 'spiral' as const,
  agitator: 'vessel_swirl' as const,
  plungerState: 'none' as const,
  liquidFillStartRatio: 0,
  liquidFillEndRatio: 0.4,
  coffeeBedTurbulence: 'bubbling_bloom' as const,
};

const validCatalogRecipe: CatalogBrewRecipe = {
  id: 'v60-hoffmann-1cup',
  methodId: 'v60',
  source: 'catalog',
  kind: 'author',
  isDefault: false,
  authorName: 'James Hoffmann',
  difficulty: 'intermediate',
  titleKey: 'recipes.v60.hoffmann1cup.title',
  processSummaryKey: 'recipes.v60.hoffmann1cup.processSummary',
  flavorHighlightKey: 'recipes.v60.hoffmann1cup.flavorHighlight',
  grindNoteKey: 'recipes.v60.hoffmann1cup.grindNote',
  defaultDoseGrams: 15,
  waterTempCelsius: { min: 94, max: 100, recommended: 95 },
  intensityRatios: { light: 17.5, normal: 16.67, strong: 15.0 },
  totalDurationSeconds: 180,
  phases: [
    {
      id: 'bloom',
      order: 1,
      type: 'bloom',
      titleKey: 'recipes.v60.hoffmann1cup.phases.bloom.title',
      instructionKey: 'recipes.v60.hoffmann1cup.phases.bloom.instruction',
      startTimeSeconds: 0,
      endTimeSeconds: 45,
      waterShare: 0.4,
      svgDirective: baseSvgDirective,
    },
    {
      id: 'pour1',
      order: 2,
      type: 'pour',
      titleKey: 'recipes.v60.hoffmann1cup.phases.pour1.title',
      instructionKey: 'recipes.v60.hoffmann1cup.phases.pour1.instruction',
      startTimeSeconds: 45,
      endTimeSeconds: 120,
      waterShare: 0.6,
      svgDirective: {
        ...baseSvgDirective,
        pourStream: 'steady',
        agitator: 'none',
        liquidFillStartRatio: 0.4,
        liquidFillEndRatio: 0.85,
        coffeeBedTurbulence: 'active_slurry',
      },
    },
    {
      id: 'drawdown',
      order: 3,
      type: 'drawdown',
      titleKey: 'recipes.v60.hoffmann1cup.phases.drawdown.title',
      instructionKey: 'recipes.v60.hoffmann1cup.phases.drawdown.instruction',
      startTimeSeconds: 120,
      endTimeSeconds: 180,
      waterShare: 0,
      svgDirective: {
        ...baseSvgDirective,
        pourStream: 'none',
        agitator: 'none',
        liquidFillStartRatio: 0.85,
        liquidFillEndRatio: 1,
        coffeeBedTurbulence: 'settled',
      },
    },
  ],
};

const validCustomRecipe: CustomBrewRecipe = {
  id: 'custom-v60-morning',
  methodId: 'v60',
  source: 'custom',
  kind: 'custom',
  isDefault: false,
  authorName: 'Mi receta',
  difficulty: 'universal',
  title: 'Mi V60 de mañana',
  processSummary: 'Bloom de 45 s y dos vertidos tranquilos.',
  flavorHighlight: 'Dulzor a caramelo y acidez cítrica suave.',
  defaultDoseGrams: 16,
  waterTempCelsius: { min: 92, max: 95, recommended: 93 },
  intensityRatios: { light: 17, normal: 16, strong: 14.7 },
  totalDurationSeconds: 180,
  createdAtIso: '2026-11-19T23:00:00.000Z',
  updatedAtIso: '2026-11-19T23:00:00.000Z',
  phases: [
    {
      id: 'phase-1',
      order: 1,
      type: 'bloom',
      titleKey: 'custom',
      instructionKey: 'custom',
      customTitle: 'Bloom',
      customInstruction: 'Verté {{waterGrams}} g en espiral.',
      startTimeSeconds: 0,
      endTimeSeconds: 45,
      waterShare: 0.25,
      svgDirective: { ...baseSvgDirective, liquidFillEndRatio: 0.25 },
    },
    {
      id: 'phase-2',
      order: 2,
      type: 'pour',
      titleKey: 'custom',
      instructionKey: 'custom',
      customTitle: 'Vertido principal',
      customInstruction: 'Completá hasta {{cumulativeWaterGrams}} g.',
      startTimeSeconds: 45,
      endTimeSeconds: 180,
      waterShare: 0.75,
      svgDirective: {
        ...baseSvgDirective,
        pourStream: 'steady',
        agitator: 'none',
        liquidFillStartRatio: 0.25,
        liquidFillEndRatio: 1,
        coffeeBedTurbulence: 'active_slurry',
      },
    },
  ],
};

describe('Multi-Recipe & Custom Recipe Zod Schemas (Block 1)', () => {
  it('validates catalog and custom recipes via discriminated BrewRecipeSchema', () => {
    expect(CatalogBrewRecipeSchema.safeParse(validCatalogRecipe).success).toBe(true);
    expect(CustomBrewRecipeSchema.safeParse(validCustomRecipe).success).toBe(true);
    expect(BrewRecipeSchema.safeParse(validCatalogRecipe).success).toBe(true);
    expect(BrewRecipeSchema.safeParse(validCustomRecipe).success).toBe(true);
  });

  it('rejects phases whose waterShare sum deviates from 1.0', () => {
    const brokenSum = {
      ...validCatalogRecipe,
      phases: validCatalogRecipe.phases.map((p, i) =>
        i === 1 ? { ...p, waterShare: 0.4 } : p
      ),
    };
    const res = BrewRecipeSchema.safeParse(brokenSum);
    expect(res.success).toBe(false);
  });

  it('rejects non-contiguous phase timelines or mismatched totalDurationSeconds', () => {
    const gapTimeline = {
      ...validCatalogRecipe,
      phases: validCatalogRecipe.phases.map((p, i) =>
        i === 1 ? { ...p, startTimeSeconds: 50 } : p
      ),
    };
    const wrongTotal = {
      ...validCatalogRecipe,
      totalDurationSeconds: 200,
    };
    expect(BrewRecipeSchema.safeParse(gapTimeline).success).toBe(false);
    expect(BrewRecipeSchema.safeParse(wrongTotal).success).toBe(false);
  });

  it('enforces espresso vs. filter intensityRatios matching methodId', () => {
    const espressoWithFilterRatios = {
      ...validCatalogRecipe,
      id: 'espresso-broken',
      methodId: 'espresso',
    };
    const v60WithEspressoRatios = {
      ...validCatalogRecipe,
      intensityRatios: { ristretto: 1.5, normale: 2.0, lungo: 3.0 },
    };
    expect(BrewRecipeSchema.safeParse(espressoWithFilterRatios).success).toBe(false);
    expect(BrewRecipeSchema.safeParse(v60WithEspressoRatios).success).toBe(false);
  });

  it('validates CustomRecipeDraftSchema and CustomRecipeExportEnvelopeSchema (schemaVersion: 1)', () => {
    const draft: CustomRecipeDraft = {
      methodId: 'v60',
      title: 'Mi V60 Suave',
      baseRatio: 16,
      phases: [
        { type: 'bloom', title: 'Bloom', durationSeconds: 45, waterAmount: 50 },
        { type: 'pour', title: 'Vertido', durationSeconds: 90, waterAmount: 200 },
      ],
    };
    expect(CustomRecipeDraftSchema.safeParse(draft).success).toBe(true);

    const envelope: CustomRecipeExportEnvelope = {
      schemaVersion: 1,
      exportedAtIso: '2026-11-19T23:05:00.000Z',
      recipe: validCustomRecipe,
    };
    expect(CustomRecipeExportEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });

  it('rejects waterShare outside 1e-6 tolerance, unsupported schemaVersion, non-positive durations, and invalid waterTempCelsius', () => {
    const slightlyOffSum = {
      ...validCatalogRecipe,
      phases: validCatalogRecipe.phases.map((p, i) =>
        i === 1 ? { ...p, waterShare: 0.599 } : p
      ),
    };
    expect(BrewRecipeSchema.safeParse(slightlyOffSum).success).toBe(false);

    const unsupportedVersion = {
      schemaVersion: 2,
      exportedAtIso: '2026-11-19T23:05:00.000Z',
      recipe: validCustomRecipe,
    };
    expect(CustomRecipeExportEnvelopeSchema.safeParse(unsupportedVersion).success).toBe(false);

    const zeroDurationDraft = {
      methodId: 'v60',
      title: 'Zero duration',
      phases: [{ type: 'bloom', title: 'Bloom', durationSeconds: 0, waterAmount: 50 }],
    };
    expect(CustomRecipeDraftSchema.safeParse(zeroDurationDraft).success).toBe(false);

    const invalidTempRecipe = {
      ...validCatalogRecipe,
      waterTempCelsius: { min: 95, max: 90, recommended: 93 },
    };
    expect(BrewRecipeSchema.safeParse(invalidTempRecipe).success).toBe(false);

    const delayedStart = {
      ...validCatalogRecipe,
      phases: validCatalogRecipe.phases.map((p, i) =>
        i === 0 ? { ...p, startTimeSeconds: 5 } : p
      ),
    };
    expect(BrewRecipeSchema.safeParse(delayedStart).success).toBe(false);
  });
});
