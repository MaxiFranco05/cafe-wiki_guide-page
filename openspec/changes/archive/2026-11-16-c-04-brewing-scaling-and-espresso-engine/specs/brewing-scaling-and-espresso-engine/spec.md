# Spec Delta

## Purpose

Provee el núcleo matemático funcional puro (`Functional Core`) para el escalado bidireccional entre café y agua en métodos de filtro e inmersión, la distribución exacta de agua por fase sin deriva de redondeo, el cálculo simultáneo de los 3 estilos de Espresso por rendimiento en taza (*yield*), la estimación orientativa en cucharadas soperas, la evaluación no bloqueante de límites físicos (`RangeThreshold`) y la recomendación dinámica de molienda según la dosis.

## ADDED Requirements

### Requirement: Bidirectional Proportional Scaling
El motor de preparación MUST escalar proporcionalmente entre gramos de café seco (`coffeeGrams`) y mililitros de agua (`waterMl`) según el `ratio` del perfil activo en los métodos de filtro e inmersión (`RN-BR-01`), redondeando el agua total al entero más cercano (`1 ml`) y la dosis de café a un decimal (`0.1 g`).

#### Scenario: Calculate total water from dry coffee dose
- **WHEN** se invoca `calculateScaledRecipe` para el método `v60` en el perfil `"normal"` (`ratio: 16.67`) con `{ coffeeGrams: 22 }`
- **THEN** el resultado retorna `coffeeGrams: 22` y `totalWaterMl: 367` (`Math.round(22 * 16.67)`)
- **AND** si no se especifica ni `coffeeGrams` ni `waterMl`, utiliza `method.defaultDoseGrams` (`15 g` → `250 ml` en V60 normal)

#### Scenario: Calculate dry coffee dose from total water volume
- **WHEN** se invoca `calculateScaledRecipe` para un método de filtro o inmersión con `{ waterMl: 367 }` y `ratio: 16.67`
- **THEN** el resultado recalcula `coffeeGrams: 22.0` (`round(367 / 16.67, 1)`) y conserva `totalWaterMl: 367`
- **AND** para `{ waterMl: 250 }` en ratio `16.0` (ej. Chemex normal), recalcula `coffeeGrams: 15.6` (`round(250 / 16.0, 1)`)

---

### Requirement: Phase Water Distribution and Rounding Reconciliation
Al escalar una receta, el motor SHALL calcular `phaseWaterGrams` y `targetCumulativeGrams` para cada fase multiplicando el agua o rendimiento total por `waterShare`, reconciliando cualquier diferencia de redondeo de `±1 g` en la última fase con vertido (`waterShare > 0`) para que la suma de `phaseWaterGrams` coincida exactamente con el total (`RN-BR-02`).

#### Scenario: Distribute phase water and reconcile rounding drift on final pour
- **WHEN** se escala una receta cuyo `totalWaterMl` (ej. `333 ml` o `367 ml`) produce una diferencia de `±1 g` al redondear individualmente `Math.round(totalWaterMl * phase.waterShare)` en cada fase con `waterShare > 0`
- **THEN** la última fase con `waterShare > 0` absorbe la diferencia de redondeo de modo que la suma de `phaseWaterGrams` de todas las fases sea exactamente igual a `totalWaterMl`
- **AND** las fases posteriores sin vertido (`waterShare === 0`, como `drawdown`, `steep` o `plunge`) mantienen `phaseWaterGrams: 0` y `targetCumulativeGrams: totalWaterMl`

---

### Requirement: Fixed Phase Timeline Stability
El motor de escalado MUST preservar inmutables los tiempos `startTimeSeconds`, `endTimeSeconds` de cada fase y `totalDurationSeconds` del perfil seleccionado sin importar cuánto se escale la dosis de café o el volumen de agua (`RN-BR-03`, `DD-02`).

#### Scenario: Phase timestamps remain unchanged across extreme doses
- **WHEN** se invoca `calculateScaledRecipe` en `v60` (`normal`) con `{ coffeeGrams: 12 }` y luego con `{ coffeeGrams: 32 }`
- **THEN** ambas recetas escaladas conservan exactamente los mismos `startTimeSeconds` (`0`, `45`, `120`, `165`), `endTimeSeconds` (`45`, `120`, `165`, `210`) y `totalDurationSeconds` (`210`) que la receta base del catálogo

---

### Requirement: Simultaneous Three-Style Espresso Yield Calculation
Para el modo `espresso_yield_ratio`, el motor SHALL calcular simultáneamente a partir de una dosis única de café seco (`doseGrams`) los 3 estilos estándar por rendimiento en taza (`RN-BR-06`, `DD-03`): Ristretto (`1:1.5`, ventana `20–25 s`), Normale (`1:2.0`, ventana `25–30 s`) y Lungo (`1:3.0`, ventana `30–35 s`).

#### Scenario: Calculate Ristretto, Normale, and Lungo yields for an 18 g dose
- **WHEN** se invoca `calculateEspressoStyles` con el método `espresso` y `doseGrams: 18`
- **THEN** retorna los 3 estilos calculados en simultáneo:
  - `ristretto`: `ratio: 1.5`, `yieldGrams: 27` (`18 * 1.5`), `targetWindowSeconds: { min: 20, max: 25 }`
  - `normale`: `ratio: 2.0`, `yieldGrams: 36` (`18 * 2.0`), `targetWindowSeconds: { min: 25, max: 30 }`
  - `lungo`: `ratio: 3.0`, `yieldGrams: 54` (`18 * 3.0`), `targetWindowSeconds: { min: 30, max: 35 }`
- **AND** cada estilo incluye sus fases escaladas donde `targetCumulativeGrams` equivale a `yieldGrams` (redondeado a `0.1 g` cuando la dosis produce decimales, ej. `17 g * 1.5 = 25.5 g`)

---

### Requirement: Orientative Tablespoon Equivalence
El motor SHALL proveer el cálculo de equivalencia orientativa en cucharadas soperas colmadas a partir de los gramos de café seco (`SU-01`), utilizando una base calibrada de `7.5 g` por cucharada sopera y redondeando el resultado a un decimal (`0.1` cdas) para asistir a usuarios sin balanza digital.

#### Scenario: Estimate tablespoons from dry coffee grams
- **WHEN** se invoca `estimateTablespoons(15)`
- **THEN** retorna `2` (equivalente a `15 / 7.5 = 2.0` cucharadas soperas)
- **AND** cuando se invoca `estimateTablespoons(22)`, retorna `2.9` (`round(22 / 7.5, 1)`)

---

### Requirement: Non-Blocking Physical Threshold Evaluation
El validador de umbrales MUST evaluar las cantidades de café y agua frente al `RangeThreshold` del método (`RN-RG-01`, `RN-RG-02`, `RN-RG-03`), retornando `"invalid_input"` para valores `<= 0` o no finitos, `"below_min"` o `"above_max"` con su clave i18n sin bloquear el cálculo cuando excede el rango físico, y `"ok"` dentro del rango operativo.

#### Scenario: Reject non-positive or non-finite inputs
- **WHEN** se invoca `evaluateRangeThresholds` con `coffeeGrams <= 0`, `waterMl <= 0`, `NaN` o `Infinity`
- **THEN** retorna `status: "invalid_input"`, `isValidInput: false` y la clave de mensaje i18n de entrada inválida (`RN-RG-02`)

#### Scenario: Trigger non-blocking warning below minimum or above maximum thresholds
- **WHEN** se evalúa `v60` (`minCoffeeGrams: 10`, `maxCoffeeGrams: 36`, `minWaterMl: 150`, `maxWaterMl: 600`) con `coffeeGrams: 9.9` o `waterMl: 149`
- **THEN** retorna `status: "below_min"`, `isValidInput: true` y `warningKey: "methods.v60.warnings.belowMin"`
- **AND** cuando se evalúa con `coffeeGrams: 36.1` o `waterMl: 601`, retorna `status: "above_max"`, `isValidInput: true` y `warningKey: "methods.v60.warnings.aboveMax"`

#### Scenario: Exact boundary values are accepted as normal operating range
- **WHEN** se evalúan los bordes exactos de cualquiera de los 6 métodos de `RN-RG-03` (ej. `10 g / 150 ml` o `36 g / 600 ml` en V60, y `14 g` o `22 g` sin `waterMl` en Espresso)
- **THEN** `evaluateRangeThresholds` retorna `status: "ok"`, `isValidInput: true` y `warningKey: null`

---

### Requirement: Dynamic Grind Size Recommendation
El sistema SHALL resolver dinámicamente la clave i18n de recomendación de molienda según la dosis de café seco y los umbrales de cama hidráulica del método (`RN-BR-04`), indicando molienda más fina debajo de `smallDoseGrindTipThresholdGrams`, más gruesa encima de `largeDoseGrindTipThresholdGrams` y molienda base estándar en el rango medio.

#### Scenario: Resolve finer, standard, or coarser grind tip by dose
- **WHEN** se invoca `resolveGrindTip` para `v60` (`smallDoseGrindTipThresholdGrams: 12`, `largeDoseGrindTipThresholdGrams: 30`)
- **THEN** con `11.5 g` (`< 12 g`) retorna `adjustment: "finer"` y la clave i18n del tip de dosis pequeña
- **AND** con `15 g` (`12 g <= D <= 30 g`) retorna `adjustment: "standard"` y `tipKey: "methods.v60.baseGrind"`
- **AND** con `31 g` (`> 30 g`) retorna `adjustment: "coarser"` y la clave i18n del tip de dosis grande

---

### Requirement: Pure Functional Core Isolation and Localization Keys
Todo el motor de escalado y validación en `src/domain/` MUST implementarse como funciones puras deterministas sin importar `react`, el DOM, `window` ni `navigator`, y MUST retornar únicamente claves de diccionario i18n sin textos visibles hardcodeados (`RN-I18N-01`).

#### Scenario: Domain engine executes in a pure Node environment without browser globals
- **WHEN** se importan y ejecutan `scaling.engine.ts` y `threshold.validator.ts` en entorno Vitest `node`
- **THEN** ninguna función accede a APIs del navegador ni muta los objetos `BrewMethod` o `RecipeProfile` de entrada (`Object.isFrozen` / inmutabilidad preservada)
- **AND** todas las claves devueltas (`warningKey`, `tipKey`, `baseGrindKey`) existen en el diccionario `esDictionary` de `src/i18n`
