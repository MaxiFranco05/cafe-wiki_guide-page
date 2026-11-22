import type { ProcessWikiEntry } from '../../domain/schemas';

export const WIKI_PROCESSES: readonly ProcessWikiEntry[] = [
  {
    slug: 'washed',
    category: 'process',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.washed.title',
    summaryKey: 'wiki.entries.washed.summary',
    commercialAliasesKey: 'wiki.entries.washed.aliases',
    sensoryProfile: { acidity: 4, sweetness: 3, body: 2, bitterness: 1 },
    metadata: {
      processFamily: 'washed_clean',
      fermentationType: 'washed',
      mucilageRemovalKey: 'wiki.entries.washed.mucilage',
      dryingMethodKey: 'wiki.entries.washed.drying',
    },
    flavorNodeIds: [
      'fruity.citrus.lemon',
      'floral.tea.black-tea',
      'sour-fermented.sour-acids.citric-acid',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.washed.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'normal',
        reasonKey: 'wiki.entries.washed.methods.chemex',
      },
    ],
  },
  {
    slug: 'pulped-natural',
    category: 'process',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.pulpedNatural.title',
    summaryKey: 'wiki.entries.pulpedNatural.summary',
    commercialAliasesKey: 'wiki.entries.pulpedNatural.aliases',
    sensoryProfile: { acidity: 2, sweetness: 4, body: 4, bitterness: 2 },
    metadata: {
      processFamily: 'mucilage_honey',
      fermentationType: 'pulped_natural',
      mucilageRemovalKey: 'wiki.entries.pulpedNatural.mucilage',
      dryingMethodKey: 'wiki.entries.pulpedNatural.drying',
    },
    flavorNodeIds: [
      'sweet.brown-sugar.caramel',
      'nutty-cocoa.nutty.hazelnut',
      'nutty-cocoa.cocoa.milk-chocolate',
    ],
    recommendedMethods: [
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.pulpedNatural.methods.espresso',
      },
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.pulpedNatural.methods.melitta',
      },
    ],
  },
  {
    slug: 'honey',
    category: 'process',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.honey.title',
    summaryKey: 'wiki.entries.honey.summary',
    commercialAliasesKey: 'wiki.entries.honey.aliases',
    sensoryProfile: { acidity: 3, sweetness: 5, body: 4, bitterness: 1 },
    metadata: {
      processFamily: 'mucilage_honey',
      fermentationType: 'honey',
      mucilageRemovalKey: 'wiki.entries.honey.mucilage',
      dryingMethodKey: 'wiki.entries.honey.drying',
    },
    flavorNodeIds: [
      'sweet.brown-sugar.honey',
      'fruity.stone-tropical.peach',
      'sweet.vanilla-aromatics.maple-syrup',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.honey.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.honey.methods.aeropress',
      },
    ],
  },
  {
    slug: 'natural',
    category: 'process',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.natural.title',
    summaryKey: 'wiki.entries.natural.summary',
    commercialAliasesKey: 'wiki.entries.natural.aliases',
    sensoryProfile: { acidity: 3, sweetness: 5, body: 5, bitterness: 2 },
    metadata: {
      processFamily: 'natural_experimental',
      fermentationType: 'natural',
      mucilageRemovalKey: 'wiki.entries.natural.mucilage',
      dryingMethodKey: 'wiki.entries.natural.drying',
    },
    flavorNodeIds: [
      'fruity.berry.blueberry',
      'fruity.berry.strawberry',
      'fruity.dried-fruit.raisin',
      'sour-fermented.fermented.winey',
    ],
    recommendedMethods: [
      {
        methodId: 'french-press',
        profileId: 'normal',
        reasonKey: 'wiki.entries.natural.methods.frenchPress',
      },
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.natural.methods.espresso',
      },
    ],
  },
  {
    slug: 'anaerobic',
    category: 'process',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.anaerobic.title',
    summaryKey: 'wiki.entries.anaerobic.summary',
    commercialAliasesKey: 'wiki.entries.anaerobic.aliases',
    sensoryProfile: { acidity: 4, sweetness: 5, body: 4, bitterness: 1 },
    metadata: {
      processFamily: 'natural_experimental',
      fermentationType: 'anaerobic',
      mucilageRemovalKey: 'wiki.entries.anaerobic.mucilage',
      dryingMethodKey: 'wiki.entries.anaerobic.drying',
    },
    flavorNodeIds: [
      'sour-fermented.fermented.boozy-rum',
      'fruity.stone-tropical.mango',
      'spiced.brown-spice.cinnamon',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.anaerobic.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'light',
        reasonKey: 'wiki.entries.anaerobic.methods.aeropress',
      },
    ],
  },
  {
    slug: 'decaf',
    category: 'process',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.decaf.title',
    summaryKey: 'wiki.entries.decaf.summary',
    commercialAliasesKey: 'wiki.entries.decaf.aliases',
    sensoryProfile: { acidity: 2, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      processFamily: 'decaffeination',
      fermentationType: 'decaf',
      mucilageRemovalKey: 'wiki.entries.decaf.mucilage',
      dryingMethodKey: 'wiki.entries.decaf.drying',
    },
    flavorNodeIds: [
      'nutty-cocoa.cocoa.milk-chocolate',
      'sweet.vanilla-aromatics.vanilla',
      'roasted.cereal.malt',
    ],
    recommendedMethods: [
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.decaf.methods.melitta',
      },
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.decaf.methods.espresso',
      },
    ],
  },
];
