import type {
  BrewMethod,
  BrewerEntry,
  BrewerFamily,
  CatalogBrewRecipe,
  RegionalRelevance,
} from '../../domain/schemas';
import { getDescendantFlavorNodeIds, getFlavorNodeById } from '../flavor-wheel';
import { RECIPES_BY_ID } from '../recipes';
import {
  matchesSensoryThresholds,
  normalizeSearchText,
  type SensoryThresholds,
} from '../wiki/search';
import { t } from '../../i18n';
import { WIKI_BREWERS_DATA } from './brewers.data';

function freezeBrewer(entry: BrewerEntry): BrewerEntry {
  Object.freeze(entry.sensoryProfile);
  Object.freeze(entry.history);
  Object.freeze(entry.flavorNodeIds);
  Object.freeze(entry.recipeIds);
  return Object.freeze(entry);
}

export const BREWERS_CATALOG: readonly BrewerEntry[] = Object.freeze(
  WIKI_BREWERS_DATA.map((entry) => freezeBrewer(entry))
);

export const BREWERS_BY_SLUG: Readonly<Record<string, BrewerEntry>> = Object.freeze(
  BREWERS_CATALOG.reduce<Record<string, BrewerEntry>>((acc, brewer) => {
    acc[brewer.slug] = brewer;
    return acc;
  }, {})
);

export function getBrewerBySlug(slug: string): BrewerEntry | undefined {
  return BREWERS_BY_SLUG[slug];
}

export function getBrewerForMethod(methodId: BrewMethod['id']): BrewerEntry | undefined {
  return BREWERS_CATALOG.find((brewer) => brewer.methodId === methodId);
}

/**
 * Resolves catalog recipes referenced by a brewer in the exact order declared.
 */
export function getBrewerRecipes(slug: string): readonly CatalogBrewRecipe[] {
  const brewer = BREWERS_BY_SLUG[slug];
  if (!brewer || brewer.recipeIds.length === 0) {
    return [];
  }

  const resolved: CatalogBrewRecipe[] = [];
  for (const recipeId of brewer.recipeIds) {
    const recipe = RECIPES_BY_ID[recipeId];
    if (recipe) {
      resolved.push(recipe);
    }
  }
  return resolved;
}

export type GroupedBrewers = Readonly<Record<BrewerFamily, readonly BrewerEntry[]>>;

const BREWER_FAMILY_ORDER: readonly BrewerFamily[] = [
  'drip_filter',
  'immersion',
  'pressure',
  'decoction',
];

export function groupBrewersByFamily(): GroupedBrewers {
  const groups: Record<BrewerFamily, BrewerEntry[]> = {
    drip_filter: [],
    immersion: [],
    pressure: [],
    decoction: [],
  };

  for (const brewer of BREWERS_CATALOG) {
    groups[brewer.family].push(brewer);
  }

  const frozen = {} as Record<BrewerFamily, readonly BrewerEntry[]>;
  for (const family of BREWER_FAMILY_ORDER) {
    frozen[family] = Object.freeze([...groups[family]]);
  }
  return Object.freeze(frozen);
}

export interface BrewerFilterOptions extends SensoryThresholds {
  readonly family?: BrewerFamily;
  readonly regionalRelevance?: RegionalRelevance;
  readonly hasBrewStation?: boolean;
  readonly query?: string;
  readonly flavorNodeId?: string;
}

function buildBrewerHaystack(brewer: BrewerEntry): string {
  const parts: string[] = [
    brewer.slug,
    t(brewer.titleKey),
    t(brewer.summaryKey),
    t(brewer.commercialAliasesKey),
  ];

  for (const flavorId of brewer.flavorNodeIds) {
    const node = getFlavorNodeById(flavorId);
    if (node) {
      parts.push(t(node.labelKey));
    }
  }

  return normalizeSearchText(parts.join(' '));
}

export function filterBrewers(options: BrewerFilterOptions = {}): readonly BrewerEntry[] {
  const {
    family,
    regionalRelevance,
    hasBrewStation,
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

  return BREWERS_CATALOG.filter((brewer) => {
    if (family !== undefined && brewer.family !== family) {
      return false;
    }

    if (regionalRelevance !== undefined && brewer.regionalRelevance !== regionalRelevance) {
      return false;
    }

    if (hasBrewStation !== undefined && (brewer.methodId !== null) !== hasBrewStation) {
      return false;
    }

    if (
      !matchesSensoryThresholds(brewer.sensoryProfile, {
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
      if (!brewer.flavorNodeIds.some((id) => flavorTargetSet.has(id))) {
        return false;
      }
    }

    if (normalizedQuery.length > 0) {
      const haystack = buildBrewerHaystack(brewer);
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}
