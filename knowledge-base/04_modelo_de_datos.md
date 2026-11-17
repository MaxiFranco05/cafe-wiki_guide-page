# Modelo de Datos

## Dominios

Aunque el sistema no utiliza una base de datos relacional en v1.0, posee un **modelo de dominio estrictamente tipado y validado con esquemas Zod** sobre archivos estáticos desacoplados:

1. **Preparación (`Brewing`)**: Define los métodos de extracción, sus límites físicos, perfiles de intensidad/ratio y la secuencia de fases temporales y mecánicas.
2. **Escena Procedural (`ProceduralScene`)**: Define las primitivas visuales SVG y los parámetros que el motor interpola en tiempo real según la fase y la dosis.
3. **Conocimiento y Cata (`Wiki & Sensory`)**: Define las fichas de orígenes, varietales, procesos de beneficio y los nodos jerárquicos de la rueda de sabores estilo SCA.
4. **Preferencias Locales (`UserPreferences`)**: Estado ligero persistido en `localStorage` para recordar los últimos valores elegidos por el usuario en su dispositivo.

## ERD (Entity Relationship Diagram)

```
┌──────────────────────┐       1 : N       ┌──────────────────────────┐
│      BrewMethod      │──────────────────▶│      RecipeProfile       │
│ (v60, espresso, ...) │                   │ (light, normal, strong / │
└──────────┬───────────┘                   │  ristretto, normale, ...)│
           │                               └────────────┬─────────────┘
           │ 1 : 1                                      │ 1 : N
           ▼                                            ▼
┌──────────────────────┐                   ┌──────────────────────────┐
│    RangeThreshold    │                   │        BrewPhase         │
│ (min/max coffee & ml)│                   │ (bloom, pour, stir, ...) │
└──────────────────────┘                   └────────────┬─────────────┘
                                                        │ 1 : 1
                                                        ▼
                                           ┌──────────────────────────┐
                                           │    SvgStageDirective     │
                                           │ (primitivas activas SVG) │
                                           └──────────────────────────┘

┌──────────────────────┐       N : M       ┌──────────────────────────┐
│      WikiEntry       │◀─────────────────▶│     FlavorWheelNode      │
│ (origen / varietal / │                   │ (jerarquía 3 niveles SCA)│
│  proceso)            │─────── N : M ────▶│  vinculada a BrewMethod  │
└──────────────────────┘                   └──────────────────────────┘
```

## Entidades

### 1. `BrewMethod` (Método de Preparación)
Representa cada una de las 6 cafeteras soportadas en el MVP.

- **Atributos**:
  - `id`: `string` (`"v60" | "chemex" | "melitta" | "aeropress" | "french-press" | "espresso"`)
  - `nameKey`: `string` (clave i18n, ej. `"methods.v60.name"`)
  - `category`: `"pour_over" | "immersion" | "hybrid" | "pressure"`
  - `scalingMode`: `"filter_water_ratio" | "espresso_yield_ratio"`
  - `defaultDoseGrams`: `number` (dosis inicial por defecto, ej. `15` en V60, `18` en Espresso)
  - `baseGrindKey`: `string` (clave i18n de referencia de molienda base, ej. media-fina, gruesa, fina)
  - `waterTempCelsius`: `{ min: number, max: number, recommended: number }`
  - `thresholds`: `RangeThreshold`
  - `profiles`: `RecipeProfile[]` (exactamente 3 perfiles por método)
- **Relaciones**:
  - `1:1` con `RangeThreshold`
  - `1:3` con `RecipeProfile`
- **Constraints**:
  - `defaultDoseGrams` debe estar dentro de `[thresholds.minCoffeeGrams, thresholds.maxCoffeeGrams]`.

### 2. `RangeThreshold` (Umbrales Físicos del Método)
Define los límites operativos normales para emitir advertencias cuando el usuario ingresa cantidades inusuales.

- **Atributos**:
  - `minCoffeeGrams`: `number` (ej. `10` g en V60, `14` g en filtro doble de Espresso)
  - `maxCoffeeGrams`: `number` (ej. `35` g en V60-02, `22` g en Espresso)
  - `minWaterMl`: `number` (opcional en Espresso; ej. `150` ml en V60)
  - `maxWaterMl`: `number` (opcional en Espresso; ej. `600` ml en V60-02)
  - `smallDoseGrindTipThresholdGrams`: `number` (umbral por debajo del cual se recomienda moler más fino)
  - `largeDoseGrindTipThresholdGrams`: `number` (umbral por encima del cual se recomienda moler más grueso)
  - `warningMessageKeys`: `{ belowMinKey: string, aboveMaxKey: string }`

### 3. `RecipeProfile` (Perfil de Intensidad / Estilo)
Define uno de los 3 niveles seleccionables por método.

- **Atributos**:
  - `id`: `"light" | "normal" | "strong"` (o `"ristretto" | "normale" | "lungo"` en Espresso)
  - `labelKey`: `string` (clave i18n)
  - `descriptionKey`: `string` (clave i18n del perfil en taza esperado)
  - `ratio`: `number` (multiplicador respecto a 1 g de café: ej. `15`, `16.67`, `18` en filtro; o `1.5`, `2.0`, `3.0` de *yield* en Espresso)
  - `referenceAuthor`: `string` (ej. `"James Hoffmann"`, `"Tetsu Kasuya"`, `"SCA Standard"`)
  - `totalDurationSeconds`: `number`
  - `phases`: `BrewPhase[]`
- **Constraints**:
  - La suma de `waterPercentage` de todas las `phases` de tipo vertido en un método de filtro debe ser exactamente `100` (`1.0`).
  - La suma de duraciones de `phases` debe coincidir con `totalDurationSeconds`.

### 4. `BrewPhase` (Fase del Temporizador)
Representa un paso discreto dentro de la línea de tiempo de preparación.

- **Atributos**:
  - `id`: `string`
  - `order`: `number` (`1..N`)
  - `type`: `"bloom" | "pour" | "wait" | "stir" | "swirl" | "plunge" | "drawdown" | "espresso_shot"`
  - `titleKey`: `string` (clave i18n, ej. `"phases.bloom.title"`)
  - `instructionKey`: `string` (clave i18n con placeholders interpolables `{{waterGrams}}`, `{{cumulativeWaterGrams}}`)
  - `startTimeSeconds`: `number`
  - `endTimeSeconds`: `number`
  - `waterShare`: `number` (fracción `0..1` del agua o yield total que se agrega en esta fase; `0` para fases de espera/agitación)
  - `svgDirective`: `SvgStageDirective`
- **Atributos calculados en tiempo de ejecución (por el motor)**:
  - `phaseWaterGrams`: `number` (agua/yield específico de esta fase redondeado a `0.1` o `1` g)
  - `targetCumulativeGrams`: `number` (peso acumulado que debe marcar la balanza al terminar la fase)

### 5. `SvgStageDirective` (Directiva de Animación Procedural)
Parametriza qué primitivas SVG reutilizables se activan durante la fase.

- **Atributos**:
  - `vesselType`: `"cone_v60" | "hourglass_chemex" | "wedge_melitta" | "cylinder_aeropress" | "beaker_french_press" | "portafilter_espresso"`
  - `pourStream`: `"none" | "gentle" | "steady" | "spiral"`
  - `agitator`: `"none" | "spoon_stir" | "vessel_swirl"`
  - `plungerState`: `"none" | "up" | "pressing" | "down"`
  - `liquidFillStartRatio`: `number` (`0..1`)
  - `liquidFillEndRatio`: `number` (`0..1`)
  - `coffeeBedTurbulence`: `"calm" | "bubbling_bloom" | "active_slurry" | "settled"`

### 6. `WikiEntry` (Ficha de la Wiki)
Representa un artículo estructurado dentro de la enciclopedia sensorial.

- **Atributos**:
  - `slug`: `string` (kebab-case único)
  - `category`: `"origin" | "varietal" | "process"`
  - `titleKey`: `string`
  - `summaryKey`: `string`
  - `sensoryProfile`: `{ acidity: 1|2|3|4|5, sweetness: 1|2|3|4|5, body: 1|2|3|4|5, bitterness: 1|2|3|4|5 }`
  - `metadata`: objeto discriminado por categoría (ej. `altitudeRangeMeters` y `region` para orígenes; `species` y `lineage` para varietales; `fermentationType` para procesos)
  - `flavorNodeIds`: `string[]` (referencias a nodos de `FlavorWheelNode`)
  - `recommendedMethods`: `Array<{ methodId: string, profileId: string, reasonKey: string }>`

### 7. `FlavorWheelNode` (Nodo de Rueda de Sabores SCA)
Estructura jerárquica de 3 anillos concéntricos para la rueda de cata interactiva.

- **Atributos**:
  - `id`: `string` (ej. `"fruity"`, `"fruity.berry"`, `"fruity.berry.blackberry"`)
  - `tier`: `1 | 2 | 3` (1 = familia central, 2 = subfamilia, 3 = descriptor específico)
  - `labelKey`: `string`
  - `colorHex`: `string` (color semántico oficial del segmento sensorial, ej. rojos para frutos rojos, amarillos para cítricos, marrones para tostados/cacao)
  - `tastingNoteKey`: `string` (explicación de cómo se percibe en boca/nariz y por qué ocurre químicamente)
  - `children`: `FlavorWheelNode[]` (vacío en `tier === 3`)

## Seed data inicial

El repositorio incluirá desde el lanzamiento v1.0 el siguiente conjunto mínimo validado:
- **6 métodos completos** (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`), cada uno con sus **3 perfiles de intensidad/estilo** (18 configuraciones de receta calibradas en total) y sus umbrales físicos (`RangeThreshold`).
- **Catálogo inicial de Wiki**:
  - **Orígenes (mínimo 8)**: Colombia, Etiopía, Brasil, Kenia, Guatemala, Costa Rica, Perú, Sumatra.
  - **Varietales (mínimo 8)**: Geisha/Gesha, Bourbon (Rojo/Amarillo/Rosado), Typica, Caturra, Catuai, SL28/SL34, Pacamara, Castillo.
  - **Procesos (mínimo 5)**: Lavado (Washed), Natural (Dry), Honey (Yellow/Red/Black), Fermentación Anaeróbica, Descafeinado (Swiss Water / Caña de azúcar).
- **Árbol completo de Rueda de Sabores (estilo SCA)**: las 9 grandes familias de nivel 1 (Frutal, Floral, Dulce, Nueces/Cacao, Especiado, Tostado, Vegetal/Herbal, Ácido/Fermentado, Otros) con sus subcategorías de nivel 2 y descriptores de nivel 3.
