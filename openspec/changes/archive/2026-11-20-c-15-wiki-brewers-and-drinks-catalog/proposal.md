# Proposal

## Why

Al revisar el mockup v1 de `C-10` (2026-11-19) el usuario pidió que la Wiki separe cada tema y sume **Cafeteras** y **Bebidas** como secciones propias. Hoy el dominio solo modela orígenes, varietales y procesos (`C-09`), así que `C-10` no puede diseñar ni implementar esas dos secciones. Este change aporta el contenido y los contratos de datos que faltan, sin UI, para desbloquear el mockup v2 de `C-10`.

## What Changes

- **Esquemas Zod nuevos** (`src/domain/schemas/brewer.schema.ts` y `drink.schema.ts`), separados de `WikiEntrySchema` de `C-09`:
  - `BrewerEntrySchema`: slug, relevancia regional, título, resumen, alias, perfil sensorial típico `1..5`, notas SCA, familia (`drip_filter | immersion | pressure | decoction`), historia (inventor, país de origen, época, cómo funciona), `methodId` (nulo para las cafeteras que solo son enciclopédicas), `recipeIds` enlazados al catálogo de `C-13` y una preparación tradicional en texto para las que no tienen estación.
  - `DrinkEntrySchema`: los mismos campos base, familia (`espresso_black | espresso_milk | cold`), historia, composición en porcentajes (café / leche / agua / espuma, suma 100), rango de volumen servido, cafeteras base, enlace opcional a la estación (`methodId` + `profileId`) y variantes regionales dentro de la ficha (prioridad Cono Sur).
- **Catálogo de 10 Cafeteras**: las 6 del MVP con estación (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso-machine`) y 4 solo enciclopédicas (`moka`, `siphon`, `cezve`, `electric-drip`).
- **Catálogo de 12 Bebidas**: `espresso`, `ristretto`, `lungo`, `americano`, `cortado`, `macchiato`, `cappuccino`, `flat-white`, `latte`, `mocha`, `cafe-con-leche`, `cold-brew`. Las variantes del Cono Sur (lágrima, cortado en jarrito y otras) van como variantes de la ficha base, no como fichas propias, y se pueden buscar por su nombre.
- **Validador puro de integridad referencial** (`RN-I18N-02`): slugs únicos en todas las secciones de la Wiki; cada método del MVP tiene exactamente una cafetera; las recetas existen y pertenecen a la cafetera; cada par `methodId` + `profileId` es válido; las cafeteras base y los nodos de la rueda SCA existen; la composición suma 100.
- **Selectores puros** con la misma convención que `src/data/wiki/`: búsqueda sin acentos (también por alias y nombres de variantes), filtros por familia, relevancia, nodo SCA y umbrales sensoriales, agrupación por familia, recetas resueltas de una cafetera, cafetera de un método y bebidas de una cafetera.
- **Diccionarios `es`** nuevos (`brewers.json`, `drinks.json`) integrados en `esDictionary`, con datos concretos y sin emojis (`RN-I18N-01`).
- Extracción sin cambio de comportamiento de la normalización de búsqueda y de los umbrales sensoriales de `src/data/wiki/index.ts` a un módulo compartido.

## Capabilities

### New Capabilities
- `wiki-brewers-and-drinks-catalog`: esquemas, catálogo estático, integridad referencial, diccionarios y selectores de las secciones Cafeteras y Bebidas de la Wiki.

### Modified Capabilities
<!-- Ninguna: WikiEntrySchema, WIKI_CATALOG y sus selectores de C-09 no cambian de comportamiento. -->

## Impact

- **Código nuevo**: `src/domain/schemas/brewer.schema.ts`, `drink.schema.ts`; `src/data/wiki-brewers/`, `src/data/wiki-drinks/`; `src/data/wiki/search.ts` (módulo compartido); `src/i18n/locales/es/brewers.json`, `drinks.json`; tests en `src/domain/__tests__/`.
- **Código modificado**: `src/domain/schemas/index.ts` (reexportaciones), `src/i18n/index.ts` (merge de diccionarios), `src/data/wiki/index.ts` (usa el módulo compartido, mismo comportamiento).
- **Sin UI** y sin dependencias nuevas. Desbloquea el mockup v2 y las tareas de fichas de Cafeteras y Bebidas de `C-10`.
- **Governance**: MEDIO.
