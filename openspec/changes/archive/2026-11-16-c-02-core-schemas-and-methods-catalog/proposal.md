# Proposal: Core Schemas and Methods Catalog

## Why

To deliver accurate brewing calculations, reliable kitchen timers, and procedural visual guidance across the application, the domain core requires strict, validated data schemas and a calibrated static catalog for the 6 MVP brewing methods (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`). Establishing this schema-first foundation now prevents invalid recipes, broken ratios, and untyped text leaks before implementing the interactive method selector (`C-03`) and mathematical calculation engine (`C-04`).

## What Changes

- **Domain Schemas (`brewing.schema.ts`)**: Define Zod schemas (`BrewMethodSchema`, `RecipeProfileSchema`, `BrewPhaseSchema`, `RangeThresholdSchema`, `SvgStageDirectiveSchema`) with strict runtime and static TypeScript typing (`z.infer`).
- **Mathematical & Structural Invariants (`RN-I18N-02`)**: Enforce Zod `.superRefine()` validation ensuring:
  - `defaultDoseGrams` is strictly within `[thresholds.minCoffeeGrams, thresholds.maxCoffeeGrams]`.
  - The sum of `waterShare` across pour/water phases equals `1.0` (100%) within floating-point tolerance (`Math.abs(sum - 1.0) < 1e-6`) for all filter/immersion profiles.
  - Phase timelines are contiguous (`startTimeSeconds` of phase $i+1$ equals `endTimeSeconds` of phase $i$) and match `totalDurationSeconds`.
  - Every method defines exactly 3 calibrated profiles (`light`, `normal`, `strong` for filter/immersion; `ristretto`, `normale`, `lungo` for espresso).
- **Calibrated Static Catalog (`src/data/methods/`)**: Implement full static definitions for all 6 MVP methods (18 recipes total) with verified physical thresholds (`RangeThreshold`, `RN-RG-03`), dose-dependent grind guidance thresholds, and procedural SVG stage directives.
- **Localized Method Dictionary (`src/i18n/locales/es/methods.json`)**: Provide zero-hardcoded Spanish translations (`RN-I18N-01`) for all method names, profile descriptions, step instructions with interpolable placeholders (`{waterGrams}`, `{cumulativeWaterGrams}`), grind references, and physical limit warning messages.
- **Deep i18n Integration**: Integrate `methods.json` into `src/i18n/index.ts` via deep dictionary composition, preserving existing `ui.json` keys without collisions.
- **Automated Validation Suite**: Implement Vitest tests verifying 100% schema compliance of all 6 methods, rejection of invalid recipes (misaligned durations, invalid ratios, water share sums $\neq 1.0$), and 100% key resolution in `es/methods.json`.

## Capabilities

### New Capabilities
- `core-schemas-and-methods-catalog`: Zod domain schemas, compile/test-time invariants, physical operational thresholds, calibrated 6-method catalog (18 profiles), and complete Spanish localization with template interpolation.

### Modified Capabilities
<!-- None. Existing app-shell-and-foundation requirements remain intact. -->

## Impact

- **Affected Code / Paths**:
  - `src/domain/schemas/brewing.schema.ts` (new)
  - `src/domain/schemas/index.ts` (new)
  - `src/data/methods/v60.ts`, `chemex.ts`, `melitta.ts`, `aeropress.ts`, `french-press.ts`, `espresso.ts`, `index.ts` (new)
  - `src/i18n/locales/es/methods.json` (new)
  - `src/i18n/index.ts` (updated to merge `methods.json` deeply into translation dictionary)
  - `src/domain/__tests__/brewing.schema.test.ts` (new)
  - `src/domain/__tests__/methods.catalog.test.ts` (new)
- **Dependencies**: Uses `zod` (already installed `^3.23.8`), `vitest` (already installed `^2.1.8`). No external runtime or UI libraries added.
- **Domain Purity**: 0 imports of `react`, DOM, `window`, or `navigator` in `src/domain/` and `src/data/`.
