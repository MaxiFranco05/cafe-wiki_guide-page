# Spec Delta

## Purpose

Provee el modelo de dominio Zod, el catálogo verificado de 19 recetas de extracción (6 recetas Estándar universales + 13 recetas de autor/clásicas fieles con proceso y notas destacadas), el motor de escalado multi-receta retrocompatible, la normalización automática de recetas personalizadas (`waterShare`, tiempos contiguos y `svgDirective`), la exportación/importación JSON validada entre usuarios y la persistencia CRUD en `storage.adapter.ts`.

## ADDED Requirements

### Requirement: Multi-Recipe and Custom Recipe Zod Schemas
The system SHALL define `BrewRecipeSchema`, `CatalogBrewRecipeSchema`, `CustomBrewRecipeSchema`, `CustomRecipeDraftSchema`, and `CustomRecipeExportEnvelopeSchema` in `src/domain/schemas/recipe.schema.ts`, enforcing contiguous phase timelines starting at zero, `waterShare` sum equal to `1.0` within `1e-6`, and matching intensity ratio keys for filter (`light | normal | strong`) vs. espresso (`ristretto | normale | lungo`).

#### Scenario: Valid catalog and custom recipes pass validation
- **WHEN** `BrewRecipeSchema.safeParse` evaluates a standard/author recipe with i18n keys or a custom user recipe with user-authored title, process summary, and phases summing to `1.0`
- **THEN** validation succeeds and returns the strongly typed `BrewRecipe` discriminated by `kind`

#### Scenario: Invalid waterShare sum, timeline gap, or espresso/filter ratio mismatch is rejected
- **WHEN** `BrewRecipeSchema.safeParse` receives phases whose `waterShare` sum deviates from `1.0`, non-contiguous phase timestamps, or filter intensity ratios assigned to `espresso`
- **THEN** validation fails with a path-specific Zod issue

### Requirement: Verified 19-Recipe Extraction Catalog
The system SHALL provide a frozen static catalog in `src/data/recipes/` containing 19 validated recipes across all 6 brewing methods: exactly 1 default universal recipe (`kind: "standard"`, `isDefault: true`) per method plus 13 verified author/classic recipes whose phases, ratios, water temperatures, and durations faithfully match documented techniques without false author attributions.

#### Scenario: Every brewing method has one default standard recipe and verified author/classic recipes
- **WHEN** `RECIPES_CATALOG` and `getRecipesByMethod(methodId)` are queried for `v60`, `chemex`, `melitta`, `aeropress`, `french-press`, and `espresso`
- **THEN** every method returns exactly one `standard` default recipe plus its verified author/classic recipes (totaling 19 recipes with unique IDs), and all catalog recipes pass `CatalogBrewRecipeSchema.safeParse`

#### Scenario: Verified author recipes preserve faithful documented parameters
- **WHEN** inspecting `v60-hoffmann-1cup`, `v60-kasuya-4-6`, `v60-scott-rao`, `chemex-hoffmann`, `aeropress-hoffmann-ultimate`, `aeropress-alan-adler`, `french-press-hoffmann`, and `espresso-turbo-shot`
- **THEN** each recipe exposes its verified phases, water shares, durations, ratios, and temperature overrides (e.g., 5 equal 20% pours for Kasuya 4:6 at 92 °C, 80 °C fast brew for Alan Adler, and 5-minute crust-settling phase for Hoffmann French Press)

### Requirement: Localized Recipe Dictionary with Process and Flavor Metadata
The system SHALL provide `src/i18n/locales/es/recipes.json` merged into `src/i18n/index.ts` (`RN-I18N-01`) resolving every catalog recipe's `titleKey`, `processSummaryKey`, `flavorHighlightKey`, `grindNoteKey`, and phase keys to non-empty Spanish strings free of emojis, with `{{waterGrams}}` and `{{cumulativeWaterGrams}}` interpolation support.

#### Scenario: Every catalog recipe translation key resolves cleanly in Spanish
- **WHEN** `t(key)` is invoked for every i18n key referenced across all 19 recipes in `RECIPES_CATALOG`
- **THEN** every key resolves to a non-empty Spanish string distinct from the raw key path and containing zero emoji characters

### Requirement: Backward-Compatible Multi-Recipe Scaling Engine
The system SHALL extend `calculateScaledRecipe(method, profileId, input?, recipe?)` so existing 3-argument callers continue scaling the method's standard recipe with zero breaking changes, while 4-argument callers scale any catalog or custom `BrewRecipe` using its intensity ratio, phases, total duration, and temperature override (falling back to `method.waterTempCelsius`).

#### Scenario: Existing 3-argument calls remain backward compatible
- **WHEN** `calculateScaledRecipe(method, "normal", { coffeeGrams: 18 })` is called without a `recipe` argument
- **THEN** the engine resolves the method's default standard recipe and returns exact scaled water grams, reconciled phase weights, and fixed timestamps

#### Scenario: Scaling an author or custom recipe applies its own phases, ratio, and temperature
- **WHEN** `calculateScaledRecipe(v60Method, "normal", { coffeeGrams: 20 }, kasuyaRecipe)` is called
- **THEN** the result uses Kasuya's `1:15` ratio (`300 ml`), 5 equal pours (`60 g` each), `210 s` total duration, `92 °C` temperature override, and returns `recipeId: "v60-kasuya-4-6"`

### Requirement: Custom Recipe Auto-Normalization and SVG Derivation
The system SHALL provide pure functions `buildCustomRecipe(draft, method)` and `duplicateRecipeAsDraft(recipe, newTitle)` in `src/domain/brewing/custom-recipe.engine.ts` that compute normalized `waterShare` (summing to `1.0` from either absolute water amounts or relative shares), chain contiguous `startTimeSeconds`/`endTimeSeconds` from per-phase durations, and derive valid `svgDirective` objects matching `method.id` and phase type.

#### Scenario: User enters absolute water milliliters and per-phase durations
- **WHEN** `buildCustomRecipe` receives a draft for `v60` with phases `[Bloom: 45s, 50ml], [Pour 1: 60s, 120ml], [Pour 2: 45s, 80ml], [Drawdown: 30s, 0ml]`
- **THEN** it produces a valid `CustomBrewRecipe` with contiguous timestamps (`0–45`, `45–105`, `105–150`, `150–180`), `totalDurationSeconds: 180`, `waterShare` values (`0.2`, `0.48`, `0.32`, `0`) summing to `1.0`, and `cone_v60` SVG directives with progressive fill ratios

#### Scenario: Duplicating a catalog recipe creates an editable custom draft
- **WHEN** `duplicateRecipeAsDraft(hoffmannV60, "Mi V60 Diario")` is called
- **THEN** it returns a valid `CustomRecipeDraft` prefilled with the source recipe's method, ratios, temperature, and phase durations/shares ready to modify and build

### Requirement: Validated Custom Recipe JSON Export and Import
The system SHALL provide pure functions `exportCustomRecipeJson(recipe)` and `importCustomRecipeJson(rawJson)` using a versioned envelope (`schemaVersion: 1`) so users can share or back up custom recipes without a backend, rejecting malformed JSON, unsupported schema versions, or schema-invalid payloads without throwing uncaught exceptions.

#### Scenario: Round-trip export and import preserves custom recipe fidelity
- **WHEN** a valid `CustomBrewRecipe` is exported with `exportCustomRecipeJson` and imported with `importCustomRecipeJson`
- **THEN** `importCustomRecipeJson` returns `{ ok: true, recipe }` with identical method, ratios, phases, and metadata

#### Scenario: Corrupt JSON or invalid payload returns structured error
- **WHEN** `importCustomRecipeJson` receives malformed JSON, an unsupported `schemaVersion`, or phases whose `waterShare` does not sum to `1.0`
- **THEN** it returns `{ ok: false, errorCode, issues }` without throwing

### Requirement: Local Persistence CRUD for Custom Recipes and Selected Recipe
The system SHALL extend `StorageAdapter` and `UserPreferencesSchema` in `src/adapters/storage.adapter.ts` backward-compatibly with `customRecipes` (defaulting to `[]`) and optional `selectedRecipeId` per method config, exposing `getCustomRecipes(methodId?)`, `saveCustomRecipe(recipe)`, and `deleteCustomRecipe(recipeId)` with safe in-memory fallback on storage errors.

#### Scenario: Existing v1 stored preferences without customRecipes load seamlessly
- **WHEN** `createStorageAdapter` reads legacy preferences JSON containing only `muted`, `theme`, and `methodConfigs`
- **THEN** validation succeeds with `customRecipes: []` and preserves all existing method configurations

#### Scenario: Saving, updating, filtering, and deleting custom recipes persists safely
- **WHEN** a user saves a custom recipe via `saveCustomRecipe`, updates it with the same `id`, queries `getCustomRecipes("v60")`, and deletes it via `deleteCustomRecipe(id)`
- **THEN** state updates immutably in storage and in-memory fallback without mutating returned snapshots
