import type {
  BrewMethod,
  OriginMacroRegion,
  OriginWikiEntry,
  ProcessFamily,
  ProcessWikiEntry,
  RecipeProfile,
  RegionalRelevance,
  VarietalGeneticGroup,
  VarietalWikiEntry,
  WikiCategory,
  WikiEntry,
  WikiSubGroup,
} from '../../domain/schemas';
import { getDescendantFlavorNodeIds, getFlavorNodeById } from '../flavor-wheel';
import { t } from '../../i18n';
import { WIKI_ORIGINS } from './origins';
import { WIKI_VARIETALS } from './varietals';
import { WIKI_PROCESSES } from './processes';

export { WIKI_ORIGINS, WIKI_VARIETALS, WIKI_PROCESSES };

function freezeEntry<T extends WikiEntry>(entry: T): T {
  Object.freeze(entry.sensoryProfile);
  Object.freeze(entry.metadata);
  Object.freeze(entry.flavorNodeIds);
  for (const method of entry.recommendedMethods) {
    Object.freeze(method);
  }
  Object.freeze(entry.recommendedMethods);
  return Object.freeze(entry);
}

export const WIKI_CATALOG: readonly WikiEntry[] = Object.freeze([
  ...WIKI_ORIGINS.map((e) => freezeEntry(e)),
  ...WIKI_VARIETALS.map((e) => freezeEntry(e)),
  ...WIKI_PROCESSES.map((e) => freezeEntry(e)),
]);

export const WIKI_ENTRIES_BY_SLUG: Readonly<Record<string, WikiEntry>> = Object.freeze(
  WIKI_CATALOG.reduce<Record<string, WikiEntry>>((acc, entry) => {
    acc[entry.slug] = entry;
    return acc;
  }, {})
);

export function getWikiEntrySubGroup(entry: WikiEntry): WikiSubGroup {
  switch (entry.category) {
    case 'origin':
      return entry.metadata.macroRegion;
    case 'varietal':
      return entry.metadata.geneticGroup;
    case 'process':
      return entry.metadata.processFamily;
  }
}

export function getWikiEntryBySlug(slug: string): WikiEntry | undefined {
  return WIKI_ENTRIES_BY_SLUG[slug];
}

export function getWikiEntryByCategoryAndSlug(
  category: WikiCategory,
  slug: string
): WikiEntry | undefined {
  const entry = WIKI_ENTRIES_BY_SLUG[slug];
  return entry && entry.category === category ? entry : undefined;
}

export function getWikiEntriesByCategory(category: 'origin'): readonly OriginWikiEntry[];
export function getWikiEntriesByCategory(category: 'varietal'): readonly VarietalWikiEntry[];
export function getWikiEntriesByCategory(category: 'process'): readonly ProcessWikiEntry[];
export function getWikiEntriesByCategory(category: WikiCategory): readonly WikiEntry[];
export function getWikiEntriesByCategory(category: WikiCategory): readonly WikiEntry[] {
  return WIKI_CATALOG.filter((entry) => entry.category === category);
}

/**
 * Returns all Wiki entries referencing the given flavor node ID or any of its descendant nodes.
 */
export function getWikiEntriesByFlavorNode(nodeId: string): readonly WikiEntry[] {
  const targetIds = new Set(getDescendantFlavorNodeIds(nodeId));
  if (targetIds.size === 0) {
    return [];
  }
  return WIKI_CATALOG.filter((entry) =>
    entry.flavorNodeIds.some((flavorId) => targetIds.has(flavorId))
  );
}

/**
 * Inverse cross-reference selector: BrewMethod (+ optional RecipeProfile) -> WikiEntry[].
 */
export function getWikiEntriesForMethod(
  methodId: BrewMethod['id'],
  profileId?: RecipeProfile['id']
): readonly WikiEntry[] {
  return WIKI_CATALOG.filter((entry) =>
    entry.recommendedMethods.some(
      (rec) => rec.methodId === methodId && (profileId === undefined || rec.profileId === profileId)
    )
  );
}

export type GroupedOrigins = Readonly<Record<OriginMacroRegion, readonly OriginWikiEntry[]>>;
export type GroupedVarietals = Readonly<Record<VarietalGeneticGroup, readonly VarietalWikiEntry[]>>;
export type GroupedProcesses = Readonly<Record<ProcessFamily, readonly ProcessWikiEntry[]>>;

const ORIGIN_GROUP_ORDER: readonly OriginMacroRegion[] = [
  'south_america',
  'central_north_america',
  'africa',
  'asia_pacific',
];

const VARIETAL_GROUP_ORDER: readonly VarietalGeneticGroup[] = [
  'bourbon_typica',
  'ethiopian_heirloom',
  'introgressed_hybrid',
  'canephora',
];

const PROCESS_GROUP_ORDER: readonly ProcessFamily[] = [
  'washed_clean',
  'mucilage_honey',
  'natural_experimental',
  'decaffeination',
];

export function groupWikiEntriesBySubGroup(category: 'origin'): GroupedOrigins;
export function groupWikiEntriesBySubGroup(category: 'varietal'): GroupedVarietals;
export function groupWikiEntriesBySubGroup(category: 'process'): GroupedProcesses;
export function groupWikiEntriesBySubGroup(
  category: WikiCategory
): GroupedOrigins | GroupedVarietals | GroupedProcesses {
  if (category === 'origin') {
    const groups: Record<OriginMacroRegion, OriginWikiEntry[]> = {
      south_america: [],
      central_north_america: [],
      africa: [],
      asia_pacific: [],
    };
    for (const entry of getWikiEntriesByCategory('origin')) {
      groups[entry.metadata.macroRegion].push(entry);
    }
    const frozen = {} as Record<OriginMacroRegion, readonly OriginWikiEntry[]>;
    for (const key of ORIGIN_GROUP_ORDER) {
      frozen[key] = Object.freeze([...groups[key]]);
    }
    return Object.freeze(frozen);
  }

  if (category === 'varietal') {
    const groups: Record<VarietalGeneticGroup, VarietalWikiEntry[]> = {
      bourbon_typica: [],
      ethiopian_heirloom: [],
      introgressed_hybrid: [],
      canephora: [],
    };
    for (const entry of getWikiEntriesByCategory('varietal')) {
      groups[entry.metadata.geneticGroup].push(entry);
    }
    const frozen = {} as Record<VarietalGeneticGroup, readonly VarietalWikiEntry[]>;
    for (const key of VARIETAL_GROUP_ORDER) {
      frozen[key] = Object.freeze([...groups[key]]);
    }
    return Object.freeze(frozen);
  }

  const groups: Record<ProcessFamily, ProcessWikiEntry[]> = {
    washed_clean: [],
    mucilage_honey: [],
    natural_experimental: [],
    decaffeination: [],
  };
  for (const entry of getWikiEntriesByCategory('process')) {
    groups[entry.metadata.processFamily].push(entry);
  }
  const frozen = {} as Record<ProcessFamily, readonly ProcessWikiEntry[]>;
  for (const key of PROCESS_GROUP_ORDER) {
    frozen[key] = Object.freeze([...groups[key]]);
  }
  return Object.freeze(frozen);
}

export interface WikiFilterOptions {
  readonly category?: WikiCategory | 'all';
  readonly subGroup?: WikiSubGroup;
  readonly regionalRelevance?: RegionalRelevance;
  readonly query?: string;
  readonly flavorNodeId?: string;
  readonly minAcidity?: number;
  readonly minSweetness?: number;
  readonly minBody?: number;
  readonly maxBitterness?: number;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildSearchableHaystack(entry: WikiEntry): string {
  const parts: string[] = [
    entry.slug,
    t(entry.titleKey),
    t(entry.summaryKey),
    t(entry.commercialAliasesKey),
  ];

  for (const flavorId of entry.flavorNodeIds) {
    const node = getFlavorNodeById(flavorId);
    if (node) {
      parts.push(t(node.labelKey));
    }
  }

  return normalizeSearchText(parts.join(' '));
}

export function filterWikiEntries(options: WikiFilterOptions = {}): readonly WikiEntry[] {
  const {
    category = 'all',
    subGroup,
    regionalRelevance,
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

  return WIKI_CATALOG.filter((entry) => {
    if (category !== 'all' && entry.category !== category) {
      return false;
    }

    if (subGroup !== undefined && getWikiEntrySubGroup(entry) !== subGroup) {
      return false;
    }

    if (regionalRelevance !== undefined && entry.regionalRelevance !== regionalRelevance) {
      return false;
    }

    if (minAcidity !== undefined && entry.sensoryProfile.acidity < minAcidity) {
      return false;
    }

    if (minSweetness !== undefined && entry.sensoryProfile.sweetness < minSweetness) {
      return false;
    }

    if (minBody !== undefined && entry.sensoryProfile.body < minBody) {
      return false;
    }

    if (maxBitterness !== undefined && entry.sensoryProfile.bitterness > maxBitterness) {
      return false;
    }

    if (flavorTargetSet !== undefined) {
      if (flavorTargetSet.size === 0) {
        return false;
      }
      if (!entry.flavorNodeIds.some((id) => flavorTargetSet.has(id))) {
        return false;
      }
    }

    if (normalizedQuery.length > 0) {
      const haystack = buildSearchableHaystack(entry);
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}
