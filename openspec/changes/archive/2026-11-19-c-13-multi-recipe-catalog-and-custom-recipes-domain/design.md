# Design

## UI Mockups

- **Decision**: `no (no UI)` — Este change implementa exclusivamente esquemas Zod (`src/domain/schemas/`), catálogo estático de 19 recetas verificadas (`src/data/recipes/`, sincronización de `src/data/methods/`), diccionario `es/recipes.json`, motor puro de escalado multi-receta y recetas custom (`src/domain/brewing/`), y persistencia CRUD en `src/adapters/storage.adapter.ts`. El selector/modal de recetas y el editor visual pertenecen a `C-14` (`recipe-selector-and-custom-editor-ui`).

## Context

Ver `proposal.md` — Why. El codebase actual tiene 203 tests en verde que dependen de `BrewMethod.profiles` (`light | normal | strong` / `ristretto | normale | lungo`), `calculateScaledRecipe(method, profileId, input)` y `UserPreferencesSchema`. Este diseño introduce soporte completo para múltiples recetas por cafetera y recetas personalizadas del usuario **sin romper ningún contrato existente** en `C-05`, `C-08` o `C-09`.

## Goals / Non-Goals

**Goals:**
- Garantizar fidelidad documental del 100% en cada receta de autor (verificadas con fuentes primarias: James Hoffmann, Tetsu Kasuya 4:6, Scott Rao, Alan Adler, Christopher Hendon / Lance Hedrick) y dar a cada cafetera una receta `standard` universal e infalible sin atribución ficticia.
- Separar limpiamente **Receta/Técnica (`BrewRecipe`)** de **Intensidad (`light | normal | strong` o `ristretto | normale | lungo`)** manteniendo compatibilidad total con `?profile=...` y `WikiEntry.recommendedMethods`.
- Simplificar al máximo la creación de recetas custom desde el dominio: aceptar `waterAmount` en ml/g o peso relativo y duraciones por fase para calcular automáticamente `waterShare`, timestamps contiguos y `svgDirective` (habilitando animación SVG en vivo en `C-14`).
- Habilitar intercambio de recetas entre usuarios sin backend mediante `exportCustomRecipeJson` / `importCustomRecipeJson` con sobre versionado (`schemaVersion: 1`) validado con Zod.

**Non-Goals:**
- Componentes React, modales o formularios de UI (alcance de `C-14`).
- Bebidas ensambladas con leche/hielo (`Cappuccino`, `Flat White`, `Macchiato`, `Cortado`, `Lágrima`), que pertenecen a un futuro change de Wiki (`C-15`), no al motor de extracción por cafetera.

## Decisions

### 1. Modelo Discriminado `BrewRecipe` (`catalog` vs. `custom`)
- **Elección**: En `src/domain/schemas/recipe.schema.ts`, definir dos variantes discriminadas por `source: 'catalog' | 'custom'` (además de `kind: 'standard' | 'author' | 'classic' | 'custom'`):
  - **Catálogo (`source: 'catalog'`)**: usa claves i18n (`titleKey`, `processSummaryKey`, `flavorHighlightKey`, `grindNoteKey?`) cumpliendo `RN-I18N-01`, y `phases` con `titleKey`/`instructionKey`.
  - **Custom (`source: 'custom'`, `kind: 'custom'`)**: almacena texto libre authored por el usuario (`title`, `processSummary?`, `flavorHighlight?`, `grindNote?`) y fases con `title`/`instruction` (junto con `titleKey`/`instructionKey` vacíos o resueltos via campos opcionales en `BrewRecipePhaseSchema` para que el motor y el timer puedan leer `phase.customTitle ?? t(phase.titleKey)` sin romper `BrewPhase`).
  - **Ratios por intensidad**: `intensityRatios` validado con `.superRefine()`:
    - Si `methodId === 'espresso'`: `{ ristretto: number, normale: number, lungo: number }`.
    - En los otros 5 métodos: `{ light: number, normal: number, strong: number }` (en recetas custom, si el usuario ingresa solo un `baseRatio`, `buildCustomRecipe` deriva automáticamente `light = round(baseRatio * 1.06)`, `normal = baseRatio`, `strong = round(baseRatio * 0.92)` salvo que el usuario provea los 3 valores).
- **Alternativa descartada**: Reemplazar `BrewMethod.profiles` por `recipes[]` con breaking change en `BrewMethodSchema`. Se descartó porque rompería `C-02`, `C-05`, `C-06`, `C-08` y `C-09`; en su lugar, `src/data/methods/*.ts` refleja exactamente la receta `standard` de cada método (corrigiendo las atribuciones falsas heredadas) y `src/data/recipes/` expone el catálogo completo de 19 recetas.

### 2. Verificación Documental de las 19 Recetas (Cero Alucinaciones)
Cada receta de autor en `src/data/recipes/` incorpora sus parámetros reales verificados:
- **V60 (`v60.ts` — 4 recetas)**:
  1. `v60-standard` (`standard`, `isDefault: true`): 3 vertidos (`0–45` bloom 20%, `45–105` pour1 45%, `105–145` pour2 35%, `145–180` drawdown; `1:16`, `93 °C`, `180 s`).
  2. `v60-hoffmann-1cup` (`author`, James Hoffmann — *A Better 1-Cup V60*): 5 pulsos de 20% (`0–45` bloom+swirl, `45–70`, `70–90`, `90–110`, `110–125` + swirl, `125–180` drawdown; `1:16.7`, `95 °C`, `180 s`, `15 g / 250 g`).
  3. `v60-kasuya-4-6` (`author`, Tetsu Kasuya — *Método 4:6, WBrC 2016*): 5 vertidos de 20% cada 45 s (`0–45`, `45–90`, `90–135`, `135–180`, `180–210`; molienda gruesa, `1:15`, `92 °C`, `210 s`, `20 g / 300 g`).
  4. `v60-scott-rao` (`author`, Scott Rao — *Single Pour + Rao Spin*): bloom 3× + excavación (`0–45`, 18%), vertido único continuo (`45–95`, 82%), stir + Rao Spin (`95–105`, 0%), drawdown (`105–180`, 0%; `1:16.4`, `96 °C`, `180 s`, `22 g / 360 g`).
- **Chemex (`chemex.ts` — 3 recetas)**:
  1. `chemex-standard` (`standard`, `isDefault: true`): bloom 45 s (20%) + 2 vertidos circulares lentos (40% / 40%) + drawdown (`240 s`, `1:16`, `94 °C`).
  2. `chemex-hoffmann` (`author`, James Hoffmann — *Chemex*): bloom + swirl (`0–45`, 15%), vertido hasta 60% (`45–75`, 45%), vertido hasta 100% (`75–105`, 40%), stir (`105–120`), swirl (`120–130`), drawdown (`130–240`; `1:16.67`, `96 °C`, `240 s`, `30 g / 500 g`).
  3. `chemex-four-pulse` (`classic`, *Técnica de 4 Pulsos*): bloom 20% + 3 pulsos de 26.67% + drawdown (`255 s`, `1:17`, `94 °C`).
- **Melitta (`melitta.ts` — 2 recetas)**:
  1. `melitta-standard` (`standard`, `isDefault: true`): bloom 45 s (20%) + 2 vertidos moderados anti-estancamiento (40% / 40%) + drawdown (`195 s`, `1:16`, `93 °C`).
  2. `melitta-controlled-pulses` (`classic`, *Pulsos Controlados*): bloom 20% + 3 pulsos cortos dejando bajar parcialmente la cama (`210 s`, `1:16.7`, `93 °C`).
- **AeroPress (`aeropress.ts` — 4 recetas)**:
  1. `aeropress-standard` (`standard`, `isDefault: true`): método directo equilibrado — vertido total + stir suave (`0–25`, 100%), inmersión sellada (`25–90`), prensado constante (`90–120`; `1:15`, `90 °C`, `120 s`).
  2. `aeropress-hoffmann-ultimate` (`author`, James Hoffmann — *Ultimate AeroPress*): directo, vertido total + sellar vacío (`0–20`, 100%), inmersión (`20–120`), swirl + reposo (`120–150`), prensado lento 30 s (`150–180`; `1:18.2`, `95 °C`, `180 s`, `11 g / 200 g`).
  3. `aeropress-alan-adler` (`author`, Alan Adler — *Receta Original 80 °C*): concentrado rápido a `80 °C` — vertido rápido (`0–10`, 100%), agitación vigorosa (`10–20`), prensado suave (`20–50`; `1:6` concentrado con nota de dilución al gusto, `50 s`, `16 g / 95 g`).
  4. `aeropress-inverted` (`classic`, *Método Invertido*): cámara invertida sin goteo previo — bloom + agitación (`0–30`, 30%), vertido final + inmersión (`30–90`, 70%), volteo y prensado lento (`90–120`; `1:13.5`, `90 °C`, `120 s`).
- **Prensa Francesa (`french-press.ts` — 3 recetas)**:
  1. `french-press-standard` (`standard`, `isDefault: true`): vertido total (`0–30`, 100%), inmersión (`30–240`), romper costra + reposo breve (`240–300`), prensado suave (`300–315`; `1:15`, `94 °C`, `315 s`).
  2. `french-press-hoffmann` (`author`, James Hoffmann — *Ultimate French Press*): vertido rápido (`0–15`, 100%), inmersión (`15–240`), romper y limpiar costra con cucharas (`240–270`), decantación 5 min sin bajar émbolo (`270–570`), apoyar malla en superficie y servir (`570–585`; `1:16.7`, `96 °C`, `585 s`, `30 g / 500 g`).
  3. `french-press-classic-quick` (`classic`, *Inmersión Clásica Rápida*): vertido + stir inicial (`0–30`, 100%), inmersión (`30–240`), prensado directo (`240–255`; `1:14`, `93 °C`, `255 s`).
- **Espresso (`espresso.ts` — 3 recetas)**:
  1. `espresso-standard` (`standard`, `isDefault: true`): pre-infusión suave (`0–6`, 10% yield) + extracción principal (`6–28`, 90% yield; `ristretto 1:1.5`, `normale 1:2.0`, `lungo 1:3.0`, `93 °C`, `28 s`).
  2. `espresso-turbo-shot` (`author`, Christopher Hendon & Lance Hedrick — *Turbo Shot 6 Bar*): molienda más gruesa a 6 bar, extracción rápida (`0–15`, 100%; `ristretto 1:2.0`, `normale 1:2.5`, `lungo 1:3.0`, `92 °C`, `15 s`, `15 g → 45 g`).
  3. `espresso-italian-classic` (`classic`, *Clásico Italiano*): extracción directa y concentrada sin pre-infusión prolongada (`0–26`, 100%; `ristretto 1:1.3`, `normale 1:1.8`, `lungo 1:2.5`, `91 °C`, `26 s`).

### 3. Normalizador Puro de Recetas Custom (`src/domain/brewing/custom-recipe.engine.ts`)
- **Elección**: `buildCustomRecipe(draft, method)`:
  1. Valida `draft` con `CustomRecipeDraftSchema`.
  2. Calcula `waterShare` automáticamente: suma todos los `waterAmount` (`>= 0`) de las fases; si la suma total es `<= 0`, falla con error de validación claro; divide cada `waterAmount / total` y reconcilia el residuo de punto flotante en la última fase con agua para garantizar `Math.abs(sum - 1.0) < 1e-6`.
  3. Encadena `startTimeSeconds` / `endTimeSeconds` consecutivos desde `0` usando `durationSeconds` (> 0) de cada fase y computa `totalDurationSeconds`.
  4. Deriva `svgDirective` automáticamente a partir del mapa `METHOD_VESSEL_MAP[method.id]` + `phase.type` (`bloom` → `spiral` + `bubbling_bloom`; `pour` → `steady` + `active_slurry`; `stir` → `spoon_stir`; `swirl` → `vessel_swirl`; `plunge` → `pressing`; `drawdown`/`wait` → `none` + `settled`; `espresso_shot` → `steady`) e interpola `liquidFillStartRatio` / `liquidFillEndRatio` acumulativos en `[0, 1]`.
  5. Export/Import JSON: `exportCustomRecipeJson(recipe)` genera `{ schemaVersion: 1, exportedAtIso, recipe }` y `importCustomRecipeJson(rawJson)` parsea de forma segura (`try/catch` + `CustomRecipeExportEnvelopeSchema.safeParse`), validando además que el resultado cumpla `CustomBrewRecipeSchema` sin lanzar excepciones.

### 4. Extensión Retrocompatible de `StorageAdapter`
- **Elección**: En `src/adapters/storage.adapter.ts`:
  - `MethodPreferenceConfigSchema` agrega `selectedRecipeId: z.string().min(1).optional()`.
  - `UserPreferencesSchema` agrega `customRecipes: z.array(CustomBrewRecipeSchema).default([])`.
  - De este modo, cualquier preferencia ya guardada en `localStorage` bajo `cafeteria-wiki:preferences:v1` (sin `customRecipes` ni `selectedRecipeId`) pasa `safeParse` automáticamente con `customRecipes: []`.
  - Nuevos métodos en `StorageAdapter`: `getCustomRecipes(methodId?)`, `saveCustomRecipe(recipe)` (upsert por `recipe.id`), `deleteCustomRecipe(recipeId)`.

## Risks / Trade-offs

- **[Risk] Sincronizar `src/data/methods/*.ts` podría alterar expectativas de algún test de `C-02`/`C-04`/`C-05`** → **Mitigación**: Mantener exactamente los mismos IDs de métodos, umbrales `RangeThreshold`, estructura de `profiles` (3 perfiles por método con sus ratios base) y verificar en `tasks.md` que el 100% de los 203 tests existentes sigan en verde.
- **[Risk] Alan Adler Original (`16 g / 95 ml`) cae por debajo de `aeropress.thresholds.minWaterMl (150 ml)`** → **Mitigación**: Esto es fiel a la física (es un concentrado para diluir al gusto); las advertencias de `RangeThreshold` son **no bloqueantes** (`RN-RG-01`) y la descripción de la receta explica explícitamente que es un concentrado de 95 ml para diluir con agua caliente.
