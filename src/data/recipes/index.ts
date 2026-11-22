import type { BrewMethod, CatalogBrewRecipe } from '../../domain/schemas';
import { V60_RECIPES } from './v60';
import { CHEMEX_RECIPES } from './chemex';
import { MELITTA_RECIPES } from './melitta';
import { AEROPRESS_RECIPES } from './aeropress';
import { FRENCH_PRESS_RECIPES } from './french-press';
import { ESPRESSO_RECIPES } from './espresso';

export {
  V60_RECIPES,
  CHEMEX_RECIPES,
  MELITTA_RECIPES,
  AEROPRESS_RECIPES,
  FRENCH_PRESS_RECIPES,
  ESPRESSO_RECIPES,
};

function freezeRecipe(recipe: CatalogBrewRecipe): CatalogBrewRecipe {
  if (recipe.waterTempCelsius) {
    Object.freeze(recipe.waterTempCelsius);
  }
  Object.freeze(recipe.intensityRatios);
  for (const phase of recipe.phases) {
    Object.freeze(phase.svgDirective);
    Object.freeze(phase);
  }
  Object.freeze(recipe.phases);
  return Object.freeze(recipe);
}

export const RECIPES_CATALOG: readonly CatalogBrewRecipe[] = Object.freeze([
  ...V60_RECIPES.map(freezeRecipe),
  ...CHEMEX_RECIPES.map(freezeRecipe),
  ...MELITTA_RECIPES.map(freezeRecipe),
  ...AEROPRESS_RECIPES.map(freezeRecipe),
  ...FRENCH_PRESS_RECIPES.map(freezeRecipe),
  ...ESPRESSO_RECIPES.map(freezeRecipe),
]);

export const RECIPES_BY_ID: Readonly<Record<string, CatalogBrewRecipe>> = Object.freeze(
  RECIPES_CATALOG.reduce<Record<string, CatalogBrewRecipe>>((acc, recipe) => {
    acc[recipe.id] = recipe;
    return acc;
  }, {})
);

const recipesByMethodRecord: Record<BrewMethod['id'], readonly CatalogBrewRecipe[]> = {
  v60: Object.freeze(RECIPES_CATALOG.filter((r) => r.methodId === 'v60')),
  chemex: Object.freeze(RECIPES_CATALOG.filter((r) => r.methodId === 'chemex')),
  melitta: Object.freeze(RECIPES_CATALOG.filter((r) => r.methodId === 'melitta')),
  aeropress: Object.freeze(RECIPES_CATALOG.filter((r) => r.methodId === 'aeropress')),
  'french-press': Object.freeze(RECIPES_CATALOG.filter((r) => r.methodId === 'french-press')),
  espresso: Object.freeze(RECIPES_CATALOG.filter((r) => r.methodId === 'espresso')),
};

export function getRecipesByMethod(methodId: BrewMethod['id']): readonly CatalogBrewRecipe[] {
  return recipesByMethodRecord[methodId];
}

export function getDefaultRecipeForMethod(methodId: BrewMethod['id']): CatalogBrewRecipe {
  const list = recipesByMethodRecord[methodId];
  const standard = list.find((r) => r.isDefault);
  if (!standard) {
    throw new Error(`No default standard recipe registered for method "${methodId}"`);
  }
  return standard;
}

export function getRecipeById(recipeId: string): CatalogBrewRecipe | undefined {
  return RECIPES_BY_ID[recipeId];
}
