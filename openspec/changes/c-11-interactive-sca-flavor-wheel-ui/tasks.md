# Tasks — C-11 `interactive-sca-flavor-wheel-ui`

> **Orden**: aplicar después de C-10 (se usan `WIKI_SECTIONS` y las rutas `/wiki/:section/:entrySlug`).
> **Gate visual**: no iniciar el grupo 1 hasta que `design.md` → `## UI Mockups` registre `Approval: approved`. Criterio de aceptación visual: `mockups/flavor-wheel.html` y `mockups/previews/c11-*.png`.
> Skills a cargar antes de codificar (Agente C + B): `vercel-react-best-practices`, `vercel-composition-patterns`, `tailwind-design-system`, `emil-design-eng`, `impeccable`, `svg-animation`, `modern-web-guidance`, `vitest`. Strict TDD: cada test se escribe y se ve fallar antes de implementar.

## 1. i18n

- [ ] 1.1 Agregar en `src/i18n/locales/es/ui.json` las claves `wheel.*` de `design.md` D8 (guía, volver, regreso a ficha, cerrar, títulos de hijos, grupos de fichas relacionadas, presencia con plural, vacío, ruta, contador, etiquetas de regiones) y quitar `wheel.placeholderDesc`; verificar con `npx vitest run src/i18n` que el test de integridad de claves pasa

## 2. Utilidades puras de la rueda

- [ ] 2.1 Test + implementación de `src/features/flavor-wheel/utils/wheel-geometry.ts`: `layoutWheel(tree, focusId)` (ángulos proporcionales a descriptores, suma 2π por anillo, 3 anillos sin foco y 2 con foco en familia, `posinset`/`setsize`), `arcPath(...)` y `labelPlacement(...)` (radial/tangencial, giro en mitad izquierda, `fits` según arco y grosor); verificar con `src/features/flavor-wheel/__tests__/wheel-geometry.test.ts` contra `FLAVOR_WHEEL_TREE` (9/20/59 segmentos, Frutal = 14/59 de 360°)
- [ ] 2.2 Test + implementación de `pickLabelTone(colorHex)` en `utils/label-tone.ts`; verificar con un test que recorre los 88 colores del catálogo y comprueba contraste ≥ 4.5:1 del tono elegido sobre el color suavizado (mezcla 78% con `--bg-canvas` calculada en el test)

- [ ] 2.3 Test + implementación de `summarizeWikiPresence(entries)` en `utils/wiki-presence.ts` (total y conteo por categoría, omite vacías); verificar con un test que Mora da 2 (1 origen, 1 varietal), `roasted.burnt` da 0 y que el total de Frutal coincide con `getWikiEntriesByFlavorNode('fruity').length`

## 3. Estado de selección

- [ ] 3.1 Test + implementación de `src/features/flavor-wheel/hooks/useFlavorSelection.ts` sobre `useSearchParams`: lee y valida `?node=` y `?from=<sección>/<slug>` (vía `WIKI_SECTIONS` + `getWikiEntryByCategoryAndSlug`), expone `selectedNode`, `lineage`, `focusFamily`, `returnEntry`, `select(id)`, `clear()`, escribe solo `node` con updater y `replace: true`; verificar con `use-flavor-selection.test.tsx` en `MemoryRouter` (id válido, id inexistente ignorado, `clear` quita `node`, el historial no crece al seleccionar 3 nodos, `from` válido se conserva tras seleccionar y limpiar, `from` inválido da `returnEntry` indefinido)
- [ ] 3.2 Test + implementación de `useGuideDismissed()` sobre `createStorageAdapter` (clave `flavorWheel.guideDismissed`, storage inyectable, valor inválido = no ocultada); verificar con `use-guide-dismissed.test.tsx`

## 4. Rueda SVG

- [ ] 4.1 Crear `components/SunburstFlavorWheelSvg.tsx` según el mockup aprobado: segmentos `role="treeitem"` con ARIA de D5, relleno `color-mix` de D3, atenuado 0.38, trazo de selección, centro `<button>` para volver, entrada `opacity`+`scale` con `key` por familia; verificar con `sunburst-flavor-wheel.test.tsx` cubriendo "Rueda completa al abrir", "Zoom en una familia", "Seleccionar una subfamilia", "Seleccionar un descriptor" y "Volver a la rueda completa"
- [ ] 4.2 Teclado con tabindex móvil (flechas cíclicas, abajo/arriba, Inicio/Fin, Enter/Espacio, Escape, foco a otra familia amplía su rama) e indicador de foco visible; verificar con `userEvent.keyboard` los escenarios de "Navegación por teclado y accesibilidad de la rueda"
- [ ] 4.3 Movimiento reducido: sin animación de entrada con `prefers-reduced-motion: reduce`; verificar con `matchMedia` mockeado que no se aplica la clase de transición

## 5. Acordeón móvil

- [ ] 5.1 Crear `components/MobileFlavorTreeAccordion.tsx`: 9 familias con barra de color y contador, subfamilias desplegables, descriptores como chips `aria-pressed`, filas ≥ 48 px, ruta del seleccionado desplegada, tocar un nodo abierto ya seleccionado lo pliega; verificar con `mobile-flavor-tree-accordion.test.tsx` cubriendo "Acordeón en mobile" y "Seleccionar los tres niveles en el acordeón"

## 6. Panel de detalle

- [ ] 6.1 Crear `components/FlavorDescriptorDrawer.tsx`: ruta navegable, nivel, nombre con muestra de color, nota de cata, hijos seleccionables (familia/subfamilia), línea de presencia (`summarizeWikiPresence`), fichas de `getWikiEntriesByFlavorNode` agrupadas Orígenes/Varietales/Procesos como `<Link>` a `/wiki/<sección>/<slug>` resuelto con `WIKI_SECTIONS`, mensaje vacío, botón cerrar; verificar con `flavor-descriptor-drawer.test.tsx` cubriendo "Detalle de un descriptor con fichas" (Mora → Kenia, SL28 / SL34), "Detalle de una familia", "Ruta navegable", "Nodo sin fichas relacionadas" (`roasted.burnt`), "Ir a una ficha desde el panel" (`/wiki/origenes/kenya`) y los dos escenarios de "Presencia del sabor en la Wiki"
- [ ] 6.2 Presentación mobile como hoja inferior (`role="dialog"`, `max-height: 70dvh`, entrada `translateY` con `--ease-drawer`), Escape cierra y devuelve el foco al nodo; verificar con test que tras Escape no hay `node` en la URL y el foco vuelve al botón del acordeón

## 7. Vista y ruta

- [ ] 7.0 Crear `components/FlavorTastingGuide.tsx` (pregunta sobre la taza, 3 pasos, chips de familias de ejemplo que seleccionan la familia, botón "Ocultar guía" solo en mobile con `useGuideDismissed`); verificar con `flavor-tasting-guide.test.tsx` cubriendo "Guía al abrir sin selección" y "Ocultar la guía en mobile"
- [ ] 7.1 Crear `src/features/flavor-wheel/views/FlavorWheelView.tsx` (encabezado con enlace "Volver a {ficha}" cuando hay `returnEntry`, contadores, grid rueda + panel en `md`, acordeón en mobile, guía sin selección), apuntar `src/App.tsx` a la nueva vista y borrar `src/features/flavor-wheel/FlavorWheelView.tsx`; verificar con `flavor-wheel-view.test.tsx` cubriendo "Enlace desde una ficha de Wiki", "Nodo inexistente", "La selección actualiza la URL", "Selección compartida", los tres escenarios de "Regreso a la ficha de origen" y "Claves de la vista resueltas" (sin claves crudas ni emojis)
- [ ] 7.2 Verificar que no hay hex sueltos ni textos literales en `src/features/flavor-wheel/` (`grep -rnE "#[0-9A-Fa-f]{6}" src/features/flavor-wheel` vacío fuera de tests) y que `npm run build` y `npx vitest run` pasan

## 8. Verificación visual

- [ ] 8.1 Con el dev server, capturar `/flavor-wheel`, `?node=fruity.berry.blackberry&from=origenes/kenya` y `?node=roasted.burnt`, y recorrer el camino ficha Kenia → chip Mora → "Volver a Kenia" a 1440×900 y 390×844 en `mockups/verify/`, revisar consola y requests fallidos, comparar con `mockups/previews/` y registrar `Visual verify` en `design.md` con diferencias por prioridad

## Workflow follow-up

- `/opsx:archive c-11-interactive-sca-flavor-wheel-ui`, marcar `[x]` C-11 en `CHANGES.md` y pushear a `dev` con confirmación del usuario.
- Incluir la tabla `Auditoría de Skills Utilizadas` al cerrar.
