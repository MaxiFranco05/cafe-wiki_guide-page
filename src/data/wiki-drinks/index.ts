import type {
  DrinkEntry,
  DrinkFamily,
  RegionalRelevance,
} from '../../domain/schemas';
import { getDescendantFlavorNodeIds, getFlavorNodeById } from '../flavor-wheel';
import {
  matchesSensoryThresholds,
  normalizeSearchText,
  type SensoryThresholds,
} from '../wiki/search';
import { t } from '../../i18n';
import { WIKI_DRINKS_DATA } from './drinks.data';

function freezeDrink(entry: DrinkEntry): DrinkEntry {
  Object.freeze(entry.sensoryProfile);
  Object.freeze(entry.history);
  Object.freeze(entry.composition);
  Object.freeze(entry.servedVolumeMl);
  Object.freeze(entry.flavorNodeIds);
  Object.freeze(entry.baseBrewerSlugs);
  if (entry.brewLink !== null) {
    Object.freeze(entry.brewLink);
  }
  for (const variant of entry.regionalVariants) {
    Object.freeze(variant);
  }
  Object.freeze(entry.regionalVariants);
  return Object.freeze(entry);
}

export const DRINKS_CATALOG: readonly DrinkEntry[] = Object.freeze(
  WIKI_DRINKS_DATA.map((entry) => freezeDrink(entry))
);

export const DRINKS_BY_SLUG: Readonly<Record<string, DrinkEntry>> = Object.freeze(
  DRINKS_CATALOG.reduce<Record<string, DrinkEntry>>((acc, drink) => {
    acc[drink.slug] = drink;
    return acc;
  }, {})
);

export function getDrinkBySlug(slug: string): DrinkEntry | undefined {
  return DRINKS_BY_SLUG[slug];
}

export function getDrinksForBrewer(brewerSlug: string): readonly DrinkEntry[] {
  return DRINKS_CATALOG.filter((drink) => drink.baseBrewerSlugs.includes(brewerSlug));
}

export type GroupedDrinks = Readonly<Record<DrinkFamily, readonly DrinkEntry[]>>;

const DRINK_FAMILY_ORDER: readonly DrinkFamily[] = [
  'espresso_black',
  'espresso_milk',
  'cold',
];

export function groupDrinksByFamily(): GroupedDrinks {
  const groups: Record<DrinkFamily, DrinkEntry[]> = {
    espresso_black: [],
    espresso_milk: [],
    cold: [],
  };

  for (const drink of DRINKS_CATALOG) {
    groups[drink.family].push(drink);
  }

  const frozen = {} as Record<DrinkFamily, readonly DrinkEntry[]>;
  for (const family of DRINK_FAMILY_ORDER) {
    frozen[family] = Object.freeze([...groups[family]]);
  }
  return Object.freeze(frozen);
}

export interface DrinkFilterOptions extends SensoryThresholds {
  readonly family?: DrinkFamily;
  readonly regionalRelevance?: RegionalRelevance;
  readonly hasMilk?: boolean;
  readonly query?: string;
  readonly flavorNodeId?: string;
}

function buildDrinkHaystack(drink: DrinkEntry): string {
  const parts: string[] = [
    drink.slug,
    t(drink.titleKey),
    t(drink.summaryKey),
    t(drink.commercialAliasesKey),
  ];

  for (const variant of drink.regionalVariants) {
    parts.push(variant.id, t(variant.nameKey), t(variant.regionKey));
  }

  for (const flavorId of drink.flavorNodeIds) {
    const node = getFlavorNodeById(flavorId);
    if (node) {
      parts.push(t(node.labelKey));
    }
  }

  return normalizeSearchText(parts.join(' '));
}

export function filterDrinks(options: DrinkFilterOptions = {}): readonly DrinkEntry[] {
  const {
    family,
    regionalRelevance,
    hasMilk,
    query,
    flavorNodeId,
    minAcidity,
    minSweetness,
    minBody,
    maxBitterness,
  } = options;

  const normalizedQuery = query ? normalizeSearchText(query) : '';
  const flavorTargetSet = flavorNodeId
    ? new Set(getDescendantFlavorNodeIds(flavorNodeId))
    : undefined;

  return DRINKS_CATALOG.filter((drink) => {
    if (family !== undefined && drink.family !== family) {
      return false;
    }

    if (regionalRelevance !== undefined && drink.regionalRelevance !== regionalRelevance) {
      return false;
    }

    if (hasMilk !== undefined) {
      const drinkHasMilk = drink.composition.milk + drink.composition.foam > 0;
      if (drinkHasMilk !== hasMilk) {
        return false;
      }
    }

    if (
      !matchesSensoryThresholds(drink.sensoryProfile, {
        minAcidity,
        minSweetness,
        minBody,
        maxBitterness,
      })
    ) {
      return false;
    }

    if (flavorTargetSet !== undefined) {
      if (flavorTargetSet.size === 0) {
        return false;
      }
      if (!drink.flavorNodeIds.some((id) => flavorTargetSet.has(id))) {
        return false;
      }
    }

    if (normalizedQuery.length > 0) {
      const haystack = buildDrinkHaystack(drink);
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}
