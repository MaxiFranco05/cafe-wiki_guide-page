# Design

## UI Mockups

- **Decision**: `no (no UI)` (2026-11-20). Este change solo agrega esquemas, datos, diccionarios y selectores puros. Las vistas de Cafeteras y Bebidas y su mockup v2 son parte de `C-10`.

## Context

Ver `proposal.md` (Why). Punto de partida en el código:

- `src/domain/schemas/wiki.schema.ts` define `WikiEntrySchema` como unión discriminada por `category` (`origin | varietal | process`) con `recommendedMethods.min(1)` y el validador `validateSensoryCatalogIntegrity`.
- `src/data/wiki/index.ts` expone `WIKI_CATALOG` (38 fichas congeladas) y selectores. `normalizeSearchText` y los filtros de umbral sensorial son privados de ese módulo.
- `src/data/recipes/index.ts` (C-13) expone `RECIPES_CATALOG`, `RECIPES_BY_ID`, `getRecipesByMethod` y `getDefaultRecipeForMethod`. Hay 19 recetas con `kind: standard | author | classic`.
- `BrewMethodBaseSchema.shape.id` es el enum de los 6 métodos y `RecipeProfileBaseSchema.shape.id` el de los 6 perfiles de intensidad.
- `esDictionary` se arma con `deepMerge` de los JSON de `src/i18n/locales/es/`.
- Decisiones del usuario (2026-11-20): suman 4 cafeteras solo enciclopédicas (moka, sifón, cezve, filtro eléctrica). Las variantes regionales de las bebidas van dentro de la ficha base.

## Goals / Non-Goals

**Goals:**
- Darle a `C-10` contratos tipados y estables para las secciones `cafeteras` y `bebidas`, con la misma forma de consulta que las secciones de `C-09`.
- No cambiar el comportamiento de `WIKI_CATALOG`, `filterWikiEntries` ni de la rueda SCA (`C-11` sigue enlazando solo a orígenes, varietales y procesos).

**Non-Goals:**
- Rutas, vistas o buscador global (son de `C-10`).
- Cálculo de bebidas con leche en la estación de preparación ni recetas nuevas en `src/data/recipes/`.
- Otras secciones futuras (tueste, molienda, glosario).

## Decisions

### D1. Esquemas propios en lugar de ampliar `WikiEntrySchema`
- **Elección**: `BrewerEntrySchema` en `brewer.schema.ts` y `DrinkEntrySchema` en `drink.schema.ts`. Los campos comunes (slug, `regionalRelevance`, `titleKey`, `summaryKey`, `commercialAliasesKey`, `sensoryProfile`, `flavorNodeIds`) se reusan desde `wiki.schema.ts`. Para eso se exporta allí un objeto `WikiEntryCommonFields` sin `recommendedMethods`, y `WikiEntryBaseFields` lo extiende con `recommendedMethods`, sin cambiar el esquema resultante.
- **Por qué**: las cafeteras enciclopédicas no tienen método, así que no cumplen `recommendedMethods.min(1)`. Sumarlas a la unión obligaría a cambiar `getWikiEntrySubGroup`, `groupWikiEntriesBySubGroup`, `getWikiEntriesByFlavorNode` y la integración de `C-11`. Con esquemas separados, `C-09` y `C-11` no cambian, y `C-10` igual puede combinar las 5 secciones desde su registro `sections.ts`.
- **Alternativa descartada**: agregar `brewer | drink` a la unión discriminada, porque modifica una capacidad archivada y obliga a migrar sus selectores y tests.

### D2. Forma de la ficha de cafetera
- `family`: `drip_filter` (V60, Chemex, Melitta, filtro eléctrica), `immersion` (prensa francesa, AeroPress, sifón), `pressure` (máquina de espresso, moka) y `decoction` (cezve).
- `history`: `{ inventorKey, originCountryKey, eraKey, howItWorksKey }`. La época es texto (por ejemplo "1908" o "siglo XVI") porque varias fechas son aproximadas; no se ordena por año.
- `methodId: BrewMethodId | null` y `recipeIds: string[]`. Con `.superRefine`: si `methodId` es `null`, `recipeIds` tiene que estar vacío y se exige `traditionalPreparationKey`. Si hay método, `recipeIds.min(1)`.
- La pertenencia de cada receta al método y la inclusión de la receta por defecto se validan en el chequeo de integridad (D4), no en el esquema, porque necesitan el catálogo de recetas.
- Las recetas se separan en "destacadas" y "tradicionales" con el `kind` que ya tiene cada receta (`author` frente a `standard | classic`). No se agrega otro campo.

### D3. Forma de la ficha de bebida
- `family`: `espresso_black | espresso_milk | cold`.
- `composition`: `{ coffee, milk, water, foam }` en enteros `0..100` que suman 100, validado con `.superRefine`. Así se puede dibujar la taza por capas en `C-10` y filtrar por "con leche" (`milk + foam > 0`).
- `servedVolumeMl: { min, max }` con `max >= min`.
- `baseBrewerSlugs: string[].min(1)` enlaza la bebida con sus cafeteras (por ejemplo, `cold-brew` con `french-press`), y también sirve para la consulta inversa "bebidas de esta cafetera".
- `brewLink: { methodId, profileId } | null`: espresso → `normale`, ristretto → `ristretto`, lungo → `lungo`. Las bebidas con leche enlazan al shot base `espresso` + `normale`, y `cold-brew` queda en `null`. El par se valida en D4.
- `history`: `{ originCountryKey, eraKey, historyKey, preparationKey }`.
- `regionalVariants: { id, nameKey, regionKey, descriptionKey }[]`, con `id` kebab-case único dentro de la ficha. Ejemplos: lágrima (Argentina y Uruguay) en `latte`, cortado en jarrito (Argentina) en `cortado`, café con leche con medialunas en `cafe-con-leche` y carajillo (España) en `americano` o `espresso`. El contenido final se cierra en apply con fuentes verificables.

### D4. Validador de integridad puro
- `validateBrewersAndDrinksIntegrity({ brewers, drinks, wikiEntries, flavorTree, methods, recipes })` vive en `drink.schema.ts` (importa los tipos de cafetera). Igual que `validateSensoryCatalogIntegrity`, devuelve `{ valid, errors[] }` y no lanza excepciones.
- Reglas: slugs únicos en cafeteras + bebidas + `WIKI_CATALOG`; cada `methodId` del enum aparece en exactamente una cafetera; cada `recipeId` existe, tiene el mismo `methodId` que su cafetera y la lista incluye `getDefaultRecipeForMethod(methodId).id`; cada `flavorNodeId` existe; cada `brewLink` es un par válido; cada `baseBrewerSlug` existe; los `id` de variantes no se repiten dentro de cada bebida.
- **Por qué recibe el catálogo de recetas como parámetro**: así el esquema no importa datos y los tests pueden pasar catálogos falsos para probar cada error.

### D5. Ubicación de datos y selectores
- `src/data/wiki-brewers/{brewers.data.ts,index.ts}` y `src/data/wiki-drinks/{drinks.data.ts,index.ts}`, igual que `src/data/flavor-wheel/`. Las colecciones se exportan congeladas en profundidad (`Object.freeze` en la ficha, `sensoryProfile`, `history`, arrays y variantes), como `freezeEntry` de `C-09`.
- Cafeteras: `BREWERS_CATALOG`, `BREWERS_BY_SLUG`, `getBrewerBySlug`, `getBrewerForMethod`, `getBrewerRecipes` (resuelve con `RECIPES_BY_ID` en el orden declarado), `groupBrewersByFamily` (orden fijo `drip_filter → immersion → pressure → decoction`) y `filterBrewers`.
- Bebidas: `DRINKS_CATALOG`, `DRINKS_BY_SLUG`, `getDrinkBySlug`, `getDrinksForBrewer`, `groupDrinksByFamily` (orden fijo `espresso_black → espresso_milk → cold`) y `filterDrinks`. El texto que se busca incluye `nameKey` de cada variante y sus alias.

### D6. Módulo de búsqueda compartido
- `normalizeSearchText` y `matchesSensoryThresholds(profile, { minAcidity, minSweetness, minBody, maxBitterness })` pasan de `src/data/wiki/index.ts` a `src/data/wiki/search.ts`. Los tres catálogos lo importan. `filterWikiEntries` mantiene firma y resultados (requisito "Existing Wiki Search Behavior Is Preserved"). Los tests de `C-09` existentes actúan como red de regresión.
- **Alternativa descartada**: copiar las funciones en cada módulo, porque la búsqueda sin acentos se desalinearía entre secciones.

### D7. Diccionarios
- `src/i18n/locales/es/brewers.json` (raíz `wiki.brewers`) y `drinks.json` (raíz `wiki.drinks`), más `wiki.brewerFamilies.*` y `wiki.drinkFamilies.*` para los títulos de grupo. Se agregan a la cadena de `deepMerge` de `esDictionary` para que `TranslationKey` los incluya.
- Contenido con datos concretos y sin relleno (`no-ai-slop`): inventor, año o época, país, mecanismo físico y proporciones. Fuentes de referencia para apply: historia de Melitta Bentz (1908), Peter Schlumbohm (Chemex, 1941), Hario (V60, 2004), Alan Adler (AeroPress, 2005), Attilio Calimani (patente de prensa, 1929), Moriondo, Bezzera y Pavoni, y Gaggia (espresso, 1884–1948), Alfonso Bialetti (moka, 1933), Loeff y Vassieux (sifón, década de 1830/1840), cezve otomana (siglo XVI), Wigomat, Moccamaster y Mr. Coffee (goteo, 1954–1972). Toda fecha dudosa se escribe como época.

## Risks / Trade-offs

- [Datos históricos discutidos (prensa francesa, espresso)] → usar épocas y redacción con "patentada por" o "popularizada por" en lugar de afirmar un único inventor; evitar cifras sin fuente.
- [Las proporciones de bebidas varían por cafetería] → la composición representa la versión canónica (SCA o barra italiana), y las variantes regionales describen las diferencias.
- [Dos fuentes de verdad de búsqueda si `C-10` combina secciones] → `search.ts` compartido; `C-10` solo combina resultados.
- [Un perfil sensorial `1..5` para una cafetera es aproximado (depende del café)] → se documenta como "perfil típico en taza" en el resumen de la sección, no como una medición.
- [Agregar un método futuro al enum rompe la regla "un método = una cafetera"] → el test falla a propósito y obliga a crear la ficha.

## Migration Plan

Cambio aditivo, sin datos de usuario ni almacenamiento. Para revertir alcanza con quitar los módulos nuevos y volver a la versión anterior de `search.ts` en `src/data/wiki/index.ts`.
