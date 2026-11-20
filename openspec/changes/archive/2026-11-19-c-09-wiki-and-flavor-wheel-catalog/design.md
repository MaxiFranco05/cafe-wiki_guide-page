# Design

## UI Mockups

- **Decision**: `no (no UI)` — Este change implementa exclusivamente esquemas Zod del dominio (`src/domain/schemas/`), catálogos estáticos (`src/data/wiki/`, `src/data/flavor-wheel/`), diccionarios localizados (`src/i18n/locales/es/`) y selectores puros sin modificar vistas ni componentes visuales. Las interfaces de usuario correspondientes se diseñan y mockupean en `C-10` (`/wiki`) y `C-11` (`/flavor-wheel`).

## Context

`C-02` estableció el patrón *Schema-First Static Catalog* para los 6 métodos de preparación (`src/domain/schemas/brewing.schema.ts`, `src/data/methods/` y `src/i18n/locales/es/methods.json`). Para habilitar el Explorador de la Wiki Sensorial (`C-10`) y la Rueda de Sabores Interactiva SCA (`C-11`), necesitamos extender ese mismo patrón al dominio enciclopédico y sensorial (`knowledge-base/04_modelo_de_datos.md` §6 y §7), cubriendo 38 fichas (orígenes y varietales globales con prioridad en cartas del Cono Sur como Brasil Santos, Colombia Huila, Perú Cajamarca, Bourbon, Mundo Novo y Catuaí), evitando la navegación plana mediante clasificación en 2 niveles e impidiendo strings hardcodeados (`RN-I18N-01`) o referencias rotas (`RN-I18N-02`).

## Goals / Non-Goals

**Goals:**
- Modelar `WikiEntrySchema` y `FlavorWheelNodeSchema` con inferencia estática `z.infer`, invariantes estructurales por `.superRefine()`, clasificación en 2 niveles, relevancia regional, alias comerciales y validación cruzada contra `METHODS_CATALOG`.
- Proveer los 38 artículos curados de la Wiki (16 orígenes, 16 varietales, 6 procesos) y el árbol de 3 anillos concéntricos con las 9 familias SCA y sus colores hexadecimales semánticos, dejando una estructura declarativa extensible para agregar futuras fichas en 1 archivo + 1 clave i18n.
- Proveer selectores puros $O(1)$ / $O(N)$ pre-indexados para consultas por `slug`, categoría, subgrupo taxonómico, `regionalRelevance`, texto (incluyendo alias comerciales), niveles sensoriales, agrupación (`groupWikiEntriesBySubGroup`), ruta jerárquica (`lineage`) y cruce bidireccional `WikiEntry ↔ FlavorWheelNode ↔ BrewMethod`.
- Redactar los diccionarios `es/wiki.json` y `es/flavor-wheel.json` con datos técnicos concretos (altitudes reales, linajes botánicos, denominaciones comerciales, compuestos químicos y parámetros de extracción) aplicando las reglas de `no-ai-slop` y cero emojis.

**Non-Goals:**
- Componentes React, rutas o estilos para `/wiki` o `/flavor-wheel` (alcance de `C-10` y `C-11`).
- Persistencia remota o CMS externo (arquitectura 100% client-side estática `DD-01`).

## Decisions

### 1. Modelado de `WikiEntry` en 2 Niveles con `z.discriminatedUnion('category', ...)`
- **Elección**: Todos los `WikiEntry` comparten `slug`, `regionalRelevance: z.enum(['southern_cone_staple', 'global_specialty'])`, `titleKey`, `summaryKey`, `commercialAliasesKey`, `sensoryProfile`, `flavorNodeIds` y `recommendedMethods`, mientras `metadata` varía según `category` (`"origin" | "varietal" | "process"`) incorporando un subgrupo taxonómico obligatorio (`object-discriminated-unions` de `zod` y `typescript-advanced-types`):
  - `category: 'origin'` → `metadata: { macroRegion: 'south_america' | 'central_north_america' | 'africa' | 'asia_pacific'; regionKey: string; altitudeRangeMeters: { min: number; max: number }; harvestMonthsKey: string }` (con `.superRefine` verificando `max >= min`).
  - `category: 'varietal'` → `metadata: { geneticGroup: 'bourbon_typica' | 'ethiopian_heirloom' | 'introgressed_hybrid' | 'canephora'; species: 'arabica' | 'canephora' | 'liberica'; lineageKey: string; discoveryRegionKey: string }`.
  - `category: 'process'` → `metadata: { processFamily: 'washed_clean' | 'mucilage_honey' | 'natural_experimental' | 'decaffeination'; fermentationType: 'washed' | 'natural' | 'pulped_natural' | 'honey' | 'anaerobic' | 'decaf'; mucilageRemovalKey: string; dryingMethodKey: string }`.
- **Alternativa descartada**: Un único `z.object` con campos opcionales en `metadata` o listas planas de 38 fichas sin subgrupos. Se descartó porque impide el *type narrowing* automático en TypeScript cuando `C-10` renderice secciones agrupadas y porque una lista plana dificultaría encontrar orígenes/varietales a medida que crezca el catálogo.

### 2. Modelado Recursivo de `FlavorWheelNode` con `z.lazy()` e Invariantes de Nivel
- **Elección**: Siguiendo `compose-lazy-recursive` (`zod`), declaramos la interfaz `FlavorWheelNode` y `FlavorWheelNodeSchema: z.ZodType<FlavorWheelNode>` usando `z.lazy(() => z.array(FlavorWheelNodeSchema))` en `children`, complementado con `.superRefine()` para validar:
  1. Formato hexadecimal estricto `^#[0-9A-Fa-f]{6}$` en `colorHex`.
  2. Coherencia de niveles: un nodo `tier: 1` solo puede tener hijos `tier: 2` (mínimo 1); un nodo `tier: 2` solo puede tener hijos `tier: 3` (mínimo 1); un nodo `tier: 3` debe tener `children.length === 0`.
  3. Coherencia de IDs jerárquicos: cada hijo debe comenzar con el prefijo `${parent.id}.` (ej. `"fruity"` → `"fruity.berry"` → `"fruity.berry.blackberry"`), facilitando el filtrado por prefijo y la trazabilidad en URL (`/flavor-wheel?node=fruity.berry.blackberry`).
- **Alternativa descartada**: Tres esquemas separados no recursivos (`Tier1Schema`, `Tier2Schema`, `Tier3Schema`). Se descartó porque el documento de arquitectura (`04_modelo_de_datos.md` §7) y los selectores recursivos de UI (`SunburstFlavorWheelSvg`, `FlavorDescriptorDrawer`) operan de forma uniforme sobre el tipo `FlavorWheelNode`.

### 3. Validación de Integridad Referencial Cruzada (`validateSensoryCatalogIntegrity`)
- **Elección**: Además de validar cada entidad individual con `WikiEntrySchema` y `FlavorWheelNodeSchema`, exportamos una función pura de validación de catálogo completo `validateSensoryCatalogIntegrity(wikiEntries, flavorTree, methodsCatalog)` en `src/domain/schemas/wiki.schema.ts` que verifica:
  - Unicidad global de `entry.slug` y `node.id`.
  - Que cada `flavorNodeId` de cada `WikiEntry` exista en el índice aplanado del árbol de la Rueda SCA.
  - Que cada `{ methodId, profileId }` en `recommendedMethods` exista en `METHODS_BY_SLUG[methodId]` y que `profileId` pertenezca a `method.profiles` (evitando, por ejemplo, recomendar `"light"` en `"espresso"` donde los perfiles son `"ristretto" | "normale" | "lungo"`).
- **Alternativa descartada**: Hardcodear `METHODS_CATALOG` dentro de `WikiEntrySchema`. Se descartó para mantener los esquemas desacoplados de los datos concretos y permitir testear `validateSensoryCatalogIntegrity` con fixtures sintéticos en Vitest (`RED → GREEN → TRIANGULATE`).

### 4. Índices Pre-calculados Inmutables, Agrupación Taxonómica y Selectores Bidireccionales
- **Elección**: En `src/data/flavor-wheel/index.ts` y `src/data/wiki/index.ts`, construir mapas inmutables (`Object.freeze`) al cargar el módulo:
  - `FLAVOR_WHEEL_TREE`: `readonly FlavorWheelNode[]` (las 9 familias raíz).
  - `FLAVOR_NODES_BY_ID`: `Readonly<Record<string, FlavorWheelNode>>`.
  - `FLAVOR_LINEAGE_BY_ID`: `Readonly<Record<string, readonly FlavorWheelNode[]>>` (cadena `[tier1]`, `[tier1, tier2]` o `[tier1, tier2, tier3]`).
  - `WIKI_CATALOG`: `readonly WikiEntry[]` (las 38 fichas: 16 orígenes + 16 varietales + 6 procesos, priorizando en orden los `southern_cone_staple` dentro de cada archivo/subgrupo).
  - `WIKI_ENTRIES_BY_SLUG`: `Readonly<Record<string, WikiEntry>>`.
  - Selectores puros:
    - `getWikiEntryBySlug(slug)` y `getWikiEntryByCategoryAndSlug(category, slug)`
    - `getWikiEntriesByCategory(category)`
    - `getWikiEntriesByFlavorNode(nodeId)`: devuelve todas las fichas que referencian `nodeId` directamente **o cualquiera de sus nodos descendientes** (de modo que tocar la familia `"fruity"` o la subfamilia `"fruity.berry"` en `C-11` liste todas las fichas con notas de frutos rojos).
    - `getWikiEntriesForMethod(methodId, profileId?)`: cruce inverso `BrewMethod → WikiEntry[]`.
    - `filterWikiEntries(options: { category?: WikiCategory | 'all'; subGroup?: WikiSubGroup; regionalRelevance?: RegionalRelevance; query?: string; flavorNodeId?: string; minAcidity?: number; minBody?: number; minSweetness?: number })`: búsqueda normalizada sin acentos (NFD) sobre título, resumen, alias comerciales (`commercialAliasesKey`) y notas de cata traducidas.
    - `groupWikiEntriesBySubGroup(category: WikiCategory)`: devuelve las fichas de la categoría agrupadas bajo su subgrupo taxonómico (`macroRegion`, `geneticGroup` o `processFamily`) preservando la prioridad de relevancia regional.
    - `getFlavorNodeById(nodeId)` y `getFlavorNodeLineage(nodeId)`.

### 5. Integración en `src/i18n/index.ts` y Redacción Técnica (`no-ai-slop`)
- **Elección**: Fusionar `esWiki` (`./locales/es/wiki.json`) y `esFlavorWheel` (`./locales/es/flavor-wheel.json`) en `esDictionary` mediante `deepMerge` y ampliar el tipo `TranslationKey` con `NestedKeyOf<typeof esWiki> | NestedKeyOf<typeof esFlavorWheel>`. Todo el contenido se redactará con datos verificables (rangos de altitud en m.s.n.m., genética botánica WCR, alias comerciales de bolsa en Argentina/Cono Sur, ácidos orgánicos como málico/fosfórico/cítrico, compuestos de Maillard y justificación hidráulica/térmica de cada receta recomendada), sin clichés de IA ni emojis.

## Risks / Trade-offs

- **[Risk] Inferencia circular en tipos recursivos de `TranslationKey` o `FlavorWheelNode`** → **Mitigación**: Anotar explícitamente `export const FlavorWheelNodeSchema: z.ZodType<FlavorWheelNode, z.ZodTypeDef, unknown>` y mantener una estructura de claves de máximo 4 niveles en `wiki.json` y `flavor-wheel.json` para que `NestedKeyOf` compile instantáneamente en `tsc -b`.
- **[Risk] Desincronización entre `flavorNodeIds` de la Wiki, `commercialAliasesKey` y hojas de la Rueda SCA al crecer de 21 a 38 fichas** → **Mitigación**: La suite `wiki-and-flavor-wheel.catalog.test.ts` valida el 100% de las referencias cruzadas, la unicidad de slugs, los subgrupos taxonómicos y el 100% de las claves i18n en cada ejecución de Vitest.
