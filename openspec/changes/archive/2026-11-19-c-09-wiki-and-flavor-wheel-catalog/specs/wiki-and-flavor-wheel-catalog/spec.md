# Spec Delta

## Purpose

Provee los esquemas Zod del dominio sensorial y enciclopédico (`WikiEntry`, `FlavorWheelNode`), el catálogo estático curado de la Wiki del Café (38 fichas clasificadas en 2 niveles entre orígenes, varietales y procesos con prioridad Cono Sur y alias comerciales) y de la Rueda de Sabores SCA (árbol jerárquico de 3 anillos concéntricos y 9 familias), los diccionarios localizados en español (`wiki.json`, `flavor-wheel.json`), la validación de integridad referencial cruzada con los métodos de preparación y los selectores puros de consulta, agrupación y navegación bidireccional.

## ADDED Requirements

### Requirement: Wiki Entry Schema and Category-Discriminated Metadata
The system SHALL define `WikiEntrySchema` in `src/domain/schemas/wiki.schema.ts` validating `slug` (kebab-case), `category` (`origin | varietal | process`), `regionalRelevance` (`southern_cone_staple | global_specialty`), `titleKey`, `summaryKey`, `commercialAliasesKey`, `sensoryProfile` (integers `1..5`), category-discriminated `metadata` (`macroRegion`, `geneticGroup`, or `processFamily`), `flavorNodeIds`, and `recommendedMethods`.

#### Scenario: Valid origin, varietal, and process entries pass validation
- **WHEN** `WikiEntrySchema.safeParse` evaluates a well-formed origin entry (with `macroRegion`, `altitudeRangeMeters`, and `regionKey`), varietal entry (with `geneticGroup`, `species`, and `lineageKey`), or process entry (with `processFamily`, `fermentationType`, and `dryingMethodKey`)
- **THEN** validation succeeds and returns the strongly typed `WikiEntry` object

#### Scenario: Out-of-bounds sensory profile or mismatched metadata is rejected
- **WHEN** `WikiEntrySchema.safeParse` receives a sensory score outside `1..5` (e.g., `0`, `6`, or `3.5`), an invalid `regionalRelevance`, or metadata fields/subgroup that do not match the entry `category`
- **THEN** validation fails with a path-specific Zod issue

### Requirement: Recursive Three-Tier SCA Flavor Wheel Schema
The system SHALL define `FlavorWheelNodeSchema` in `src/domain/schemas/flavor-wheel.schema.ts` representing a recursive 3-tier hierarchy (`tier: 1 | 2 | 3`) with `id`, `labelKey`, `colorHex` (`^#[0-9A-Fa-f]{6}$`), `tastingNoteKey`, and `children`, enforcing that tier 1 nodes have tier 2 children, tier 2 nodes have tier 3 children, and tier 3 leaf nodes have an empty `children` array (`[]`).

#### Scenario: Valid three-tier flavor tree passes validation
- **WHEN** `FlavorWheelNodeSchema.safeParse` evaluates a tier 1 root family containing tier 2 subfamilies and tier 3 leaf descriptors with valid 6-digit hex colors and hierarchical dot-prefixed IDs
- **THEN** validation succeeds for the entire tree

#### Scenario: Invalid tier hierarchy or malformed hex color is rejected
- **WHEN** `FlavorWheelNodeSchema.safeParse` evaluates a tier 3 node with non-empty `children`, a tier 1 node containing a tier 3 child directly, or a `colorHex` that is not a valid 6-digit hex color
- **THEN** validation fails reporting the exact violating node path

### Requirement: Curated Static Coffee Wiki Catalog
The system SHALL provide a static catalog in `src/data/wiki/` containing 38 validated entries organized by taxonomic sub-groups, tagged with `regionalRelevance`, and identified by globally unique `slug` keys (16 origins, 16 varietals, and 6 processes).

#### Scenario: Wiki catalog meets category counts, sub-group coverage, and uniqueness
- **WHEN** `WIKI_CATALOG` is loaded from `src/data/wiki/`
- **THEN** every entry passes `WikiEntrySchema.safeParse`, all 38 slugs are unique, and the catalog includes 16 origins (`brazil`, `colombia`, `peru`, `bolivia`, `ecuador`, `guatemala`, `costa-rica`, `el-salvador`, `honduras`, `nicaragua`, `panama`, `mexico`, `ethiopia`, `kenya`, `rwanda`, `sumatra`), 16 varietals (`bourbon`, `mundo-novo`, `catuai`, `caturra`, `typica`, `maragogype`, `pacas`, `pacamara`, `villa-sarchi`, `geisha`, `sl28-sl34`, `java`, `sidra`, `castillo`, `catimor`, `robusta-canephora`), and 6 processes (`washed`, `pulped-natural`, `honey`, `natural`, `anaerobic`, `decaf`)

### Requirement: Three-Ring SCA Flavor Wheel Static Catalog
The system SHALL provide a static catalog in `src/data/flavor-wheel/` containing the 9 root tier 1 sensory families (`fruity`, `floral`, `sweet`, `nutty-cocoa`, `spiced`, `roasted`, `green-vegetative`, `sour-fermented`, `other`), each populated with tier 2 subfamilies and tier 3 specific tasting descriptors with unique IDs across the entire tree.

#### Scenario: Flavor wheel catalog contains all 9 root families and valid tree nodes
- **WHEN** `FLAVOR_WHEEL_TREE` is loaded from `src/data/flavor-wheel/`
- **THEN** it contains the 9 root families in `tier: 1`, every node in the tree passes `FlavorWheelNodeSchema.safeParse`, and all node IDs are globally unique

### Requirement: Cross-Catalog Referential Integrity Invariant
The system SHALL enforce at test and build time (`RN-I18N-02`) that every `flavorNodeId` referenced by a `WikiEntry` exists in the Flavor Wheel catalog, and every `recommendedMethods` entry (`methodId` and `profileId`) references an existing method and valid profile ID in `METHODS_CATALOG`.

#### Scenario: All Wiki references resolve to existing Flavor Wheel nodes and Brew Methods
- **WHEN** the catalog integrity verification runs across `WIKI_CATALOG`, `FLAVOR_WHEEL_TREE`, and `METHODS_CATALOG`
- **THEN** 100% of `entry.flavorNodeIds` resolve to an existing `FlavorWheelNode` and 100% of `entry.recommendedMethods` resolve to a valid `BrewMethod` and `RecipeProfile` within that method

#### Scenario: Dangling flavor node or invalid method profile reference is rejected
- **WHEN** a candidate `WikiEntry` references a non-existent `flavorNodeId` or a `profileId` not supported by the target `methodId` (such as `"light"` on `"espresso"`)
- **THEN** the cross-catalog integrity validator returns a failure identifying the broken reference

### Requirement: Localized Spanish Dictionaries and Zero Hardcoded Copy
The system SHALL provide `src/i18n/locales/es/wiki.json` and `src/i18n/locales/es/flavor-wheel.json` merged into `src/i18n/index.ts` (`RN-I18N-01`), ensuring every `titleKey`, `summaryKey`, `commercialAliasesKey`, metadata key, `reasonKey`, `labelKey`, and `tastingNoteKey` in the Wiki and Flavor Wheel catalogs resolves to a non-empty Spanish string written with concrete technical facts and zero emojis.

#### Scenario: Every catalog translation key resolves in Spanish dictionary
- **WHEN** `t(key)` is called for every translation key referenced across `WIKI_CATALOG` and `FLAVOR_WHEEL_TREE`
- **THEN** `t(key)` returns a localized non-empty string distinct from the raw key path and containing no emoji characters

### Requirement: Pure Bidirectional Query and Cross-Reference Selectors
The system SHALL expose pure, side-effect-free selector functions to query Wiki entries by slug, category, sub-group, `regionalRelevance`, sensory thresholds, flavor node ID, or text query (including `commercialAliasesKey`), group entries via `groupWikiEntriesBySubGroup(category)`, and query Flavor Wheel nodes by ID, ancestor lineage path, and associated Wiki entries.

#### Scenario: Bidirectional lookup between a flavor descriptor and related Wiki entries
- **WHEN** a consumer queries `getFlavorNodeLineage("fruity.berry.blackberry")` and `getWikiEntriesByFlavorNode("fruity.berry")` (or a leaf descriptor ID)
- **THEN** the lineage selector returns the ordered ancestor chain from tier 1 to tier 3, and the Wiki selector returns all `WikiEntry` items associated with that flavor node or its descendant leaf nodes

#### Scenario: Filtering by commercial alias, sub-group, and grouping by taxonomy
- **WHEN** a consumer calls `filterWikiEntries({ category: "origin", query: "santos" })`, filters by `subGroup` or `regionalRelevance`, or calls `groupWikiEntriesBySubGroup("varietal")`
- **THEN** `filterWikiEntries` matches entries via resolved `commercialAliasesKey` (returning `brazil` for `"santos"`) and filters cleanly, while `groupWikiEntriesBySubGroup` returns entries organized under their taxonomic sub-groups without mutating source collections
