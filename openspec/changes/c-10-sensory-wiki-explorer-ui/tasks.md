# Tasks — C-10 `sensory-wiki-explorer-ui`

> **Bloqueado por C-15** (`wiki-brewers-and-drinks-catalog`): no iniciar hasta que C-15 esté archivado.
> **Gate visual**: no iniciar el grupo 1 hasta que `design.md` → `## UI Mockups` registre `Approval: approved` para el mockup v2.
> Skills Agente C a cargar antes de codificar: `vercel-react-best-practices`, `vercel-composition-patterns`, `tailwind-design-system`, `impeccable`, `emil-design-eng`, `svg-animation`, `modern-web-guidance`. Strict TDD: cada test se escribe y se ve fallar antes de implementar.

## 0. Mockup v2

- [ ] 0.1 Regenerar el snapshot con los datos de C-09 + C-15 y crear `mockups/wiki-v2.html`: portada con 5 secciones, `/wiki/origenes` y `/wiki/bebidas` (sin filtros, filtrada, vacía) y fichas de origen, cafetera y bebida con rueda sensorial; capturas 1440×900 y 390×844 en `mockups/previews/`; registrar `Preview: rendered` y pedir aprobación

## 1. i18n y registro de secciones

- [ ] 1.1 Claves `wiki.ui.*` en `src/i18n/locales/es/ui.json` (portada, nombres y descripciones de sección, buscador, filtros, contador, vacío, encabezados de ficha, metadatos por sección, rueda, "Preparar en {method} ({profile})", volver); eliminar `wiki.categories.*`, `wiki.entryPlaceholderBody`, `wiki.prepareWithV60` y `nav.search.entries.wiki.<categoría>` placeholder; verificar con `npx vitest run src/i18n`
- [ ] 1.2 Test + implementación de `src/features/wiki/sections.ts` (5 secciones, slug → fuente de datos, subgrupos, filtros habilitados, búsqueda por slug de ficha); verificar con `wiki-sections.test.ts`

## 2. Estado y helpers

- [ ] 2.1 Test + implementación de `useWikiSectionFilters` (`q|grupo|perfil|familia`, valores inválidos ignorados, `replace` para `q`, `push` para filtros, `reset()`) sobre `MemoryRouter`
- [ ] 2.2 Test + implementación de helpers puros: `shortProfileLabel` (todos los perfiles del catálogo), `getNoteFamilyId` y mapa familia → token `--flavor-*` (9 familias)

## 3. Componentes

- [ ] 3.1 `SensoryWheel` (`full` y `compact`): 4 sectores, 5 anillos, relleno hasta `valor/5`, etiquetas y `N/5`, `role="img"` + `aria-label`; tests de geometría (radio por valor) y accesibilidad
- [ ] 3.2 `WikiSectionCard` (portada) y `WikiEntryCard` (sección) como `<Link>`; tests de enlace y conteos
- [ ] 3.3 `WikiSectionFilters` (buscador con borrar, subgrupo, perfil y familia según la sección, `aria-pressed`); tests de interacción
- [ ] 3.4 `FlavorNoteChips`, `RecommendedMethodCard` y bloques de metadatos por sección (orígenes, varietales, procesos, cafeteras, bebidas); tests de URLs (incluido el chip de nota con `node` y `from=<sección>/<slug>`) y de campos por sección

## 4. Vistas y rutas

- [ ] 4.1 `WikiHomeView` (`/wiki`): 5 tarjetas con conteo; test sin lista combinada
- [ ] 4.2 `WikiSectionView` (`/wiki/:section`): grupos, contador `aria-live`, vacío con limpiar, 404 para sección desconocida; tests (orígenes = 16, `etiopia`, `geisha` no aparece en orígenes, África, Acidez alta, Frutal en varietales, volver atrás restaura filtros)
- [ ] 4.3 `WikiEntryDetailView` (`/wiki/:section/:entrySlug`): encabezado, rueda, metadatos por sección, notas, métodos, orden mobile; tests (Kenia, proceso sin altitud, cafetera con historia, `/wiki/procesos/kenya` → 404)
- [ ] 4.4 Cablear rutas en `src/App.tsx`, borrar `WikiIndexView.tsx`/`WikiEntryView.tsx` placeholder y actualizar `AppLayout.test.tsx`
- [ ] 4.5 Test de integración: "Preparar en Hario V60 (Liviano)" desde Kenia lleva a `/brew/v60?profile=light` con Liviano seleccionado

## 5. Buscador global y documentación

- [ ] 5.1 `GlobalSearch` indexa las fichas de las 5 secciones desde el registro; actualizar `GlobalSearch.test.tsx` (`geisha` → `/wiki/varietales/geisha`; sin categorías placeholder)
- [ ] 5.2 Actualizar rutas de ficha en `knowledge-base/03_actores_y_roles.md` y `07_flujos_principales.md` (`/wiki/:section/:entrySlug`)

## 6. Verificación

- [ ] 6.1 `npx vitest run`, `npx tsc --noEmit` y `npm run build` sin errores; `grep` sin hex sueltos, `any`, `@ts-ignore`, emojis ni textos hardcodeados en `src/features/wiki/`
- [ ] 6.2 Visual verify contra el mockup v2 aprobado (portada, sección, fichas de origen/cafetera/bebida a 1440×900 y 390×844 en `mockups/verify/`), consola y red limpias, registrar `Visual verify:` en `design.md` y detener el server

## Workflow follow-up

- Archivar con `/opsx:archive c-10-sensory-wiki-explorer-ui`, marcar `[x]` C-10 en `CHANGES.md` y sincronizar las specs `sensory-wiki-explorer-ui` y `app-shell-and-foundation`.
- Incluir la tabla `Auditoría de Skills Utilizadas` y el bloque de próximo change/modelos al cerrar.
