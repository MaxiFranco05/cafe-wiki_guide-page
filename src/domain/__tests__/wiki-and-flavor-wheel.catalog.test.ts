import { describe, it, expect } from 'vitest';
import {
  FlavorWheelNodeSchema,
  WikiEntrySchema,
  validateSensoryCatalogIntegrity,
  type FlavorWheelNode,
  type WikiEntry,
} from '../schemas';
import {
  FLAVOR_WHEEL_TREE,
  FLAVOR_NODES_BY_ID,
  getFlavorNodeById,
  getFlavorNodeLineage,
  getDescendantFlavorNodeIds,
} from '../../data/flavor-wheel';
import {
  WIKI_CATALOG,
  WIKI_ENTRIES_BY_SLUG,
  getWikiEntryBySlug,
  getWikiEntryByCategoryAndSlug,
  getWikiEntriesByCategory,
  getWikiEntriesByFlavorNode,
  getWikiEntriesForMethod,
  groupWikiEntriesBySubGroup,
  filterWikiEntries,
} from '../../data/wiki';
import { METHODS_CATALOG } from '../../data/methods';
import { t } from '../../i18n';

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

function flattenFlavorTree(nodes: readonly FlavorWheelNode[]): FlavorWheelNode[] {
  const result: FlavorWheelNode[] = [];
  const visit = (node: FlavorWheelNode) => {
    result.push(node);
    for (const child of node.children) {
      visit(child);
    }
  };
  for (const root of nodes) {
    visit(root);
  }
  return result;
}

function collectWikiTranslationKeys(entry: WikiEntry): string[] {
  const keys = [
    entry.titleKey,
    entry.summaryKey,
    entry.commercialAliasesKey,
    ...entry.recommendedMethods.map((rec) => rec.reasonKey),
  ];

  if (entry.category === 'origin') {
    keys.push(entry.metadata.regionKey, entry.metadata.harvestMonthsKey);
  } else if (entry.category === 'varietal') {
    keys.push(entry.metadata.lineageKey, entry.metadata.discoveryRegionKey);
  } else {
    keys.push(entry.metadata.mucilageRemovalKey, entry.metadata.dryingMethodKey);
  }

  return keys;
}

describe('SCA Flavor Wheel Static Catalog (Block 2)', () => {
  const expectedRootIds = [
    'fruity',
    'floral',
    'sweet',
    'nutty-cocoa',
    'spiced',
    'roasted',
    'green-vegetative',
    'sour-fermented',
    'other',
  ];

  it('contains all 9 SCA tier 1 root families in expected taxonomy', () => {
    const rootIds = FLAVOR_WHEEL_TREE.map((node) => node.id);
    expect(rootIds).toEqual(expectedRootIds);
  });

  it('validates every root family and nested node against FlavorWheelNodeSchema', () => {
    for (const root of FLAVOR_WHEEL_TREE) {
      const parsed = FlavorWheelNodeSchema.safeParse(root);
      expect(parsed.success, `Failed validating root ${root.id}`).toBe(true);
    }
  });

  it('maintains globally unique IDs indexed in FLAVOR_NODES_BY_ID', () => {
    const allNodes = flattenFlavorTree(FLAVOR_WHEEL_TREE);
    const uniqueIds = new Set(allNodes.map((node) => node.id));
    expect(uniqueIds.size).toBe(allNodes.length);
    expect(Object.keys(FLAVOR_NODES_BY_ID).length).toBe(allNodes.length);

    for (const node of allNodes) {
      expect(FLAVOR_NODES_BY_ID[node.id]).toBe(node);
    }
  });

  it('resolves getFlavorNodeById, getFlavorNodeLineage, and getDescendantFlavorNodeIds across all tiers', () => {
    const rootLineage = getFlavorNodeLineage('fruity');
    expect(rootLineage?.map((n) => n.id)).toEqual(['fruity']);

    const tier2Lineage = getFlavorNodeLineage('fruity.berry');
    expect(tier2Lineage?.map((n) => n.id)).toEqual(['fruity', 'fruity.berry']);

    const blackberry = getFlavorNodeById('fruity.berry.blackberry');
    expect(blackberry?.tier).toBe(3);

    const tier3Lineage = getFlavorNodeLineage('fruity.berry.blackberry');
    expect(tier3Lineage?.map((n) => n.id)).toEqual([
      'fruity',
      'fruity.berry',
      'fruity.berry.blackberry',
    ]);

    expect(getFlavorNodeById('nonexistent.node')).toBeUndefined();
    expect(getFlavorNodeLineage('nonexistent.node')).toBeUndefined();

    const berryDescendants = getDescendantFlavorNodeIds('fruity.berry');
    expect(berryDescendants).toContain('fruity.berry');
    expect(berryDescendants).toContain('fruity.berry.blackberry');
    expect(berryDescendants.length).toBeGreaterThanOrEqual(3);

    const leafDescendants = getDescendantFlavorNodeIds('fruity.berry.blackberry');
    expect(leafDescendants).toEqual(['fruity.berry.blackberry']);
    expect(getDescendantFlavorNodeIds('nonexistent.node')).toEqual([]);
  });

  it('freezes exported flavor wheel collections and nested nodes against mutation', () => {
    expect(Object.isFrozen(FLAVOR_WHEEL_TREE)).toBe(true);
    expect(Object.isFrozen(FLAVOR_NODES_BY_ID)).toBe(true);
    expect(Object.isFrozen(FLAVOR_WHEEL_TREE[0])).toBe(true);
    expect(Object.isFrozen(FLAVOR_WHEEL_TREE[0]!.children)).toBe(true);
  });

  it('resolves 100% of flavor wheel labelKey and tastingNoteKey in Spanish with zero emojis', () => {
    const allNodes = flattenFlavorTree(FLAVOR_WHEEL_TREE);
    for (const node of allNodes) {
      const label = t(node.labelKey);
      const note = t(node.tastingNoteKey);

      expect(label, `Missing labelKey ${node.labelKey}`).not.toBe(node.labelKey);
      expect(label.trim().length).toBeGreaterThan(0);
      expect(EMOJI_REGEX.test(label), `Emoji found in ${node.labelKey}`).toBe(false);

      expect(note, `Missing tastingNoteKey ${node.tastingNoteKey}`).not.toBe(node.tastingNoteKey);
      expect(note.trim().length).toBeGreaterThan(15);
      expect(EMOJI_REGEX.test(note), `Emoji found in ${node.tastingNoteKey}`).toBe(false);
    }
  });
});

describe('Sensory Wiki Static Catalog & Bidirectional Selectors (Block 3)', () => {
  const expectedOrigins = [
    'brazil',
    'colombia',
    'peru',
    'bolivia',
    'ecuador',
    'guatemala',
    'costa-rica',
    'el-salvador',
    'honduras',
    'nicaragua',
    'panama',
    'mexico',
    'ethiopia',
    'kenya',
    'rwanda',
    'sumatra',
  ];

  const expectedVarietals = [
    'bourbon',
    'mundo-novo',
    'catuai',
    'caturra',
    'typica',
    'maragogype',
    'pacas',
    'pacamara',
    'villa-sarchi',
    'geisha',
    'sl28-sl34',
    'java',
    'sidra',
    'castillo',
    'catimor',
    'robusta-canephora',
  ];

  const expectedProcesses = [
    'washed',
    'pulped-natural',
    'honey',
    'natural',
    'anaerobic',
    'decaf',
  ];

  it('contains all 38 curated entries (16 origins, 16 varietals, 6 processes) validated by Zod', () => {
    expect(WIKI_CATALOG).toHaveLength(38);
    expect(Object.keys(WIKI_ENTRIES_BY_SLUG)).toHaveLength(38);

    const originSlugs = getWikiEntriesByCategory('origin').map((e) => e.slug);
    const varietalSlugs = getWikiEntriesByCategory('varietal').map((e) => e.slug);
    const processSlugs = getWikiEntriesByCategory('process').map((e) => e.slug);

    expect(originSlugs).toEqual(expectedOrigins);
    expect(varietalSlugs).toEqual(expectedVarietals);
    expect(processSlugs).toEqual(expectedProcesses);

    for (const entry of WIKI_CATALOG) {
      const parsed = WikiEntrySchema.safeParse(entry);
      expect(parsed.success, `Failed validating wiki entry ${entry.slug}`).toBe(true);
    }
  });

  it('passes cross-catalog referential integrity (Wiki <-> FlavorWheel <-> BrewMethods)', () => {
    const result = validateSensoryCatalogIntegrity(
      WIKI_CATALOG,
      FLAVOR_WHEEL_TREE,
      METHODS_CATALOG
    );
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('resolves 100% of Wiki translation keys (including commercialAliasesKey) in Spanish without emojis', () => {
    for (const entry of WIKI_CATALOG) {
      const keys = collectWikiTranslationKeys(entry);
      for (const key of keys) {
        const resolved = t(key);
        expect(resolved, `Unresolved key ${key} in ${entry.slug}`).not.toBe(key);
        expect(resolved.trim().length, `Empty value for ${key}`).toBeGreaterThan(0);
        expect(EMOJI_REGEX.test(resolved), `Emoji found in ${key}`).toBe(false);
      }
    }
  });

  it('supports slug, category+slug, flavor node (with ancestor expansion), and brew method lookups', () => {
    const kenya = getWikiEntryBySlug('kenya');
    expect(kenya?.category).toBe('origin');
    expect(getWikiEntryByCategoryAndSlug('origin', 'kenya')).toBe(kenya);
    expect(getWikiEntryByCategoryAndSlug('varietal', 'kenya')).toBeUndefined();

    const berryEntries = getWikiEntriesByFlavorNode('fruity.berry');
    const berrySlugs = berryEntries.map((e) => e.slug);
    expect(berrySlugs).toContain('kenya');
    expect(berrySlugs).toContain('ethiopia');

    const fruityRootEntries = getWikiEntriesByFlavorNode('fruity');
    expect(fruityRootEntries.length).toBeGreaterThanOrEqual(berryEntries.length);

    const v60Entries = getWikiEntriesForMethod('v60');
    expect(v60Entries.length).toBeGreaterThan(0);
    expect(
      v60Entries.every((e) => e.recommendedMethods.some((m) => m.methodId === 'v60'))
    ).toBe(true);

    const espressoNormaleEntries = getWikiEntriesForMethod('espresso', 'normale');
    expect(espressoNormaleEntries.some((e) => e.slug === 'brazil')).toBe(true);
  });

  it('groups entries by 2-level taxonomic sub-group via groupWikiEntriesBySubGroup', () => {
    const originsByRegion = groupWikiEntriesBySubGroup('origin');
    expect(Object.keys(originsByRegion)).toEqual([
      'south_america',
      'central_north_america',
      'africa',
      'asia_pacific',
    ]);
    expect(originsByRegion.south_america.map((e) => e.slug)).toEqual([
      'brazil',
      'colombia',
      'peru',
      'bolivia',
      'ecuador',
    ]);

    const varietalsByGroup = groupWikiEntriesBySubGroup('varietal');
    expect(Object.keys(varietalsByGroup)).toEqual([
      'bourbon_typica',
      'ethiopian_heirloom',
      'introgressed_hybrid',
      'canephora',
    ]);
    expect(varietalsByGroup.bourbon_typica.map((e) => e.slug)).toContain('bourbon');
    expect(varietalsByGroup.bourbon_typica.map((e) => e.slug)).toContain('mundo-novo');

    const processesByFamily = groupWikiEntriesBySubGroup('process');
    expect(Object.keys(processesByFamily)).toEqual([
      'washed_clean',
      'mucilage_honey',
      'natural_experimental',
      'decaffeination',
    ]);
    expect(processesByFamily.mucilage_honey.map((e) => e.slug)).toEqual([
      'pulped-natural',
      'honey',
    ]);
  });

  it('filters entries by commercial aliases (e.g. santos, huila, cereja descascada, ojo de elefante), accent-insensitive query, subGroup, and regionalRelevance', () => {
    expect(filterWikiEntries({ category: 'origin', query: 'santos' }).map((e) => e.slug)).toContain(
      'brazil'
    );
    expect(filterWikiEntries({ category: 'origin', query: 'huila' }).map((e) => e.slug)).toContain(
      'colombia'
    );
    expect(filterWikiEntries({ query: 'cereja descascada' }).map((e) => e.slug)).toEqual([
      'pulped-natural',
    ]);
    expect(filterWikiEntries({ query: 'ojo de elefante' }).map((e) => e.slug)).toEqual([
      'maragogype',
    ]);
    expect(filterWikiEntries({ query: 'CAJAMARCA' }).map((e) => e.slug)).toEqual(['peru']);

    // Accent-insensitive queries (with and without accents return identical sets)
    const withAccent = filterWikiEntries({ query: 'Etiopía' }).map((e) => e.slug);
    const withoutAccent = filterWikiEntries({ query: 'etiopia' }).map((e) => e.slug);
    expect(withAccent).toEqual(withoutAccent);
    expect(withoutAccent).toContain('ethiopia');

    const southernConeOrigins = filterWikiEntries({
      category: 'origin',
      regionalRelevance: 'southern_cone_staple',
    });
    expect(southernConeOrigins.map((e) => e.slug)).toEqual([
      'brazil',
      'colombia',
      'peru',
      'bolivia',
      'guatemala',
      'honduras',
      'nicaragua',
    ]);

    const africanOrigins = filterWikiEntries({
      category: 'origin',
      subGroup: 'africa',
    });
    expect(africanOrigins.map((e) => e.slug)).toEqual(['ethiopia', 'kenya', 'rwanda']);
  });

  it('triangulates combined sensory thresholds, multi-tier flavorNodeId filters, and taxonomy completeness', () => {
    const highAcidityFloral = filterWikiEntries({
      flavorNodeId: 'floral',
      minAcidity: 5,
      maxBitterness: 1,
    });
    expect(highAcidityFloral.map((e) => e.slug)).toEqual(
      expect.arrayContaining(['panama', 'ethiopia', 'geisha', 'sidra'])
    );

    const highBodyNutty = filterWikiEntries({
      flavorNodeId: 'nutty-cocoa.nutty',
      minBody: 4,
      minSweetness: 4,
    });
    expect(highBodyNutty.map((e) => e.slug)).toEqual(
      expect.arrayContaining(['brazil', 'mundo-novo', 'catuai'])
    );

    const exactLeafFilter = filterWikiEntries({
      flavorNodeId: 'fruity.berry.blackberry',
    });
    expect(exactLeafFilter.map((e) => e.slug)).toEqual(['kenya', 'sl28-sl34']);

    expect(filterWikiEntries({ flavorNodeId: 'unknown.flavor' })).toEqual([]);

    // Verify groupWikiEntriesBySubGroup partitions all 38 entries without loss or duplication
    const originsCount = Object.values(groupWikiEntriesBySubGroup('origin')).reduce(
      (sum, list) => sum + list.length,
      0
    );
    const varietalsCount = Object.values(groupWikiEntriesBySubGroup('varietal')).reduce(
      (sum, list) => sum + list.length,
      0
    );
    const processesCount = Object.values(groupWikiEntriesBySubGroup('process')).reduce(
      (sum, list) => sum + list.length,
      0
    );
    expect(originsCount + varietalsCount + processesCount).toBe(38);

    // Verify taxonomy label keys resolve cleanly in Spanish
    const taxonomyKeys = [
      'wiki.subGroups.south_america',
      'wiki.subGroups.central_north_america',
      'wiki.subGroups.africa',
      'wiki.subGroups.asia_pacific',
      'wiki.subGroups.bourbon_typica',
      'wiki.subGroups.ethiopian_heirloom',
      'wiki.subGroups.introgressed_hybrid',
      'wiki.subGroups.canephora',
      'wiki.subGroups.washed_clean',
      'wiki.subGroups.mucilage_honey',
      'wiki.subGroups.natural_experimental',
      'wiki.subGroups.decaffeination',
      'wiki.relevance.southern_cone_staple',
      'wiki.relevance.global_specialty',
      'wiki.species.arabica',
      'wiki.species.canephora',
      'wiki.species.liberica',
    ];
    for (const key of taxonomyKeys) {
      const resolved = t(key);
      expect(resolved).not.toBe(key);
      expect(EMOJI_REGEX.test(resolved)).toBe(false);
    }

    expect(Object.isFrozen(WIKI_CATALOG)).toBe(true);
    expect(Object.isFrozen(WIKI_ENTRIES_BY_SLUG)).toBe(true);
  });
});
