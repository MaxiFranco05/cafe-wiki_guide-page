# Proposal

## Why

Las vistas del Explorador de la Wiki Sensorial (`C-10`, `/wiki` y `/wiki/:category/:entrySlug`) y de la Rueda de Sabores Interactiva SCA (`C-11`, `/flavor-wheel`) requieren una fuente de verdad estática, desacoplada de la UI y validada en tiempo de test/build (`RN-I18N-01`, `RN-I18N-02`). Para reflejar la oferta real de las cafeterías de especialidad del Cono Sur (Brasil Santos, Colombia Huila, Perú Cajamarca, Bourbon, Mundo Novo, Catuaí) junto al mapa mundial y evitar que un catálogo creciente de 38+ fichas se vuelva un laberinto, el dominio debe modelar clasificación en 2 niveles, relevancia regional y alias comerciales buscables.

## What Changes

- **Esquemas Zod del dominio sensorial y enciclopédico**:
  - `src/domain/schemas/wiki.schema.ts`: definición de `WikiEntrySchema` con perfil sensorial cuantitativo (`acidity`, `sweetness`, `body`, `bitterness` en escala entera `1..5`), `regionalRelevance` (`southern_cone_staple | global_specialty`), `commercialAliasesKey` (denominaciones de bolsa/región), metadatos polimórficos discriminados por categoría (`z.discriminatedUnion('category', ...)` incluyendo subgrupo taxonómico obligatorio: `macroRegion` en `origin`, `geneticGroup` en `varietal`, `processFamily` en `process`), referencias a nodos de sabor (`flavorNodeIds`) y métodos recomendados (`recommendedMethods` con `methodId`, `profileId`, `reasonKey`).
  - `src/domain/schemas/flavor-wheel.schema.ts`: definición recursiva (`z.lazy()`) de `FlavorWheelNodeSchema` para el árbol de 3 anillos concéntricos (`tier: 1 | 2 | 3`) con color semántico (`colorHex`), `labelKey`, `tastingNoteKey` e invariantes estructurales por nivel (nodos `tier: 3` sin hijos; prefijos de `id` jerárquicos coherentes).
  - Re-exportación limpia en `src/domain/schemas/index.ts`.
- **Catálogo estático de la Wiki del Café (`src/data/wiki/`) — 38 fichas clasificadas en 2 niveles**:
  - **16 Orígenes (`origins.ts`)**:
    - `south_america`: `brazil`, `colombia`, `peru`, `bolivia`, `ecuador`
    - `central_north_america`: `guatemala`, `costa-rica`, `el-salvador`, `honduras`, `nicaragua`, `panama`, `mexico`
    - `africa`: `ethiopia`, `kenya`, `rwanda`
    - `asia_pacific`: `sumatra`
  - **16 Varietales (`varietals.ts`)**:
    - `bourbon_typica`: `bourbon`, `mundo-novo`, `catuai`, `caturra`, `typica`, `maragogype`, `pacas`, `pacamara`, `villa-sarchi`
    - `ethiopian_heirloom`: `geisha`, `sl28-sl34`, `java`, `sidra`
    - `introgressed_hybrid`: `castillo`, `catimor`
    - `canephora`: `robusta-canephora`
  - **6 Procesos de beneficio (`processes.ts`)**:
    - `washed_clean`: `washed`
    - `mucilage_honey`: `pulped-natural`, `honey`
    - `natural_experimental`: `natural`, `anaerobic`
    - `decaffeination`: `decaf`
  - Barrel y selectores de consulta, agrupación taxonómica y cruce en `src/data/wiki/index.ts` (`filterWikiEntries` con soporte para `subGroup`, `regionalRelevance` y búsqueda sobre `commercialAliasesKey`, más `groupWikiEntriesBySubGroup(category)`).
- **Catálogo estático de la Rueda de Sabores SCA (`src/data/flavor-wheel/`)**:
  - Árbol completo de 3 niveles con las **9 grandes familias de nivel 1** (`fruity`, `floral`, `sweet`, `nutty-cocoa`, `spiced`, `roasted`, `green-vegetative`, `sour-fermented`, `other`), subfamilias de nivel 2 y descriptores específicos de nivel 3 con sus colores hexadecimales semánticos (`colorHex`).
  - Índices planos de búsqueda (`FLAVOR_NODES_BY_ID`) y selectores de ruta jerárquica y cruce con Wiki en `src/data/flavor-wheel/index.ts`.
- **Diccionarios i18n en español (`RN-I18N-01`) con redacción técnica libre de relleno (`no-ai-slop`)**:
  - `src/i18n/locales/es/wiki.json` y `src/i18n/locales/es/flavor-wheel.json` con datos concretos (altitudes, linajes genéticos, denominaciones comerciales reales como Brasil Santos / Sul de Minas / Cerrado Mineiro, Colombia Huila / Supremo, Perú Cajamarca, Ojo de Elefante y Cereja Descascada, mecanismos químicos de fermentación/percepción sensorial y razones de extracción por método/perfil).
  - Integración en `src/i18n/index.ts` dentro de `esDictionary` y `TranslationKey`.
- **Suite de tests de validación e integridad referencial (`RN-I18N-02`)**:
  - Tests unitarios en `src/domain/__tests__/wiki-and-flavor-wheel.schema.test.ts` y `src/domain/__tests__/wiki-and-flavor-wheel.catalog.test.ts` verificando esquemas, rechazo de datos inválidos, integridad referencial cruzada (`WikiEntry.flavorNodeIds → FlavorWheelNode.id`, `WikiEntry.recommendedMethods → BrewMethod.id + RecipeProfile.id`), resolución del 100% de claves i18n en `es`, agrupación por subgrupos y selectores bidireccionales.

## Capabilities

### New Capabilities
- `wiki-and-flavor-wheel-catalog`: Esquemas Zod del dominio sensorial (`WikiEntry`, `FlavorWheelNode`), catálogo estático de 38 fichas de Wiki clasificadas en 2 niveles (16 orígenes, 16 varietales, 6 procesos) con prioridad Cono Sur y alias comerciales, árbol SCA de 3 niveles (9 familias), diccionarios localizados en español (`wiki.json`, `flavor-wheel.json`), validación de integridad referencial cruzada con `METHODS_CATALOG` y selectores puros de búsqueda, agrupación y navegación bidireccional.

### Modified Capabilities
<!-- Ninguna capability existente cambia sus requisitos a nivel de especificación. -->

## Impact

- **Nuevos archivos de dominio**: `src/domain/schemas/wiki.schema.ts`, `src/domain/schemas/flavor-wheel.schema.ts` (y actualización de `src/domain/schemas/index.ts`).
- **Nuevos archivos de catálogo estático**: `src/data/wiki/{origins,varietals,processes,index}.ts`, `src/data/flavor-wheel/{flavor-wheel.data,index}.ts`.
- **Nuevos diccionarios i18n**: `src/i18n/locales/es/wiki.json`, `src/i18n/locales/es/flavor-wheel.json` (y actualización de `src/i18n/index.ts`).
- **Nuevos tests**: `src/domain/__tests__/wiki-and-flavor-wheel.schema.test.ts`, `src/domain/__tests__/wiki-and-flavor-wheel.catalog.test.ts`.
- **Dependencias / UI**: Cero nuevas dependencias en `package.json`; cero cambios visuales en componentes React (`Decision: no (no UI)`). Desbloquea `C-10` y `C-11`.
