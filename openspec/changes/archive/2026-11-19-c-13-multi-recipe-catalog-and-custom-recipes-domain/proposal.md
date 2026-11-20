# Proposal

## Why

En el catálogo inicial (`C-02`), los 3 perfiles de intensidad (`light`, `normal`, `strong`) de cada cafetera comparten fases idénticas y atribuyen nombres de referentes (James Hoffmann, Tetsu Kasuya, Alan Adler) a recetas cuyas fases, tiempos y temperaturas no corresponden a las técnicas reales. Además, el dominio actual solo soporta una receta fija por método y no permite que el usuario elija entre una receta universal infalible, recetas de autor fieles con su perfil de sabor o sus propias recetas personalizadas compartibles.

## What Changes

- **Nuevos esquemas Zod de recetas multi-técnica y personalizadas (`src/domain/schemas/recipe.schema.ts`)**:
  - `BrewRecipeSchema`: modela una receta completa asociada a un `methodId`, con `id`, `kind` (`'standard' | 'author' | 'classic' | 'custom'`), `isDefault`, `authorName`, `difficulty` (`'universal' | 'intermediate' | 'advanced'`), `titleKey` / `title`, `processSummaryKey` / `processSummary`, `flavorHighlightKey` / `flavorHighlight`, `grindNoteKey` / `grindNote` (opcional), `waterTempCelsius` (opcional, hereda del método), `defaultDoseGrams` (opcional), `intensityRatios` (mapa de ratios para `light | normal | strong` o `ristretto | normale | lungo`), `totalDurationSeconds` y `phases` (validando suma de `waterShare === 1.0` y contigüidad temporal con `.superRefine()`).
  - `CustomRecipeDraftSchema` y `CustomRecipeExportEnvelopeSchema`: esquemas de entrada permisivos para creación/edición de recetas del usuario y sobre versionado (`schemaVersion: 1`) para exportar/importar JSON compartible entre usuarios.
- **Catálogo calibrado y fiel de 19 recetas de extracción (`src/data/recipes/`)**:
  - **6 Recetas Estándar (`kind: 'standard'`, `isDefault: true`)**: una receta universal, balanceada y sin atribución ficticia para cada método (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`), recalibrando también `src/data/methods/*.ts` para eliminar atribuciones falsas y mantener 100% retrocompatibilidad.
  - **13 Recetas de Autor / Técnicas Clásicas verificadas** con fases, tiempos, ratios y temperaturas reales comprobadas:
    - **V60**: *James Hoffmann — Better 1-Cup* (5 pulsos de 20% + swirl, 1:16.7, 95 °C, 3:00), *Tetsu Kasuya — Método 4:6* (5 vertidos cada 45 s, molienda gruesa, 1:15, 92 °C, 3:30), *Scott Rao — Vertido Único + Rao Spin* (bloom 3× + vertido continuo + spin, 1:16.4, 96 °C, 3:00).
    - **Chemex**: *James Hoffmann — Chemex* (bloom + 60% + 100% + stir + swirl, 1:16.7, 96 °C, 4:00), *4 Pulsos de Alta Claridad* (técnica clásica, 1:17, 94 °C, 4:15).
    - **Melitta**: *Pulsos Controlados* (técnica clásica anti-estancamiento, 1:16.7, 93 °C, 3:30).
    - **AeroPress**: *James Hoffmann — Ultimate AeroPress* (directo, 2:00 inmersión + swirl + 30 s reposo + 30 s prensa, 1:18.2, 95 °C, 3:00), *Alan Adler — Original 80 °C* (concentrado rápido, 10 s stir + 30 s prensa, 80 °C, 0:50), *Método Invertido* (cuerpo denso, 1:13.5, 90 °C, 2:00).
    - **Prensa Francesa**: *James Hoffmann — Ultimate French Press* (4:00 inmersión + romper/limpiar costra + 5:00 decantación sin bajar émbolo, 1:16.7, 96 °C, 9:45), *Inmersión Clásica Rápida* (4:15, 1:14, 93 °C).
    - **Espresso**: *Turbo Shot* (Christopher Hendon / Lance Hedrick — 6 bar, molienda más gruesa, 15 s, 1:3, 92 °C), *Clásico Italiano* (concentrado tradicional, 26 s, 91 °C).
  - Nota: cada cafetera incluye exactamente 1 receta `standard` (`isDefault: true`) + sus recetas `author` / `classic` verificadas; las bebidas de barra con leche/ensamblado (Cappuccino, Macchiato, Flat White) se mantienen explícitamente fuera del motor de extracción y se reservan para un change posterior de Wiki.
- **Motor puro multi-receta, normalizador de recetas custom y compartir JSON (`src/domain/brewing/`)**:
  - `calculateScaledRecipe(method, profileId, input?, recipe?)`: extensión retrocompatible que escala usando cualquier `BrewRecipe` (estándar, autor o custom) respetando la intensidad elegida (`light | normal | strong` o `ristretto | normale | lungo`) y devolviendo `recipeId`, `waterTempCelsius` (override o del método) y fases escaladas sin deriva (`RN-BR-01..03`).
  - `buildCustomRecipe(draft, method)`: normaliza automáticamente recetas creadas por el usuario — calcula `waterShare` normalizado a `1.0` tanto si ingresó `ml/g` concretos como pesos relativos, encadena `startTimeSeconds`/`endTimeSeconds` a partir de duraciones por fase y deriva automáticamente `svgDirective` coherentes con el `vesselType` del método para animar la escena SVG procedural.
  - `duplicateRecipeAsDraft(recipe, newTitle)`: clona cualquier receta estándar o de autor como borrador editable del usuario.
  - `exportCustomRecipeJson(recipe)` y `importCustomRecipeJson(rawJson)`: serialización y deserialización validada con Zod para compartir o respaldar recetas entre usuarios.
- **Persistencia local de recetas custom y receta seleccionada (`src/adapters/storage.adapter.ts`)**:
  - Extensión retrocompatible de `UserPreferencesSchema` con `customRecipes: CustomRecipe[]` (default `[]`) y `selectedRecipeId?: string` dentro de `MethodPreferenceConfigSchema`, más métodos `saveCustomRecipe`, `deleteCustomRecipe` y `getCustomRecipes(methodId?)` con fallback seguro en memoria.
- **Diccionario i18n (`src/i18n/locales/es/recipes.json`)**:
  - Textos técnicos concretos (`no-ai-slop`, cero emojis) para nombres, descripciones breves del proceso, perfiles de sabor que destaca cada receta, notas de molienda e instrucciones interpolables (`{{waterGrams}}`, `{{cumulativeWaterGrams}}`), integrado en `src/i18n/index.ts`.

## Capabilities

### New Capabilities
- `multi-recipe-and-custom-recipes-domain`: Esquemas Zod multi-receta y de recetas personalizadas, catálogo verificado de 6 recetas Estándar universales + 13 recetas de autor/clásicas con proceso y perfil de sabor, motor de escalado multi-receta retrocompatible, normalizador automático de fases custom (`waterShare`, tiempos y `svgDirective`), exportación/importación JSON validada y persistencia CRUD en `storage.adapter.ts`.

### Modified Capabilities
<!-- Ninguna capability existente rompe sus requisitos; `BrewMethod.profiles`, `calculateScaledRecipe` sin 4to parámetro y `UserPreferencesSchema` permanecen 100% retrocompatibles. -->

## Impact

- **Nuevos archivos de dominio**: `src/domain/schemas/recipe.schema.ts`, `src/domain/brewing/custom-recipe.engine.ts`.
- **Nuevos archivos de catálogo e i18n**: `src/data/recipes/{v60,chemex,melitta,aeropress,french-press,espresso,index}.ts`, `src/i18n/locales/es/recipes.json`.
- **Archivos modificados (retrocompatibles)**: `src/domain/schemas/index.ts`, `src/domain/brewing/scaling.engine.ts`, `src/domain/brewing/index.ts`, `src/data/methods/*.ts` (sincronizando la receta estándar sin atribuciones falsas), `src/adapters/storage.adapter.ts`, `src/i18n/index.ts`.
- **Nuevos tests**: `src/domain/__tests__/recipe.schema.test.ts`, `src/domain/__tests__/recipes.catalog.test.ts`, `src/domain/__tests__/custom-recipe.engine.test.ts`, y ampliación de `src/adapters/__tests__/storage.adapter.test.ts`.
- **Dependencias / UI**: Cero nuevas dependencias; cero cambios visuales (`Decision: no (no UI)`). Desbloquea `C-14` (`recipe-selector-and-custom-editor-ui`).
