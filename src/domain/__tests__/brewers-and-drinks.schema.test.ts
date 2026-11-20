import { describe, it, expect } from 'vitest';
import {
  BrewerEntrySchema,
  DrinkEntrySchema,
  validateBrewersAndDrinksIntegrity,
  type BrewerEntry,
  type DrinkEntry,
  type FlavorWheelNode,
  type WikiEntry,
} from '../schemas';
import { METHODS_CATALOG } from '../../data/methods';
import { RECIPES_CATALOG } from '../../data/recipes';

const validStationBrewer: BrewerEntry = {
  slug: 'v60',
  regionalRelevance: 'southern_cone_staple',
  titleKey: 'wiki.brewers.v60.title',
  summaryKey: 'wiki.brewers.v60.summary',
  commercialAliasesKey: 'wiki.brewers.v60.aliases',
  sensoryProfile: {
    acidity: 4,
    sweetness: 4,
    body: 2,
    bitterness: 1,
  },
  flavorNodeIds: ['fruity.citrus.orange', 'floral.blossom.jasmine'],
  family: 'drip_filter',
  history: {
    inventorKey: 'wiki.brewers.v60.history.inventor',
    originCountryKey: 'wiki.brewers.v60.history.originCountry',
    eraKey: 'wiki.brewers.v60.history.era',
    howItWorksKey: 'wiki.brewers.v60.history.howItWorks',
  },
  methodId: 'v60',
  recipeIds: ['v60-standard', 'v60-hoffmann-1cup'],
};

const validEncyclopedicBrewer: BrewerEntry = {
  slug: 'moka',
  regionalRelevance: 'southern_cone_staple',
  titleKey: 'wiki.brewers.moka.title',
  summaryKey: 'wiki.brewers.moka.summary',
  commercialAliasesKey: 'wiki.brewers.moka.aliases',
  sensoryProfile: {
    acidity: 2,
    sweetness: 3,
    body: 4,
    bitterness: 4,
  },
  flavorNodeIds: ['nutty-cocoa.cocoa.dark-chocolate'],
  family: 'pressure',
  history: {
    inventorKey: 'wiki.brewers.moka.history.inventor',
    originCountryKey: 'wiki.brewers.moka.history.originCountry',
    eraKey: 'wiki.brewers.moka.history.era',
    howItWorksKey: 'wiki.brewers.moka.history.howItWorks',
  },
  methodId: null,
  recipeIds: [],
  traditionalPreparationKey: 'wiki.brewers.moka.traditionalPreparation',
};

const validCappuccinoDrink: DrinkEntry = {
  slug: 'cappuccino',
  regionalRelevance: 'southern_cone_staple',
  titleKey: 'wiki.drinks.cappuccino.title',
  summaryKey: 'wiki.drinks.cappuccino.summary',
  commercialAliasesKey: 'wiki.drinks.cappuccino.aliases',
  sensoryProfile: {
    acidity: 2,
    sweetness: 4,
    body: 4,
    bitterness: 2,
  },
  flavorNodeIds: ['nutty-cocoa.cocoa.milk-chocolate', 'sweet.brown-sugar.caramel'],
  family: 'espresso_milk',
  history: {
    originCountryKey: 'wiki.drinks.cappuccino.history.originCountry',
    eraKey: 'wiki.drinks.cappuccino.history.era',
    historyKey: 'wiki.drinks.cappuccino.history.story',
    preparationKey: 'wiki.drinks.cappuccino.history.preparation',
  },
  composition: {
    coffee: 33,
    milk: 33,
    water: 0,
    foam: 34,
  },
  servedVolumeMl: {
    min: 150,
    max: 180,
  },
  baseBrewerSlugs: ['espresso-machine'],
  brewLink: {
    methodId: 'espresso',
    profileId: 'normale',
  },
  regionalVariants: [
    {
      id: 'capuchino-italiano-clasico',
      nameKey: 'wiki.drinks.cappuccino.variants.italianClassic.name',
      regionKey: 'wiki.drinks.cappuccino.variants.italianClassic.region',
      descriptionKey: 'wiki.drinks.cappuccino.variants.italianClassic.description',
    },
  ],
};

describe('BrewerEntrySchema', () => {
  it('accepts a valid brewer with brew station and recipe IDs', () => {
    const parsed = BrewerEntrySchema.safeParse(validStationBrewer);
    expect(parsed.success).toBe(true);
  });

  it('accepts a valid encyclopedic brewer with methodId null, empty recipes, and traditionalPreparationKey', () => {
    const parsed = BrewerEntrySchema.safeParse(validEncyclopedicBrewer);
    expect(parsed.success).toBe(true);
  });

  it('rejects sensoryProfile scores outside integer 1..5 (0, 6, 3.5)', () => {
    const zero = BrewerEntrySchema.safeParse({
      ...validStationBrewer,
      sensoryProfile: { ...validStationBrewer.sensoryProfile, acidity: 0 },
    });
    const six = BrewerEntrySchema.safeParse({
      ...validStationBrewer,
      sensoryProfile: { ...validStationBrewer.sensoryProfile, body: 6 },
    });
    const decimal = BrewerEntrySchema.safeParse({
      ...validStationBrewer,
      sensoryProfile: { ...validStationBrewer.sensoryProfile, sweetness: 3.5 },
    });

    expect(zero.success).toBe(false);
    expect(six.success).toBe(false);
    expect(decimal.success).toBe(false);
  });

  it('rejects unknown brewer family and non-kebab slug', () => {
    const badFamily = BrewerEntrySchema.safeParse({
      ...validStationBrewer,
      family: 'vacuum_chamber',
    });
    const badSlug = BrewerEntrySchema.safeParse({
      ...validStationBrewer,
      slug: 'Hario_V60',
    });

    expect(badFamily.success).toBe(false);
    expect(badSlug.success).toBe(false);
  });

  it('rejects encyclopedic brewer (methodId: null) without traditionalPreparationKey', () => {
    const { traditionalPreparationKey: _omitted, ...withoutPrep } = validEncyclopedicBrewer;
    const parsed = BrewerEntrySchema.safeParse(withoutPrep);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.includes('traditionalPreparationKey'))).toBe(true);
    }
  });

  it('rejects encyclopedic brewer (methodId: null) with non-empty recipeIds', () => {
    const parsed = BrewerEntrySchema.safeParse({
      ...validEncyclopedicBrewer,
      recipeIds: ['v60-standard'],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.includes('recipeIds'))).toBe(true);
    }
  });

  it('rejects station brewer (methodId non-null) with empty recipeIds', () => {
    const parsed = BrewerEntrySchema.safeParse({
      ...validStationBrewer,
      recipeIds: [],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.includes('recipeIds'))).toBe(true);
    }
  });
});

describe('DrinkEntrySchema', () => {
  it('accepts a valid cappuccino milk drink with composition summing 100 and regional variants', () => {
    const parsed = DrinkEntrySchema.safeParse(validCappuccinoDrink);
    expect(parsed.success).toBe(true);
  });

  it('accepts a drink with null brewLink and empty regionalVariants', () => {
    const parsed = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      slug: 'cold-brew',
      family: 'cold',
      composition: { coffee: 100, milk: 0, water: 0, foam: 0 },
      brewLink: null,
      regionalVariants: [],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects composition summing 95 or 105 on the composition path', () => {
    const sum95 = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      composition: { coffee: 30, milk: 35, water: 0, foam: 30 },
    });
    const sum105 = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      composition: { coffee: 35, milk: 35, water: 0, foam: 35 },
    });

    expect(sum95.success).toBe(false);
    if (!sum95.success) {
      expect(sum95.error.issues.some((issue) => issue.path[0] === 'composition')).toBe(true);
    }
    expect(sum105.success).toBe(false);
    if (!sum105.success) {
      expect(sum105.error.issues.some((issue) => issue.path[0] === 'composition')).toBe(true);
    }
  });

  it('rejects negative or non-integer percentages in composition', () => {
    const negative = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      composition: { coffee: 110, milk: -10, water: 0, foam: 0 },
    });
    const decimal = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      composition: { coffee: 33.5, milk: 33.5, water: 0, foam: 33 },
    });

    expect(negative.success).toBe(false);
    expect(decimal.success).toBe(false);
  });

  it('rejects inverted servedVolumeMl range on servedVolumeMl.max', () => {
    const parsed = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      servedVolumeMl: { min: 200, max: 150 },
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some(
          (issue) => issue.path[0] === 'servedVolumeMl' && issue.path[1] === 'max'
        )
      ).toBe(true);
    }
  });

  it('rejects empty baseBrewerSlugs and non-kebab variant id', () => {
    const emptyBrewers = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      baseBrewerSlugs: [],
    });
    const badVariantId = DrinkEntrySchema.safeParse({
      ...validCappuccinoDrink,
      regionalVariants: [
        {
          id: 'Lagrima_Argentina',
          nameKey: 'a',
          regionKey: 'b',
          descriptionKey: 'c',
        },
      ],
    });

    expect(emptyBrewers.success).toBe(false);
    expect(badVariantId.success).toBe(false);
  });
});

describe('validateBrewersAndDrinksIntegrity', () => {
  const miniFlavorTree: FlavorWheelNode[] = [
    {
      id: 'nutty-cocoa',
      tier: 1,
      labelKey: 'a',
      colorHex: '#A87B64',
      tastingNoteKey: 'b',
      children: [
        {
          id: 'nutty-cocoa.cocoa',
          tier: 2,
          labelKey: 'c',
          colorHex: '#BB764C',
          tastingNoteKey: 'd',
          children: [
            {
              id: 'nutty-cocoa.cocoa.dark-chocolate',
              tier: 3,
              labelKey: 'e',
              colorHex: '#470604',
              tastingNoteKey: 'f',
              children: [],
            },
            {
              id: 'nutty-cocoa.cocoa.milk-chocolate',
              tier: 3,
              labelKey: 'g',
              colorHex: '#692A19',
              tastingNoteKey: 'h',
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'fruity',
      tier: 1,
      labelKey: 'i',
      colorHex: '#DA1D23',
      tastingNoteKey: 'j',
      children: [
        {
          id: 'fruity.citrus',
          tier: 2,
          labelKey: 'k',
          colorHex: '#F7A128',
          tastingNoteKey: 'l',
          children: [
            {
              id: 'fruity.citrus.orange',
              tier: 3,
              labelKey: 'm',
              colorHex: '#E2631E',
              tastingNoteKey: 'n',
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'floral',
      tier: 1,
      labelKey: 'o',
      colorHex: '#E0719C',
      tastingNoteKey: 'p',
      children: [
        {
          id: 'floral.blossom',
          tier: 2,
          labelKey: 'q',
          colorHex: '#E0719C',
          tastingNoteKey: 'r',
          children: [
            {
              id: 'floral.blossom.jasmine',
              tier: 3,
              labelKey: 's',
              colorHex: '#F7F1BD',
              tastingNoteKey: 't',
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'sweet',
      tier: 1,
      labelKey: 'u',
      colorHex: '#E65832',
      tastingNoteKey: 'v',
      children: [
        {
          id: 'sweet.brown-sugar',
          tier: 2,
          labelKey: 'w',
          colorHex: '#D45A59',
          tastingNoteKey: 'x',
          children: [
            {
              id: 'sweet.brown-sugar.caramel',
              tier: 3,
              labelKey: 'y',
              colorHex: '#D97828',
              tastingNoteKey: 'z',
              children: [],
            },
          ],
        },
      ],
    },
  ];

  const miniWikiEntries: WikiEntry[] = [
    {
      slug: 'brazil',
      category: 'origin',
      regionalRelevance: 'southern_cone_staple',
      titleKey: 'wiki.entries.brazil.title',
      summaryKey: 'wiki.entries.brazil.summary',
      commercialAliasesKey: 'wiki.entries.brazil.aliases',
      sensoryProfile: { acidity: 2, sweetness: 4, body: 4, bitterness: 2 },
      flavorNodeIds: ['nutty-cocoa.cocoa.milk-chocolate'],
      recommendedMethods: [
        { methodId: 'espresso', profileId: 'normale', reasonKey: 'wiki.entries.brazil.methods.espresso' },
      ],
      metadata: {
        macroRegion: 'south_america',
        regionKey: 'wiki.entries.brazil.region',
        altitudeRangeMeters: { min: 800, max: 1350 },
        harvestMonthsKey: 'wiki.entries.brazil.harvest',
      },
    },
  ];

  function makeSixMethodBrewers(): BrewerEntry[] {
    const makeMethodBrewer = (
      slug: string,
      methodId: NonNullable<BrewerEntry['methodId']>,
      recipeIds: string[]
    ): BrewerEntry => ({
      ...validStationBrewer,
      slug,
      methodId,
      recipeIds,
    });

    return [
      makeMethodBrewer('v60', 'v60', ['v60-standard', 'v60-hoffmann-1cup']),
      makeMethodBrewer('chemex', 'chemex', ['chemex-standard']),
      makeMethodBrewer('melitta', 'melitta', ['melitta-standard']),
      makeMethodBrewer('aeropress', 'aeropress', ['aeropress-standard']),
      makeMethodBrewer('french-press', 'french-press', ['french-press-standard']),
      makeMethodBrewer('espresso-machine', 'espresso', ['espresso-standard']),
      validEncyclopedicBrewer,
    ];
  }

  it('returns valid: true for coherent fake catalogs covering all 6 MVP methods', () => {
    const result = validateBrewersAndDrinksIntegrity({
      brewers: makeSixMethodBrewers(),
      drinks: [validCappuccinoDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('reports recipe belonging to another method', () => {
    const brewers = makeSixMethodBrewers().map((b) =>
      b.slug === 'v60' ? { ...b, recipeIds: ['v60-standard', 'chemex-standard'] } : b
    );
    const result = validateBrewersAndDrinksIntegrity({
      brewers,
      drinks: [validCappuccinoDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('chemex-standard') && e.includes('v60'))).toBe(true);
  });

  it('reports unknown recipeId', () => {
    const brewers = makeSixMethodBrewers().map((b) =>
      b.slug === 'v60' ? { ...b, recipeIds: ['v60-standard', 'v60-ghost-recipe'] } : b
    );
    const result = validateBrewersAndDrinksIntegrity({
      brewers,
      drinks: [validCappuccinoDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('v60-ghost-recipe'))).toBe(true);
  });

  it('reports missing default recipe for a method brewer', () => {
    const brewers = makeSixMethodBrewers().map((b) =>
      b.slug === 'v60' ? { ...b, recipeIds: ['v60-hoffmann-1cup'] } : b
    );
    const result = validateBrewersAndDrinksIntegrity({
      brewers,
      drinks: [validCappuccinoDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('v60-standard'))).toBe(true);
  });

  it('reports a method with 0 brewers and a method with 2 brewers', () => {
    const withoutChemex = makeSixMethodBrewers().filter((b) => b.slug !== 'chemex');
    const resZero = validateBrewersAndDrinksIntegrity({
      brewers: withoutChemex,
      drinks: [validCappuccinoDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(resZero.valid).toBe(false);
    expect(resZero.errors.some((e) => e.includes('chemex'))).toBe(true);

    const twoV60: BrewerEntry[] = [
      ...makeSixMethodBrewers(),
      { ...validStationBrewer, slug: 'v60-switch', methodId: 'v60', recipeIds: ['v60-standard'] },
    ];
    const resTwo = validateBrewersAndDrinksIntegrity({
      brewers: twoV60,
      drinks: [validCappuccinoDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(resTwo.valid).toBe(false);
    expect(resTwo.errors.some((e) => e.includes('v60'))).toBe(true);
  });

  it('reports invalid brewLink pair (espresso + light)', () => {
    const brokenDrink: DrinkEntry = {
      ...validCappuccinoDrink,
      brewLink: { methodId: 'espresso', profileId: 'light' },
    };
    const result = validateBrewersAndDrinksIntegrity({
      brewers: makeSixMethodBrewers(),
      drinks: [brokenDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('espresso') && e.includes('light'))).toBe(true);
  });

  it('reports unknown baseBrewerSlug on a drink', () => {
    const brokenDrink: DrinkEntry = {
      ...validCappuccinoDrink,
      baseBrewerSlugs: ['unknown-brewer'],
    };
    const result = validateBrewersAndDrinksIntegrity({
      brewers: makeSixMethodBrewers(),
      drinks: [brokenDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('unknown-brewer'))).toBe(true);
  });

  it('reports unknown flavorNodeId on brewers or drinks', () => {
    const brokenDrink: DrinkEntry = {
      ...validCappuccinoDrink,
      flavorNodeIds: ['fruity.ghost.flavor'],
    };
    const result = validateBrewersAndDrinksIntegrity({
      brewers: makeSixMethodBrewers(),
      drinks: [brokenDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('fruity.ghost.flavor'))).toBe(true);
  });

  it('reports slug collision with existing WIKI_CATALOG', () => {
    const collidingBrewer: BrewerEntry = {
      ...validEncyclopedicBrewer,
      slug: 'brazil',
    };
    const result = validateBrewersAndDrinksIntegrity({
      brewers: [...makeSixMethodBrewers(), collidingBrewer],
      drinks: [validCappuccinoDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('brazil'))).toBe(true);
  });

  it('reports duplicate regional variant id within the same drink', () => {
    const dupVariantDrink: DrinkEntry = {
      ...validCappuccinoDrink,
      regionalVariants: [
        validCappuccinoDrink.regionalVariants[0]!,
        { ...validCappuccinoDrink.regionalVariants[0]! },
      ],
    };
    const result = validateBrewersAndDrinksIntegrity({
      brewers: makeSixMethodBrewers(),
      drinks: [dupVariantDrink],
      wikiEntries: miniWikiEntries,
      flavorTree: miniFlavorTree,
      methods: METHODS_CATALOG,
      recipes: RECIPES_CATALOG,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('capuchino-italiano-clasico'))).toBe(true);
  });
});
