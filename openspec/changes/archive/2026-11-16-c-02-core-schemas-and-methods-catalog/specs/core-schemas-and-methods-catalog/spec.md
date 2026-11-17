# Spec Delta: Core Schemas and Methods Catalog

## Purpose

Provides strictly typed Zod domain schemas, compile/test-time mathematical invariants, physical operational thresholds, a calibrated static catalog for the 6 MVP brewing methods, and localized Spanish dictionaries.

## ADDED Requirements

### Requirement: Brewing Domain Schemas Definition
The system SHALL define Zod schemas (`BrewMethodSchema`, `RecipeProfileSchema`, `BrewPhaseSchema`, `RangeThresholdSchema`, `SvgStageDirectiveSchema`) in `src/domain/schemas/brewing.schema.ts` and export inferred TypeScript types.

#### Scenario: Valid method schema validation
- **WHEN** a valid brewing method object adhering to `BrewMethodSchema` is parsed with `safeParse`
- **THEN** the parse operation succeeds and returns the typed method object

#### Scenario: Rejection of invalid enumeration values
- **WHEN** an object with an invalid `category` (e.g. `"percolator"`) or invalid `scalingMode` is parsed
- **THEN** the schema validation fails with descriptive Zod issues

### Requirement: Method Dose Range Validation Invariant
The system SHALL enforce via Zod `.superRefine()` that `defaultDoseGrams` is greater than or equal to `thresholds.minCoffeeGrams` and less than or equal to `thresholds.maxCoffeeGrams`.

#### Scenario: Default dose within physical range
- **WHEN** a method definition has `defaultDoseGrams: 15`, `minCoffeeGrams: 10`, and `maxCoffeeGrams: 36`
- **THEN** the refinement validation passes without issues

#### Scenario: Default dose outside physical range
- **WHEN** a method definition specifies `defaultDoseGrams: 40` while `maxCoffeeGrams` is 36
- **THEN** the refinement fails with an error issue targeted at `defaultDoseGrams`

### Requirement: Filter Water Share Sum Invariant
The system SHALL enforce via Zod `.superRefine()` that the sum of `waterShare` across all phases of any filter or immersion recipe profile equals `1.0` within floating-point tolerance (`Math.abs(sum - 1.0) < 1e-6`).

#### Scenario: Balanced pour phases totaling 100 percent
- **WHEN** a filter profile defines phases with water shares `0.2`, `0.5`, and `0.3`
- **THEN** the water share summation refinement succeeds

#### Scenario: Unbalanced pour phases failing validation
- **WHEN** a filter profile defines phases whose water shares sum to `0.9` or `1.1`
- **THEN** the refinement validation fails with an issue indicating the water share discrepancy

### Requirement: Phase Timeline Contiguity Invariant
The system SHALL enforce via Zod `.superRefine()` that phase timelines are contiguous (phase $i+1$ `startTimeSeconds` equals phase $i$ `endTimeSeconds`) starting at zero, and the final `endTimeSeconds` equals `totalDurationSeconds`.

#### Scenario: Contiguous phase sequence matching duration
- **WHEN** a profile defines sequential phases spanning 0-45s, 45-120s, and 120-210s with `totalDurationSeconds: 210`
- **THEN** the timeline refinement validation passes

#### Scenario: Discontinuous phase gap or duration mismatch
- **WHEN** a profile defines a phase sequence with a time gap (e.g. 0-45s followed by 50-120s) or ending at 200s when `totalDurationSeconds: 210`
- **THEN** the timeline refinement fails with an issue pinpointing the timing inconsistency

### Requirement: Profile Count and Taxonomy Invariant
The system SHALL require that each method defines exactly 3 calibrated profiles using allowed taxonomy keys (`light`, `normal`, `strong` for filter/immersion; `ristretto`, `normale`, `lungo` for espresso).

#### Scenario: Method with three valid profile identifiers
- **WHEN** a filter method defines profiles with IDs `light`, `normal`, and `strong`
- **THEN** the profile taxonomy refinement passes

#### Scenario: Method with insufficient or non-conforming profile keys
- **WHEN** a method defines only 2 profiles or uses non-standard profile identifiers
- **THEN** the profile taxonomy refinement fails with an issue reporting invalid profile structure

### Requirement: Calibrated Six-Method Static Catalog
The system SHALL provide a static catalog in `src/data/methods/` containing full definitions for `v60`, `chemex`, `melitta`, `aeropress`, `french-press`, and `espresso` with calibrated profiles and physical `RangeThreshold` limits (`RN-RG-03`).

#### Scenario: Complete catalog export
- **WHEN** the static catalog index is loaded
- **THEN** it exports an array and record containing all 6 MVP methods with 18 total recipe profiles

#### Scenario: Range thresholds conform to physical equipment limits
- **WHEN** inspecting thresholds for V60, Chemex, Melitta, AeroPress, French Press, and Espresso
- **THEN** the coffee and water boundaries match the physical specifications defined in `RN-RG-03`

### Requirement: Localized Method Dictionary and Cross-Reference Integrity
The system SHALL provide a Spanish dictionary `src/i18n/locales/es/methods.json` containing all method names, profile descriptions, step instructions, and grind tips (`RN-I18N-01`), and all catalog keys SHALL resolve.

#### Scenario: Resolution of method name and phase keys
- **WHEN** translating catalog keys such as `methods.v60.name` or `methods.v60.phases.bloom.title`
- **THEN** the i18n resolver returns the non-empty localized Spanish string

#### Scenario: Step instruction template interpolation
- **WHEN** a phase instruction template contains `{waterGrams}` and `{cumulativeWaterGrams}` placeholders
- **THEN** the i18n interpolator replaces the placeholders with formatted numerical values

#### Scenario: Catalog key cross-reference verification
- **WHEN** every `nameKey`, `labelKey`, `descriptionKey`, `titleKey`, `instructionKey`, and `warningMessageKeys` in the catalog is checked against `es/methods.json`
- **THEN** 100% of the keys resolve without fallback to the raw key string

### Requirement: Domain and Data Module Architecture Purity
The domain schemas and data catalog modules SHALL NOT import or reference `react`, DOM APIs, `window`, or `navigator` (`RN-BR-*`, `DD-05`).

#### Scenario: Headless execution in Node environment
- **WHEN** the domain schemas and catalog files are executed in a Node.js test environment
- **THEN** all schemas, refinements, and catalog records evaluate without runtime DOM dependencies
