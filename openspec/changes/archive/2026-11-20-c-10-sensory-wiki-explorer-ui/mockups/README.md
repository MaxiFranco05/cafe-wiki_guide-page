# Mockups — C-10 `sensory-wiki-explorer-ui`

- **Design system revision**: 4 (`design-system/README.md`)
- **Approval**: approved (2026-11-20, by user — v3.1 con relaciones entre orígenes, varietales y cafeteras)
- **Preview**: v3.1 rendered (2026-11-20, `previews/c10v31-*.png`); v3 en `previews/c10v3-*.png`; v2 en `previews/c10v2-*.png`; v1 archivada en `previews/v1/`

## v3.1 — pulido de v3 (2026-11-20)

`wiki-v3-1.html` + `previews/c10v31-*.png`. Misma propuesta editorial de v3 con correcciones de una auditoría visual:

**Bugs corregidos**
- La rueda sensorial de la ficha tiene un ancho máximo de 340 px: entre 768 y 1023 px ya no ocupa todo el ancho con etiquetas gigantes.
- Las fichas sin contenido editorial ya no muestran un capítulo "Origen e historia" que repetía el resumen con la nota interna "(enriquecimiento completo en C-16)": el capítulo se omite.
- Los capítulos se numeran al renderizar, así quedan consecutivos aunque falte alguno.
- Separación de 8 px entre el título y la línea de alias.

**Pulido**
- Tarjetas: la mini rueda queda solo como gráfico (sin etiquetas de 7,8 px) y debajo va una línea legible "Predomina: Acidez 5 · Dulzor 4" (atributos ≥ 4, o el mayor si ninguno llega a 4).
- Fichas: índice fijo "En esta ficha" en la columna derecha (desktop), con salto a cada capítulo; la rueda y el CTA quedan arriba y el índice acompaña el scroll.
- Cafeteras: orden práctico — Recetas (o "Cómo se prepara" en las enciclopédicas) → Cómo funciona → Historia → Vocabulario → Bebidas.
- Bebidas: taza más grande (250 px), escala en ml legible (~12–14 px) y leyenda corta ("Taza mediana · escala en ml (máx. 200)") sin repetir el volumen.
- Alias: máximo 3 visibles con "y N más" (lista completa en `title` y para lectores de pantalla).
- Foto de cafetera: epígrafe abajo a la izquierda, en una sola línea, sin tapar el objeto.
- Mobile: la fila de filtros de subgrupo se desvanece en el borde para indicar que hay más.

| Estado | Ruta hash | Captura |
|---|---|---|
| Sección Orígenes con línea "Predomina" (desktop) | `#/wiki/origenes` | `previews/c10v31-section-origenes-desktop-1440x900.png` |
| Sección Cafeteras (mobile) | `#/wiki/cafeteras` | `previews/c10v31-section-cafeteras-mobile-390x844.png` |
| Ficha V60: recetas primero e índice (desktop, arriba y con scroll) | `#/wiki/cafeteras/v60` | `previews/c10v31-detail-brewer-v60-desktop-1440x900.png`, `previews/c10v31-detail-brewer-v60-desktop-1440x900-scrolled.png` |
| Ficha Brasil sin contenido editorial (desktop) | `#/wiki/origenes/brazil` | `previews/c10v31-detail-origin-brazil-noeditorial-desktop-1440x900.png` |
| Ficha Honey en tableta (rueda contenida) | `#/wiki/procesos/honey` | `previews/c10v31-detail-process-honey-tablet-900x1000.png` |
| Ficha Moka (mobile, epígrafe y alias) | `#/wiki/cafeteras/moka` | `previews/c10v31-detail-brewer-moka-mobile-390x844.png` |
| Ficha Cappuccino: composición (mobile) | `#/wiki/bebidas/cappuccino` | `previews/c10v31-detail-drink-cappuccino-mobile-390x844-scrolled.png` |

**Relaciones entre secciones** (pedido del usuario, 2026-11-20)
- Los varietales siguen siendo una sección propia (un mismo varietal crece en muchos orígenes), pero se enlazan en ambas direcciones: el origen muestra "Varietales que se cultivan" y el varietal "Dónde se cultiva".
- Cada método recomendado suma "Conocer la {cafetera}", y la ficha de cada cafetera con estación muestra "Cafés que lucen en esta cafetera" (orígenes, varietales y procesos que la recomiendan, con su perfil). Esta dirección se deriva de `recommendedMethods`, sin datos nuevos.
- El vínculo origen → varietales **no existe en el catálogo**: el mockup usa un mapa de muestra (`ORIGIN_VARIETALS`). En la app debe ser un campo curado y con fuente en el catálogo (C-16), definido una sola vez; la dirección inversa se deriva.

| Estado | Ruta hash | Captura |
|---|---|---|
| Brasil: varietales y "Conocer la cafetera" | `#/wiki/origenes/brazil` | `previews/c10v31-detail-origin-brazil-relations-desktop-1440x900.png` |
| Bourbon: dónde se cultiva | `#/wiki/varietales/bourbon` | `previews/c10v31-detail-varietal-bourbon-relations-desktop-1440x900.png` |
| Chemex: cafés que lucen en esta cafetera | `#/wiki/cafeteras/chemex` | `previews/c10v31-detail-brewer-chemex-coffees-desktop-1440x900.png` |

**Pendiente fuera del mockup**
- Contenido editorial: varias afirmaciones de historia y simbología del prototipo no tienen fuente (por ejemplo el V60 como *kaizen*, el ristretto "nacido entre Nápoles y Sicilia"). El catálogo editorial (C-16) debería exigir una fuente por hito y cita, y dejar la simbología como opcional.
- Imágenes: las 12 fotos pesan 620–790 KB cada una (~8,6 MB) y están duplicadas en `design-system/assets/photos/` y `public/images/coffee/`; convertir a WebP/AVIF (~120 KB, `srcset`, carga diferida) antes de C-12.
- `design-system/README.md` lista 5 fotos y hay 12: actualizar y subir la revisión del design system.

## v3 — propuesta editorial (2026-11-20, pulida en v3.1)

Evoluciona v2 incorporando las 4 observaciones del usuario:
1. **Mini-rueda etiquetada en tarjetas**: cada cuadrante muestra su nombre y valor (`Acidez`, `Dulzor`, `Cuerpo`, `Amargor` + `N/5`), destacando en `--accent-gold` los atributos dominantes (`>= 4`).
2. **Cafeteras con íconos propios y fotografía moody real**: 10 íconos SVG vectoriales coherentes con `MethodVesselIcon.tsx` (6 de estación + 4 enciclopédicos) en tarjetas y título de ficha, más fotografía moody dedicada en `design-system/assets/photos/` (`v60`, `immersion/chemex`, `melitta`, `aeropress`, `french-press`, `pro-machine`, `moka`, `siphon`, `cezve`, `electric-drip`).
3. **Bebidas a escala real de volumen y alto contraste**: 3 siluetas de recipiente (pocillo 110 ml, taza mediana 200 ml, vaso/taza grande 320 ml) con nivel de llenado proporcional al volumen servido y escala lateral en ml (`Ristretto` vs `Espresso` vs `Lungo` diferenciados a simple vista + crema en cafés negros y hielo en Cold Brew); pared de doble borde con separación oscura para que leche y espuma nunca se confundan con el contorno del vaso.
4. **Jerarquía visual editorial + profundidad histórica y simbología**: hero con línea de datos clave, capítulos numerados (`01`, `02`, `03`, `04`), bloque destacado de simbología cultural y línea de tiempo de hitos históricos (prototipado en v3 sobre fichas de muestra; el enriquecimiento completo de las 60 fichas irá en un change dedicado de catálogo `C-16`).

### Pantallas y estados capturados (`previews/c10v3-*.png`)

| Estado | Ruta hash | Captura |
|---|---|---|
| Sección Orígenes con mini-rueda etiquetada (desktop) | `#/wiki/origenes` | `previews/c10v3-section-origenes-desktop-1440x900.png` |
| Sección Cafeteras con íconos propios (desktop) | `#/wiki/cafeteras` | `previews/c10v3-section-cafeteras-desktop-1440x900.png` |
| Sección Cafeteras (mobile `390×844`) | `#/wiki/cafeteras` | `previews/c10v3-section-cafeteras-mobile-390x844.png` |
| Ficha Cafetera con estación — Hario V60 (desktop) | `#/wiki/cafeteras/v60` | `previews/c10v3-detail-brewer-v60-desktop-1440x900.png` |
| Ficha Cafetera enciclopédica — Moka (desktop) | `#/wiki/cafeteras/moka` | `previews/c10v3-detail-brewer-moka-desktop-1440x900.png` |
| Ficha Cafetera enciclopédica — Moka (mobile, top + scroll) | `#/wiki/cafeteras/moka` | `previews/c10v3-detail-brewer-moka-mobile-390x844.png`, `previews/c10v3-detail-brewer-moka-mobile-390x844-scrolled.png` |
| Ficha Cafetera enciclopédica — Cezve (desktop) | `#/wiki/cafeteras/cezve` | `previews/c10v3-detail-brewer-cezve-desktop-1440x900.png` |
| Ficha Origen — Kenia (desktop) | `#/wiki/origenes/kenya` | `previews/c10v3-detail-origin-kenya-desktop-1440x900.png` |
| Ficha Bebida — Ristretto 15–25 ml (desktop, escala baja) | `#/wiki/bebidas/ristretto` | `previews/c10v3-detail-drink-ristretto-desktop-1440x900.png` |
| Ficha Bebida — Lungo 60–110 ml (desktop, escala alta) | `#/wiki/bebidas/lungo` | `previews/c10v3-detail-drink-lungo-desktop-1440x900.png` |
| Ficha Bebida — Cappuccino (desktop, alto contraste leche/espuma) | `#/wiki/bebidas/cappuccino` | `previews/c10v3-detail-drink-cappuccino-desktop-1440x900.png` |
| Ficha Bebida — Cappuccino (mobile scroll) | `#/wiki/bebidas/cappuccino` | `previews/c10v3-detail-drink-cappuccino-mobile-390x844-scrolled.png` |

### Cómo abrirlo interactivo

```powershell
python -m http.server 8731 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8731/openspec/changes/c-10-sensory-wiki-explorer-ui/mockups/wiki-v3.html`.

## v2 — iterada por feedback (2026-11-20)

`wiki-v2.html` + `previews/c10v2-*.png`. Aprobada en estructura general (portada con 5 secciones, filtros por sección, rueda de 4 sectores); el usuario pidió 4 mejoras incorporadas en v3: etiquetas en la mini-rueda de cards, íconos y fotos reales de cafeteras, escala visual real de volumen y contraste vaso/leche en bebidas, y mayor jerarquía editorial e historia/simbología.

## v1 — rechazada (2026-11-19)

`wiki-explorer-v1.html` + `previews/v1/`. Explorador único con pestañas Todos / Orígenes / Varietales / Procesos (variantes A filtros arriba y B panel lateral) y ficha con barras sensoriales.

Motivo del rechazo (usuario): "está todo desorganizado y poco intuitivo", mezcla orígenes, varietales y procesos que no son lo mismo; faltan secciones de Cafeteras y Bebidas; prefiere una rueda radial (estilo "rueda de rendimiento") en lugar de barras.

Se conserva como referencia de estilo: shell real, tarjetas, chips de familia con tokens `--flavor-*`, jerarquía de botones "Preparar en…" (primario / secundario) y orden mobile de la ficha.

## Regenerar el snapshot

Crear temporalmente `src/__ssr_snapshot_entry.tsx` con `renderPage(url)` (`renderToStaticMarkup` de `<MemoryRouter><AppRoutes/></MemoryRouter>`) y `wikiData()` (catálogo + `t()`), cargarlo con `vite.createServer({ server: { middlewareMode: true } }).ssrLoadModule(...)`, escribir `assets/c10-v2-snapshot.js`, `server.transformRequest('/src/index.css?direct')` → `assets/c10-v2-snapshot.css`, reemplazar `/images/coffee/` por la ruta relativa a `design-system/assets/photos/` y borrar el archivo temporal.
