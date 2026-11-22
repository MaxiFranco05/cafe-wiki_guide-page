import type { OriginWikiEntry } from '../../domain/schemas';

export const WIKI_ORIGINS: readonly OriginWikiEntry[] = [
  // --- Sudamérica (prioridad Cono Sur) ---
  {
    slug: 'brazil',
    category: 'origin',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.brazil.title',
    summaryKey: 'wiki.entries.brazil.summary',
    commercialAliasesKey: 'wiki.entries.brazil.aliases',
    sensoryProfile: { acidity: 2, sweetness: 4, body: 4, bitterness: 2 },
    metadata: {
      macroRegion: 'south_america',
      regionKey: 'wiki.entries.brazil.region',
      altitudeRangeMeters: { min: 800, max: 1350 },
      harvestMonthsKey: 'wiki.entries.brazil.harvest',
    },
    flavorNodeIds: [
      'nutty-cocoa.cocoa.milk-chocolate',
      'nutty-cocoa.nutty.hazelnut',
      'nutty-cocoa.nutty.almond',
      'sweet.brown-sugar.caramel',
    ],
    recommendedMethods: [
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.brazil.methods.espresso',
      },
      {
        methodId: 'french-press',
        profileId: 'normal',
        reasonKey: 'wiki.entries.brazil.methods.frenchPress',
      },
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.brazil.methods.melitta',
      },
    ],
  },
  {
    slug: 'colombia',
    category: 'origin',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.colombia.title',
    summaryKey: 'wiki.entries.colombia.summary',
    commercialAliasesKey: 'wiki.entries.colombia.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      macroRegion: 'south_america',
      regionKey: 'wiki.entries.colombia.region',
      altitudeRangeMeters: { min: 1400, max: 2100 },
      harvestMonthsKey: 'wiki.entries.colombia.harvest',
    },
    flavorNodeIds: [
      'sweet.brown-sugar.panela',
      'fruity.citrus.orange',
      'fruity.stone-tropical.cherry',
      'nutty-cocoa.cocoa.milk-chocolate',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.colombia.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.colombia.methods.aeropress',
      },
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.colombia.methods.espresso',
      },
    ],
  },
  {
    slug: 'peru',
    category: 'origin',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.peru.title',
    summaryKey: 'wiki.entries.peru.summary',
    commercialAliasesKey: 'wiki.entries.peru.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      macroRegion: 'south_america',
      regionKey: 'wiki.entries.peru.region',
      altitudeRangeMeters: { min: 1300, max: 2050 },
      harvestMonthsKey: 'wiki.entries.peru.harvest',
    },
    flavorNodeIds: [
      'nutty-cocoa.cocoa.milk-chocolate',
      'sweet.brown-sugar.honey',
      'nutty-cocoa.nutty.walnut',
      'fruity.stone-tropical.apple',
    ],
    recommendedMethods: [
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.peru.methods.melitta',
      },
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.peru.methods.v60',
      },
    ],
  },
  {
    slug: 'bolivia',
    category: 'origin',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.bolivia.title',
    summaryKey: 'wiki.entries.bolivia.summary',
    commercialAliasesKey: 'wiki.entries.bolivia.aliases',
    sensoryProfile: { acidity: 4, sweetness: 5, body: 3, bitterness: 1 },
    metadata: {
      macroRegion: 'south_america',
      regionKey: 'wiki.entries.bolivia.region',
      altitudeRangeMeters: { min: 1450, max: 2100 },
      harvestMonthsKey: 'wiki.entries.bolivia.harvest',
    },
    flavorNodeIds: [
      'floral.blossom.chamomile',
      'fruity.stone-tropical.peach',
      'sweet.brown-sugar.panela',
      'fruity.citrus.orange',
    ],
    recommendedMethods: [
      {
        methodId: 'chemex',
        profileId: 'light',
        reasonKey: 'wiki.entries.bolivia.methods.chemex',
      },
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.bolivia.methods.v60',
      },
    ],
  },
  {
    slug: 'ecuador',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.ecuador.title',
    summaryKey: 'wiki.entries.ecuador.summary',
    commercialAliasesKey: 'wiki.entries.ecuador.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 3, bitterness: 1 },
    metadata: {
      macroRegion: 'south_america',
      regionKey: 'wiki.entries.ecuador.region',
      altitudeRangeMeters: { min: 1400, max: 2100 },
      harvestMonthsKey: 'wiki.entries.ecuador.harvest',
    },
    flavorNodeIds: [
      'floral.blossom.rose',
      'fruity.stone-tropical.mango',
      'sweet.brown-sugar.panela',
      'spiced.brown-spice.cinnamon',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.ecuador.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'normal',
        reasonKey: 'wiki.entries.ecuador.methods.chemex',
      },
    ],
  },

  // --- Centroamérica y Norteamérica ---
  {
    slug: 'guatemala',
    category: 'origin',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.guatemala.title',
    summaryKey: 'wiki.entries.guatemala.summary',
    commercialAliasesKey: 'wiki.entries.guatemala.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 4, bitterness: 2 },
    metadata: {
      macroRegion: 'central_north_america',
      regionKey: 'wiki.entries.guatemala.region',
      altitudeRangeMeters: { min: 1350, max: 2000 },
      harvestMonthsKey: 'wiki.entries.guatemala.harvest',
    },
    flavorNodeIds: [
      'nutty-cocoa.cocoa.dark-chocolate',
      'fruity.stone-tropical.apple',
      'spiced.brown-spice.nutmeg',
      'sour-fermented.sour-acids.malic-acid',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.guatemala.methods.v60',
      },
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.guatemala.methods.espresso',
      },
    ],
  },
  {
    slug: 'costa-rica',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.costaRica.title',
    summaryKey: 'wiki.entries.costaRica.summary',
    commercialAliasesKey: 'wiki.entries.costaRica.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      macroRegion: 'central_north_america',
      regionKey: 'wiki.entries.costaRica.region',
      altitudeRangeMeters: { min: 1200, max: 1900 },
      harvestMonthsKey: 'wiki.entries.costaRica.harvest',
    },
    flavorNodeIds: [
      'sweet.brown-sugar.honey',
      'fruity.citrus.orange',
      'fruity.citrus.lime',
      'floral.blossom.chamomile',
    ],
    recommendedMethods: [
      {
        methodId: 'chemex',
        profileId: 'normal',
        reasonKey: 'wiki.entries.costaRica.methods.chemex',
      },
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.costaRica.methods.v60',
      },
    ],
  },
  {
    slug: 'el-salvador',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.elSalvador.title',
    summaryKey: 'wiki.entries.elSalvador.summary',
    commercialAliasesKey: 'wiki.entries.elSalvador.aliases',
    sensoryProfile: { acidity: 3, sweetness: 5, body: 3, bitterness: 2 },
    metadata: {
      macroRegion: 'central_north_america',
      regionKey: 'wiki.entries.elSalvador.region',
      altitudeRangeMeters: { min: 1200, max: 1850 },
      harvestMonthsKey: 'wiki.entries.elSalvador.harvest',
    },
    flavorNodeIds: [
      'fruity.stone-tropical.cherry',
      'nutty-cocoa.nutty.almond',
      'sweet.brown-sugar.caramel',
      'sour-fermented.sour-acids.malic-acid',
    ],
    recommendedMethods: [
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.elSalvador.methods.aeropress',
      },
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.elSalvador.methods.melitta',
      },
    ],
  },
  {
    slug: 'honduras',
    category: 'origin',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.honduras.title',
    summaryKey: 'wiki.entries.honduras.summary',
    commercialAliasesKey: 'wiki.entries.honduras.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 4, bitterness: 2 },
    metadata: {
      macroRegion: 'central_north_america',
      regionKey: 'wiki.entries.honduras.region',
      altitudeRangeMeters: { min: 1200, max: 1800 },
      harvestMonthsKey: 'wiki.entries.honduras.harvest',
    },
    flavorNodeIds: [
      'sweet.vanilla-aromatics.maple-syrup',
      'fruity.stone-tropical.apple',
      'nutty-cocoa.cocoa.milk-chocolate',
      'fruity.stone-tropical.cherry',
    ],
    recommendedMethods: [
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.honduras.methods.melitta',
      },
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.honduras.methods.espresso',
      },
    ],
  },
  {
    slug: 'nicaragua',
    category: 'origin',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.nicaragua.title',
    summaryKey: 'wiki.entries.nicaragua.summary',
    commercialAliasesKey: 'wiki.entries.nicaragua.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      macroRegion: 'central_north_america',
      regionKey: 'wiki.entries.nicaragua.region',
      altitudeRangeMeters: { min: 1100, max: 1700 },
      harvestMonthsKey: 'wiki.entries.nicaragua.harvest',
    },
    flavorNodeIds: [
      'nutty-cocoa.cocoa.milk-chocolate',
      'nutty-cocoa.nutty.walnut',
      'sweet.brown-sugar.caramel',
      'fruity.stone-tropical.apple',
    ],
    recommendedMethods: [
      {
        methodId: 'french-press',
        profileId: 'normal',
        reasonKey: 'wiki.entries.nicaragua.methods.frenchPress',
      },
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.nicaragua.methods.melitta',
      },
    ],
  },
  {
    slug: 'panama',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.panama.title',
    summaryKey: 'wiki.entries.panama.summary',
    commercialAliasesKey: 'wiki.entries.panama.aliases',
    sensoryProfile: { acidity: 5, sweetness: 5, body: 2, bitterness: 1 },
    metadata: {
      macroRegion: 'central_north_america',
      regionKey: 'wiki.entries.panama.region',
      altitudeRangeMeters: { min: 1450, max: 1950 },
      harvestMonthsKey: 'wiki.entries.panama.harvest',
    },
    flavorNodeIds: [
      'floral.blossom.jasmine',
      'floral.blossom.bergamot',
      'fruity.stone-tropical.peach',
      'fruity.citrus.orange',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.panama.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'light',
        reasonKey: 'wiki.entries.panama.methods.chemex',
      },
    ],
  },
  {
    slug: 'mexico',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.mexico.title',
    summaryKey: 'wiki.entries.mexico.summary',
    commercialAliasesKey: 'wiki.entries.mexico.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      macroRegion: 'central_north_america',
      regionKey: 'wiki.entries.mexico.region',
      altitudeRangeMeters: { min: 1100, max: 1750 },
      harvestMonthsKey: 'wiki.entries.mexico.harvest',
    },
    flavorNodeIds: [
      'nutty-cocoa.nutty.hazelnut',
      'spiced.brown-spice.cinnamon',
      'nutty-cocoa.cocoa.milk-chocolate',
      'sweet.brown-sugar.panela',
    ],
    recommendedMethods: [
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.mexico.methods.melitta',
      },
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.mexico.methods.aeropress',
      },
    ],
  },

  // --- África ---
  {
    slug: 'ethiopia',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.ethiopia.title',
    summaryKey: 'wiki.entries.ethiopia.summary',
    commercialAliasesKey: 'wiki.entries.ethiopia.aliases',
    sensoryProfile: { acidity: 5, sweetness: 4, body: 2, bitterness: 1 },
    metadata: {
      macroRegion: 'africa',
      regionKey: 'wiki.entries.ethiopia.region',
      altitudeRangeMeters: { min: 1700, max: 2200 },
      harvestMonthsKey: 'wiki.entries.ethiopia.harvest',
    },
    flavorNodeIds: [
      'floral.blossom.jasmine',
      'floral.blossom.bergamot',
      'fruity.berry.blueberry',
      'floral.tea.black-tea',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.ethiopia.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'light',
        reasonKey: 'wiki.entries.ethiopia.methods.chemex',
      },
    ],
  },
  {
    slug: 'kenya',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.kenya.title',
    summaryKey: 'wiki.entries.kenya.summary',
    commercialAliasesKey: 'wiki.entries.kenya.aliases',
    sensoryProfile: { acidity: 5, sweetness: 4, body: 4, bitterness: 1 },
    metadata: {
      macroRegion: 'africa',
      regionKey: 'wiki.entries.kenya.region',
      altitudeRangeMeters: { min: 1500, max: 2100 },
      harvestMonthsKey: 'wiki.entries.kenya.harvest',
    },
    flavorNodeIds: [
      'fruity.berry.blackberry',
      'fruity.citrus.grapefruit',
      'sour-fermented.sour-acids.phosphoric-acid',
      'fruity.berry.raspberry',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.kenya.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.kenya.methods.aeropress',
      },
    ],
  },
  {
    slug: 'rwanda',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.rwanda.title',
    summaryKey: 'wiki.entries.rwanda.summary',
    commercialAliasesKey: 'wiki.entries.rwanda.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 3, bitterness: 1 },
    metadata: {
      macroRegion: 'africa',
      regionKey: 'wiki.entries.rwanda.region',
      altitudeRangeMeters: { min: 1550, max: 2050 },
      harvestMonthsKey: 'wiki.entries.rwanda.harvest',
    },
    flavorNodeIds: [
      'fruity.citrus.orange',
      'fruity.dried-fruit.prune',
      'sour-fermented.fermented.winey',
      'floral.tea.black-tea',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.rwanda.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'normal',
        reasonKey: 'wiki.entries.rwanda.methods.chemex',
      },
    ],
  },

  // --- Asia-Pacífico ---
  {
    slug: 'sumatra',
    category: 'origin',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.sumatra.title',
    summaryKey: 'wiki.entries.sumatra.summary',
    commercialAliasesKey: 'wiki.entries.sumatra.aliases',
    sensoryProfile: { acidity: 2, sweetness: 3, body: 5, bitterness: 3 },
    metadata: {
      macroRegion: 'asia_pacific',
      regionKey: 'wiki.entries.sumatra.region',
      altitudeRangeMeters: { min: 1100, max: 1650 },
      harvestMonthsKey: 'wiki.entries.sumatra.harvest',
    },
    flavorNodeIds: [
      'other.woody-earthy.earthy',
      'other.woody-earthy.cedar',
      'spiced.brown-spice.clove',
      'nutty-cocoa.cocoa.dark-chocolate',
    ],
    recommendedMethods: [
      {
        methodId: 'french-press',
        profileId: 'strong',
        reasonKey: 'wiki.entries.sumatra.methods.frenchPress',
      },
      {
        methodId: 'espresso',
        profileId: 'ristretto',
        reasonKey: 'wiki.entries.sumatra.methods.espresso',
      },
    ],
  },
];
