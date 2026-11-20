# Proposal — C-10 `sensory-wiki-explorer-ui`

> **Revisión 2 (2026-11-19)**: al revisar el primer mockup el usuario pidió separar cada tema (no mezclar orígenes, varietales y procesos), sumar **Cafeteras** y **Bebidas** a la Wiki y reemplazar las barras sensoriales por una rueda radial. El contenido nuevo va en `C-15 wiki-brewers-and-drinks-catalog`, que pasa a ser dependencia de este change.

## Why

C-09 dejó el catálogo de orígenes, varietales y procesos, pero `/wiki` y `/wiki/:category/:entrySlug` siguen mostrando placeholders con categorías inventadas (`granos`, `molienda`, `agua`…), y el buscador global enlaza a esas fichas falsas. Además, una Wiki que mezcla en una sola lista temas de naturaleza distinta (un país, una planta, un método de beneficio, una cafetera, una bebida) resulta confusa: cada sección necesita su propia puerta de entrada y sus propios filtros. Sin esta change no se cumple `US-009` ni el tramo Wiki → Preparación del Flujo 4.

## What Changes

- **Portada `/wiki`** (reemplaza `WikiIndexView` placeholder): una tarjeta por sección — **Orígenes**, **Varietales**, **Procesos**, **Cafeteras**, **Bebidas** — con descripción y cantidad de fichas.
- **Página de sección `/wiki/:section`** (`origenes | varietales | procesos | cafeteras | bebidas`): solo las fichas de esa sección, agrupadas por su subgrupo, con buscador instantáneo y filtros propios (subgrupo, perfil en taza y familia SCA donde aplique); estado en la URL para volver atrás sin perder la búsqueda.
- **Ficha `/wiki/:section/:entrySlug`** (reemplaza `WikiEntryView` placeholder):
  - **Rueda sensorial** radial de 4 sectores (Acidez, Dulzor, Cuerpo, Amargor) con anillos 1..5, en lugar de barras.
  - Encabezado y metadatos propios de la sección (orígenes: altitud, región, cosecha; varietales: especie, linaje, descubrimiento; procesos: fermentación, mucílago, secado; cafeteras: origen, historia, recetas tradicionales; bebidas: origen, historia, proporciones).
  - Notas de cata enlazadas a `/flavor-wheel?node=<id>`.
  - Botón de un toque **"Preparar en {Método} ({Perfil})"** a `/brew/:methodSlug?profile=:profileId`.
  - Sección o slug inexistente → vista 404.
- **Rutas**: se agrega `/wiki/:section` y el segmento de la ficha pasa a ser la sección en español (**BREAKING** para las URLs placeholder `/wiki/granos/...`, que no tenían contenido real).
- **Buscador global**: indexa las fichas reales de las 5 secciones, indicando la sección.
- Limpieza de claves i18n placeholder de `wiki.*` y nuevas claves de UI.

## Capabilities

### New Capabilities
- `sensory-wiki-explorer-ui`: navegación de la Wiki del Café en la interfaz — portada por secciones, página de sección con búsqueda y filtros propios, ficha con rueda sensorial, metadatos por sección, notas enlazadas a la rueda y preparación en un toque, y fichas en el buscador global.

### Modified Capabilities
- `app-shell-and-foundation`: las rutas públicas canónicas incorporan `/wiki/:section` y la ficha pasa a `/wiki/:section/:entrySlug`.

## Impact

- **Depende de**: `C-15 wiki-brewers-and-drinks-catalog` (esquemas y fichas de Cafeteras y Bebidas), que a su vez depende de `C-13 multi-recipe-catalog-and-custom-recipes-domain` para enlazar las recetas de cada cafetera. Orígenes, varietales y procesos usan el catálogo de C-09 tal cual.
- **Código nuevo**: `src/features/wiki/views/` (`WikiHomeView`, `WikiSectionView`, `WikiEntryDetailView`), `src/features/wiki/components/` (`SensoryWheel`, `WikiSectionCard`, `WikiEntryCard`, `WikiSectionFilters`, `RecommendedMethodCard`, `FlavorNoteChips`, metadatos por sección), `src/features/wiki/hooks/useWikiSectionFilters.ts`.
- **Código modificado**: `src/App.tsx`, `src/shared/components/GlobalSearch.tsx`, `src/i18n/locales/es/ui.json`.
- **Código eliminado**: `src/features/wiki/WikiIndexView.tsx` y `WikiEntryView.tsx` placeholder.
- **Sin cambios** en `src/domain/` ni en `src/data/` desde este change.
- **Fuera de alcance**: rueda interactiva `/flavor-wheel` (C-11), secciones futuras (Tueste, Molienda, Glosario, Autores, Asociaciones; ver "Backlog futuro" en `CHANGES.md`), favoritos, imágenes por ficha, otros idiomas.
