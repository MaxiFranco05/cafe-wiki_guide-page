import type { VarietalWikiEntry } from '../../domain/schemas';

export const WIKI_VARIETALS: readonly VarietalWikiEntry[] = [
  // --- Grupo Bourbon / Typica ---
  {
    slug: 'bourbon',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.bourbon.title',
    summaryKey: 'wiki.entries.bourbon.summary',
    commercialAliasesKey: 'wiki.entries.bourbon.aliases',
    sensoryProfile: { acidity: 3, sweetness: 5, body: 4, bitterness: 2 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.bourbon.lineage',
      discoveryRegionKey: 'wiki.entries.bourbon.discovery',
    },
    flavorNodeIds: [
      'sweet.brown-sugar.caramel',
      'nutty-cocoa.cocoa.milk-chocolate',
      'fruity.stone-tropical.cherry',
      'sweet.vanilla-aromatics.vanilla',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.bourbon.methods.v60',
      },
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.bourbon.methods.espresso',
      },
    ],
  },
  {
    slug: 'mundo-novo',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.mundoNovo.title',
    summaryKey: 'wiki.entries.mundoNovo.summary',
    commercialAliasesKey: 'wiki.entries.mundoNovo.aliases',
    sensoryProfile: { acidity: 2, sweetness: 4, body: 4, bitterness: 2 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.mundoNovo.lineage',
      discoveryRegionKey: 'wiki.entries.mundoNovo.discovery',
    },
    flavorNodeIds: [
      'nutty-cocoa.cocoa.milk-chocolate',
      'nutty-cocoa.nutty.almond',
      'sweet.brown-sugar.caramel',
    ],
    recommendedMethods: [
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.mundoNovo.methods.espresso',
      },
      {
        methodId: 'french-press',
        profileId: 'normal',
        reasonKey: 'wiki.entries.mundoNovo.methods.frenchPress',
      },
    ],
  },
  {
    slug: 'catuai',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.catuai.title',
    summaryKey: 'wiki.entries.catuai.summary',
    commercialAliasesKey: 'wiki.entries.catuai.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 4, bitterness: 2 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.catuai.lineage',
      discoveryRegionKey: 'wiki.entries.catuai.discovery',
    },
    flavorNodeIds: [
      'nutty-cocoa.nutty.almond',
      'sweet.brown-sugar.honey',
      'nutty-cocoa.cocoa.milk-chocolate',
    ],
    recommendedMethods: [
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.catuai.methods.melitta',
      },
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.catuai.methods.espresso',
      },
    ],
  },
  {
    slug: 'caturra',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.caturra.title',
    summaryKey: 'wiki.entries.caturra.summary',
    commercialAliasesKey: 'wiki.entries.caturra.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.caturra.lineage',
      discoveryRegionKey: 'wiki.entries.caturra.discovery',
    },
    flavorNodeIds: [
      'fruity.citrus.orange',
      'sweet.brown-sugar.panela',
      'fruity.stone-tropical.apple',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.caturra.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.caturra.methods.aeropress',
      },
    ],
  },
  {
    slug: 'typica',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.typica.title',
    summaryKey: 'wiki.entries.typica.summary',
    commercialAliasesKey: 'wiki.entries.typica.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 3, bitterness: 1 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.typica.lineage',
      discoveryRegionKey: 'wiki.entries.typica.discovery',
    },
    flavorNodeIds: [
      'floral.blossom.chamomile',
      'sweet.vanilla-aromatics.vanilla',
      'fruity.citrus.lemon',
      'sweet.brown-sugar.panela',
    ],
    recommendedMethods: [
      {
        methodId: 'chemex',
        profileId: 'light',
        reasonKey: 'wiki.entries.typica.methods.chemex',
      },
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.typica.methods.v60',
      },
    ],
  },
  {
    slug: 'maragogype',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.maragogype.title',
    summaryKey: 'wiki.entries.maragogype.summary',
    commercialAliasesKey: 'wiki.entries.maragogype.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 2, bitterness: 1 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.maragogype.lineage',
      discoveryRegionKey: 'wiki.entries.maragogype.discovery',
    },
    flavorNodeIds: [
      'floral.blossom.chamomile',
      'fruity.citrus.orange',
      'sweet.brown-sugar.honey',
    ],
    recommendedMethods: [
      {
        methodId: 'chemex',
        profileId: 'normal',
        reasonKey: 'wiki.entries.maragogype.methods.chemex',
      },
      {
        methodId: 'v60',
        profileId: 'strong',
        reasonKey: 'wiki.entries.maragogype.methods.v60',
      },
    ],
  },
  {
    slug: 'pacas',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.pacas.title',
    summaryKey: 'wiki.entries.pacas.summary',
    commercialAliasesKey: 'wiki.entries.pacas.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.pacas.lineage',
      discoveryRegionKey: 'wiki.entries.pacas.discovery',
    },
    flavorNodeIds: [
      'sweet.brown-sugar.caramel',
      'fruity.stone-tropical.cherry',
      'nutty-cocoa.nutty.almond',
    ],
    recommendedMethods: [
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.pacas.methods.melitta',
      },
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.pacas.methods.aeropress',
      },
    ],
  },
  {
    slug: 'pacamara',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.pacamara.title',
    summaryKey: 'wiki.entries.pacamara.summary',
    commercialAliasesKey: 'wiki.entries.pacamara.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 4, bitterness: 2 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.pacamara.lineage',
      discoveryRegionKey: 'wiki.entries.pacamara.discovery',
    },
    flavorNodeIds: [
      'green-vegetative.herbal.fresh-herb',
      'fruity.stone-tropical.peach',
      'spiced.pungent.black-pepper',
      'nutty-cocoa.cocoa.dark-chocolate',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.pacamara.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'strong',
        reasonKey: 'wiki.entries.pacamara.methods.aeropress',
      },
    ],
  },
  {
    slug: 'villa-sarchi',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.villaSarchi.title',
    summaryKey: 'wiki.entries.villaSarchi.summary',
    commercialAliasesKey: 'wiki.entries.villaSarchi.aliases',
    sensoryProfile: { acidity: 5, sweetness: 4, body: 3, bitterness: 1 },
    metadata: {
      geneticGroup: 'bourbon_typica',
      species: 'arabica',
      lineageKey: 'wiki.entries.villaSarchi.lineage',
      discoveryRegionKey: 'wiki.entries.villaSarchi.discovery',
    },
    flavorNodeIds: [
      'fruity.citrus.lime',
      'fruity.stone-tropical.apple',
      'sweet.brown-sugar.honey',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.villaSarchi.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'light',
        reasonKey: 'wiki.entries.villaSarchi.methods.chemex',
      },
    ],
  },

  // --- Linajes Etíopes y Especialidad ---
  {
    slug: 'geisha',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.geisha.title',
    summaryKey: 'wiki.entries.geisha.summary',
    commercialAliasesKey: 'wiki.entries.geisha.aliases',
    sensoryProfile: { acidity: 5, sweetness: 5, body: 2, bitterness: 1 },
    metadata: {
      geneticGroup: 'ethiopian_heirloom',
      species: 'arabica',
      lineageKey: 'wiki.entries.geisha.lineage',
      discoveryRegionKey: 'wiki.entries.geisha.discovery',
    },
    flavorNodeIds: [
      'floral.blossom.jasmine',
      'floral.blossom.bergamot',
      'fruity.stone-tropical.peach',
      'floral.tea.black-tea',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.geisha.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'light',
        reasonKey: 'wiki.entries.geisha.methods.chemex',
      },
    ],
  },
  {
    slug: 'sl28-sl34',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.sl28Sl34.title',
    summaryKey: 'wiki.entries.sl28Sl34.summary',
    commercialAliasesKey: 'wiki.entries.sl28Sl34.aliases',
    sensoryProfile: { acidity: 5, sweetness: 4, body: 4, bitterness: 1 },
    metadata: {
      geneticGroup: 'ethiopian_heirloom',
      species: 'arabica',
      lineageKey: 'wiki.entries.sl28Sl34.lineage',
      discoveryRegionKey: 'wiki.entries.sl28Sl34.discovery',
    },
    flavorNodeIds: [
      'fruity.berry.blackberry',
      'fruity.citrus.grapefruit',
      'sour-fermented.sour-acids.phosphoric-acid',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.sl28Sl34.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'normal',
        reasonKey: 'wiki.entries.sl28Sl34.methods.aeropress',
      },
    ],
  },
  {
    slug: 'java',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.java.title',
    summaryKey: 'wiki.entries.java.summary',
    commercialAliasesKey: 'wiki.entries.java.aliases',
    sensoryProfile: { acidity: 4, sweetness: 4, body: 3, bitterness: 1 },
    metadata: {
      geneticGroup: 'ethiopian_heirloom',
      species: 'arabica',
      lineageKey: 'wiki.entries.java.lineage',
      discoveryRegionKey: 'wiki.entries.java.discovery',
    },
    flavorNodeIds: [
      'floral.blossom.jasmine',
      'spiced.pungent.cardamom',
      'spiced.brown-spice.anise',
      'floral.tea.black-tea',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.java.methods.v60',
      },
      {
        methodId: 'chemex',
        profileId: 'normal',
        reasonKey: 'wiki.entries.java.methods.chemex',
      },
    ],
  },
  {
    slug: 'sidra',
    category: 'varietal',
    regionalRelevance: 'global_specialty',
    titleKey: 'wiki.entries.sidra.title',
    summaryKey: 'wiki.entries.sidra.summary',
    commercialAliasesKey: 'wiki.entries.sidra.aliases',
    sensoryProfile: { acidity: 5, sweetness: 5, body: 3, bitterness: 1 },
    metadata: {
      geneticGroup: 'ethiopian_heirloom',
      species: 'arabica',
      lineageKey: 'wiki.entries.sidra.lineage',
      discoveryRegionKey: 'wiki.entries.sidra.discovery',
    },
    flavorNodeIds: [
      'floral.blossom.rose',
      'fruity.berry.strawberry',
      'fruity.stone-tropical.mango',
    ],
    recommendedMethods: [
      {
        methodId: 'v60',
        profileId: 'light',
        reasonKey: 'wiki.entries.sidra.methods.v60',
      },
      {
        methodId: 'aeropress',
        profileId: 'light',
        reasonKey: 'wiki.entries.sidra.methods.aeropress',
      },
    ],
  },

  // --- Híbridos Introgresados ---
  {
    slug: 'castillo',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.castillo.title',
    summaryKey: 'wiki.entries.castillo.summary',
    commercialAliasesKey: 'wiki.entries.castillo.aliases',
    sensoryProfile: { acidity: 3, sweetness: 4, body: 3, bitterness: 2 },
    metadata: {
      geneticGroup: 'introgressed_hybrid',
      species: 'arabica',
      lineageKey: 'wiki.entries.castillo.lineage',
      discoveryRegionKey: 'wiki.entries.castillo.discovery',
    },
    flavorNodeIds: [
      'sweet.brown-sugar.panela',
      'fruity.citrus.orange',
      'nutty-cocoa.cocoa.milk-chocolate',
    ],
    recommendedMethods: [
      {
        methodId: 'melitta',
        profileId: 'normal',
        reasonKey: 'wiki.entries.castillo.methods.melitta',
      },
      {
        methodId: 'v60',
        profileId: 'normal',
        reasonKey: 'wiki.entries.castillo.methods.v60',
      },
    ],
  },
  {
    slug: 'catimor',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.catimor.title',
    summaryKey: 'wiki.entries.catimor.summary',
    commercialAliasesKey: 'wiki.entries.catimor.aliases',
    sensoryProfile: { acidity: 2, sweetness: 3, body: 4, bitterness: 3 },
    metadata: {
      geneticGroup: 'introgressed_hybrid',
      species: 'arabica',
      lineageKey: 'wiki.entries.catimor.lineage',
      discoveryRegionKey: 'wiki.entries.catimor.discovery',
    },
    flavorNodeIds: [
      'nutty-cocoa.nutty.walnut',
      'nutty-cocoa.cocoa.dark-chocolate',
      'green-vegetative.herbal.fresh-herb',
    ],
    recommendedMethods: [
      {
        methodId: 'espresso',
        profileId: 'normale',
        reasonKey: 'wiki.entries.catimor.methods.espresso',
      },
      {
        methodId: 'french-press',
        profileId: 'normal',
        reasonKey: 'wiki.entries.catimor.methods.frenchPress',
      },
    ],
  },

  // --- Coffea canephora ---
  {
    slug: 'robusta-canephora',
    category: 'varietal',
    regionalRelevance: 'southern_cone_staple',
    titleKey: 'wiki.entries.robustaCanephora.title',
    summaryKey: 'wiki.entries.robustaCanephora.summary',
    commercialAliasesKey: 'wiki.entries.robustaCanephora.aliases',
    sensoryProfile: { acidity: 1, sweetness: 2, body: 5, bitterness: 5 },
    metadata: {
      geneticGroup: 'canephora',
      species: 'canephora',
      lineageKey: 'wiki.entries.robustaCanephora.lineage',
      discoveryRegionKey: 'wiki.entries.robustaCanephora.discovery',
    },
    flavorNodeIds: [
      'nutty-cocoa.cocoa.dark-chocolate',
      'roasted.cereal.toasted-grain',
      'other.woody-earthy.woody',
    ],
    recommendedMethods: [
      {
        methodId: 'espresso',
        profileId: 'ristretto',
        reasonKey: 'wiki.entries.robustaCanephora.methods.espresso',
      },
      {
        methodId: 'aeropress',
        profileId: 'strong',
        reasonKey: 'wiki.entries.robustaCanephora.methods.aeropress',
      },
    ],
  },
];
