# Design: Core Schemas and Methods Catalog

## Context

The application architecture follows the **Functional Core, Imperative Shell** pattern (`knowledge-base/08_arquitectura_propuesta.md`). The domain core (`src/domain/`) must be pure TypeScript without any UI or browser dependencies. The static catalog (`src/data/methods/`) serves as the single source of truth for method definitions, ratio configurations, physical limits, and procedural phase instructions.

In `C-01`, the foundational AppShell and basic i18n resolver (`src/i18n/index.ts` loading `src/i18n/locales/es/ui.json`) were established. In `ui.json`, top-level UI strings exist, including high-level card labels under `"methods"` (`methods.ratioLabel`, `methods.v60.title`, etc.). `C-02` introduces the comprehensive domain catalog schemas, calibrated seed data for all 6 MVP methods (18 recipes total), and localized method details in `src/i18n/locales/es/methods.json`.

## Goals / Non-Goals

**Goals:**
- Define type-safe Zod schemas in `src/domain/schemas/brewing.schema.ts` for all 5 core preparation entities (`BrewMethod`, `RecipeProfile`, `BrewPhase`, `RangeThreshold`, `SvgStageDirective`).
- Implement compile/test-time mathematical invariants via `.superRefine()`:
  - Default dose within equipment physical range `[minCoffeeGrams, maxCoffeeGrams]`.
  - Water share across pour phases in filter/immersion profiles summing strictly to `1.0` (with `1e-6` floating-point tolerance).
  - Contiguous phase timelines (`startTimeSeconds` of phase $i+1$ equals `endTimeSeconds` of phase $i$) starting at 0 and matching `totalDurationSeconds`.
  - Profile taxonomy and count validation (exactly 3 profiles per method: `light`/`normal`/`strong` for filter/immersion, `ristretto`/`normale`/`lungo` for espresso).
- Calibrate the static catalog in `src/data/methods/` with real physical parameters (`RN-RG-03`) and professional recipes (James Hoffmann, Tetsu Kasuya, SCA standards) for 6 MVP methods (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`).
- Localize all catalog strings in `src/i18n/locales/es/methods.json` with interpolable step placeholders (`{waterGrams}`, `{cumulativeWaterGrams}`).
- Integrate `methods.json` into `src/i18n/index.ts` using recursive deep dictionary merging to preserve existing `ui.json` keys without collisions.
- Maintain 100% domain purity: 0 imports of `react`, DOM, `window`, or `navigator` in `src/domain/` and `src/data/`.

**Non-Goals:**
- UI components, method selector cards, or calculators (deferred to `C-03` and `C-04`).
- Mathematical scaling functions or timer runtime state machine (deferred to `C-04` and `C-05`).
- Sensory Wiki entries or SCA Flavor Wheel hierarchy (deferred to `C-08` and `C-09`).
- User profile creation, recipe customization, or backend persistence.

## Decisions

### 1. Schema-First Static Catalog with Zod SuperRefine
- **Choice**: Model all domain entities with Zod (`BrewMethodSchema`, `RecipeProfileSchema`, etc.) and enforce business constraints (`RN-I18N-02`) at the schema boundary using `.superRefine()`.
- **Alternatives Considered**:
  - *TypeScript interfaces only*: Lacks runtime verification during test/build; invalid hand-authored JSON/TS catalog data could slip into production.
  - *Custom validation functions*: Reinvents validation logic and error path mapping already provided out-of-the-box by Zod.
- **Rationale**: Zod schemas generate both static TypeScript types (`z.infer<typeof BrewMethodSchema>`) and runtime validators that execute during `vitest` runs, guaranteeing catalog integrity before bundling.

### 2. Floating-Point Tolerance for Water Share Invariant
- **Choice**: Enforce $\left| \sum (\text{waterShare}) - 1.0 \right| < 10^{-6}$ for filter/immersion profiles.
- **Alternatives Considered**:
  - *Exact equality (`=== 1.0`)*: Binary floating-point arithmetic (e.g. `0.2 + 0.5 + 0.3 = 1.0000000000000002`) can cause false-positive test rejections.
  - *Integer percentages (`1..100`)*: Less convenient for downstream multiplication ($W \times \text{waterShare}$) in calculation engines.
- **Rationale**: A tolerance of $10^{-6}$ accounts for IEEE 754 precision while strictly catching any real recipe calibration errors.

### 3. Deep Dictionary Merging in i18n
- **Choice**: Implement a lightweight, pure recursive `deepMerge` in `src/i18n/index.ts` to merge `esUi` and `esMethods` into a unified locale dictionary.
- **Alternatives Considered**:
  - *Shallow merge (`{ ...esUi, ...esMethods }`)*: Would overwrite `esUi.methods` (which holds UI card labels like `methods.ratioLabel`) with `esMethods.methods`.
  - *Different top-level keys (`catalog.*`)*: Diverges from the domain entity naming (`methods.v60.*`).
  - *Heavy external library (`lodash.merge`)*: Unnecessary bundle bloat for a static client-side dictionary.
- **Rationale**: A 10-line pure recursive merge combines nested keys safely, ensuring both UI labels and catalog keys co-exist seamlessly under dot-notation resolution (`t('methods.ratioLabel')` and `t('methods.v60.name')`).

### 4. Template Interpolation Format
- **Choice**: Support `{paramKey}` (and tolerate `{{paramKey}}`) in `t(key, params)` for step instruction templates (e.g. `methods.v60.phases.bloom.instruction` using `{waterGrams}` and `{cumulativeWaterGrams}`).
- **Alternatives Considered**:
  - *`printf`-style `%s` / `%d`*: Non-descriptive, error-prone when ordering changes across languages.
  - *ES6 template literals in data*: Cannot be stored in static JSON dictionaries.
- **Rationale**: Aligning with `src/i18n/index.ts` `{paramKey}` syntax enables readable, self-documenting recipe templates in `es/methods.json`.

### 5. Modular File Organization for Methods
- **Choice**: Separate each method definition into its own file (`src/data/methods/v60.ts`, `chemex.ts`, etc.) and aggregate them in `src/data/methods/index.ts`.
- **Alternatives Considered**:
  - *Single 1,500-line `methods.ts` file*: Hard to review, higher risk of merge conflicts during parallel development.
- **Rationale**: Granular files keep method definitions under 200 lines each and allow clean imports and isolated unit tests.

## UI Mockups

- **Decision**: no (no UI)
- **Rationale**: Change `C-02` is strictly a domain schema, data catalog, and localization change (`src/domain/schemas/`, `src/data/methods/`, `src/i18n/locales/es/methods.json`). It contains no user interface, visual components, pages, or styling. In accordance with project policy and `CHANGES.md`, no UI mockups are required.

## Risks / Trade-offs

- **[Risk] High volume of recipe data in static bundle** → *Mitigation*: The 6 methods with 18 profiles total ~15 KB of uncompressed TypeScript/JSON. When bundled and gzipped by Vite, this adds < 4 KB to the bundle, well within mobile performance budgets.
- **[Risk] Typo in i18n keys leading to missing text at runtime** → *Mitigation*: Implement an automated cross-reference test in `src/domain/__tests__/methods.catalog.test.ts` that iterates through all `*Key` fields in the catalog and asserts that `t(key) !== key`.
- **[Risk] Espresso yield ratio vs. filter water ratio differences** → *Mitigation*: Espresso uses `scalingMode: "espresso_yield_ratio"` and sets `waterShare` relative to total beverage yield. Invariants discriminate on `scalingMode` to apply appropriate validation rules.
