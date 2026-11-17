import { z } from 'zod';

export const RangeThresholdSchema = z
  .object({
    minCoffeeGrams: z.number().positive(),
    maxCoffeeGrams: z.number().positive(),
    minWaterMl: z.number().positive().optional(),
    maxWaterMl: z.number().positive().optional(),
    smallDoseGrindTipThresholdGrams: z.number().positive(),
    largeDoseGrindTipThresholdGrams: z.number().positive(),
    warningMessageKeys: z.object({
      belowMinKey: z.string().min(1),
      aboveMaxKey: z.string().min(1),
    }),
  })
  .superRefine((val, ctx) => {
    if (val.maxCoffeeGrams < val.minCoffeeGrams) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxCoffeeGrams'],
        message: 'maxCoffeeGrams must be greater than or equal to minCoffeeGrams',
      });
    }
    if (
      val.minWaterMl !== undefined &&
      val.maxWaterMl !== undefined &&
      val.maxWaterMl < val.minWaterMl
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxWaterMl'],
        message: 'maxWaterMl must be greater than or equal to minWaterMl',
      });
    }
  });

export type RangeThreshold = z.infer<typeof RangeThresholdSchema>;

export const SvgStageDirectiveSchema = z.object({
  vesselType: z.enum([
    'cone_v60',
    'hourglass_chemex',
    'wedge_melitta',
    'cylinder_aeropress',
    'beaker_french_press',
    'portafilter_espresso',
  ]),
  pourStream: z.enum(['none', 'gentle', 'steady', 'spiral']),
  agitator: z.enum(['none', 'spoon_stir', 'vessel_swirl']),
  plungerState: z.enum(['none', 'up', 'pressing', 'down']),
  liquidFillStartRatio: z.number().min(0).max(1),
  liquidFillEndRatio: z.number().min(0).max(1),
  coffeeBedTurbulence: z.enum(['calm', 'bubbling_bloom', 'active_slurry', 'settled']),
});

export type SvgStageDirective = z.infer<typeof SvgStageDirectiveSchema>;

export const BrewPhaseSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  type: z.enum([
    'bloom',
    'pour',
    'wait',
    'stir',
    'swirl',
    'plunge',
    'drawdown',
    'espresso_shot',
  ]),
  titleKey: z.string().min(1),
  instructionKey: z.string().min(1),
  startTimeSeconds: z.number().nonnegative(),
  endTimeSeconds: z.number().positive(),
  waterShare: z.number().min(0).max(1),
  svgDirective: SvgStageDirectiveSchema,
});

export type BrewPhase = z.infer<typeof BrewPhaseSchema>;

export const RecipeProfileBaseSchema = z.object({
  id: z.enum(['light', 'normal', 'strong', 'ristretto', 'normale', 'lungo']),
  labelKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  ratio: z.number().positive(),
  referenceAuthor: z.string().min(1),
  totalDurationSeconds: z.number().positive(),
  phases: z.array(BrewPhaseSchema).min(1),
});

export const RecipeProfileSchema = RecipeProfileBaseSchema.superRefine((val, ctx) => {
  // Check contiguous timeline
  if (val.phases.length > 0) {
    const firstPhase = val.phases[0];
    if (firstPhase && firstPhase.startTimeSeconds !== 0) {
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
          message: `Phase ${current.id} endTimeSeconds must be greater than startTimeSeconds`,
        });
      }

      if (i < val.phases.length - 1) {
        const next = val.phases[i + 1];
        if (next && current.endTimeSeconds !== next.startTimeSeconds) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phases', i + 1, 'startTimeSeconds'],
            message: `Phase ${next.id} startTimeSeconds (${next.startTimeSeconds}) does not match previous phase endTimeSeconds (${current.endTimeSeconds})`,
          });
        }
      }
    }

    const lastPhase = val.phases[val.phases.length - 1];
    if (lastPhase && lastPhase.endTimeSeconds !== val.totalDurationSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalDurationSeconds'],
        message: `Last phase endTimeSeconds (${lastPhase.endTimeSeconds}) does not match totalDurationSeconds (${val.totalDurationSeconds})`,
      });
    }
  }

  // Check waterShare sum == 1.0 (+- 1e-6)
  const sumWaterShare = val.phases.reduce((acc, p) => acc + p.waterShare, 0);
  if (Math.abs(sumWaterShare - 1.0) > 1e-6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phases'],
      message: `Sum of waterShare across all phases must equal 1.0 (found ${sumWaterShare.toFixed(4)})`,
    });
  }
});

export type RecipeProfile = z.infer<typeof RecipeProfileSchema>;

export const BrewMethodBaseSchema = z.object({
  id: z.enum(['v60', 'chemex', 'melitta', 'aeropress', 'french-press', 'espresso']),
  nameKey: z.string().min(1),
  category: z.enum(['pour_over', 'immersion', 'hybrid', 'pressure']),
  scalingMode: z.enum(['filter_water_ratio', 'espresso_yield_ratio']),
  defaultDoseGrams: z.number().positive(),
  baseGrindKey: z.string().min(1),
  waterTempCelsius: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    recommended: z.number().positive(),
  }),
  thresholds: RangeThresholdSchema,
  profiles: z.array(RecipeProfileSchema).length(3),
});

export const BrewMethodSchema = BrewMethodBaseSchema.superRefine((val, ctx) => {
  // Check defaultDoseGrams within [minCoffeeGrams, maxCoffeeGrams]
  if (
    val.defaultDoseGrams < val.thresholds.minCoffeeGrams ||
    val.defaultDoseGrams > val.thresholds.maxCoffeeGrams
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultDoseGrams'],
      message: `defaultDoseGrams (${val.defaultDoseGrams}) must be between ${val.thresholds.minCoffeeGrams} and ${val.thresholds.maxCoffeeGrams}`,
    });
  }

  // Check profile taxonomy uniformly
  const profileIds = new Set<string>(val.profiles.map((p) => p.id));
  const isEspresso = val.scalingMode === 'espresso_yield_ratio' || val.id === 'espresso';
  const required = isEspresso ? ['ristretto', 'normale', 'lungo'] : ['light', 'normal', 'strong'];
  const missing = required.filter((r) => !profileIds.has(r));

  if (missing.length > 0 || profileIds.size !== 3) {
    const label = isEspresso ? 'Espresso' : 'Filter/immersion';
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['profiles'],
      message: `${label} profiles must contain exactly [${required.join(', ')}], missing: ${missing.join(', ')}`,
    });
  }
});

export type BrewMethod = z.infer<typeof BrewMethodSchema>;
