import type {
  BrewerEntry,
  DrinkEntry,
  RegionalRelevance,
  SensoryProfile,
  WikiCategory,
  WikiEntry,
} from '../../domain/schemas';
import { getDescendantFlavorNodeIds, getFlavorNodeById } from '../../data/flavor-wheel';
import { WIKI_CATALOG, getWikiEntrySubGroup, groupWikiEntriesBySubGroup } from '../../data/wiki';
import { matchesSensoryThresholds, normalizeSearchText } from '../../data/wiki/search';
import { BREWERS_CATALOG, groupBrewersByFamily } from '../../data/wiki-brewers';
import { DRINKS_CATALOG, groupDrinksByFamily } from '../../data/wiki-drinks';
import { t } from '../../i18n';
import { profileFiltersToThresholds, type ProfileFilterId } from './utils/wiki-ui.helpers';

export const WIKI_SECTION_SLUGS = ['origenes', 'varietales', 'procesos', 'cafeteras', 'bebidas'] as const;
export type WikiSectionSlug = (typeof WIKI_SECTION_SLUGS)[number];

export type WikiSectionIcon = 'globe' | 'leaf' | 'drop' | 'brewer' | 'cup';

interface WikiItemBase {
  readonly section: WikiSectionSlug;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly aliases: string;
  readonly groupId: string;
  readonly groupLabel: string;
  readonly relevance: RegionalRelevance;
  readonly sensory: SensoryProfile;
  readonly flavorNodeIds: readonly string[];
  readonly haystack: string;
}

/** Normalized view model shared by every section; `entry` keeps the full catalog record. */
export type WikiItem =
  | (WikiItemBase & { readonly kind: 'wiki'; readonly entry: WikiEntry })
  | (WikiItemBase & { readonly kind: 'brewer'; readonly entry: BrewerEntry })
  | (WikiItemBase & { readonly kind: 'drink'; readonly entry: DrinkEntry });

export interface WikiSectionDef {
  readonly slug: WikiSectionSlug;
  readonly icon: WikiSectionIcon;
  readonly items: readonly WikiItem[];
  readonly groupOrder: readonly string[];
}

export interface WikiSectionFilters {
  readonly q: string;
  readonly grupo: string;
  readonly perfil: readonly ProfileFilterId[];
  readonly familia: string;
}

function haystackOf(parts: readonly string[], flavorNodeIds: readonly string[]): string {
  const noteLabels = flavorNodeIds.flatMap((id) => {
    const node = getFlavorNodeById(id);
    return node ? [t(node.labelKey)] : [];
  });
  return normalizeSearchText([...parts, ...noteLabels].join(' '));
}

function baseFields(
  section: WikiSectionSlug,
  entry: { slug: string; titleKey: string; summaryKey: string; commercialAliasesKey: string; regionalRelevance: RegionalRelevance; sensoryProfile: SensoryProfile; flavorNodeIds: readonly string[] },
  groupId: string,
  groupLabel: string,
): WikiItemBase {
  const title = t(entry.titleKey);
  const summary = t(entry.summaryKey);
  const aliases = t(entry.commercialAliasesKey);
  return {
    section,
    slug: entry.slug,
    title,
    summary,
    aliases,
    groupId,
    groupLabel,
    relevance: entry.regionalRelevance,
    sensory: entry.sensoryProfile,
    flavorNodeIds: entry.flavorNodeIds,
    haystack: haystackOf([entry.slug, title, aliases, summary], entry.flavorNodeIds),
  };
}

function wikiItems(section: WikiSectionSlug, category: WikiCategory): readonly WikiItem[] {
  return WIKI_CATALOG.filter((entry) => entry.category === category).map((entry) => {
    const group = getWikiEntrySubGroup(entry);
    return { ...baseFields(section, entry, group, t(`wiki.subGroups.${group}`)), kind: 'wiki' as const, entry };
  });
}

const SECTIONS: readonly WikiSectionDef[] = Object.freeze([
  { slug: 'origenes', icon: 'globe', items: wikiItems('origenes', 'origin'), groupOrder: Object.keys(groupWikiEntriesBySubGroup('origin')) },
  { slug: 'varietales', icon: 'leaf', items: wikiItems('varietales', 'varietal'), groupOrder: Object.keys(groupWikiEntriesBySubGroup('varietal')) },
  { slug: 'procesos', icon: 'drop', items: wikiItems('procesos', 'process'), groupOrder: Object.keys(groupWikiEntriesBySubGroup('process')) },
  {
    slug: 'cafeteras',
    icon: 'brewer',
    items: BREWERS_CATALOG.map((entry) => ({
      ...baseFields('cafeteras', entry, entry.family, t(`wiki.brewerFamilies.${entry.family}`)),
      kind: 'brewer' as const,
      entry,
    })),
    groupOrder: Object.keys(groupBrewersByFamily()),
  },
  {
    slug: 'bebidas',
    icon: 'cup',
    items: DRINKS_CATALOG.map((entry) => ({
      ...baseFields('bebidas', entry, entry.family, t(`wiki.drinkFamilies.${entry.family}`)),
      kind: 'drink' as const,
      entry,
    })),
    groupOrder: Object.keys(groupDrinksByFamily()),
  },
] satisfies WikiSectionDef[]);

export const WIKI_SECTIONS: readonly WikiSectionDef[] = SECTIONS;

export function isWikiSectionSlug(value: string | undefined): value is WikiSectionSlug {
  return value !== undefined && (WIKI_SECTION_SLUGS as readonly string[]).includes(value);
}

export function getWikiSection(slug: string | undefined): WikiSectionDef | undefined {
  return isWikiSectionSlug(slug) ? SECTIONS.find((s) => s.slug === slug) : undefined;
}

export function getWikiItem(section: string | undefined, slug: string | undefined): WikiItem | undefined {
  return getWikiSection(section)?.items.find((item) => item.slug === slug);
}

/** Section of the wiki entry behind a catalog category (for cross links). */
export const CATEGORY_SECTION: Readonly<Record<WikiCategory, WikiSectionSlug>> = {
  origin: 'origenes',
  varietal: 'varietales',
  process: 'procesos',
};

export function filterWikiItems(section: WikiSectionSlug, filters: WikiSectionFilters): readonly WikiItem[] {
  const def = getWikiSection(section);
  if (!def) return [];
  const query = normalizeSearchText(filters.q);
  const thresholds = profileFiltersToThresholds(filters.perfil);
  const familyNodes = filters.familia ? new Set(getDescendantFlavorNodeIds(filters.familia)) : null;
  return def.items.filter((item) => {
    if (filters.grupo && item.groupId !== filters.grupo) return false;
    if (!matchesSensoryThresholds(item.sensory, thresholds)) return false;
    if (familyNodes && !item.flavorNodeIds.some((id) => familyNodes.has(id))) return false;
    if (query && !item.haystack.includes(query)) return false;
    return true;
  });
}

export interface WikiItemGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly WikiItem[];
}

export function groupWikiItems(section: WikiSectionSlug, items: readonly WikiItem[]): readonly WikiItemGroup[] {
  const def = getWikiSection(section);
  if (!def) return [];
  return def.groupOrder
    .map((id) => {
      const list = items.filter((item) => item.groupId === id);
      return { id, label: list[0]?.groupLabel ?? '', items: list };
    })
    .filter((group) => group.items.length > 0);
}

/** Localized label of a subgroup even when no item of the current result set belongs to it. */
export function groupLabelFor(section: WikiSectionSlug, groupId: string): string {
  return getWikiSection(section)?.items.find((item) => item.groupId === groupId)?.groupLabel ?? groupId;
}
