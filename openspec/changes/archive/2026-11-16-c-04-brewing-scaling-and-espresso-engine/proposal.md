# Proposal

## Why

Con los esquemas Zod (`BrewMethod`, `RecipeProfile`, `BrewPhase`, `RangeThreshold`) y el catálogo estático de los 6 métodos de extracción ya establecidos en `C-02`, la aplicación necesita el núcleo matemático puro (`Functional Core`) que transforme entradas dinámicas del usuario (gramos de café o mililitros de agua) en recetas ejecutables, rendimientos en taza para Espresso, validaciones de límites físicos de cada cafetera y recomendaciones dinámicas de molienda antes de construir la interfaz interactiva de la Estación de Preparación (`C-05`).

## What Changes

- **Motor de escalado bidireccional y distribución por fases (`src/domain/brewing/scaling.engine.ts`)**:
  - Implementar `calculateScaledRecipe(method, profileId, input: { coffeeGrams?: number; waterMl?: number })`:
    - Escalado bidireccional proporcional (`RN-BR-01`): cálculo de agua total a partir de café (`waterMl = Math.round(coffeeGrams * ratio)`, entero de `1 ml`) y cálculo de café a partir de agua (`coffeeGrams = roundToOneDecimal(waterMl / ratio)`, precisión de `0.1 g`).
    - Distribución de agua por fase y reconciliación de redondeo (`RN-BR-02`): cálculo de `phaseWaterGrams` y `targetCumulativeGrams` para cada `BrewPhase`, ajustando cualquier deriva de redondeo de `±1 g` en la última fase con vertido (`waterShare > 0`) para garantizar la invariante exacta `sum(phaseWaterGrams) === totalWaterMl`.
    - Conservación estricta de tiempos (`RN-BR-03`, `DD-02` Opción A): preservación inmutable de `startTimeSeconds`, `endTimeSeconds` y `totalDurationSeconds` sin alteración al variar la dosis.
  - Implementar `calculateEspressoStyles(method, doseGrams)`:
    - Cálculo simultáneo de los 3 estilos clásicos por rendimiento en taza (*yield*) a partir de una única dosis de café seco (`RN-BR-06`, `DD-03`): **Ristretto** (`1:1.5`, ventana objetivo `20–25 s`), **Normale** (`1:2.0`, ventana objetivo `25–30 s`) y **Lungo** (`1:3.0`, ventana objetivo `30–35 s`), incluyendo `yieldGrams`, `targetWindowSeconds`, `totalDurationSeconds` y las fases escaladas.
  - Implementar `estimateTablespoons(coffeeGrams)`:
    - Conversión orientativa a cucharadas soperas colmadas (`SU-01`, base estándar calibrada de `7.5 g` por cucharada sopera, redondeada a `0.5` o `0.1` cucharadas para referencia visual sin balanza).
- **Validador de umbrales físicos y resolución de molienda (`src/domain/thresholds/threshold.validator.ts`)**:
  - Implementar `evaluateRangeThresholds(thresholds, coffeeGrams, waterMl?)`:
    - Evaluación pura de límites operativos por método (`RN-RG-01`, `RN-RG-02`, `RN-RG-03`) retornando estado discriminado `"ok" | "below_min" | "above_max" | "invalid_input"` junto con las claves de diccionario i18n correspondientes (`belowMinKey`, `aboveMaxKey` o clave de entrada inválida para valores `<= 0`, `NaN` o no finitos) sin bloquear el cálculo cuando está fuera del rango físico normal.
  - Implementar `resolveGrindTip(method, coffeeGrams)`:
    - Resolución dinámica de consejo de molienda según la altura de cama de café y la Ley de Darcy (`RN-BR-04`), indicando molienda más fina si `coffeeGrams < smallDoseGrindTipThresholdGrams`, más gruesa si `coffeeGrams > largeDoseGrindTipThresholdGrams` o molienda base estándar (`method.baseGrindKey`) dentro del rango medio, siempre mediante claves i18n (`RN-I18N-01`).
- **Diccionario i18n y suite de pruebas unitarias TDD (`src/domain/__tests__/`)**:
  - Incorporar claves i18n faltantes en `src/i18n/locales/es/` para consejos dinámicos de molienda y validación de entradas inválidas.
  - Cobertura unitaria exhaustiva al 100% con Vitest bajo **Strict TDD Mode** verificando los 5 métodos de filtro/inmersión, modo Espresso, invariante de suma de fases sin deriva, bordes exactos de `RN-RG-03` y rechazo de valores `<= 0` o `NaN`.

## Capabilities

### New Capabilities
- `brewing-scaling-and-espresso-engine`: Motor funcional puro de escalado bidireccional café/agua, distribución de agua por fase sin deriva de redondeo, cálculo simultáneo de los 3 estilos de Espresso por *yield*, equivalencia en cucharadas soperas, evaluación de umbrales físicos (`RangeThreshold`) y recomendación dinámica de molienda.

### Modified Capabilities
<!-- No existing spec requirements are modified by this change. -->

## Impact

- **Código nuevo**:
  - `src/domain/brewing/scaling.engine.ts`
  - `src/domain/thresholds/threshold.validator.ts`
  - `src/domain/index.ts` (o re-exportación limpia de barriles de dominio si aplica)
  - `src/domain/__tests__/scaling.engine.test.ts`
  - `src/domain/__tests__/threshold.validator.test.ts`
- **Archivos actualizados**:
  - `src/i18n/locales/es/methods.json` / `src/i18n/locales/es/ui.json` (claves de diccionario para tips dinámicos de molienda y error de entrada inválida, respetando `RN-I18N-01`).
- **Arquitectura y fronteras**:
  - 100% *Functional Core* en `src/domain/`: cero importaciones de `react`, DOM, `window` o `navigator`.
  - Habilita directamente `C-05` (`brew-station-calculator-ui`) y `C-07` (`live-brew-timer-and-wake-lock`).
