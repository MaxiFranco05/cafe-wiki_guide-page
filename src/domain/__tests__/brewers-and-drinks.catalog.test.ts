import { describe, it, expect } from 'vitest';
import {
  BrewerEntrySchema,
  DrinkEntrySchema,
  validateBrewersAndDrinksIntegrity,
  type BrewerEntry,
  type DrinkEntry,
} from '../schemas';
import {
  BREWERS_CATALOG,
  BREWERS_BY_SLUG,
  getBrewerBySlug,
  getBrewerForMethod,
  getBrewerRecipes,
  groupBrewersByFamily,
  filterBrewers,
} from '../../data/wiki-brewers';
import {
  DRINKS_CATALOG,
  DRINKS_BY_SLUG,
  getDrinkBySlug,
  getDrinksForBrewer,
  groupDrinksByFamily,
  filterDrinks,
} from '../../data/wiki-drinks';
import { WIKI_CATALOG } from '../../data/wiki';
import { FLAVOR_WHEEL_TREE } from '../../data/flavor-wheel';
import { METHODS_CATALOG } from '../../data/methods';
import { RECIPES_CATALOG } from '../../data/recipes';
import { t } from '../../i18n';

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

function collectBrewerTranslationKeys(entry: BrewerEntry): string[] {
  const keys = [
    entry.titleKey,
    entry.summaryKey,
    entry.commercialAliasesKey,
    entry.history.inventorKey,
    entry.history.originCountryKey,
    entry.history.eraKey,
    entry.history.howItWorksKey,
  ];
  if (entry.traditionalPreparationKey) {
    keys.push(entry.traditionalPreparationKey);
  }
  return keys;
}

describe('Wiki Brewers Static Catalog (Block 3)', () => {
  const expectedBrewerSlugs = [
    'v60',
    'chemex',
    'melitta',
    'aeropress',
    'french-press',
    'espresso-machine',
    'moka',
    'siphon',
    'cezve',
    'electric-drip',
  ];

  const expectedEncyclopedicSlugs = ['moka', 'siphon', 'cezve', 'electric-drip'];

  it('contains exactly the 10 specified brewers validated by BrewerEntrySchema', () => {
    expect(BREWERS_CATALOG).toHaveLength(10);
    expect(Object.keys(BREWERS_BY_SLUG)).toHaveLength(10);
    expect(BREWERS_CATALOG.map((b) => b.slug)).toEqual(expectedBrewerSlugs);

    for (const brewer of BREWERS_CATALOG) {
      const parsed = BrewerEntrySchema.safeParse(brewer);
      expect(parsed.success, `Failed validating brewer ${brewer.slug}`).toBe(true);
    }
  });

  it('maps each of the 6 MVP brew methods to exactly one brewer and keeps the 4 encyclopedic brewers without method or recipes', () => {
    const stationBrewers = BREWERS_CATALOG.filter((b) => b.methodId !== null);
    const encyclopedicBrewers = BREWERS_CATALOG.filter((b) => b.methodId === null);

    expect(stationBrewers).toHaveLength(6);
    expect(new Set(stationBrewers.map((b) => b.methodId))).toEqual(
      new Set(['v60', 'chemex', 'melitta', 'aeropress', 'french-press', 'espresso'])
    );

    expect(encyclopedicBrewers.map((b) => b.slug)).toEqual(expectedEncyclopedicSlugs);
    for (const brewer of encyclopedicBrewers) {
      expect(brewer.recipeIds).toEqual([]);
      expect(brewer.traditionalPreparationKey).toBeTruthy();
    }
  });

  it('resolves brewer recipes from RECIPES_CATALOG in declared order without duplicating content', () => {
    const v60 = getBrewerBySlug('v60');
    expect(v60).toBeDefined();

    const v60Recipes = getBrewerRecipes('v60');
    expect(v60Recipes.map((r) => r.id)).toEqual(v60!.recipeIds);
    expect(v60Recipes.some((r) => r.id === 'v60-standard')).toBe(true);
    expect(v60Recipes.every((r) => r.methodId === 'v60')).toBe(true);

    expect(getBrewerRecipes('moka')).toEqual([]);
    expect(getBrewerRecipes('sifon-inexistente')).toEqual([]);
  });

  it('exports deeply frozen collections and nested brewer properties', () => {
    expect(Object.isFrozen(BREWERS_CATALOG)).toBe(true);
    expect(Object.isFrozen(BREWERS_BY_SLUG)).toBe(true);

    for (const brewer of BREWERS_CATALOG) {
      expect(Object.isFrozen(brewer)).toBe(true);
      expect(Object.isFrozen(brewer.sensoryProfile)).toBe(true);
      expect(Object.isFrozen(brewer.history)).toBe(true);
      expect(Object.isFrozen(brewer.flavorNodeIds)).toBe(true);
      expect(Object.isFrozen(brewer.recipeIds)).toBe(true);
    }
  });

  it('resolves 100% of brewer and family translation keys in Spanish with zero emojis', () => {
    const familyKeys = [
      'wiki.brewerFamilies.drip_filter',
      'wiki.brewerFamilies.immersion',
      'wiki.brewerFamilies.pressure',
      'wiki.brewerFamilies.decoction',
    ];
    for (const key of familyKeys) {
      const resolved = t(key);
      expect(resolved, `Missing family key ${key}`).not.toBe(key);
      expect(resolved.trim().length).toBeGreaterThan(0);
      expect(EMOJI_REGEX.test(resolved), `Emoji found in ${key}`).toBe(false);
    }

    for (const brewer of BREWERS_CATALOG) {
      for (const key of collectBrewerTranslationKeys(brewer)) {
        const resolved = t(key);
        expect(resolved, `Unresolved key ${key} in ${brewer.slug}`).not.toBe(key);
        expect(resolved.trim().length, `Empty value for ${key}`).toBeGreaterThan(0);
        expect(EMOJI_REGEX.test(resolved), `Emoji found in ${key}`).toBe(false);
      }
    }
  });

  it('supports lookup by slug and brew method, returning undefined for unknown slugs', () => {
    expect(getBrewerForMethod('espresso')?.slug).toBe('espresso-machine');
    expect(getBrewerForMethod('v60')?.slug).toBe('v60');
    expect(getBrewerBySlug('sifon-inexistente')).toBeUndefined();
  });

  it('filters brewers by alias query, accent-insensitive text, brew station, family, relevance, SCA node descendants, and sensory thresholds', () => {
    expect(filterBrewers({ query: 'bialetti' }).map((b) => b.slug)).toEqual(['moka']);
    expect(filterBrewers({ query: 'VOLTURNO' }).map((b) => b.slug)).toEqual(['moka']);
    const withoutAccent = filterBrewers({ query: 'sifon' }).map((b) => b.slug);
    const withAccent = filterBrewers({ query: 'Sifón' }).map((b) => b.slug);
    expect(withAccent).toEqual(withoutAccent);
    expect(withoutAccent).toContain('siphon');
    expect(filterBrewers({ query: 'sifon japones' }).map((b) => b.slug)).toEqual(['siphon']);

    expect(filterBrewers({ hasBrewStation: false }).map((b) => b.slug)).toEqual(
      expectedEncyclopedicSlugs
    );
    expect(filterBrewers({ hasBrewStation: true })).toHaveLength(6);

    expect(filterBrewers({ family: 'drip_filter' }).map((b) => b.slug)).toEqual([
      'v60',
      'chemex',
      'melitta',
      'electric-drip',
    ]);
    expect(filterBrewers({ family: 'decoction' }).map((b) => b.slug)).toEqual(['cezve']);

    const globalOnly = filterBrewers({ regionalRelevance: 'global_specialty' });
    expect(globalOnly.map((b) => b.slug)).toEqual(['chemex', 'siphon', 'cezve']);

    const floralBrewers = filterBrewers({ flavorNodeId: 'floral' });
    expect(floralBrewers.map((b) => b.slug)).toEqual(['v60', 'chemex', 'siphon']);
    expect(filterBrewers({ flavorNodeId: 'unknown.flavor' })).toEqual([]);

    const highBody = filterBrewers({ minBody: 5 });
    expect(highBody.map((b) => b.slug)).toEqual(['french-press', 'espresso-machine', 'cezve']);

    const crispLowBitterness = filterBrewers({ minAcidity: 4, maxBitterness: 1 });
    expect(crispLowBitterness.map((b) => b.slug)).toEqual(['v60', 'chemex', 'siphon']);
  });

  it('groups brewers by family in fixed order without loss or mutation', () => {
    const grouped = groupBrewersByFamily();
    expect(Object.keys(grouped)).toEqual(['drip_filter', 'immersion', 'pressure', 'decoction']);
    expect(grouped.drip_filter.map((b) => b.slug)).toEqual([
      'v60',
      'chemex',
      'melitta',
      'electric-drip',
    ]);
    expect(grouped.immersion.map((b) => b.slug)).toEqual(['aeropress', 'french-press', 'siphon']);
    expect(grouped.pressure.map((b) => b.slug)).toEqual(['espresso-machine', 'moka']);
    expect(grouped.decoction.map((b) => b.slug)).toEqual(['cezve']);

    const total = Object.values(grouped).reduce((sum, list) => sum + list.length, 0);
    expect(total).toBe(10);
    expect(Object.isFrozen(grouped)).toBe(true);
    expect(Object.isFrozen(grouped.drip_filter)).toBe(true);
  });
});

function collectDrinkTranslationKeys(entry: DrinkEntry): string[] {
  const keys = [
    entry.titleKey,
    entry.summaryKey,
    entry.commercialAliasesKey,
    entry.history.originCountryKey,
    entry.history.eraKey,
    entry.history.historyKey,
    entry.history.preparationKey,
  ];
  for (const variant of entry.regionalVariants) {
    keys.push(variant.nameKey, variant.regionKey, variant.descriptionKey);
  }
  return keys;
}

describe('Wiki Drinks Static Catalog (Block 4)', () => {
  const expectedDrinkSlugs = [
    'espresso',
    'ristretto',
    'lungo',
    'americano',
    'cortado',
    'macchiato',
    'cappuccino',
    'flat-white',
    'latte',
    'mocha',
    'cafe-con-leche',
    'cold-brew',
  ];

  it('contains exactly the 12 specified drinks validated by DrinkEntrySchema with compositions summing 100', () => {
    expect(DRINKS_CATALOG).toHaveLength(12);
    expect(Object.keys(DRINKS_BY_SLUG)).toHaveLength(12);
    expect(DRINKS_CATALOG.map((d) => d.slug)).toEqual(expectedDrinkSlugs);

    for (const drink of DRINKS_CATALOG) {
      const parsed = DrinkEntrySchema.safeParse(drink);
      expect(parsed.success, `Failed validating drink ${drink.slug}`).toBe(true);

      const sum =
        drink.composition.coffee +
        drink.composition.milk +
        drink.composition.water +
        drink.composition.foam;
      expect(sum, `Composition sum mismatch on ${drink.slug}`).toBe(100);
    }
  });

  it('assigns each drink to the specified family (4 espresso_black, 7 espresso_milk, 1 cold)', () => {
    const black = DRINKS_CATALOG.filter((d) => d.family === 'espresso_black').map((d) => d.slug);
    const milk = DRINKS_CATALOG.filter((d) => d.family === 'espresso_milk').map((d) => d.slug);
    const cold = DRINKS_CATALOG.filter((d) => d.family === 'cold').map((d) => d.slug);

    expect(black).toEqual(['espresso', 'ristretto', 'lungo', 'americano']);
    expect(milk).toEqual([
      'cortado',
      'macchiato',
      'cappuccino',
      'flat-white',
      'latte',
      'mocha',
      'cafe-con-leche',
    ]);
    expect(cold).toEqual(['cold-brew']);
  });

  it('models lagrima as a regional variant inside a milk drink (Argentina/Uruguay), not as a separate entry', () => {
    expect(getDrinkBySlug('lagrima')).toBeUndefined();
    expect(DRINKS_CATALOG.some((d) => d.slug === 'lagrima')).toBe(false);

    const milkDrinksWithLagrima = DRINKS_CATALOG.filter(
      (d) =>
        d.family === 'espresso_milk' &&
        d.regionalVariants.some((v) => v.id === 'lagrima')
    );
    expect(milkDrinksWithLagrima).toHaveLength(1);

    const lagrimaVariant = milkDrinksWithLagrima[0]!.regionalVariants.find(
      (v) => v.id === 'lagrima'
    );
    expect(lagrimaVariant).toBeDefined();
    const region = t(lagrimaVariant!.regionKey);
    expect(region).toMatch(/Argentina/i);
    expect(region).toMatch(/Uruguay/i);
  });

  it('exports deeply frozen drink collections, nested objects, and regional variants', () => {
    expect(Object.isFrozen(DRINKS_CATALOG)).toBe(true);
    expect(Object.isFrozen(DRINKS_BY_SLUG)).toBe(true);

    for (const drink of DRINKS_CATALOG) {
      expect(Object.isFrozen(drink)).toBe(true);
      expect(Object.isFrozen(drink.sensoryProfile)).toBe(true);
      expect(Object.isFrozen(drink.history)).toBe(true);
      expect(Object.isFrozen(drink.composition)).toBe(true);
      expect(Object.isFrozen(drink.servedVolumeMl)).toBe(true);
      expect(Object.isFrozen(drink.flavorNodeIds)).toBe(true);
      expect(Object.isFrozen(drink.baseBrewerSlugs)).toBe(true);
      if (drink.brewLink !== null) {
        expect(Object.isFrozen(drink.brewLink)).toBe(true);
      }
      expect(Object.isFrozen(drink.regionalVariants)).toBe(true);
      for (const variant of drink.regionalVariants) {
        expect(Object.isFrozen(variant)).toBe(true);
      }
    }
  });

  it('resolves 100% of drink, family, and variant translation keys in Spanish with zero emojis', () => {
    const familyKeys = [
      'wiki.drinkFamilies.espresso_black',
      'wiki.drinkFamilies.espresso_milk',
      'wiki.drinkFamilies.cold',
    ];
    for (const key of familyKeys) {
      const resolved = t(key);
      expect(resolved, `Missing family key ${key}`).not.toBe(key);
      expect(resolved.trim().length).toBeGreaterThan(0);
      expect(EMOJI_REGEX.test(resolved), `Emoji found in ${key}`).toBe(false);
    }

    for (const drink of DRINKS_CATALOG) {
      for (const key of collectDrinkTranslationKeys(drink)) {
        const resolved = t(key);
        expect(resolved, `Unresolved key ${key} in ${drink.slug}`).not.toBe(key);
        expect(resolved.trim().length, `Empty value for ${key}`).toBeGreaterThan(0);
        expect(EMOJI_REGEX.test(resolved), `Emoji found in ${key}`).toBe(false);
      }
    }
  });

  it('finds base drinks by regional variant name (accent-insensitive), brewer relation, milk filter, family, relevance, SCA node, and sensory thresholds', () => {
    expect(filterDrinks({ query: 'lagrima' }).map((d) => d.slug)).toEqual(['latte']);
    expect(filterDrinks({ query: 'Lágrima' }).map((d) => d.slug)).toEqual(['latte']);
    expect(filterDrinks({ query: 'bicerin' }).map((d) => d.slug)).toEqual(['mocha']);
    expect(filterDrinks({ query: 'gibraltar' }).map((d) => d.slug)).toEqual(['cortado']);
    expect(filterDrinks({ query: 'carajillo' }).map((d) => d.slug)).toEqual(['espresso']);
    expect(getDrinkBySlug('bebida-inexistente')).toBeUndefined();

    const espressoMachineDrinks = getDrinksForBrewer('espresso-machine').map((d) => d.slug);
    expect(espressoMachineDrinks).toContain('espresso');
    expect(espressoMachineDrinks).toContain('cappuccino');
    expect(espressoMachineDrinks).not.toContain('cold-brew');
    expect(getDrinksForBrewer('french-press').map((d) => d.slug)).toEqual([
      'cafe-con-leche',
      'cold-brew',
    ]);
    expect(getDrinksForBrewer('inexistente')).toEqual([]);

    const noMilkDrinks = filterDrinks({ hasMilk: false });
    expect(noMilkDrinks.every((d) => d.composition.milk === 0 && d.composition.foam === 0)).toBe(
      true
    );
    expect(noMilkDrinks.map((d) => d.slug)).toEqual([
      'espresso',
      'ristretto',
      'lungo',
      'americano',
      'cold-brew',
    ]);
    expect(filterDrinks({ hasMilk: true })).toHaveLength(7);

    expect(filterDrinks({ family: 'cold' }).map((d) => d.slug)).toEqual(['cold-brew']);
    expect(filterDrinks({ regionalRelevance: 'global_specialty' }).map((d) => d.slug)).toEqual([
      'lungo',
    ]);

    expect(filterDrinks({ flavorNodeId: 'sweet.vanilla-aromatics' }).map((d) => d.slug)).toEqual([
      'latte',
      'mocha',
    ]);
    expect(filterDrinks({ flavorNodeId: 'unknown.flavor' })).toEqual([]);

    expect(filterDrinks({ minSweetness: 5, maxBitterness: 1 }).map((d) => d.slug)).toEqual([
      'latte',
    ]);
    expect(filterDrinks({ minBody: 5 }).map((d) => d.slug)).toEqual(['espresso', 'ristretto']);
  });

  it('groups drinks by family in fixed order without loss or mutation', () => {
    const grouped = groupDrinksByFamily();
    expect(Object.keys(grouped)).toEqual(['espresso_black', 'espresso_milk', 'cold']);
    expect(grouped.espresso_black).toHaveLength(4);
    expect(grouped.espresso_milk).toHaveLength(7);
    expect(grouped.cold).toHaveLength(1);

    const total = Object.values(grouped).reduce((sum, list) => sum + list.length, 0);
    expect(total).toBe(12);
    expect(Object.isFrozen(grouped)).toBe(true);
    expect(Object.isFrozen(grouped.espresso_milk)).toBe(true);
  });
});

describe('Cross-Catalog Referential Integrity on Shipped Catalogs (Block 5)', () => {
  it('passes validateBrewersAndDrinksIntegrity with zero errors across all shipped catalogs', () => {
    const result = validateBrewersAndDrinksIntegrity({
      brewers: BREWERS_CATALOG,
      drinks: DRINKS_CATALOG,
      wikiEntries: WIKI_CATALOG,
      flavorTree: FLAVOR_WHEEL_TREE,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
