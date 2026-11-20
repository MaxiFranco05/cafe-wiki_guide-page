# Design — C-10 `sensory-wiki-explorer-ui`

## UI Mockups

- **Design system revision**: 4 (`design-system/README.md`, aprobado 2026-11-17)
- **Decision**: yes (2026-11-19)
- **Mockups**: v1 `mockups/wiki-explorer-v1.html` **rechazada** (2026-11-19, ver `mockups/README.md`); v2 pendiente hasta que C-15 defina Cafeteras y Bebidas
- **Approval**: pending
- **Preview**: v1 rendered (2026-11-19, `mockups/previews/v1/`); v2 pendiente
- **Visual verify**: —

### Feedback del usuario sobre v1 (2026-11-19)

- El explorador mezclaba orígenes, varietales y procesos en una lista "Todos": desorganizado y poco intuitivo.
- La Wiki debe sumar **Cafeteras** (origen, mejores recetas y tradicionales) y **Bebidas** (cappuccino, ristretto, etc., con su origen).
- Reemplazar las barras de Acidez/Dulzor/Cuerpo/Amargor por una rueda radial tipo "rueda de rendimiento", manteniendo esos 4 atributos.
- Decisiones elegidas: portada + página por sección; rueda con los 4 atributos actuales; contenido nuevo en un change de catálogo previo (C-15); Tueste, Molienda, Glosario, Autores y Asociaciones quedan para el futuro.

### Design Brief (v2)

- **Audiencia y tarea**: explorador de café de especialidad (*Explore*): elige primero **qué** quiere conocer (un país, una planta, un proceso, una cafetera, una bebida) y después compara dentro de ese tema.
- **Pantallas y estados**: portada `/wiki`; sección `/wiki/:section` (sin filtros, filtrada, sin resultados); ficha de origen, varietal, proceso, cafetera y bebida; 404.
- **Responsive**: 390×844 y 1440×900. En mobile la ficha va encabezado → rueda sensorial → cómo prepararlo → características → notas.
- **Tokens / assets**: solo `tokens.css`; `--accent-primary`/`--accent-gold` para el relleno de la rueda, `--flavor-*` para familias SCA; fotos de `design-system/assets/photos/` en las tarjetas de sección de la portada. Cero hex sueltos.
- **Se conserva de v1**: shell real, estilo de tarjetas y chips, jerarquía de botones "Preparar en…" (primero primario, resto secundario), orden mobile de la ficha.
- **Restricciones**: sin emojis, iconos SVG inline, objetivos táctiles ≥ 44 px, textos vía i18n, motion solo `transform`/`opacity`/color con `prefers-reduced-motion`.

## Context

`/wiki` y `/wiki/:category/:entrySlug` existen como rutas (`App.tsx`) pero renderizan placeholders con 5 categorías ficticias. C-09 dejó el catálogo de orígenes, varietales y procesos (`WIKI_CATALOG`, 38 fichas) con selectores puros en `src/data/wiki/index.ts` (`filterWikiEntries`, `getWikiEntryByCategoryAndSlug`, `getWikiEntrySubGroup`, `groupWikiEntriesBySubGroup`) y el árbol SCA en `src/data/flavor-wheel/`. C-15 aportará Cafeteras y Bebidas con selectores de la misma forma. La estación ya resuelve `?profile=` con `resolveInitialProfileId`. `GlobalSearch` indexa entradas wiki falsas.

## Goals / Non-Goals

**Goals:**
- Una sola definición de secciones (`WIKI_SECTIONS`: slug en español, clave i18n, fuente de datos, subgrupos, filtros habilitados) que alimente portada, rutas, página de sección y buscador global.
- Estado de cada sección serializado en la URL, sin duplicarlo en React.
- `SensoryWheel` reutilizable (C-11 puede usarlo en su panel de cata).

**Non-Goals:**
- Una lista combinada de todas las secciones.
- Virtualización o paginación (< 100 fichas por sección).
- Secciones futuras (Tueste, Molienda, Glosario, Autores, Asociaciones).

## Decisions

### D1 — Registro de secciones
`src/features/wiki/sections.ts` declara las 5 secciones (`origenes → origin`, `varietales → varietal`, `procesos → process`, `cafeteras`, `bebidas`) con su clave de título y descripción, la función que devuelve sus fichas, su agrupación y qué filtros muestra. Portada, `WikiSectionView`, `WikiEntryDetailView` y `GlobalSearch` leen de ahí; agregar una sección futura es agregar una entrada.
- *Alternativa descartada*: un componente por sección — duplicaría búsqueda, filtros y tarjetas.

### D2 — Rutas
`/wiki` → `WikiHomeView`; `/wiki/:section` → `WikiSectionView`; `/wiki/:section/:entrySlug` → `WikiEntryDetailView`. La sección se valida contra el registro; el slug de ficha es el del catálogo (`kenya`, `geisha`). Cualquier fallo → `NotFoundView`.

### D3 — Filtros por sección en la URL (`useWikiSectionFilters`)
`useSearchParams` como fuente de verdad: `q`, `grupo` (subgrupo de la sección), `perfil` (`acidez,dulzor,cuerpo,amargor` → `minAcidity: 4`, `minSweetness: 4`, `minBody: 4`, `maxBitterness: 2`) y `familia` (id de familia SCA). Valores desconocidos se ignoran. La búsqueda escribe con `replace`, filtros con `push`.

### D4 — Rueda sensorial (`SensoryWheel`)
SVG propio, sin librería: 4 sectores de 90°, 5 anillos concéntricos y radios guía; cada sector es un `path` de anillo circular desde el centro hasta `r = valor / 5 · R`, rellenado con gradiente `--accent-primary → --accent-gold`. Etiquetas fuera del círculo y el valor `N/5` junto a cada una. `role="img"` con `aria-label` que enumera los 4 valores. Versión `compact` (sin etiquetas, ~56 px) para las tarjetas.
- *Alternativa descartada*: radar poligonal — con 4 ejes queda un rombo poco legible; los sectores rellenos replican la "rueda de rendimiento" pedida.

### D5 — Ficha por sección
`WikiEntryDetailView` resuelve la ficha desde el registro y elige el bloque de metadatos con un `switch` exhaustivo sobre la sección (orígenes, varietales, procesos de C-09; cafeteras y bebidas con los campos de C-15). Los bloques comunes (encabezado, rueda, notas, preparar) se comparten.

### D6 — Preparar en un toque
`RecommendedMethodCard` usa la etiqueta corta del perfil (texto antes de ` (`, p. ej. "Liviano") vía `shortProfileLabel`, y un `<Link to={`/brew/${methodId}?profile=${profileId}`}>` (no `navigate` en handler) para teclado, clic medio y lectores de pantalla.

### D7 — Notas y familias
Familia raíz con `FLAVOR_LINEAGE_BY_ID[id][0]`; color del punto desde un mapa familia → token `--flavor-*` (no el `colorHex` del catálogo). Chips como `<Link to={`/flavor-wheel?node=${id}&from=${section}/${entrySlug}`}>` (`from` lo usa C-11 para el enlace "Volver a {ficha}").

### D8 — Buscador global
`GlobalSearch` construye el índice desde el registro de secciones (título, nombres alternativos y nombre de sección como subtítulo). Se eliminan `WIKI_ENTRIES_CONFIG` y las claves placeholder.

### D9 — Accesibilidad
Tarjetas de sección y de ficha como un único `<Link>`; filtros `<button aria-pressed>`; selector de subgrupo como grupo de radios; contador de resultados `aria-live="polite"`.

## Risks / Trade-offs

- [C-15 todavía no definió los campos de Cafeteras y Bebidas] → el mockup v2 y las tareas de esas fichas se completan después de C-15; D5 deja el `switch` exhaustivo para que TypeScript marque lo que falte.
- [Cambian las URLs de ficha (`/wiki/origin/kenya` en la KB → `/wiki/origenes/kenya`)] → actualizar `knowledge-base/03_actores_y_roles.md` y `07_flujos_principales.md` al aplicar.
- [Rueda de 4 sectores con valores bajos se ve casi vacía] → anillos y radios guía siempre visibles, y valor numérico junto a cada etiqueta.
- [`shortProfileLabel` depende del formato "Nombre (Detalle)"] → test que recorre todos los perfiles del catálogo.

## Migration Plan

Solo UI en cliente. Las URLs placeholder (`/wiki/granos/bourbon`, etc.) pasan a 404; no estaban enlazadas fuera de la app. Rollback = revertir el commit.
