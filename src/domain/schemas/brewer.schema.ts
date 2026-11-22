import { z } from 'zod';
import { BrewMethodBaseSchema } from './brewing.schema';
import { WikiEntryCommonFields } from './wiki.schema';

export const BrewerFamilySchema = z.enum([
  'drip_filter',
  'immersion',
  'pressure',
  'decoction',
]);
export type BrewerFamily = z.infer<typeof BrewerFamilySchema>;

export const BrewerHistorySchema = z.object({
  inventorKey: z.string().min(1),
  originCountryKey: z.string().min(1),
  eraKey: z.string().min(1),
  howItWorksKey: z.string().min(1),
});
export type BrewerHistory = z.infer<typeof BrewerHistorySchema>;

export const BrewerEntrySchema = z
  .object({
    ...WikiEntryCommonFields,
    family: BrewerFamilySchema,
    history: BrewerHistorySchema,
    methodId: BrewMethodBaseSchema.shape.id.nullable(),
    recipeIds: z.array(z.string().min(1)),
    traditionalPreparationKey: z.string().min(1).optional(),
  })
  .superRefine((entry, ctx) => {
    if (entry.methodId === null) {
      if (entry.recipeIds.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recipeIds'],
          message: 'Encyclopedic brewers (methodId: null) must not list recipeIds',
        });
      }
      if (!entry.traditionalPreparationKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['traditionalPreparationKey'],
          message: 'Encyclopedic brewers (methodId: null) require a traditionalPreparationKey',
        });
      }
    } else if (entry.recipeIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recipeIds'],
        message: 'Brewers linked to a brew station require at least one recipeId',
      });
    }
  });

export type BrewerEntry = z.infer<typeof BrewerEntrySchema>;
