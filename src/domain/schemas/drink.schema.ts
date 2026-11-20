import { z } from 'zod';
import {
  BrewMethodBaseSchema,
  RecipeProfileBaseSchema,
  type BrewMethod,
} from './brewing.schema';
import type { BrewerEntry } from './brewer.schema';
import type { FlavorWheelNode } from './flavor-wheel.schema';
import type { CatalogBrewRecipe } from './recipe.schema';
import {
  KEBAB_SLUG_REGEX,
  WikiEntryCommonFields,
  type SensoryCatalogIntegrityResult,
  type WikiEntry,
} from './wiki.schema';

export const DrinkFamilySchema = z.enum(['espresso_black', 'espresso_milk', 'cold']);
export type DrinkFamily = z.infer<typeof DrinkFamilySchema>;

const CompositionPercentSchema = z.number().int().min(0).max(100);

export const DrinkCompositionSchema = z
  .object({
    coffee: CompositionPercentSchema,
    milk: CompositionPercentSchema,
    water: CompositionPercentSchema,
    foam: CompositionPercentSchema,
  })
  .superRefine((comp, ctx) => {
    const total = comp.coffee + comp.milk + comp.water + comp.foam;
    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: `Drink composition percentages must sum to 100 (received ${total})`,
      });
    }
  });
export type DrinkComposition = z.infer<typeof DrinkCompositionSchema>;

export const DrinkServedVolumeMlSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .superRefine((range, ctx) => {
    if (range.max < range.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max'],
        message: `servedVolumeMl.max (${range.max}) must be greater than or equal to min (${range.min})`,
      });
    }
  });
export type DrinkServedVolumeMl = z.infer<typeof DrinkServedVolumeMlSchema>;

export const DrinkHistorySchema = z.object({
  originCountryKey: z.string().min(1),
  eraKey: z.string().min(1),
  historyKey: z.string().min(1),
  preparationKey: z.string().min(1),
});
export type DrinkHistory = z.infer<typeof DrinkHistorySchema>;

export const DrinkBrewLinkSchema = z.object({
  methodId: BrewMethodBaseSchema.shape.id,
  profileId: RecipeProfileBaseSchema.shape.id,
});
export type DrinkBrewLink = z.infer<typeof DrinkBrewLinkSchema>;

export const DrinkRegionalVariantSchema = z.object({
  id: z.string().regex(KEBAB_SLUG_REGEX, {
    message: 'Drink regional variant id must be kebab-case',
  }),
  nameKey: z.string().min(1),
  regionKey: z.string().min(1),
  descriptionKey: z.string().min(1),
});
export type DrinkRegionalVariant = z.infer<typeof DrinkRegionalVariantSchema>;

export const DrinkEntrySchema = z.object({
  ...WikiEntryCommonFields,
  family: DrinkFamilySchema,
  history: DrinkHistorySchema,
  composition: DrinkCompositionSchema,
  servedVolumeMl: DrinkServedVolumeMlSchema,
  baseBrewerSlugs: z
    .array(
      z.string().regex(KEBAB_SLUG_REGEX, {
        message: 'Base brewer slug must be kebab-case',
      })
    )
    .min(1),
  brewLink: DrinkBrewLinkSchema.nullable(),
  regionalVariants: z.array(DrinkRegionalVariantSchema),
});
export type DrinkEntry = z.infer<typeof DrinkEntrySchema>;

export interface BrewersAndDrinksIntegrityInput {
  readonly brewers: readonly BrewerEntry[];
  readonly drinks: readonly DrinkEntry[];
  readonly wikiEntries: readonly WikiEntry[];
  readonly flavorTree: readonly FlavorWheelNode[];
  readonly methods: readonly BrewMethod[];
  readonly recipes: readonly CatalogBrewRecipe[];
}

function collectFlavorIds(nodes: readonly FlavorWheelNode[], ids: Set<string>): void {
  for (const node of nodes) {
    ids.add(node.id);
    if (node.children.length > 0) {
      collectFlavorIds(node.children, ids);
    }
  }
}

/**
 * Pure cross-catalog referential integrity validator for Brewers and Drinks (RN-I18N-02).
 * Verifies global slug uniqueness across all Wiki sections, 1:1 mapping of MVP brew methods,
 * valid brewer recipe references (including each method's default recipe), valid SCA flavor IDs,
 * valid drink brewLink pairs, existing baseBrewerSlugs, and unique variant IDs per drink.
 */
export function validateBrewersAndDrinksIntegrity(
  input: BrewersAndDrinksIntegrityInput
): SensoryCatalogIntegrityResult {
  const { brewers, drinks, wikiEntries, flavorTree, methods, recipes } = input;
  const errors: string[] = [];

  const flavorIds = new Set<string>();
  collectFlavorIds(flavorTree, flavorIds);

  const methodProfilesMap = new Map<string, Set<string>>();
  for (const method of methods) {
    methodProfilesMap.set(
      method.id,
      new Set(method.profiles.map((profile) => profile.id))
    );
  }

  const recipesById = new Map<string, CatalogBrewRecipe>();
  const defaultRecipeByMethod = new Map<string, string>();
  for (const recipe of recipes) {
    recipesById.set(recipe.id, recipe);
    if (recipe.isDefault) {
      defaultRecipeByMethod.set(recipe.methodId, recipe.id);
    }
  }

  const seenGlobalSlugs = new Set<string>();
  for (const entry of wikiEntries) {
    seenGlobalSlugs.add(entry.slug);
  }

  const brewerCountByMethod = new Map<string, string[]>();
  for (const methodId of BrewMethodBaseSchema.shape.id.options) {
    brewerCountByMethod.set(methodId, []);
  }

  const brewerSlugs = new Set<string>();
  for (const brewer of brewers) {
    if (seenGlobalSlugs.has(brewer.slug)) {
      errors.push(`Duplicate Wiki slug "${brewer.slug}" found in brewers catalog`);
    } else {
      seenGlobalSlugs.add(brewer.slug);
    }
    brewerSlugs.add(brewer.slug);

    for (const flavorId of brewer.flavorNodeIds) {
      if (!flavorIds.has(flavorId)) {
        errors.push(`Brewer "${brewer.slug}" references unknown flavorNodeId "${flavorId}"`);
      }
    }

    if (brewer.methodId !== null) {
      const mappedBrewers = brewerCountByMethod.get(brewer.methodId);
      if (mappedBrewers) {
        mappedBrewers.push(brewer.slug);
      }

      const seenRecipeIds = new Set<string>();
      for (const recipeId of brewer.recipeIds) {
        if (seenRecipeIds.has(recipeId)) {
          errors.push(`Brewer "${brewer.slug}" lists duplicate recipeId "${recipeId}"`);
        } else {
          seenRecipeIds.add(recipeId);
        }

        const recipe = recipesById.get(recipeId);
        if (!recipe) {
          errors.push(`Brewer "${brewer.slug}" references unknown recipeId "${recipeId}"`);
        } else if (recipe.methodId !== brewer.methodId) {
          errors.push(
            `Brewer "${brewer.slug}" (method "${brewer.methodId}") references recipe "${recipeId}" belonging to method "${recipe.methodId}"`
          );
        }
      }

      const defaultRecipeId = defaultRecipeByMethod.get(brewer.methodId);
      if (defaultRecipeId && !seenRecipeIds.has(defaultRecipeId)) {
        errors.push(
          `Brewer "${brewer.slug}" (method "${brewer.methodId}") is missing its default recipe "${defaultRecipeId}"`
        );
      }
    }
  }

  for (const [methodId, slugs] of brewerCountByMethod.entries()) {
    if (slugs.length === 0) {
      errors.push(`Brew method "${methodId}" has no brewer entry mapped in brewers catalog`);
    } else if (slugs.length > 1) {
      errors.push(
        `Brew method "${methodId}" is mapped to multiple brewer entries: ${slugs.join(', ')}`
      );
    }
  }

  for (const drink of drinks) {
    if (seenGlobalSlugs.has(drink.slug)) {
      errors.push(`Duplicate Wiki slug "${drink.slug}" found in drinks catalog`);
    } else {
      seenGlobalSlugs.add(drink.slug);
    }

    for (const flavorId of drink.flavorNodeIds) {
      if (!flavorIds.has(flavorId)) {
        errors.push(`Drink "${drink.slug}" references unknown flavorNodeId "${flavorId}"`);
      }
    }

    for (const brewerSlug of drink.baseBrewerSlugs) {
      if (!brewerSlugs.has(brewerSlug)) {
        errors.push(`Drink "${drink.slug}" references unknown baseBrewerSlug "${brewerSlug}"`);
      }
    }

    if (drink.brewLink !== null) {
      const validProfiles = methodProfilesMap.get(drink.brewLink.methodId);
      if (!validProfiles) {
        errors.push(
          `Drink "${drink.slug}" references unknown brewLink.methodId "${drink.brewLink.methodId}"`
        );
      } else if (!validProfiles.has(drink.brewLink.profileId)) {
        errors.push(
          `Drink "${drink.slug}" references invalid brewLink profileId "${drink.brewLink.profileId}" for method "${drink.brewLink.methodId}"`
        );
      }
    }

    const seenVariantIds = new Set<string>();
    for (const variant of drink.regionalVariants) {
      if (seenVariantIds.has(variant.id)) {
        errors.push(`Drink "${drink.slug}" contains duplicate regional variant id "${variant.id}"`);
      } else {
        seenVariantIds.add(variant.id);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
