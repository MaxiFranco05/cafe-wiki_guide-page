# Tasks

> Skills (Agente B): `zod`, `typescript-advanced-types`, `vitest`, `no-ai-slop`. Strict TDD. Sin imports de React, DOM ni `window` en `src/domain/` ni `src/data/`. Governance MEDIO: avisar al usuario antes de cerrar la lista de variantes regionales y de fechas dudosas.

## 1. Módulo de búsqueda compartido (`src/data/wiki/search.ts`)

- [x] 1.1 **[TDD RED]** Crear `src/data/wiki/__tests__/search.test.ts` o agregar el bloque en `src/domain/__tests__/` con tests de `normalizeSearchText` (tildes, mayúsculas, espacios) y `matchesSensoryThresholds` (cada umbral por separado y combinados). Verificar que fallan porque el módulo no existe.
- [x] 1.2 **[TDD GREEN / REFACTOR]** Mover las dos funciones de `src/data/wiki/index.ts` a `search.ts` y hacer que `filterWikiEntries` las importe. Verificar con `npx vitest run src/domain/__tests__/wiki-and-flavor-wheel.catalog.test.ts` que los tests de `C-09` siguen en verde sin cambios (requisito "Existing Wiki Search Behavior Is Preserved").

## 2. Esquemas Zod (`src/domain/schemas/`)

- [x] 2.1 **[TDD RED]** Crear `src/domain/__tests__/brewers-and-drinks.schema.test.ts`. Para `BrewerEntrySchema`: cafetera válida con método, cafetera enciclopédica válida (`methodId: null`, `recipeIds: []`, `traditionalPreparationKey`) y rechazos (puntaje `0`/`6`/`3.5`, familia desconocida, slug no kebab, `methodId: null` sin preparación tradicional, `methodId: null` con recetas, método sin recetas). Para `DrinkEntrySchema`: cappuccino válido y rechazos (composición que suma 95 o 105, porcentaje negativo o decimal, volumen invertido, `baseBrewerSlugs` vacío, id de variante no kebab).
- [x] 2.2 **[TDD GREEN]** Extraer `WikiEntryCommonFields` en `wiki.schema.ts` sin cambiar `WikiEntrySchema` (los tests de `C-09` siguen en verde). Implementar `brewer.schema.ts` y `drink.schema.ts` con tipos `z.infer` y reexportarlos en `src/domain/schemas/index.ts`. Verificar con `npx vitest run src/domain/__tests__/brewers-and-drinks.schema.test.ts`.
- [x] 2.3 **[TDD RED → GREEN]** Agregar tests de `validateBrewersAndDrinksIntegrity` con catálogos falsos: receta de otro método, receta inexistente, falta la receta por defecto, método con 0 o 2 cafeteras, `brewLink` `espresso` + `light`, cafetera base inexistente, nodo SCA inexistente, slug que repite un slug de `WIKI_CATALOG`, variante duplicada. Cada caso tiene que generar un error que nombre la referencia rota. Implementar el validador hasta pasar.

## 3. Catálogo de Cafeteras (`src/data/wiki-brewers/` y `es/brewers.json`)

- [x] 3.1 **[TDD RED]** Crear `src/domain/__tests__/brewers-and-drinks.catalog.test.ts` (bloque Cafeteras): exactamente los 10 slugs del spec, todos válidos con el esquema, los 6 métodos con una cafetera cada uno, las 4 enciclopédicas sin método ni recetas, `getBrewerRecipes('v60')` incluye `v60-standard` en el orden declarado, `getBrewerRecipes('moka')` vacío, colecciones congeladas en profundidad y 100% de claves resueltas en español sin emojis.
- [x] 3.2 **[TDD GREEN]** Escribir `brewers.data.ts` (familias, historia, `recipeIds` tomados de `src/data/recipes/`, perfil típico y notas SCA existentes) y `src/i18n/locales/es/brewers.json` con datos concretos (inventor, época, país, mecanismo; ver design D7) e integrarlo en `esDictionary`. Verificar con el test del bloque.
- [x] 3.3 **[TDD TRIANGULATE]** Agregar tests de selectores: `getBrewerForMethod('espresso')` devuelve `espresso-machine`, `filterBrewers({ query: 'bialetti' })` devuelve `moka`, `{ hasBrewStation: false }` devuelve las 4 enciclopédicas, filtros por familia, relevancia, nodo SCA (con descendientes) y umbrales, `groupBrewersByFamily` en orden fijo, slug inexistente devuelve `undefined`. Verificar que pasan.

## 4. Catálogo de Bebidas (`src/data/wiki-drinks/` y `es/drinks.json`)

- [x] 4.1 **[TDD RED]** Ampliar `brewers-and-drinks.catalog.test.ts` (bloque Bebidas): exactamente los 12 slugs, familias según el spec, ninguna ficha `lagrima`, la variante lágrima dentro de una bebida con leche con región Argentina/Uruguay, composición que suma 100, colecciones congeladas y 100% de claves (incluidas las de variantes) resueltas sin emojis.
- [x] 4.2 **[TDD GREEN]** Escribir `drinks.data.ts` (composición canónica, volumen, `baseBrewerSlugs`, `brewLink`, variantes regionales con prioridad Cono Sur) y `src/i18n/locales/es/drinks.json`, e integrarlo en `esDictionary`. Antes de cerrar, mostrar al usuario la lista de variantes por bebida y las fechas marcadas como época. Verificar con el test del bloque.
- [x] 4.3 **[TDD TRIANGULATE]** Agregar tests de selectores: `filterDrinks({ query: 'lagrima' })` devuelve la bebida base, `getDrinksForBrewer('espresso-machine')` incluye `espresso` y `cappuccino`, `{ hasMilk: false }` solo devuelve bebidas con leche y espuma en 0, filtros por familia, relevancia, nodo SCA y umbrales, y `groupDrinksByFamily` en orden fijo. Verificar que pasan.

## 5. Integración y cierre

- [x] 5.1 Agregar en `brewers-and-drinks.catalog.test.ts` el chequeo `validateBrewersAndDrinksIntegrity` sobre los catálogos reales (`BREWERS_CATALOG`, `DRINKS_CATALOG`, `WIKI_CATALOG`, `FLAVOR_WHEEL_TREE`, `METHODS_CATALOG`, `RECIPES_CATALOG`) sin errores. Verificar que pasa.
- [x] 5.2 Ejecutar `npx vitest run`, `npx tsc --noEmit` (o `npm run build`) y `npm run lint` si existe: 0 errores. Confirmar con grep que `src/domain/` y los módulos nuevos de `src/data/` no importan `react`, `window` ni `navigator`, y que no hay `any`, `@ts-ignore` ni `as unknown as`.
- [x] 5.3 Actualizar `openspec/changes/c-10-sensory-wiki-explorer-ui/design.md` (Context y D5) con los nombres reales de los selectores y campos de Cafeteras y Bebidas, para que el mockup v2 de `C-10` parta de los datos reales. Verificar que `openspec validate c-10-sensory-wiki-explorer-ui` pasa.

## Workflow follow-up

- Archivar con `/opsx:archive c-15-wiki-brewers-and-drinks-catalog` y marcar `[x] [C-15]` en `CHANGES.md`.
- Incluir la tabla `Auditoría de Skills Utilizadas` y el bloque de pase hacia `C-10` (modelo, governance y effort).
- Commit con Conventional Commits y push a `dev` solo con confirmación del usuario.
