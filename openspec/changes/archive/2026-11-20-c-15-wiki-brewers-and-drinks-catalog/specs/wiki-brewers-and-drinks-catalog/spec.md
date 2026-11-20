# Spec Delta

## Purpose

Provee el contenido enciclopédico validado de las secciones Cafeteras y Bebidas de la Wiki del Café: esquemas, catálogo estático, integridad referencial con métodos, recetas y rueda SCA, diccionarios en español y consultas puras para que la UI de la Wiki las muestre sin lógica propia.

## ADDED Requirements

### Requirement: Brewer Entry Schema
The system SHALL validate every brewer entry with a schema requiring a kebab-case slug, regional relevance, title, summary and aliases keys, a sensory profile of integers `1..5` (acidity, sweetness, body, bitterness), at least one flavor node, a family (`drip_filter | immersion | pressure | decoction`), history keys (inventor, origin country, era, how it works), a nullable brew method ID and a list of recipe IDs.

#### Scenario: Valid brewer with brew station passes
- **WHEN** a brewer with `methodId: "v60"`, non-empty `recipeIds` and all required keys is validated
- **THEN** validation succeeds and returns a typed brewer entry

#### Scenario: Encyclopedic brewer without station passes
- **WHEN** a brewer with `methodId: null`, empty `recipeIds` and a traditional preparation key is validated
- **THEN** validation succeeds

#### Scenario: Invalid brewer is rejected
- **WHEN** a brewer has a sensory score outside `1..5`, an unknown family, a non-kebab slug, or `methodId: null` without a traditional preparation key
- **THEN** validation fails with a path-specific issue

### Requirement: Drink Entry Schema
The system SHALL validate every drink entry with the same base fields as brewers, a family (`espresso_black | espresso_milk | cold`), history keys, a composition in integer percentages of coffee, milk, water and foam that sum exactly 100, a served volume range in ml (`max >= min`), at least one base brewer slug, an optional brew link (`methodId` + `profileId`) and a list of regional variants.

#### Scenario: Valid milk drink passes
- **WHEN** a cappuccino with composition `{ coffee: 33, milk: 33, water: 0, foam: 34 }`, volume `150..180` ml and a brew link `espresso` + `normale` is validated
- **THEN** validation succeeds

#### Scenario: Composition not summing 100 is rejected
- **WHEN** a drink composition sums 95 or 105, or has a negative or non-integer percentage
- **THEN** validation fails on the composition path

#### Scenario: Inverted volume range is rejected
- **WHEN** a drink has `servedVolumeMl.max` lower than `min`
- **THEN** validation fails on `servedVolumeMl.max`

### Requirement: Static Brewers Catalog
The system SHALL provide 10 validated brewer entries: 6 with brew station (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso-machine`) and 4 encyclopedic only (`moka`, `siphon`, `cezve`, `electric-drip`).

#### Scenario: Catalog content and station mapping
- **WHEN** the brewers catalog is loaded
- **THEN** it contains exactly those 10 slugs, every entry passes the brewer schema, each of the 6 MVP brew methods maps to exactly one brewer, and the 4 encyclopedic brewers have no brew method and no recipes

### Requirement: Brewer Recipes Link to the Recipes Catalog
The system SHALL link brewer recipes by recipe ID to the existing recipes catalog without duplicating recipe content, and every brewer with brew station SHALL list its method's default recipe.

#### Scenario: Recipes resolve for a brewer with station
- **WHEN** the recipes of brewer `v60` are requested
- **THEN** the result is the list of catalog recipes in the declared order, all with `methodId: "v60"`, including `v60-standard`

#### Scenario: Encyclopedic brewer has no recipes
- **WHEN** the recipes of brewer `moka` are requested
- **THEN** the result is an empty list

### Requirement: Static Drinks Catalog
The system SHALL provide 12 validated drink entries: `espresso`, `ristretto`, `lungo`, `americano`, `cortado`, `macchiato`, `cappuccino`, `flat-white`, `latte`, `mocha`, `cafe-con-leche` and `cold-brew`.

#### Scenario: Catalog content and families
- **WHEN** the drinks catalog is loaded
- **THEN** it contains exactly those 12 slugs, every entry passes the drink schema, `espresso_black` holds espresso, ristretto, lungo and americano, `espresso_milk` holds the 7 milk drinks and `cold` holds cold brew

### Requirement: Regional Variants Inside the Base Drink
The system SHALL model Southern Cone and other regional variants as variants of a base drink entry, each with name, region and description keys, and SHALL NOT create separate drink entries for them.

#### Scenario: Lágrima is a variant, not an entry
- **WHEN** the drinks catalog is loaded
- **THEN** no entry has slug `lagrima`, and the variant "lágrima" exists inside a milk drink entry with an Argentina/Uruguay region

### Requirement: Cross-Catalog Referential Integrity for Brewers and Drinks
The system SHALL verify at test time (`RN-I18N-02`) that slugs are unique across all Wiki sections, flavor node IDs exist, brewer recipe IDs exist and belong to the brewer's method, drink brew links are valid method/profile pairs, and drink base brewer slugs exist.

#### Scenario: Shipped catalogs pass integrity
- **WHEN** the integrity check runs over brewers, drinks, existing Wiki entries, the flavor wheel, the methods catalog and the recipes catalog
- **THEN** it reports valid with no errors

#### Scenario: Broken references are reported
- **WHEN** a candidate brewer references a recipe of another method or an unknown recipe, a drink links `espresso` + `light`, a drink references an unknown base brewer, or a slug repeats an existing Wiki slug
- **THEN** the integrity check reports invalid with one error naming each broken reference

### Requirement: Spanish Dictionaries Without Hardcoded Copy
The system SHALL resolve every translation key referenced by the brewers and drinks catalogs, including variant keys, to a non-empty Spanish string with concrete facts and no emojis (`RN-I18N-01`).

#### Scenario: All keys resolve
- **WHEN** every key of every brewer and drink entry is translated
- **THEN** each returns a non-empty string different from the key and without emoji characters

### Requirement: Brewer Query Selectors
The system SHALL expose pure queries to get a brewer by slug, get the brewer of a brew method, group brewers by family in a fixed order, and filter brewers by accent-insensitive text (title, summary, aliases, flavor labels), family, regional relevance, brew station presence, flavor node (including descendants) and sensory thresholds, without mutating the catalog.

#### Scenario: Lookup and filter brewers
- **WHEN** a consumer gets the brewer of method `espresso`, filters with query `"bialetti"` and filters with `hasBrewStation: false`
- **THEN** the results are `espresso-machine`, `moka`, and the 4 encyclopedic brewers respectively

#### Scenario: Unknown slug returns nothing
- **WHEN** a consumer requests brewer `sifon-inexistente`
- **THEN** the result is `undefined`

### Requirement: Drink Query Selectors
The system SHALL expose pure queries to get a drink by slug, group drinks by family in a fixed order, list drinks made with a given brewer, and filter drinks by accent-insensitive text (including regional variant names), family, regional relevance, presence of milk, flavor node and sensory thresholds, without mutating the catalog.

#### Scenario: Search finds a drink by its variant name
- **WHEN** a consumer filters drinks with query `"lagrima"`
- **THEN** the result contains the base drink that holds the lágrima variant

#### Scenario: Drinks of a brewer and milk filter
- **WHEN** a consumer lists drinks of brewer `espresso-machine` and filters drinks with `hasMilk: false`
- **THEN** the first result includes espresso and cappuccino, and the second contains only drinks whose milk and foam percentages are both 0

### Requirement: Existing Wiki Search Behavior Is Preserved
The system SHALL keep the existing origins, varietals and processes search and filter results unchanged when the search normalization is shared with the new sections.

#### Scenario: Existing alias search still works
- **WHEN** a consumer filters existing Wiki entries with query `"santos"` or `"cereja descascada"`
- **THEN** the results are the same entries returned before this change
