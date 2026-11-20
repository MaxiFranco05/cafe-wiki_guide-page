# Mockups — C-10 `sensory-wiki-explorer-ui`

- **Design system revision**: 4 (`design-system/README.md`)
- **Approval**: pending — mockup v2 a crear después de C-15
- **Preview**: v1 rendered (2026-11-19); v2 pendiente

## v1 — rechazada (2026-11-19)

`wiki-explorer-v1.html` + `previews/v1/`. Explorador único con pestañas Todos / Orígenes / Varietales / Procesos (variantes A filtros arriba y B panel lateral) y ficha con barras sensoriales.

Motivo del rechazo (usuario): "está todo desorganizado y poco intuitivo", mezcla orígenes, varietales y procesos que no son lo mismo; faltan secciones de Cafeteras y Bebidas; prefiere una rueda radial (estilo "rueda de rendimiento") en lugar de barras.

Se conserva como referencia de estilo: shell real, tarjetas, chips de familia con tokens `--flavor-*`, jerarquía de botones "Preparar en…" (primario / secundario) y orden mobile de la ficha.

## v2 — pendiente

A crear cuando C-15 defina los campos de Cafeteras y Bebidas:

- `/wiki` portada con 5 tarjetas de sección.
- `/wiki/origenes` (y una sección de las nuevas) con buscador y filtros propios.
- Ficha con rueda sensorial de 4 sectores para orígenes, cafetera y bebida.
- Capturas 1440×900 y 390×844 en `previews/`.

## Regenerar el snapshot

Crear temporalmente `src/__ssr_snapshot_entry.tsx` con `renderPage(url)` (`renderToStaticMarkup` de `<MemoryRouter><AppRoutes/></MemoryRouter>`) y `wikiData()` (catálogo + `t()`), cargarlo con `vite.createServer({ server: { middlewareMode: true } }).ssrLoadModule(...)`, escribir `assets/c10-app-snapshot.js`, `server.transformRequest('/src/index.css?direct')` → `assets/c10-app-snapshot.css`, reemplazar `/images/coffee/` por la ruta relativa a `design-system/assets/photos/` y borrar el archivo temporal.
