import { describe, it, expect } from 'vitest';
import {
  FlavorWheelNodeSchema,
  WikiEntrySchema,
  validateSensoryCatalogIntegrity,
  type FlavorWheelNode,
  type WikiEntry,
  type BrewMethod,
} from '../schemas';
import { METHODS_CATALOG } from '../../data/methods';

const validFlavorTree: FlavorWheelNode[] = [
  {
    id: 'fruity',
    tier: 1,
    labelKey: 'flavorWheel.nodes.fruity.label',
    colorHex: '#C93B4B',
    tastingNoteKey: 'flavorWheel.nodes.fruity.note',
    children: [
      {
        id: 'fruity.berry',
        tier: 2,
        labelKey: 'flavorWheel.nodes.fruity.berry.label',
        colorHex: '#B62D54',
        tastingNoteKey: 'flavorWheel.nodes.fruity.berry.note',
        children: [
          {
            id: 'fruity.berry.blackberry',
            tier: 3,
            labelKey: 'flavorWheel.nodes.fruity.berry.blackberry.label',
            colorHex: '#4E2A4F',
            tastingNoteKey: 'flavorWheel.nodes.fruity.berry.blackberry.note',
            children: [],
          },
        ],
      },
    ],
  },
];

const validOriginEntry: WikiEntry = {
  slug: 'brazil',
  category: 'origin',
  regionalRelevance: 'southern_cone_staple',
  titleKey: 'wiki.entries.brazil.title',
  summaryKey: 'wiki.entries.brazil.summary',
  commercialAliasesKey: 'wiki.entries.brazil.aliases',
  sensoryProfile: {
    acidity: 2,
    sweetness: 4,
    body: 4,
    bitterness: 2,
  },
  metadata: {
    macroRegion: 'south_america',
    regionKey: 'wiki.entries.brazil.region',
    altitudeRangeMeters: { min: 800, max: 1350 },
    harvestMonthsKey: 'wiki.entries.brazil.harvest',
  },
  flavorNodeIds: ['fruity.berry.blackberry'],
  recommendedMethods: [
    {
      methodId: 'espresso',
      profileId: 'normale',
      reasonKey: 'wiki.entries.brazil.methods.espresso',
    },
  ],
};

const validVarietalEntry: WikiEntry = {
  slug: 'bourbon',
  category: 'varietal',
  regionalRelevance: 'southern_cone_staple',
  titleKey: 'wiki.entries.bourbon.title',
  summaryKey: 'wiki.entries.bourbon.summary',
  commercialAliasesKey: 'wiki.entries.bourbon.aliases',
  sensoryProfile: {
    acidity: 3,
    sweetness: 5,
    body: 3,
    bitterness: 2,
  },
  metadata: {
    geneticGroup: 'bourbon_typica',
    species: 'arabica',
    lineageKey: 'wiki.entries.bourbon.lineage',
    discoveryRegionKey: 'wiki.entries.bourbon.discovery',
  },
  flavorNodeIds: ['fruity.berry.blackberry'],
  recommendedMethods: [
    {
      methodId: 'v60',
      profileId: 'normal',
      reasonKey: 'wiki.entries.bourbon.methods.v60',
    },
  ],
};

const validProcessEntry: WikiEntry = {
  slug: 'washed',
  category: 'process',
  regionalRelevance: 'southern_cone_staple',
  titleKey: 'wiki.entries.washed.title',
  summaryKey: 'wiki.entries.washed.summary',
  commercialAliasesKey: 'wiki.entries.washed.aliases',
  sensoryProfile: {
    acidity: 4,
    sweetness: 3,
    body: 2,
    bitterness: 2,
  },
  metadata: {
    processFamily: 'washed_clean',
    fermentationType: 'washed',
    mucilageRemovalKey: 'wiki.entries.washed.mucilage',
    dryingMethodKey: 'wiki.entries.washed.drying',
  },
  flavorNodeIds: ['fruity.berry.blackberry'],
  recommendedMethods: [
    {
      methodId: 'v60',
      profileId: 'light',
      reasonKey: 'wiki.entries.washed.methods.v60',
    },
  ],
};

describe('FlavorWheelNodeSchema (3-tier recursive SCA schema)', () => {
  it('accepts a valid 3-tier tree with dot-prefixed IDs and 6-digit hex colors', () => {
    const result = FlavorWheelNodeSchema.safeParse(validFlavorTree[0]);
    expect(result.success).toBe(true);
  });

  it('rejects a tier 3 leaf node with non-empty children', () => {
    const invalidLeaf: unknown = {
      id: 'fruity.berry.blackberry',
      tier: 3,
      labelKey: 'flavorWheel.nodes.fruity.berry.blackberry.label',
      colorHex: '#4E2A4F',
      tastingNoteKey: 'flavorWheel.nodes.fruity.berry.blackberry.note',
      children: [
        {
          id: 'fruity.berry.blackberry.extra',
          tier: 3,
          labelKey: 'x',
          colorHex: '#4E2A4F',
          tastingNoteKey: 'y',
          children: [],
        },
      ],
    };
    const result = FlavorWheelNodeSchema.safeParse(invalidLeaf);
    expect(result.success).toBe(false);
  });

  it('rejects a tier 1 node containing a tier 3 child directly (skipping tier 2)', () => {
    const skippedTier: unknown = {
      ...validFlavorTree[0],
      children: [
        {
          id: 'fruity.blackberry',
          tier: 3,
          labelKey: 'flavorWheel.nodes.fruity.blackberry.label',
          colorHex: '#4E2A4F',
          tastingNoteKey: 'flavorWheel.nodes.fruity.blackberry.note',
          children: [],
        },
      ],
    };
    const result = FlavorWheelNodeSchema.safeParse(skippedTier);
    expect(result.success).toBe(false);
  });

  it('rejects children whose ID does not start with parent dot-prefix', () => {
    const brokenPrefix: unknown = {
      ...validFlavorTree[0],
      children: [
        {
          id: 'floral.berry',
          tier: 2,
          labelKey: 'a',
          colorHex: '#B62D54',
          tastingNoteKey: 'b',
          children: [
            {
              id: 'floral.berry.blackberry',
              tier: 3,
              labelKey: 'c',
              colorHex: '#4E2A4F',
              tastingNoteKey: 'd',
              children: [],
            },
          ],
        },
      ],
    };
    const result = FlavorWheelNodeSchema.safeParse(brokenPrefix);
    expect(result.success).toBe(false);
  });

  it('rejects malformed colorHex values (3-digit shorthand and non-hex chars)', () => {
    const shortHex = FlavorWheelNodeSchema.safeParse({
      ...validFlavorTree[0],
      colorHex: '#C93',
    });
    const nonHexChars = FlavorWheelNodeSchema.safeParse({
      ...validFlavorTree[0],
      colorHex: '#GGGGGG',
    });
    const missingHash = FlavorWheelNodeSchema.safeParse({
      ...validFlavorTree[0],
      colorHex: 'C93B4B',
    });
    expect(shortHex.success).toBe(false);
    expect(nonHexChars.success).toBe(false);
    expect(missingHash.success).toBe(false);
  });

  it('rejects tier 1 or tier 2 nodes with empty children array', () => {
    const emptyTier1 = FlavorWheelNodeSchema.safeParse({
      ...validFlavorTree[0],
      children: [],
    });
    const emptyTier2 = FlavorWheelNodeSchema.safeParse({
      ...validFlavorTree[0],
      children: [
        {
          id: 'fruity.berry',
          tier: 2,
          labelKey: 'a',
          colorHex: '#B62D54',
          tastingNoteKey: 'b',
          children: [],
        },
      ],
    });
    expect(emptyTier1.success).toBe(false);
    expect(emptyTier2.success).toBe(false);
  });
});

describe('WikiEntrySchema (category-discriminated 2-level taxonomy)', () => {
  it('accepts valid origin, varietal, and process entries', () => {
    expect(WikiEntrySchema.safeParse(validOriginEntry).success).toBe(true);
    expect(WikiEntrySchema.safeParse(validVarietalEntry).success).toBe(true);
    expect(WikiEntrySchema.safeParse(validProcessEntry).success).toBe(true);
  });

  it('rejects sensoryProfile scores outside integer 1..5 range (including decimals)', () => {
    const zeroAcidity = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      sensoryProfile: { ...validOriginEntry.sensoryProfile, acidity: 0 },
    });
    const overFiveBody = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      sensoryProfile: { ...validOriginEntry.sensoryProfile, body: 6 },
    });
    const decimalSweetness = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      sensoryProfile: { ...validOriginEntry.sensoryProfile, sweetness: 3.5 },
    });
    expect(zeroAcidity.success).toBe(false);
    expect(overFiveBody.success).toBe(false);
    expect(decimalSweetness.success).toBe(false);
  });

  it('rejects invalid regionalRelevance and non-kebab slugs', () => {
    const badRelevance = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      regionalRelevance: 'europe_only',
    });
    const badSlug = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      slug: 'Brasil_Santos',
    });
    expect(badRelevance.success).toBe(false);
    expect(badSlug.success).toBe(false);
  });

  it('rejects origin altitudeRangeMeters when max < min', () => {
    const invertedAltitude = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      metadata: {
        ...validOriginEntry.metadata,
        altitudeRangeMeters: { min: 1900, max: 1200 },
      },
    });
    expect(invertedAltitude.success).toBe(false);
  });

  it('rejects mismatched metadata or cross-category subgroup fields and empty arrays', () => {
    const wrongMetadata = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      metadata: validVarietalEntry.metadata,
    });
    const wrongSubgroupValue = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      metadata: {
        ...validOriginEntry.metadata,
        macroRegion: 'bourbon_typica',
      },
    });
    const emptyFlavors = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      flavorNodeIds: [],
    });
    const emptyMethods = WikiEntrySchema.safeParse({
      ...validOriginEntry,
      recommendedMethods: [],
    });
    expect(wrongMetadata.success).toBe(false);
    expect(wrongSubgroupValue.success).toBe(false);
    expect(emptyFlavors.success).toBe(false);
    expect(emptyMethods.success).toBe(false);
  });
});

describe('validateSensoryCatalogIntegrity (cross-catalog invariant)', () => {
  it('returns valid: true for coherent wiki entries, flavor tree, and methods catalog', () => {
    const result = validateSensoryCatalogIntegrity(
      [validOriginEntry, validVarietalEntry, validProcessEntry],
      validFlavorTree,
      METHODS_CATALOG
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('detects duplicate wiki slugs', () => {
    const result = validateSensoryCatalogIntegrity(
      [validOriginEntry, { ...validOriginEntry }],
      validFlavorTree,
      METHODS_CATALOG
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('brazil'))).toBe(true);
  });

  it('detects duplicate flavor wheel node IDs across distinct branches', () => {
    const duplicateBranchTree: FlavorWheelNode[] = [
      validFlavorTree[0]!,
      {
        id: 'floral',
        tier: 1,
        labelKey: 'a',
        colorHex: '#D86C9C',
        tastingNoteKey: 'b',
        children: [
          {
            id: 'floral.sub',
            tier: 2,
            labelKey: 'c',
            colorHex: '#D86C9C',
            tastingNoteKey: 'd',
            children: [
              {
                id: 'fruity.berry.blackberry',
                tier: 3,
                labelKey: 'e',
                colorHex: '#4E2A4F',
                tastingNoteKey: 'f',
                children: [],
              },
            ],
          },
        ],
      },
    ];
    const result = validateSensoryCatalogIntegrity(
      [validOriginEntry],
      duplicateBranchTree,
      METHODS_CATALOG
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate flavor wheel node id'))).toBe(true);
  });

  it('detects dangling flavorNodeId references', () => {
    const brokenWiki: WikiEntry = {
      ...validOriginEntry,
      flavorNodeIds: ['fruity.nonexistent.note'],
    };
    const result = validateSensoryCatalogIntegrity([brokenWiki], validFlavorTree, METHODS_CATALOG);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('fruity.nonexistent.note'))).toBe(true);
  });

  it('detects incompatible methodId and profileId pairs in both directions (filter on espresso and espresso on filter)', () => {
    const invalidProfileOnEspresso: WikiEntry = {
      ...validOriginEntry,
      recommendedMethods: [
        {
          methodId: 'espresso',
          profileId: 'light',
          reasonKey: 'wiki.entries.brazil.methods.espresso',
        },
      ],
    };
    const invalidProfileOnV60: WikiEntry = {
      ...validVarietalEntry,
      recommendedMethods: [
        {
          methodId: 'v60',
          profileId: 'ristretto',
          reasonKey: 'wiki.entries.bourbon.methods.v60',
        },
      ],
    };
    const resEspresso = validateSensoryCatalogIntegrity(
      [invalidProfileOnEspresso],
      validFlavorTree,
      METHODS_CATALOG as readonly BrewMethod[]
    );
    const resV60 = validateSensoryCatalogIntegrity(
      [invalidProfileOnV60],
      validFlavorTree,
      METHODS_CATALOG as readonly BrewMethod[]
    );
    expect(resEspresso.valid).toBe(false);
    expect(resEspresso.errors.some((e) => e.includes('espresso') && e.includes('light'))).toBe(
      true
    );
    expect(resV60.valid).toBe(false);
    expect(resV60.errors.some((e) => e.includes('v60') && e.includes('ristretto'))).toBe(true);
  });
});
