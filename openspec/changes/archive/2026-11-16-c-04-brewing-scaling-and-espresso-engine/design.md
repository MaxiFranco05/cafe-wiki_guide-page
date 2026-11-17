# Design

## Context

`C-02` estableció los esquemas Zod (`BrewMethod`, `RecipeProfile`, `BrewPhase`, `RangeThreshold`) en `src/domain/schemas/brewing.schema.ts` y el catálogo inmutable de los 6 métodos en `src/data/methods/`. Antes de construir la vista interactiva de la Estación de Preparación (`C-05`, `/brew/:methodSlug`), el sistema requiere el motor matemático puro (`Functional Core`) en `src/domain/brewing/scaling.engine.ts` y `src/domain/thresholds/threshold.validator.ts`. Véase `proposal.md` para la motivación completa y `specs/brewing-scaling-and-espresso-engine/spec.md` para el contrato de comportamiento.

Restricciones arquitectónicas clave (`AGENTS.md` y `knowledge-base/08_arquitectura_propuesta.md`):
- **Aislamiento de Núcleo Puro**: Ningún archivo bajo `src/domain/` puede importar `react`, el DOM, `window` ni `navigator`.
- **TypeScript Estricto**: Cero uso de `any`, `@ts-ignore` o aserciones inseguras (`as unknown as X`). Todos los retornos deben ser inmutables (`readonly`) y predecibles.
- **Desacoplamiento i18n (`RN-I18N-01`)**: El motor nunca emite cadenas de texto en español; retorna claves tipadas del diccionario (`src/i18n/locales/es/`).

## Goals / Non-Goals

**Goals:**
- Diseñar contratos TypeScript estrictos e inmutables para el resultado de recetas escaladas (`ScaledRecipeResult`, `ScaledBrewPhase`), los estilos de Espresso (`EspressoStyleResult`), la evaluación de umbrales (`ThresholdEvaluationResult`) y el tip dinámico de molienda (`GrindTipResult`).
- Garantizar exactitud aritmética en punto flotante IEEE 754 mediante funciones auxiliares deterministas de redondeo y reconciliación de la última fase con vertido (`waterShare > 0`).
- Mantener la ejecución 100% síncrona, sin efectos secundarios y verificable en entorno Vitest `node`.

**Non-Goals:**
- Construir componentes React, hooks de estado o vistas para `/brew/:methodSlug` (alcance de `C-05`).
- Implementar el reloj monotónico `performance.now()`, `Screen Wake Lock` o `Web Audio API` (alcance de `C-07`).
- Modificar los datos semilla calibrados del catálogo de los 6 métodos creados en `C-02`.

## UI Mockups

- **Decision**: no (no UI)
- **Justificación**: `C-04` implementa exclusivamente funciones matemáticas y validadores puros en `src/domain/` sin componentes visuales ni cambios de estilos.

## Decisions

### 1. Contratos de Tipos y Firmas Puras en `src/domain/brewing/scaling.engine.ts`

- **Decisión**: Exponer tipos explícitos con propiedades `readonly` e integración directa con `ThresholdEvaluationResult` y `GrindTipResult`:
  ```ts
  export interface ScalingInput {
    readonly coffeeGrams?: number;
    readonly waterMl?: number;
  }

  export interface ScaledBrewPhase extends BrewPhase {
    readonly phaseWaterGrams: number;
    readonly targetCumulativeGrams: number;
  }

  export interface ScaledRecipeResult {
    readonly methodId: BrewMethod['id'];
    readonly profileId: RecipeProfile['id'];
    readonly scalingMode: BrewMethod['scalingMode'];
    readonly ratio: number;
    readonly coffeeGrams: number;
    readonly totalWaterMl: number;
    readonly tablespoons: number;
    readonly totalDurationSeconds: number;
    readonly waterTempCelsius: BrewMethod['waterTempCelsius'];
    readonly phases: readonly ScaledBrewPhase[];
    readonly thresholdEvaluation: ThresholdEvaluationResult;
    readonly grindTip: GrindTipResult;
  }

  export interface EspressoTargetWindow {
    readonly min: number;
    readonly max: number;
  }

  export interface EspressoStyleResult {
    readonly profileId: 'ristretto' | 'normale' | 'lungo';
    readonly labelKey: string;
    readonly descriptionKey: string;
    readonly ratio: number;
    readonly doseGrams: number;
    readonly yieldGrams: number;
    readonly targetWindowSeconds: EspressoTargetWindow;
    readonly totalDurationSeconds: number;
    readonly phases: readonly ScaledBrewPhase[];
  }
  ```
- **Alternativas consideradas**:
  - *Devolver únicamente números sueltos y obligar a la UI a ensamblar fases, umbrales y molienda*: descartado porque duplica lógica de dominio en los componentes React (`C-05`) y dificulta el testeo integral del Flujo 1 (`knowledge-base/07_flujos_principales.md`).
- **Resolución de entrada en `calculateScaledRecipe(method, profileId, input?)`**:
  1. Seleccionar el `RecipeProfile` cuyo `id === profileId` (si no coincide, hacer fallback seguro al perfil `"normal"` o `"normale"` o al primer perfil del método).
  2. Si `input?.coffeeGrams !== undefined`, usar `coffeeGrams = roundToOneDecimal(input.coffeeGrams)` y calcular `totalWaterMl = Math.round(coffeeGrams * profile.ratio)` (o `roundToOneDecimal(coffeeGrams * profile.ratio)` cuando `scalingMode === 'espresso_yield_ratio'`).
  3. Si `input?.coffeeGrams === undefined` y `input?.waterMl !== undefined`, usar `totalWaterMl = Math.round(input.waterMl)` y calcular `coffeeGrams = roundToOneDecimal(totalWaterMl / profile.ratio)`.
  4. Si ambos están ausentes, usar `coffeeGrams = method.defaultDoseGrams` y calcular `totalWaterMl = Math.round(coffeeGrams * profile.ratio)`.
  5. Si el valor de entrada es inválido (`<= 0`, `NaN`, `!Number.isFinite`), `thresholdEvaluation` reporta `"invalid_input"` y las cantidades calculadas se sanean a `0` sin lanzar excepciones no controladas en tipeo intermedio de la UI.

### 2. Algoritmo de Distribución por Fase y Reconciliación de Redondeo (`RN-BR-02`)

- **Decisión**:
  - Identificar el índice de la última fase con vertido activo (`lastPourIndex`, donde `phase.waterShare > 0`).
  - Para métodos `filter_water_ratio`, cada fase con `waterShare > 0` previa a `lastPourIndex` recibe `Math.round(totalWaterMl * phase.waterShare)`.
  - La fase en `lastPourIndex` recibe exactamente `totalWaterMl - sumOfPreviousPourPhases`, absorbiendo cualquier diferencia de `±1 g` producida por el redondeo individual.
  - Para métodos `espresso_yield_ratio` (donde una dosis impar como `17 g` en Ristretto `1:1.5` produce `25.5 g` de *yield*), se preserva un decimal (`roundToOneDecimal`) de modo que `phaseWaterGrams` y `targetCumulativeGrams` sean `25.5 g`.
  - En todas las fases, `targetCumulativeGrams` es la suma acumulada de `phaseWaterGrams` desde la fase `0` hasta la fase `i` inclusive, manteniendo `phaseWaterGrams: 0` y el acumulado constante en fases de espera, agitación o drenaje (`waterShare === 0`).
- **Alternativas consideradas**:
  - *Redondear cada fase independientemente sin reconciliar el último vertido*: descartado porque viola `RN-BR-02` (por ejemplo, `333 ml` con shares `0.2 / 0.4 / 0.4` daría `67 + 133 + 133 = 333`, pero con `0.33 / 0.33 / 0.34` o `22 g` en ciertos perfiles puede derivar en `±1 g` respecto al total mostrado en el input superior).

### 3. Motor Simultáneo de Espresso por Yield (`RN-BR-06`, `DD-03`)

- **Decisión**: `calculateEspressoStyles(method, doseGrams)` toma el método `espresso` y la dosis de café seco (`doseGrams`, por defecto `method.defaultDoseGrams = 18`) y devuelve una tupla/arreglo inmutable con los 3 estilos en orden canónico (`ristretto`, `normale`, `lungo`):
  - `ristretto` (`ratio: 1.5`): `yieldGrams = roundToOneDecimal(doseGrams * 1.5)`, `targetWindowSeconds: { min: 20, max: 25 }`
  - `normale` (`ratio: 2.0`): `yieldGrams = roundToOneDecimal(doseGrams * 2.0)`, `targetWindowSeconds: { min: 25, max: 30 }`
  - `lungo` (`ratio: 3.0`): `yieldGrams = roundToOneDecimal(doseGrams * 3.0)`, `targetWindowSeconds: { min: 30, max: 35 }`
- **Justificación**: Cumple literalmente con `RN-BR-06` y el Flujo 3 de `07_flujos_principales.md`, entregando tanto la ventana objetivo de extracción (`20–25 s`, `25–30 s`, `30–35 s`) para las tarjetas `EspressoYieldCards` (`C-05`) como las `phases` escaladas para el temporizador en vivo (`C-07`).

### 4. Equivalencia en Cucharadas Soperas (`SU-01`)

- **Decisión**: Implementar `estimateTablespoons(coffeeGrams: number): number` usando la constante exportada `GRAMS_PER_TABLESPOON = 7.5` (punto medio del estándar de especialidad `7–8 g` por cucharada sopera colmada documentado en `SU-01`) y redondeando a 1 decimal (`roundToOneDecimal(coffeeGrams / GRAMS_PER_TABLESPOON)`). Para entradas `<= 0` o no finitas, retorna `0`.

### 5. Evaluación de Umbrales (`RN-RG-01..03`) y Tip Dinámico de Molienda (`RN-BR-04`) en `src/domain/thresholds/threshold.validator.ts`

- **Decisión**:
  - `evaluateRangeThresholds(thresholds: RangeThreshold, coffeeGrams: number, waterMl?: number): ThresholdEvaluationResult`:
    1. **Prioridad 1 (`invalid_input`)**: Si `!Number.isFinite(coffeeGrams) || coffeeGrams <= 0` o si `waterMl !== undefined && (!Number.isFinite(waterMl) || waterMl <= 0)`, retorna:
       `{ status: 'invalid_input', isValidInput: false, warningKey: 'brew.warnings.invalidInput', breachedReasons: [...] }`.
    2. **Prioridad 2 (`below_min`)**: Si `coffeeGrams < thresholds.minCoffeeGrams` o `(waterMl !== undefined && thresholds.minWaterMl !== undefined && waterMl < thresholds.minWaterMl)`, retorna:
       `{ status: 'below_min', isValidInput: true, warningKey: thresholds.warningMessageKeys.belowMinKey, breachedReasons: [...] }`.
    3. **Prioridad 3 (`above_max`)**: Si `coffeeGrams > thresholds.maxCoffeeGrams` o `(waterMl !== undefined && thresholds.maxWaterMl !== undefined && waterMl > thresholds.maxWaterMl)`, retorna:
       `{ status: 'above_max', isValidInput: true, warningKey: thresholds.warningMessageKeys.aboveMaxKey, breachedReasons: [...] }`.
    4. **Prioridad 4 (`ok`)**: Retorna `{ status: 'ok', isValidInput: true, warningKey: null, breachedReasons: [] }`.
  - `resolveGrindTip(method: Pick<BrewMethod, 'baseGrindKey' | 'thresholds'>, coffeeGrams: number): GrindTipResult`:
    - Si `coffeeGrams > 0 && coffeeGrams < method.thresholds.smallDoseGrindTipThresholdGrams`, retorna `{ adjustment: 'finer', tipKey: 'brew.grindTips.finer', baseGrindKey: method.baseGrindKey }`.
    - Si `coffeeGrams > method.thresholds.largeDoseGrindTipThresholdGrams`, retorna `{ adjustment: 'coarser', tipKey: 'brew.grindTips.coarser', baseGrindKey: method.baseGrindKey }`.
    - En cualquier otro caso (rango medio `[smallDoseGrindTipThresholdGrams, largeDoseGrindTipThresholdGrams]` o valor inválido), retorna `{ adjustment: 'standard', tipKey: method.baseGrindKey, baseGrindKey: method.baseGrindKey }`.

## Risks / Trade-offs

- **[Risk] Imprecisión de punto flotante en divisiones/multiplicaciones (ej. `18 * 1.5` o `367 / 16.67` generando `22.01559...`)** → **Mitigación**: Centralizar el redondeo en `roundToOneDecimal(value) = Math.round((value + Number.EPSILON) * 10) / 10` y validar la reciprocidad bidireccional (`café -> agua -> café`) en tests unitarios para los 5 métodos de filtro/inmersión.
- **[Risk] Conflicto cuando `coffeeGrams` está en rango pero `waterMl` excede el umbral (ej. perfil `light 1:17` cerca del borde máximo de café en V60 o AeroPress)** → **Mitigación**: `evaluateRangeThresholds` evalúa tanto `coffeeGrams` como `waterMl` (cuando `minWaterMl`/`maxWaterMl` están definidos en `RangeThreshold`) y expone `breachedReasons` (`'coffee_below_min' | 'coffee_above_max' | 'water_below_min' | 'water_above_max'`) para trazabilidad completa sin bloquear el cálculo (`RN-RG-01`).

## Migration Plan

1. Agregar las claves `brew.warnings.invalidInput`, `brew.grindTips.finer`, `brew.grindTips.coarser` y `brew.grindTips.standard` en `src/i18n/locales/es/ui.json`.
2. Implementar `src/domain/thresholds/threshold.validator.ts` y `src/domain/brewing/scaling.engine.ts` siguiendo el ciclo **Strict TDD** (`RED` → `GREEN` → `TRIANGULATE` → `REFACTOR`).
3. Ejecutar `npm test` y `npm run build` para verificar 0 errores de tipos y 100% de pasaje en Vitest.
