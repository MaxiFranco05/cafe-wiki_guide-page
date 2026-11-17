# Tasks: Core Schemas and Methods Catalog

## 1. Domain Schemas & Invariants (TDD Cycle)

- [x] 1.1 `[TDD RED]` Author failing test suite in `src/domain/__tests__/brewing.schema.test.ts` defining expected behavior and fixtures for `BrewMethodSchema`, `RecipeProfileSchema`, `BrewPhaseSchema`, `RangeThresholdSchema`, and `SvgStageDirectiveSchema`; verify tests fail with missing schema definitions by executing `npx vitest run src/domain/__tests__/brewing.schema.test.ts`.
- [x] 1.2 `[TDD GREEN]` Implement `RangeThresholdSchema`, `SvgStageDirectiveSchema`, `BrewPhaseSchema`, `RecipeProfileSchema`, and `BrewMethodSchema` with inferred TypeScript types (`z.infer`) in `src/domain/schemas/brewing.schema.ts` and barrel exports in `src/domain/schemas/index.ts`; verify basic schema parsing tests pass by executing `npx vitest run src/domain/__tests__/brewing.schema.test.ts`.
- [x] 1.3 `[TDD TRIANGULATE & REFACTOR]` Implement comprehensive `.superRefine()` rules and tests for: default dose in `[minCoffeeGrams, maxCoffeeGrams]`, filter `waterShare` sum equal to `1.0` (`1e-6` tolerance), contiguous phase timelines matching `totalDurationSeconds`, and 3-profile taxonomy; verify all invariant edge cases pass and refactor cleanly by executing `npx vitest run src/domain/__tests__/brewing.schema.test.ts`.

## 2. Spanish Localization & Deep i18n Integration (TDD Cycle)

- [x] 2.1 `[TDD RED]` Author failing test suite in `src/domain/__tests__/i18n.integration.test.ts` verifying that `t()` resolves catalog keys alongside existing `ui.json` keys, interpolates `{waterGrams}` and `{cumulativeWaterGrams}` placeholders, and preserves fallback behavior; verify tests fail prior to dictionary integration by executing `npx vitest run src/domain/__tests__/i18n.integration.test.ts`.
- [x] 2.2 `[TDD GREEN]` Author `src/i18n/locales/es/methods.json` containing complete Spanish translations for all 6 methods (names, descriptions, step instructions with `{waterGrams}` / `{cumulativeWaterGrams}`, grind references, warning messages) and update `src/i18n/index.ts` with pure recursive `deepMerge`; verify translation tests pass by executing `npx vitest run src/domain/__tests__/i18n.integration.test.ts`.
- [x] 2.3 `[TDD TRIANGULATE & REFACTOR]` Expand i18n tests to verify non-collision of existing `ui.json` keys (e.g. `methods.ratioLabel`, `methods.v60.title`), nested key resolution, and support for both `{key}` and `{{key}}` parameter syntax; verify tests pass by executing `npx vitest run src/domain/__tests__/i18n.integration.test.ts`.

## 3. Calibrated Methods Catalog (TDD Cycle)

- [x] 3.1 `[TDD RED]` Author failing test suite in `src/domain/__tests__/methods.catalog.test.ts` asserting that all 6 MVP methods (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`) and their 18 profiles conform to `BrewMethodSchema` and physical limits (`RN-RG-03`); verify tests fail due to missing catalog files by executing `npx vitest run src/domain/__tests__/methods.catalog.test.ts`.
- [x] 3.2 `[TDD GREEN]` Implement calibrated method definitions in `src/data/methods/v60.ts`, `chemex.ts`, `melitta.ts`, `aeropress.ts`, `french-press.ts`, and `espresso.ts` with 3 calibrated profiles each and `RangeThreshold` limits, aggregating them in `src/data/methods/index.ts`; verify schema validation passes for all 6 methods by executing `npx vitest run src/domain/__tests__/methods.catalog.test.ts`.
- [x] 3.3 `[TDD TRIANGULATE & REFACTOR]` Implement cross-reference validation in `src/domain/__tests__/methods.catalog.test.ts` verifying that 100% of `*Key` references in the catalog resolve in `es/methods.json`, and verify domain architecture purity (0 imports of `react`, DOM, `window`, `navigator` in `src/domain/` and `src/data/`); verify all tests pass by executing `npx vitest run src/domain/__tests__/methods.catalog.test.ts`.

## 4. Full Quality Gate & Verification

- [x] 4.1 Run full TypeScript compilation check with strict mode enabled (`npx tsc --noEmit`) and verify 0 type errors.
- [x] 4.2 Run complete project test suite (`npx vitest run`) and verify 100% tests passing across all domain, catalog, and UI integration test files.
