# Design — C-10 `sensory-wiki-explorer-ui`

## UI Mockups

- **Design system revision**: 4 (`design-system/README.md`, aprobado 2026-11-17). Las 7 fotos nuevas de cafeteras se registran en el design system como Revision 5 (tarea 0.1; sin cambios de tokens ni de mockups ya aprobados).
- **Decision**: yes (2026-11-19)
- **Mockups**: v3.1 `mockups/wiki-v3-1.html` (aprobada) + `mockups/README.md`. Historial: v3 `mockups/wiki-v3.html` (Antigravity, 2026-11-20), v2 `mockups/wiki-v2.html`, v1 `mockups/wiki-explorer-v1.html` rechazada (2026-11-19).
- **Approval**: approved (2026-11-20, by user — v3.1 con relaciones entre orígenes, varietales y cafeteras)
- **Preview**: rendered (2026-11-20, `mockups/previews/c10v31-*.png`; 1440×900, 900×1000 y 390×844; consola sin errores salvo el favicon del servidor local)
- **Visual verify**: passed (2026-11-20 — app real en `localhost` vs. mockup v3.1: portada y Orígenes a 1440×900, Kenia (relaciones + "Conocer la Hario V60") y V60 (recetas primero, índice fijo y "Cafés que lucen") a 1440×900, Honey a 900×1000 (rueda contenida), Cafeteras, Moka y Cappuccino a 390×844 (orden encabezado → rueda → acción → capítulos); capturas en `mockups/verify/c10-app-*.png`; 0 errores ni warnings de consola, 0 requests fallidos. Diferencia menor: la tipografía de la app (Outfit cargada) se ve algo más condensada que en el mockup estático. No verificado en navegador: estado vacío y filtros combinados (cubiertos por tests))
- **Criterio de aceptación**: `mockups/wiki-v3-1.html` y `mockups/previews/c10v31-*.png`. Los textos de historia y simbología de las 8 fichas prototipadas (`EDITORIAL` en el mockup) **no** forman parte de la aceptación: son contenido de muestra sin fuente (ver D11).

### Historial de feedback

- **v1 (2026-11-19)**: rechazada por mezclar orígenes, varietales y procesos en una lista "Todos"; faltaban Cafeteras y Bebidas; se pidió una rueda radial en lugar de barras.
- **v2 (2026-11-20)**: estructura aprobada (portada con 5 secciones, filtros por sección, rueda de 4 sectores); se pidieron etiquetas en la mini rueda, íconos y fotos de cafeteras, escala real de volumen en bebidas y más jerarquía editorial.
- **v3 → v3.1 (2026-11-20)**: auditoría visual. Corregidos: rueda gigante en tableta, capítulo de historia que repetía el resumen con una nota interna visible, numeración fija de capítulos, título pegado a los alias. Pulido: línea "Predomina" en tarjetas, índice "En esta ficha", recetas primero en cafeteras, taza legible, alias acotados, epígrafe de foto abajo, degradé en la fila de filtros.
- **v3.1 + relaciones (2026-11-20)**: los varietales siguen siendo sección propia, enlazados en ambas direcciones con los orígenes; cada método enlaza a su cafetera y cada cafetera lista los cafés que la recomiendan.

### Design Brief (v3.1)

- **Audiencia y tarea**: explorador de café de especialidad (*Explore*): elige primero **qué** quiere conocer (país, planta, proceso, cafetera o bebida), compara dentro de ese tema y salta a preparar.
- **Pantallas y estados**: portada `/wiki`; sección `/wiki/:section` (sin filtros, filtrada, sin resultados); ficha de origen, varietal, proceso, cafetera con estación, cafetera enciclopédica y bebida; ficha con y sin contenido editorial; 404.
- **Responsive**: 390×844, 900×1000 y 1440×900. Desktop: dos columnas, con la rueda y el CTA arriba a la derecha y el índice "En esta ficha" fijo. Por debajo de 1024 px: una columna en el orden encabezado → rueda → CTA → capítulos, sin índice.
- **Tokens / assets**: solo `tokens.css`; `--accent-primary`/`--accent-gold` para la rueda y los CTA, `--flavor-*` para familias SCA, `--svg-*` para la taza; 10 fotos de cafeteras y `beans-moody.jpg` de `design-system/assets/photos/` (servidas desde `public/images/coffee/`). Cero hex sueltos.
- **Restricciones**: sin emojis, iconos SVG inline, objetivos táctiles ≥ 44 px, textos vía i18n, motion solo `transform`/`opacity`/color con `prefers-reduced-motion`.

## Context

`/wiki` y `/wiki/:category/:entrySlug` existen como rutas (`App.tsx`) pero renderizan placeholders con 5 categorías ficticias. C-09 dejó el catálogo de orígenes, varietales y procesos (`WIKI_CATALOG`, 38 fichas) con selectores puros en `src/data/wiki/index.ts` (`filterWikiEntries`, `getWikiEntryByCategoryAndSlug`, `getWikiEntrySubGroup`, `groupWikiEntriesBySubGroup`) y el árbol SCA en `src/data/flavor-wheel/`. C-15 dejó las dos secciones nuevas con el mismo contrato puro y búsqueda compartida (`src/data/wiki/search.ts`: `normalizeSearchText`, `matchesSensoryThresholds`):
- **Cafeteras (`src/data/wiki-brewers/index.ts`)**: `BREWERS_CATALOG` (10 fichas: 6 con estación + 4 enciclopédicas), `BREWERS_BY_SLUG`, `getBrewerBySlug`, `getBrewerForMethod`, `getBrewerRecipes`, `groupBrewersByFamily` (`drip_filter | immersion | pressure | decoction`) y `filterBrewers`; textos en `src/i18n/locales/es/brewers.json`.
- **Bebidas (`src/data/wiki-drinks/index.ts`)**: `DRINKS_CATALOG` (12 fichas con variantes regionales), `DRINKS_BY_SLUG`, `getDrinkBySlug`, `getDrinksForBrewer`, `groupDrinksByFamily` (`espresso_black | espresso_milk | cold`) y `filterDrinks`; textos en `src/i18n/locales/es/drinks.json`.

La estación resuelve `?profile=` (`resolveInitialProfileId`) y `?recipe=` (C-14). `GlobalSearch` indexa entradas wiki falsas. El catálogo **no** tiene vínculo origen ↔ varietal (solo el texto libre `discoveryRegionKey`) ni contenido editorial de historia, simbología o hitos.

## Goals / Non-Goals

**Goals:**
- Una sola definición de secciones (`WIKI_SECTIONS`) que alimente portada, rutas, página de sección, ficha y buscador global.
- Estado de cada sección serializado en la URL, sin duplicarlo en React.
- Capítulos de ficha declarativos: los que no tienen contenido no se renderizan.
- `SensoryWheel` reutilizable (C-11 puede usarlo en su panel de cata).

**Non-Goals:**
- Una lista combinada de todas las secciones.
- Contenido editorial de historia, simbología e hitos para las 60 fichas (catálogo editorial C-16, con fuentes).
- Optimización de imágenes para la PWA (C-12).
- Secciones futuras (Tueste, Molienda, Glosario, Autores, Asociaciones).

## Decisions

### D1 — Registro de secciones
`src/features/wiki/sections.ts` declara las 5 secciones (`origenes → origin`, `varietales → varietal`, `procesos → process`, `cafeteras`, `bebidas`) con clave de título y descripción, ícono, fuente de fichas, agrupación y filtros habilitados. Portada, vistas y `GlobalSearch` leen de ahí.
- *Alternativa descartada*: un componente por sección — duplicaría búsqueda, filtros y tarjetas.

### D2 — Rutas
`/wiki` → `WikiHomeView`; `/wiki/:section` → `WikiSectionView`; `/wiki/:section/:entrySlug` → `WikiEntryDetailView`. Sección validada contra el registro; slug de ficha del catálogo (`kenya`, `geisha`). Fallo → `NotFoundView`.

### D3 — Filtros por sección en la URL (`useWikiSectionFilters`)
`useSearchParams` como fuente de verdad: `q`, `grupo` (subgrupo), `perfil` (`acidez,dulzor,cuerpo,amargor` → `minAcidity: 4`, `minSweetness: 4`, `minBody: 4`, `maxBitterness: 2`), `familia` (id SCA) y `filtros=1` (panel "Perfil y sabor" abierto). Valores desconocidos se ignoran. Búsqueda con `replace`, filtros con `push`.

### D4 — Rueda sensorial (`SensoryWheel`)
SVG propio: 4 sectores de 90° (Acidez arriba a la derecha, sentido horario), 5 anillos y radios guía; cada sector rellena desde el centro hasta `valor / 5 · R` con gradiente `--accent-primary → --accent-gold`.
- `variant="full"`: etiquetas y `N/5` fuera del círculo, marcas 1–5, `max-width: 340px` centrada, `role="img"` con `aria-label` de los 4 valores, y debajo la frase "Predomina …".
- `variant="compact"` (tarjetas): solo el gráfico (~64–76 px, `aria-hidden`); el dato legible va en la línea `CardProfile` ("Predomina: Acidez 5 · Dulzor 4": atributos ≥ 4, o el mayor si ninguno llega).
- *Descartado*: etiquetas alrededor de la mini rueda (v3) — quedaban en 7,8 px, ilegibles.

### D5 — Ficha por sección
`WikiEntryDetailView` resuelve la ficha desde el registro; un `switch` exhaustivo sobre la sección arma los hechos clave del encabezado y la lista de capítulos:
- **Orígenes / Varietales / Procesos (`WikiEntry`)**: hechos de `OriginMetadata`, `VarietalMetadata` o `ProcessMetadata`; capítulos: relación origen ↔ varietal (D12), historia (D11), notas.
- **Cafeteras (`BrewerEntry`)**: foto + ícono en el encabezado; hechos: creador, origen, época; capítulos en orden práctico: Recetas (`getBrewerRecipes`, pestañas De autor / Tradicionales, cada una con "Preparar esta receta" → `/brew/:methodId?recipe=:id`) o "Cómo se prepara" (`traditionalPreparationKey`) si es enciclopédica → Cómo funciona → Cafés que lucen en esta cafetera (D12) → Historia (D11) → Notas → Bebidas (`getDrinksForBrewer`).
- **Bebidas (`DrinkEntry`)**: hechos: origen, época, servicio típico; capítulos: Composición (D9) → Origen e historia (`history.historyKey`) → Variantes regionales → Notas.

### D6 — Preparar en un toque
`RecommendedMethodCard` usa la etiqueta corta del perfil (texto antes de ` (`, vía `shortProfileLabel`) y `<Link to={`/brew/${methodId}?profile=${profileId}`}>`; el primero es primario y el resto secundario. Debajo, "Conocer la {cafetera}" → `/wiki/cafeteras/:slug` vía `getBrewerForMethod`.

### D7 — Notas y familias
Familia raíz con `FLAVOR_LINEAGE_BY_ID[id][0]`; color desde un mapa familia → token `--flavor-*` (no el `colorHex` del catálogo). Chips `<Link to={`/flavor-wheel?node=${id}&from=${section}/${entrySlug}`}>` (`from` lo usa C-11 para el enlace "Volver a {ficha}").

### D8 — Buscador global
Índice construido desde el registro de secciones (título, alias, sección como subtítulo). Se eliminan `WIKI_ENTRIES_CONFIG` y las claves placeholder.

### D9 — Composición de bebidas (`DrinkComposition`)
SVG de recipiente según el volumen servido (pocillo hasta 115 ml, taza mediana hasta 205 ml, taza grande, o vaso alto con hielo para cold brew), llenado al promedio de `servedVolumeMl` sobre la capacidad del recipiente; capas agua → café → leche → espuma con separadores; crema en cafés negros; pared doble para separar la espuma del borde; escala lateral en ml con texto ≥ 11 px y leyenda corta ("Taza mediana · escala en ml (máx. 200)"). Al lado, leyenda de capas con porcentajes y volumen servido.

### D10 — Capítulos declarativos e índice
Cada bloque de ficha es un objeto `{ id, title, sub, body }` o `null`; la vista filtra los `null` y numera al renderizar (`01`, `02`…), así la numeración siempre es consecutiva. Con 2 o más capítulos, la columna derecha suma `WikiChapterIndex` ("En esta ficha"), `position: sticky` (la columna se estira y solo el índice queda fijo, para que paneles altos no queden inalcanzables); cada entrada hace scroll al capítulo (sin animación con `prefers-reduced-motion`) y mueve el foco a su título. Oculto por debajo de 1024 px.

### D11 — Contenido editorial opcional
El capítulo "Historia y simbología cultural" (párrafos, recuadro de simbología e hitos) se renderiza solo si la ficha trae ese contenido, que llegará con el catálogo editorial C-16 e incluirá fuentes. C-10 implementa el componente y lo prueba con datos de prueba, pero **no** incorpora los textos de muestra del mockup. Sin contenido, el capítulo se omite: nunca se repite el resumen ni se muestran notas internas. Las bebidas ya tienen `history.historyKey` (C-15) y lo muestran como "Origen e historia".

### D12 — Relaciones entre secciones
- **Origen ↔ varietal**: nueva tabla de relación `src/data/wiki/origin-varietals.ts` (origen → varietales habituales), validada con Zod (`OriginVarietalsSchema` en `src/domain/schemas/wiki.schema.ts`) y con test de integridad referencial (todos los slugs existen y son de la categoría correcta). Se define una sola vez; `getVarietalsForOrigin` y `getOriginsForVarietal` (selectores puros) derivan ambas direcciones. Contenido inicial: el mapa aprobado en el mockup; C-16 podrá sumar fuentes. Sin relaciones, la sección se omite.
- **Cafetera ← orígenes / varietales / procesos**: derivada de `recommendedMethods` (`methodId` → `getBrewerForMethod`), sin datos nuevos; agrupada por sección con el perfil sugerido. Solo en cafeteras con estación.
- *Alternativa descartada*: anidar varietales dentro de cada origen — un varietal crece en muchos orígenes (Bourbon aparece en 6) y su ficha quedaría duplicada.

### D13 — Imágenes de cafeteras
`BREWER_PHOTOS` (slug → archivo y epígrafe vía i18n) y `BrewerIcon` (10 íconos 32×32 con la gramática de `MethodVesselIcon`: los 6 existentes + moka, sifón, cezve y filtro eléctrico). Fotos con `loading="lazy"`, `decoding="async"` y `alt` con el nombre de la cafetera; epígrafe abajo a la izquierda en una línea con elipsis.

### D14 — Accesibilidad
Tarjetas como un único `<Link>` con `aria-label` que incluye el perfil; filtros `<button aria-pressed>`; subgrupos como `radiogroup`; contador `aria-live="polite"`; pestañas de recetas `tablist`; alias recortados a 3 con "y N más" y la lista completa como texto para lectores de pantalla.

## Risks / Trade-offs

- [URLs de ficha cambian respecto de la KB (`/wiki/origin/kenya` → `/wiki/origenes/kenya`)] → actualizar `knowledge-base/03_actores_y_roles.md` y `07_flujos_principales.md`.
- [La tabla origen ↔ varietal no tiene fuentes todavía] → contenido conservador (variedades habituales por país); C-16 suma fuentes sin cambiar la UI.
- [Fotos de 620–790 KB, ~8,6 MB en total y duplicadas en `design-system/` y `public/`] → carga diferida en C-10; conversión a WebP/AVIF y política de caché en C-12.
- [`shortProfileLabel` depende del formato "Nombre (Detalle)"] → test que recorre todos los perfiles del catálogo.
- [Índice fijo en fichas cortas] → solo se muestra con 2 o más capítulos.

## Migration Plan

Solo UI en cliente más una tabla de relación de datos. Las URLs placeholder (`/wiki/granos/bourbon`, etc.) pasan a 404; no estaban enlazadas fuera de la app. Rollback = revertir el commit.
