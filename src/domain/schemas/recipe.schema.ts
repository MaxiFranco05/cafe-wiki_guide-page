import { z } from 'zod';
import {
  BrewMethodBaseSchema,
  BrewPhaseSchema,
  type BrewMethod,
  type BrewPhase,
} from './brewing.schema';

const RECIPE_ID_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RecipeKindSchema = z.enum(['standard', 'author', 'classic', 'custom']);
export type RecipeKind = z.infer<typeof RecipeKindSchema>;

export const RecipeDifficultySchema = z.enum(['universal', 'intermediate', 'advanced']);
export type RecipeDifficulty = z.infer<typeof RecipeDifficultySchema>;

export const WaterTempRangeSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive(),
    recommended: z.number().positive(),
  })
  .superRefine((temp, ctx) => {
    if (temp.max < temp.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max'],
        message: 'waterTempCelsius.max must be >= min',
      });
    }
    if (temp.recommended < temp.min || temp.recommended > temp.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recommended'],
        message: 'waterTempCelsius.recommended must lie within [min, max]',
      });
    }
  });
export type WaterTempRange = z.infer<typeof WaterTempRangeSchema>;

export const FilterIntensityRatiosSchema = z
  .object({
    light: z.number().positive(),
    normal: z.number().positive(),
    strong: z.number().positive(),
  })
  .strict();
export type FilterIntensityRatios = z.infer<typeof FilterIntensityRatiosSchema>;

export const EspressoIntensityRatiosSchema = z
  .object({
    ristretto: z.number().positive(),
    normale: z.number().positive(),
    lungo: z.number().positive(),
  })
  .strict();
export type EspressoIntensityRatios = z.infer<typeof EspressoIntensityRatiosSchema>;

export const IntensityRatiosSchema = z.union([
  FilterIntensityRatiosSchema,
  EspressoIntensityRatiosSchema,
]);
export type IntensityRatios = z.infer<typeof IntensityRatiosSchema>;

export const BrewRecipePhaseSchema = BrewPhaseSchema.extend({
  customTitle: z.string().min(1).optional(),
  customInstruction: z.string().min(1).optional(),
});
export type BrewRecipePhase = z.infer<typeof BrewRecipePhaseSchema>;

const BrewRecipeCommonFields = {
  id: z.string().regex(RECIPE_ID_REGEX, {
    message: 'Recipe id must be kebab-case (e.g. v60-hoffmann-1cup)',
  }),
  methodId: BrewMethodBaseSchema.shape.id,
  isDefault: z.boolean(),
  authorName: z.string().min(1),
  difficulty: RecipeDifficultySchema,
  defaultDoseGrams: z.number().positive().optional(),
  waterTempCelsius: WaterTempRangeSchema.optional(),
  intensityRatios: IntensityRatiosSchema,
  totalDurationSeconds: z.number().positive(),
  phases: z.array(BrewRecipePhaseSchema).min(1),
};

export const CatalogBrewRecipeBaseSchema = z.object({
  ...BrewRecipeCommonFields,
  source: z.literal('catalog'),
  kind: z.enum(['standard', 'author', 'classic']),
  titleKey: z.string().min(1),
  processSummaryKey: z.string().min(1),
  flavorHighlightKey: z.string().min(1),
  grindNoteKey: z.string().min(1).optional(),
});

export const CustomBrewRecipeBaseSchema = z.object({
  ...BrewRecipeCommonFields,
  source: z.literal('custom'),
  kind: z.literal('custom'),
  title: z.string().trim().min(1).max(80),
  processSummary: z.string().trim().max(300).optional(),
  flavorHighlight: z.string().trim().max(200).optional(),
  grindNote: z.string().trim().max(120).optional(),
  createdAtIso: z.string().min(1),
  updatedAtIso: z.string().min(1),
});

interface RecipeInvariantTarget {
  readonly methodId: BrewMethod['id'];
  readonly intensityRatios: IntensityRatios;
  readonly totalDurationSeconds: number;
  readonly phases: readonly BrewPhase[];
}

function validateRecipeInvariants(val: RecipeInvariantTarget, ctx: z.RefinementCtx): void {
  const isEspresso = val.methodId === 'espresso';
  const hasEspressoKeys = 'ristretto' in val.intensityRatios;

  if (isEspresso && !hasEspressoKeys) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['intensityRatios'],
      message: 'Espresso recipes must define ristretto, normale, and lungo intensityRatios',
    });
  } else if (!isEspresso && hasEspressoKeys) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['intensityRatios'],
      message: 'Filter/immersion recipes must define light, normal, and strong intensityRatios',
    });
  }

  if (val.phases.length > 0) {
    const first = val.phases[0];
    if (first && first.startTimeSeconds !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phases', 0, 'startTimeSeconds'],
        message: 'First phase must start at 0 seconds',
      });
    }

    for (let i = 0; i < val.phases.length; i++) {
      const current = val.phases[i];
      if (!current) continue;

      if (current.endTimeSeconds <= current.startTimeSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phases', i, 'endTimeSeconds'],
          message: `Phase "${current.id}" endTimeSeconds must be greater than startTimeSeconds`,
        });
      }

      if (i < val.phases.length - 1) {
        const next = val.phases[i + 1];
        if (next && current.endTimeSeconds !== next.startTimeSeconds) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phases', i + 1, 'startTimeSeconds'],
            message: `Phase "${next.id}" startTimeSeconds (${next.startTimeSeconds}) must match previous endTimeSeconds (${current.endTimeSeconds})`,
          });
        }
      }
    }

    const last = val.phases[val.phases.length - 1];
    if (last && last.endTimeSeconds !== val.totalDurationSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalDurationSeconds'],
        message: `Last phase endTimeSeconds (${last.endTimeSeconds}) must match totalDurationSeconds (${val.totalDurationSeconds})`,
      });
    }
  }

  const sumWaterShare = val.phases.reduce((acc, p) => acc + p.waterShare, 0);
  if (Math.abs(sumWaterShare - 1.0) > 1e-6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phases'],
      message: `Sum of waterShare across phases must equal 1.0 (got ${sumWaterShare.toFixed(6)})`,
    });
  }
}

export const CatalogBrewRecipeSchema =
  CatalogBrewRecipeBaseSchema.superRefine(validateRecipeInvariants);
export type CatalogBrewRecipe = z.infer<typeof CatalogBrewRecipeSchema>;

export const CustomBrewRecipeSchema =
  CustomBrewRecipeBaseSchema.superRefine(validateRecipeInvariants);
export type CustomBrewRecipe = z.infer<typeof CustomBrewRecipeSchema>;

export const BrewRecipeSchema = z
  .discriminatedUnion('source', [CatalogBrewRecipeBaseSchema, CustomBrewRecipeBaseSchema])
  .superRefine(validateRecipeInvariants);
export type BrewRecipe = z.infer<typeof BrewRecipeSchema>;

export const CustomRecipeDraftPhaseSchema = z.object({
  id: z.string().min(1).optional(),
  type: BrewPhaseSchema.shape.type,
  title: z.string().trim().min(1).max(60),
  instruction: z.string().trim().max(240).optional(),
  durationSeconds: z.number().int().positive(),
  waterAmount: z.number().nonnegative(),
});
export type CustomRecipeDraftPhase = z.infer<typeof CustomRecipeDraftPhaseSchema>;

export const CustomRecipeDraftSchema = z.object({
  id: z.string().regex(RECIPE_ID_REGEX).optional(),
  methodId: BrewMethodBaseSchema.shape.id,
  title: z.string().trim().min(1).max(80),
  authorName: z.string().trim().min(1).max(60).optional(),
  processSummary: z.string().trim().max(300).optional(),
  flavorHighlight: z.string().trim().max(200).optional(),
  grindNote: z.string().trim().max(120).optional(),
  defaultDoseGrams: z.number().positive().optional(),
  waterTempCelsius: WaterTempRangeSchema.optional(),
  baseRatio: z.number().positive().optional(),
  intensityRatios: IntensityRatiosSchema.optional(),
  phases: z.array(CustomRecipeDraftPhaseSchema).min(1),
});
export type CustomRecipeDraft = z.infer<typeof CustomRecipeDraftSchema>;

export const CUSTOM_RECIPE_EXPORT_SCHEMA_VERSION = 1 as const;

export const CustomRecipeExportEnvelopeSchema = z.object({
  schemaVersion: z.literal(CUSTOM_RECIPE_EXPORT_SCHEMA_VERSION),
  exportedAtIso: z.string().min(1),
  recipe: CustomBrewRecipeSchema,
});
export type CustomRecipeExportEnvelope = z.infer<typeof CustomRecipeExportEnvelopeSchema>;
