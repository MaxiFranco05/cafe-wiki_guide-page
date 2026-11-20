# Design — C-11 `interactive-sca-flavor-wheel-ui`

## Context

- `src/data/flavor-wheel/` expone `FLAVOR_WHEEL_TREE` (congelado; 9 familias, 20 subfamilias, 59 descriptores), `getFlavorNodeById`, `getFlavorNodeLineage` y `getDescendantFlavorNodeIds`. `src/data/wiki/` expone `getWikiEntriesByFlavorNode(nodeId)`, que ya incluye descendientes. No hace falta tocar `src/domain/` ni `src/data/`.
- `colorHex` del catálogo son los colores SCA saturados (por ejemplo `#DA1D23`, `#FDE404`). `tokens.css` Rev 4 define además 9 tonos de familia desaturados (`--flavor-*`), pero con nombres que no coinciden con todos los ids (`--flavor-spices` vs. `spiced`) y sin tonos para subfamilias ni descriptores.
- 16 nodos no tienen fichas de Wiki relacionadas (por ejemplo `sweet.brown-sugar.molasses`, `roasted.burnt`), así que el estado vacío del panel es real, no teórico.
- La ruta `/flavor-wheel` ya existe. C-10 (en planificación, revisada) cambia las fichas a `/wiki/:section/:entrySlug` con slugs de sección en español (`origenes`, `varietales`, `procesos`, `cafeteras`, `bebidas`), declarados en un registro único `WIKI_SECTIONS` (`src/features/wiki/sections.ts`, mapa `origenes → origin`, etc.). Sus chips de notas enlazan a `/flavor-wheel?node=<id>`; con esta change pasan a agregar `&from=<sección>/<slug>`.
- `createStorageAdapter` (`src/adapters/storage.adapter.ts`) ya se usa para preferencias (`useLastBrewMethod`); la guía ocultable reutiliza ese patrón.
- Regla dura de performance: animar solo `transform` y `opacity`, respetar `prefers-reduced-motion`. Regla dura de i18n: ningún texto literal en componentes.

## Goals / Non-Goals

**Goals:**
- Geometría de la rueda como funciones puras testeables, sin dependencias nuevas.
- Una sola fuente de verdad para la selección (la URL), compartida por rueda, acordeón y panel.
- Rueda legible a 1440 px y acordeón cómodo a 390 px con el mismo catálogo.

**Non-Goals:**
- Etiquetar los 59 descriptores en la rueda completa: los que no entran se nombran en la rama ampliada y siempre por nombre accesible.
- Mostrar la rueda radial en mobile: a 390 px los descriptores quedan en ~6 px de arco.
- Modificar tokens (no hay bump de revisión del Design System).

## Decisions

### D1. Geometría propia en `utils/wheel-geometry.ts` (sin d3)
Funciones puras: `layoutWheel(root, focusId)` devuelve, por nodo visible, `{ id, tier, ring, startAngle, endAngle }` con ángulo proporcional a la cantidad de descriptores (hojas) de cada nodo; `arcPath(inner, outer, start, end)` devuelve el `d` del segmento anular; `labelPlacement(...)` devuelve posición, rotación radial (texto girado 180° en la mitad izquierda para que no quede cabeza abajo) y si la etiqueta entra (largo de arco en el radio medio ≥ 13 px y largo de texto estimado ≤ grosor del anillo). Radios en un `viewBox` de 600: centro 0–72, anillo 1 72–150, anillo 2 150–222, anillo 3 222–296. Con zoom en una familia hay 2 anillos: subfamilias 72–168 y descriptores 168–296. Etiquetas radiales cuando el segmento es angosto y tangenciales cuando es ancho; 13 px en familias y 10.5 px en el resto.
*Alternativa*: `d3-hierarchy` + `d3-shape`. Descartada: suma ~30 kB para cálculos que son 40 líneas y complica el precacheo de C-12.

### D2. Selección y zoom derivados de `?node=`
`useFlavorSelection()` lee `node` y `from` con `useSearchParams`, valida `node` con `getFlavorNodeById` y `from` contra `WIKI_SECTIONS` + `getWikiEntryByCategoryAndSlug`, y devuelve `{ selectedNode, lineage, focusNode, returnEntry, select(id), clear() }`. `select` y `clear` escriben con el updater de `setSearchParams` (copian los parámetros actuales y solo tocan `node`) y `{ replace: true }`, así `from` se conserva. El zoom (`focusNode`) no se guarda aparte: siempre es la familia (`lineage[0]`) del nodo seleccionado. Volver desde el centro o con Escape limpia la selección.
*Alternativa*: estado React local + sincronización manual con la URL. Descartada: dos fuentes de verdad y el enlace profundo de C-10 se resolvería solo al montar.
*Alternativa de zoom*: ampliar también a nivel subfamilia (1 anillo). Descartada tras el primer render del mockup: una subfamilia de 2 a 4 descriptores queda como 4 cuñas enormes, sin contexto de las subfamilias hermanas.

### D3. Color: `colorHex` del catálogo suavizado sobre el canvas
Cada segmento usa `fill: color-mix(in oklab, <colorHex> 78%, var(--bg-canvas))`; el mismo valor alimenta el acordeón y la muestra del panel. Así se respetan los colores semánticos que pide `US-010` y la paleta oscura de Rev 4, sin escribir hex en componentes: el hex es dato validado por Zod. Nodos atenuados: `opacity: 0.38`. Separación entre segmentos: trazo `var(--bg-canvas)` de 1.5 px. Color de etiqueta: `pickLabelTone(colorHex)` (pura) devuelve `'dark' | 'light'` según la luminancia relativa, que se mapea a `var(--bg-canvas)` o `var(--text-primary)`.
*Alternativa*: usar los 9 `--flavor-*` de tokens para todos los niveles. Descartada: los hijos quedarían del mismo color que la familia y se pierde la diferencia cítrico / frutos rojos; además los nombres no coinciden con los ids.

### D4. Rueda en desktop, acordeón en mobile, ambos montados por CSS
Breakpoint `md` (768 px) de Tailwind: la rueda se muestra con `hidden md:block` y el acordeón con `md:hidden`. Ambos leen la misma selección, así que cambiar de ancho no pierde estado. En desktop el layout es de 2 columnas (rueda ~560 px, panel 380 px). Sin selección, la columna del panel muestra una tarjeta breve de cómo usar la rueda. El acordeón usa `<button aria-expanded>` por nivel con filas de 48 px, barra de color a la izquierda y contador de descriptores; la ruta del nodo seleccionado queda desplegada.
*Alternativa*: `matchMedia` para montar uno solo. Descartada: obliga a un adapter para tests y agrega un render extra al cargar; el costo de tener ambos en el DOM es bajo (≈90 nodos cada uno).

### D5. Teclado: patrón de árbol con tabindex móvil
El `<svg>` contiene un `<g role="tree">`; cada segmento es `role="treeitem"` con `aria-level`, `aria-setsize`, `aria-posinset`, `aria-selected`, `aria-expanded` (familias y subfamilias) y `aria-label` con el nombre localizado. Un solo segmento tiene `tabIndex=0`; el resto `-1`. Teclas según la spec. El foco visible es un trazo `var(--border-focus)` de 3 px dibujado sobre el segmento (no `outline`, que SVG no dibuja de forma consistente). El centro es un `<button>` HTML superpuesto con nombre accesible "Volver a la rueda completa". Si las flechas llevan el foco a otra familia, se selecciona esa familia para que su rama quede visible.
*Alternativa*: un `<button>` por segmento en el orden de tabulación. Descartada: 88 paradas de Tab.

### D6. Panel: aside en desktop, hoja inferior en mobile
`FlavorDescriptorDrawer` es un `<aside aria-labelledby>` en desktop. En mobile se presenta como hoja inferior fija (`role="dialog"`, `aria-modal="false"` para no bloquear el acordeón, alto máximo 70 dvh con scroll interno), que entra con `transform: translateY` y `--ease-drawer`; Escape y el botón cerrar limpian la selección y devuelven el foco al botón del nodo. Las fichas se agrupan con `getWikiEntriesByFlavorNode(id)` y se ordenan por categoría (Orígenes, Varietales, Procesos) y luego por orden del catálogo; cada una es un `<Link>` a `/wiki/<sección>/<slug>`, con la sección resuelta desde la categoría vía `WIKI_SECTIONS` de C-10 (sin duplicar el mapa en la feature de la rueda).

### D7. Transición de zoom solo con `transform` y `opacity`
Al cambiar el foco, el grupo de segmentos nuevo se monta con `key={focusId}` y entra con `opacity 0 → 1` y `scale(0.94) → scale(1)` (`--duration-normal`, `--ease-out`, `transform-origin` en el centro). No se interpolan ángulos. Con `prefers-reduced-motion` el bloque global de `tokens.css` deja la transición en ~0 ms.
*Alternativa*: tween de ángulos con `requestAnimationFrame`. Descartada: repinta paths en cada frame y rompe la regla de animar solo `transform`/`opacity`.

### D8. Textos
Claves nuevas en `ui.json` bajo `wheel.*`: `guide.{question,steps.*,examples,dismiss}`, `back`, `close`, `returnTo` (`Volver a {title}`), `childrenTitle.{family,subfamily}`, `related.{title,origin,varietal,process,empty}`, `presence.{total,origin,varietal,process}` (con plural), `pathLabel`, `descriptorCount`, `treeLabel`, `accordionLabel`. Se elimina `wheel.placeholderDesc`. Nombres y notas de nodos siguen en `flavor-wheel.json` (C-09).

### D9. Acompañamiento para principiantes
Tres piezas chicas, sin datos nuevos de catálogo:
- **Guía inicial** (`FlavorTastingGuide`): pregunta "¿Qué sentís en la taza?", tres pasos (familia general → subfamilia → descriptor) y tres familias de ejemplo como chips que seleccionan esa familia. En desktop ocupa la columna del panel cuando no hay selección; en mobile va sobre el acordeón con botón "Ocultar guía", persistido con `createStorageAdapter` bajo `flavorWheel.guideDismissed` (fuera del dominio, como pide la regla de `src/adapters/`).
- **Línea de presencia**: `summarizeWikiPresence(entries)` (pura, en `utils/`) cuenta total y por categoría sobre el resultado de `getWikiEntriesByFlavorNode`; el panel la muestra antes del listado. Se usa la misma lista para contar y listar, así no pueden diferir.
- **Regreso a la ficha**: `returnEntry` de D2 alimenta un enlace "Volver a {título}" en el encabezado de la vista (no en el panel, para que siga visible al cerrarlo).
*Alternativa*: guardar la ficha de origen en estado de navegación (`location.state`). Descartada: no sobrevive a recargar ni a compartir el enlace, y no es testeable desde la URL.

## Risks / Trade-offs

- [Etiquetas que no entran en la rueda completa (descriptores de ~6°)] → umbral de D1 las oculta; aparecen al ampliar la rama y siempre como `aria-label` y en el panel. El mockup muestra cuáles quedan visibles.
- [Contraste de etiquetas sobre colores intermedios (por ejemplo `#E2631E` suavizado)] → `pickLabelTone` elige el tono con más contraste (umbral 0.287 de luminancia del `colorHex`, probado contra los 88 colores). **Ajuste en apply (2026-11-20)**: 20 colores no llegan a 4.5:1 con ningún tono (el mejor queda entre 4.13 y 4.49) y oscurecer la mezcla no lo resuelve sin apagar la paleta aprobada. Se mantiene la mezcla 78%, el test exige ≥ 4.1:1 con el tono elegido, y cada etiqueta lleva un halo de 2.5 px en el tono opuesto (`paint-order: stroke`) que separa el glifo del relleno.
- [`color-mix` no soportado] → navegadores objetivo (Chrome/Safari/Firefox actuales) lo soportan; fallback: `fill` con `colorHex` y `fill-opacity: 0.82`.
- [Rueda y acordeón montados a la vez duplican `id`s o textos en tests] → los tests consultan dentro de `within(region)` por `aria-label` de cada región.
- [C-11 usa `WIKI_SECTIONS` y las rutas `/wiki/:section/:entrySlug` de C-10] → aplicar C-10 antes que C-11 (orden natural del roadmap: ambas en FASE 3, C-10 primero). Si se invirtiera, el primer task de C-11 crea el registro mínimo y C-10 lo amplía.
- [`from` como texto libre en la URL] → solo se usa si resuelve a una ficha del catálogo; nunca se renderiza tal cual ni se usa como destino sin validar.

## Migration Plan

Reemplazo directo del placeholder: nueva vista en `src/features/flavor-wheel/views/`, `App.tsx` apunta a ella y se borra `src/features/flavor-wheel/FlavorWheelView.tsx`. Sin datos persistidos ni flags. Rollback: revertir el commit.

## UI Mockups

- **Design system revision**: 4 (`design-system/README.md`, aprobado 2026-11-17; coincide con `visual_design.revision: 4` y `mode: system-and-mockups` en `.active-orchestrator-state.json`).
- **Decision**: yes (2026-11-19)
- **Mockups**: `openspec/changes/c-11-interactive-sca-flavor-wheel-ui/mockups/flavor-wheel.html` (interactivo, datos reales del catálogo en `mockups/assets/wheel-data.js`) + `mockups/README.md`.
- **Approval**: approved (2026-11-20, by user — mockup con zoom a la rama de la familia, guía de cata, línea de presencia en la Wiki y enlace "Volver a {ficha}")
- **Criterio de aceptación**: `mockups/flavor-wheel.html` + `mockups/previews/c11-*.png` (full, descriptor con `from=origenes/kenya`, subfamilia sin fichas, acordeón con guía y hoja inferior mobile).
- **Preview**: rendered (2026-11-19, Playwright vía `http://127.0.0.1:8731`, capturas en `mockups/previews/`: `c11-full-desktop-1440x900.png`, `c11-descriptor-desktop-1440x900.png`, `c11-subfamily-empty-desktop-1440x900.png`, `c11-accordion-mobile-390x844.png`, `c11-sheet-mobile-390x844.png`; 0 errores de consola salvo el 404 de `favicon.ico` del servidor estático)
- **Revisión 2026-11-19 (pedida por el usuario)**: se suman la guía de cata para principiantes, la línea de presencia en la Wiki y el enlace "Volver a {ficha}" (`?from=`); los enlaces del panel pasan a `/wiki/<sección>/<slug>` (C-10). Capturas re-renderizadas: `c11-full-desktop`, `c11-descriptor-desktop` (con `from=origenes/kenya`), `c11-accordion-mobile` y `c11-sheet-mobile`; `c11-subfamily-empty-desktop` no cambia visualmente. 0 errores de consola.
- **Visual verify**: passed (2026-11-20 — app real en `localhost:5174` (dev server, 5173 ocupado) vs. mockup aprobado; capturas en `mockups/verify/`; 0 errores de consola, sin requests fallidos).
  - Revisado a 1440×900: rueda completa + guía, `?node=fruity.berry.blackberry&from=origenes/kenya` (zoom Frutal, Mora resaltada, presencia "Aparece en 2 fichas: 1 origen, 1 varietal", "Volver a Kenia"), `?node=roasted.burnt` (estado vacío), teclado (→, Enter, → cíclico con anillo de foco visible). Camino real ficha Kenia → chip Mora (`from=origenes%2Fkenya`) → "Volver a Kenia" → `/wiki/origenes/kenya`.
  - Revisado a 390×844: guía con "Ocultar guía" sobre el acordeón; hoja inferior con Mora y regreso; Escape cierra, conserva `from` y devuelve el foco a la fila Frutal.
  - **Corregido durante verify (major)**: en mobile la barra inferior tapaba el borde de la hoja porque `<main>` del `AppLayout` crea su propio contexto de apilamiento (`relative z-10`); la hoja y su fondo se renderizan ahora en un portal sobre `document.body`.
  - **Menor (catálogo, fuera de alcance)**: la subfamilia `floral.tea` y su único descriptor `floral.tea.black-tea` comparten el nombre "Té negro", así que el lector de pantalla anuncia dos "Té negro" en niveles distintos.
  - **Menor**: en la rueda completa la fila de atajos de teclado queda justo bajo el pliegue a 900 px de alto, igual que en el mockup aprobado.
- **Shell**: navbar y barra inferior del mockup son una versión simplificada del `AppShell` real (sin buscador ni fondo de granos); la implementación usa el `AppLayout` existente sin cambios.
