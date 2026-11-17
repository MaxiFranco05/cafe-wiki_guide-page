# Tasks

## 1. Claves de Diccionario i18n para Umbrales y Molienda (`RN-I18N-01`)

- [x] 1.1 Agregar las claves `brew.warnings.invalidInput`, `brew.grindTips.finer`, `brew.grindTips.coarser` y `brew.grindTips.standard` en `src/i18n/locales/es/ui.json` (sin emojis ni strings hardcodeados en el motor) y verificar que `npm test` mantiene verde la suite existente de `i18n`.

## 2. Validador de Umbrales Físicos y Tip Dinámico de Molienda (`src/domain/thresholds/threshold.validator.ts`)

- [x] 2.1 **[TDD RED]** Crear `src/domain/__tests__/threshold.validator.test.ts` con tests que fallen inicialmente para `evaluateRangeThresholds` (`"ok" | "below_min" | "above_max" | "invalid_input"`, rechazo de `<= 0`, `NaN` e `Infinity` según `RN-RG-02`) y `resolveGrindTip` (`"finer" | "standard" | "coarser"` según `RN-BR-04`), verificando que Vitest reporte el fallo esperado al no existir la implementación.
- [x] 2.2 **[TDD GREEN]** Implementar `evaluateRangeThresholds` y `resolveGrindTip` junto con sus interfaces (`ThresholdStatus`, `ThresholdEvaluationResult`, `GrindTipAdjustment`, `GrindTipResult`) en `src/domain/thresholds/threshold.validator.ts` sin importar `react`/DOM/`window`, y verificar que los tests iniciales pasen con `npx vitest run src/domain/__tests__/threshold.validator.test.ts`.
- [x] 2.3 **[TDD TRIANGULATE & REFACTOR]** Ampliar `src/domain/__tests__/threshold.validator.test.ts` cubriendo los bordes exactos de los 6 métodos de `RN-RG-03` (`V60 10–36 g / 150–600 ml`, `Chemex 20–55 g / 300–900 ml`, `Melitta 10–35 g / 150–550 ml`, `AeroPress 11–30 g / 150–260 ml`, `Prensa Francesa 12–65 g / 180–1000 ml`, `Espresso 14–22 g` sin `waterMl`), la existencia de todas las claves i18n devueltas en `esDictionary` y contratos de tipos con `expectTypeOf`, verificando que toda la suite pase sin mutar los objetos de entrada.

## 3. Motor de Escalado Bidireccional y Reconciliación por Fases (`src/domain/brewing/scaling.engine.ts`)

- [x] 3.1 **[TDD RED]** Crear `src/domain/__tests__/scaling.engine.test.ts` con tests que fallen inicialmente para `estimateTablespoons` (`SU-01`) y `calculateScaledRecipe` (escalado `coffeeGrams -> waterMl` y `waterMl -> coffeeGrams` según `RN-BR-01`, reconciliación de redondeo `±1 g` en el último vertido según `RN-BR-02` e inmutabilidad de tiempos `startTimeSeconds`/`endTimeSeconds` según `RN-BR-03`), verificando el fallo inicial en Vitest.
- [x] 3.2 **[TDD GREEN]** Implementar `estimateTablespoons`, `roundToOneDecimal` y `calculateScaledRecipe` en `src/domain/brewing/scaling.engine.ts` integrando `evaluateRangeThresholds` y `resolveGrindTip`, y verificar que los tests de `scaling.engine.test.ts` pasen en verde.
- [x] 3.3 **[TDD TRIANGULATE & REFACTOR]** Triangulizar `src/domain/__tests__/scaling.engine.test.ts` probando los 5 métodos de filtro/inmersión (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`) en sus 3 perfiles (`light`, `normal`, `strong`), dosis impares/extremas que fuercen deriva de redondeo (garantizando `sum(phaseWaterGrams) === totalWaterMl`), entradas inválidas (`0`, `-5`, `NaN`) y preservación de `Object.isFrozen` sobre el catálogo.

## 4. Motor Simultáneo de Espresso por Yield (`RN-BR-06`, `DD-03`)

- [x] 4.1 **[TDD RED]** Agregar en `src/domain/__tests__/scaling.engine.test.ts` tests que fallen inicialmente para `calculateEspressoStyles(espressoMethod, doseGrams)` verificando el cálculo simultáneo de `ristretto` (`1:1.5`, `20–25 s`), `normale` (`1:2.0`, `25–30 s`) y `lungo` (`1:3.0`, `30–35 s`) con `18 g` (`27 g`, `36 g`, `54 g`) y dosis con decimales (`17 g` → `25.5 g`, `34 g`, `51 g`).
- [x] 4.2 **[TDD GREEN]** Implementar `calculateEspressoStyles` en `src/domain/brewing/scaling.engine.ts` devolviendo los 3 `EspressoStyleResult` con sus ventanas objetivo y fases escaladas, y verificar que `npx vitest run src/domain/__tests__/scaling.engine.test.ts` pase al 100%.
- [x] 4.3 **[TDD TRIANGULATE & REFACTOR]** Refactorizar utilidades numéricas compartidas en `src/domain/brewing/scaling.engine.ts`, re-exportar los módulos públicos de dominio y verificar que ningún archivo en `src/domain/` importe `react`, `window`, `document` ni `navigator` ejecutando `npm test` y `npm run build` con 0 errores.

## Workflow follow-up

- Archivar el change (`openspec-archive-change`) una vez completadas y verificadas todas las tareas de implementación, y marcar `[x]` en `CHANGES.md` para `C-04`.
