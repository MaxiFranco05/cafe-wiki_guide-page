import { z } from 'zod';
import {
  BrewMethodBaseSchema,
  RecipeProfileBaseSchema,
  type BrewMethod,
} from './brewing.schema';
import type { FlavorWheelNode } from './flavor-wheel.schema';

export const KEBAB_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const WikiCategorySchema = z.enum(['origin', 'varietal', 'process']);
export type WikiCategory = z.infer<typeof WikiCategorySchema>;

export const RegionalRelevanceSchema = z.enum(['southern_cone_staple', 'global_specialty']);
export type RegionalRelevance = z.infer<typeof RegionalRelevanceSchema>;

export const OriginMacroRegionSchema = z.enum([
  'south_america',
  'central_north_america',
  'africa',
  'asia_pacific',
]);
export type OriginMacroRegion = z.infer<typeof OriginMacroRegionSchema>;

export const VarietalGeneticGroupSchema = z.enum([
  'bourbon_typica',
  'ethiopian_heirloom',
  'introgressed_hybrid',
  'canephora',
]);
export type VarietalGeneticGroup = z.infer<typeof VarietalGeneticGroupSchema>;

export const ProcessFamilySchema = z.enum([
  'washed_clean',
  'mucilage_honey',
  'natural_experimental',
  'decaffeination',
]);
export type ProcessFamily = z.infer<typeof ProcessFamilySchema>;

export const WikiSubGroupSchema = z.union([
  OriginMacroRegionSchema,
  VarietalGeneticGroupSchema,
  ProcessFamilySchema,
]);
export type WikiSubGroup = z.infer<typeof WikiSubGroupSchema>;

export const SensoryScoreSchema = z.number().int().min(1).max(5);
export type SensoryScore = z.infer<typeof SensoryScoreSchema>;

export const SensoryProfileSchema = z.object({
  acidity: SensoryScoreSchema,
  sweetness: SensoryScoreSchema,
  body: SensoryScoreSchema,
  bitterness: SensoryScoreSchema,
});
export type SensoryProfile = z.infer<typeof SensoryProfileSchema>;

export const RecommendedMethodSchema = z.object({
  methodId: BrewMethodBaseSchema.shape.id,
  profileId: RecipeProfileBaseSchema.shape.id,
  reasonKey: z.string().min(1),
});
export type RecommendedMethod = z.infer<typeof RecommendedMethodSchema>;

export const AltitudeRangeMetersSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive(),
  })
  .superRefine((range, ctx) => {
    if (range.max < range.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max'],
        message: `altitudeRangeMeters.max (${range.max}) must be greater than or equal to min (${range.min})`,
      });
    }
  });
export type AltitudeRangeMeters = z.infer<typeof AltitudeRangeMetersSchema>;

export const WikiEntryCommonFields = {
  slug: z.string().regex(KEBAB_SLUG_REGEX, {
    message: 'Wiki entry slug must be kebab-case (e.g. costa-rica, sl28-sl34)',
  }),
  regionalRelevance: RegionalRelevanceSchema,
  titleKey: z.string().min(1),
  summaryKey: z.string().min(1),
  commercialAliasesKey: z.string().min(1),
  sensoryProfile: SensoryProfileSchema,
  flavorNodeIds: z.array(z.string().min(1)).min(1),
};

const WikiEntryBaseFields = {
  ...WikiEntryCommonFields,
  recommendedMethods: z.array(RecommendedMethodSchema).min(1),
};

export const OriginMetadataSchema = z.object({
  macroRegion: OriginMacroRegionSchema,
  regionKey: z.string().min(1),
  altitudeRangeMeters: AltitudeRangeMetersSchema,
  harvestMonthsKey: z.string().min(1),
});
export type OriginMetadata = z.infer<typeof OriginMetadataSchema>;

export const VarietalMetadataSchema = z.object({
  geneticGroup: VarietalGeneticGroupSchema,
  species: z.enum(['arabica', 'canephora', 'liberica']),
  lineageKey: z.string().min(1),
  discoveryRegionKey: z.string().min(1),
});
export type VarietalMetadata = z.infer<typeof VarietalMetadataSchema>;

export const ProcessMetadataSchema = z.object({
  processFamily: ProcessFamilySchema,
  fermentationType: z.enum(['washed', 'natural', 'pulped_natural', 'honey', 'anaerobic', 'decaf']),
  mucilageRemovalKey: z.string().min(1),
  dryingMethodKey: z.string().min(1),
});
export type ProcessMetadata = z.infer<typeof ProcessMetadataSchema>;

export const OriginWikiEntrySchema = z.object({
  ...WikiEntryBaseFields,
  category: z.literal('origin'),
  metadata: OriginMetadataSchema,
});
export type OriginWikiEntry = z.infer<typeof OriginWikiEntrySchema>;

export const VarietalWikiEntrySchema = z.object({
  ...WikiEntryBaseFields,
  category: z.literal('varietal'),
  metadata: VarietalMetadataSchema,
});
export type VarietalWikiEntry = z.infer<typeof VarietalWikiEntrySchema>;

export const ProcessWikiEntrySchema = z.object({
  ...WikiEntryBaseFields,
  category: z.literal('process'),
  metadata: ProcessMetadataSchema,
});
export type ProcessWikiEntry = z.infer<typeof ProcessWikiEntrySchema>;

export const WikiEntrySchema = z.discriminatedUnion('category', [
  OriginWikiEntrySchema,
  VarietalWikiEntrySchema,
  ProcessWikiEntrySchema,
]);
export type WikiEntry = z.infer<typeof WikiEntrySchema>;

const WikiSlugSchema = z.string().regex(KEBAB_SLUG_REGEX, {
  message: 'Wiki slug must be kebab-case',
});

/**
 * Origin -> varietals commonly grown there (C-10). Defined once; the reverse
 * direction (varietal -> origins) is always derived from this same table.
 */
export const OriginVarietalsSchema = z.record(
  WikiSlugSchema,
  z
    .array(WikiSlugSchema)
    .min(1)
    .refine((slugs) => new Set(slugs).size === slugs.length, {
      message: 'Varietal slugs must not repeat within an origin',
    })
);
export type OriginVarietals = z.infer<typeof OriginVarietalsSchema>;

export interface SensoryCatalogIntegrityResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

function collectFlavorNodeIds(
  nodes: readonly FlavorWheelNode[],
  seenIds: Set<string>,
  errors: string[]
): void {
  for (const node of nodes) {
    if (seenIds.has(node.id)) {
      errors.push(`Duplicate flavor wheel node id "${node.id}"`);
    } else {
      seenIds.add(node.id);
    }
    if (node.children.length > 0) {
      collectFlavorNodeIds(node.children, seenIds, errors);
    }
  }
}

/**
 * Pure cross-catalog referential integrity validator (RN-I18N-02).
 * Verifies unique flavor node IDs, unique wiki slugs, valid flavorNodeIds,
 * and valid methodId/profileId pairs against the brewing methods catalog.
 */
export function validateSensoryCatalogIntegrity(
  wikiEntries: readonly WikiEntry[],
  flavorTree: readonly FlavorWheelNode[],
  methodsCatalog: readonly BrewMethod[]
): SensoryCatalogIntegrityResult {
  const errors: string[] = [];

  const flavorIds = new Set<string>();
  collectFlavorNodeIds(flavorTree, flavorIds, errors);

  const methodProfilesMap = new Map<string, Set<string>>();
  for (const method of methodsCatalog) {
    methodProfilesMap.set(
      method.id,
      new Set(method.profiles.map((profile) => profile.id))
    );
  }

  const seenSlugs = new Set<string>();
  for (const entry of wikiEntries) {
    if (seenSlugs.has(entry.slug)) {
      errors.push(`Duplicate wiki entry slug "${entry.slug}"`);
    } else {
      seenSlugs.add(entry.slug);
    }

    for (const flavorId of entry.flavorNodeIds) {
      if (!flavorIds.has(flavorId)) {
        errors.push(
          `Wiki entry "${entry.slug}" references unknown flavorNodeId "${flavorId}"`
        );
      }
    }

    for (const rec of entry.recommendedMethods) {
      const validProfiles = methodProfilesMap.get(rec.methodId);
      if (!validProfiles) {
        errors.push(
          `Wiki entry "${entry.slug}" references unknown methodId "${rec.methodId}"`
        );
      } else if (!validProfiles.has(rec.profileId)) {
        errors.push(
          `Wiki entry "${entry.slug}" references invalid profileId "${rec.profileId}" for method "${rec.methodId}"`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
