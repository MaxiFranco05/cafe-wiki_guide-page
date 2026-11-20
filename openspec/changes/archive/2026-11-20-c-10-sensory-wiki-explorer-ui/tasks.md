# Tasks — C-10 `sensory-wiki-explorer-ui`

> **Gate visual**: mockup v3.1 aprobado (`design.md` → `Approval: approved`, 2026-11-20). Criterio de aceptación: `mockups/wiki-v3-1.html` y `mockups/previews/c10v31-*.png`, excepto los textos de muestra de historia y simbología (`EDITORIAL`), que no se implementan (D11).
> Skills Agente C a cargar antes de codificar: `vercel-react-best-practices`, `vercel-composition-patterns`, `tailwind-design-system`, `impeccable`, `emil-design-eng`, `svg-animation`, `modern-web-guidance`; para la tabla de relación, `zod` y `vitest`. Strict TDD: cada test se escribe y se ve fallar antes de implementar.

## 0. Assets y design system

- [x] 0.1 Registrar las 7 fotos nuevas (`melitta`, `aeropress`, `french-press`, `moka`, `siphon`, `cezve`, `electric-drip`) en `design-system/README.md` y `brand.md`, subir a `Revision: 5` (sin cambios de tokens) y verificar que existen también en `public/images/coffee/`

## 1. Datos: relación origen ↔ varietal

- [x] 1.1 Test + implementación de `OriginVarietalsSchema` en `src/domain/schemas/wiki.schema.ts` (mapa slug de origen → lista no vacía de slugs de varietal, sin duplicados)
- [x] 1.2 Test + implementación de `src/data/wiki/origin-varietals.ts` con el mapa aprobado en el mockup y selectores puros `getVarietalsForOrigin` / `getOriginsForVarietal`; test de integridad referencial (cada slug existe y es de la categoría correcta) y de simetría de la derivación

## 2. i18n, registro de secciones y helpers

- [x] 2.1 Claves `wiki.ui.*` en `src/i18n/locales/es/ui.json` (portada, secciones, buscador, filtros, contador, vacío, capítulos, índice "En esta ficha", hechos clave, "Predomina", rueda, composición, relaciones, "Preparar en {method} ({profile})", "Preparar esta receta", "Conocer la {brewer}", epígrafes de fotos, volver); eliminar `wiki.categories.*`, `wiki.entryPlaceholderBody`, `wiki.prepareWithV60` y `nav.search.entries.wiki.<categoría>` placeholder; verificar con `npx vitest run src/i18n`
- [x] 2.2 Test + implementación de `src/features/wiki/sections.ts` (5 secciones, slug → fuente, ícono, subgrupos y filtros habilitados, búsqueda de ficha por sección y slug)
- [x] 2.3 Test + implementación de `useWikiSectionFilters` (`q|grupo|perfil|familia|filtros`, valores inválidos ignorados, `replace` para `q`, `push` para filtros, `reset()`) sobre `MemoryRouter`
- [x] 2.4 Test + implementación de helpers puros: `shortProfileLabel` (todos los perfiles del catálogo), `cardProfile` (atributos ≥ 4 o el mayor), `getNoteFamilyId`, mapa familia → `--flavor-*` (9 familias), `vesselSpec` (recipiente y capacidad por volumen) y `capAliases` (máximo 3 + resto)

## 3. Componentes

- [x] 3.1 `SensoryWheel` (`full` con etiquetas, marcas y `max-width: 340px`; `compact` solo gráfico): 4 sectores, 5 anillos, relleno hasta `valor/5`; tests de geometría y `aria-label`
- [x] 3.2 `BrewerIcon` (10 cafeteras) y `BrewerPhoto` (`loading="lazy"`, epígrafe en una línea); test de ícono por slug con fallback
- [x] 3.3 `WikiSectionCard` (portada) y `WikiEntryCard` (mini rueda + línea "Predomina" + hasta 3 notas; badges de estación/recetas en cafeteras y leche/volumen en bebidas) como `<Link>`; tests de enlace y contenido
- [x] 3.4 `WikiSectionFilters` (buscador con borrar, subgrupos como `radiogroup` con conteos, panel "Perfil y sabor" con `aria-expanded`, chips `aria-pressed`); tests de interacción
- [x] 3.5 `WikiChapter` (numeración recibida por props) y `WikiChapterIndex` (sticky, scroll al capítulo, foco en el título, sin animación con movimiento reducido); tests de numeración consecutiva con capítulos omitidos y de navegación
- [x] 3.6 `FlavorNoteChips` (`/flavor-wheel?node=…&from=<sección>/<slug>`), `RecommendedMethodCard` (primario/secundario + "Conocer la {cafetera}"), `RecipeTabs` (De autor / Tradicionales, `?recipe=`), `DrinkComposition` (D9) y bloques de hechos por sección; tests de URLs y de campos por sección
- [x] 3.7 Capítulos de relación: "Varietales que se cultivan", "Dónde se cultiva" y "Cafés que lucen en esta cafetera" (agrupados por sección con perfil); tests con relaciones y sin ellas (capítulo omitido)
- [x] 3.8 `WikiStoryChapter` con contenido editorial opcional (párrafos, simbología, hitos) probado con datos de prueba; sin contenido devuelve `null`

## 4. Vistas y rutas

- [x] 4.1 `WikiHomeView` (`/wiki`): hero y 5 tarjetas con conteo; test sin lista combinada
- [x] 4.2 `WikiSectionView` (`/wiki/:section`): grupos, contador `aria-live`, vacío con limpiar, 404 para sección desconocida; tests (orígenes = 16, `etiopia`, `geisha` no aparece en orígenes, África, Acidez alta, Frutal en varietales, volver atrás restaura filtros)
- [x] 4.3 `WikiEntryDetailView` (`/wiki/:section/:entrySlug`): encabezado con hechos y alias acotados, rueda + CTA + índice, capítulos por sección en el orden de D5, orden mobile encabezado → rueda → CTA → capítulos; tests (Kenia con varietal relacionado, Brasil sin capítulo de historia y numeración desde 01, cafetera con recetas primero, cafetera enciclopédica, bebida con composición, `/wiki/procesos/kenya` → 404)
- [x] 4.4 Cablear rutas en `src/App.tsx`, borrar `WikiIndexView.tsx`/`WikiEntryView.tsx` placeholder y actualizar `AppLayout.test.tsx`
- [x] 4.5 Tests de integración: "Preparar en Hario V60 (Liviano)" desde Kenia → `/brew/v60?profile=light` con Liviano seleccionado; "Preparar esta receta" desde la ficha V60 → estación con esa receta; "Conocer la Hario V60" → `/wiki/cafeteras/v60`

## 5. Buscador global y documentación

- [x] 5.1 `GlobalSearch` indexa las fichas de las 5 secciones desde el registro; actualizar `GlobalSearch.test.tsx` (`geisha` → `/wiki/varietales/geisha`; sin categorías placeholder)
- [x] 5.2 Actualizar rutas de ficha en `knowledge-base/03_actores_y_roles.md` y `07_flujos_principales.md` (`/wiki/:section/:entrySlug`)

## 6. Verificación

- [x] 6.1 `npx vitest run`, `npx tsc --noEmit` y `npm run build` sin errores; `grep` sin hex sueltos, `any`, `@ts-ignore`, emojis ni textos hardcodeados en `src/features/wiki/`
- [x] 6.2 Visual verify contra el mockup v3.1 (portada, sección, fichas de origen con y sin historia, varietal, cafetera con estación, cafetera enciclopédica y bebida, a 1440×900, 900×1000 y 390×844 en `mockups/verify/`), consola y red limpias, registrar `Visual verify:` en `design.md` y detener el server

## Workflow follow-up

- Archivar con `/opsx:archive c-10-sensory-wiki-explorer-ui`, marcar `[x]` C-10 en `CHANGES.md` y sincronizar las specs `sensory-wiki-explorer-ui` y `app-shell-and-foundation`.
- Registrar en `CHANGES.md` el catálogo editorial C-16 (historia, simbología e hitos con fuentes para las 60 fichas, y fuentes para la tabla origen ↔ varietal) y la optimización de imágenes en C-12.
- Incluir la tabla `Auditoría de Skills Utilizadas` y el bloque de próximo change/modelos al cerrar.
