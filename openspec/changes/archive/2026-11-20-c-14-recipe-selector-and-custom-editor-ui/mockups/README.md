# Mockups — C-14 `recipe-selector-and-custom-editor-ui`

- **Design system revision**: 4
- **Approval**: approved (2026-11-20, by user); `station-header-rev2.html` (encabezado rev 2): approved (2026-11-20, by user — variante A)
- **Archivo**: `recipe-selector-and-editor.html` (interactivo; importa `design-system/tokens.css`, `design-system/brand.js` y `assets/logo.svg`; solo variables de tokens, superficies elevadas por `color-mix` igual que C-08).
- **Datos**: recetas reales de V60 del catálogo C-13 (Estándar, Hoffmann, Kasuya 4:6, Rao) con 20 g de café; una receta personalizada de ejemplo ("Mi V60 de la mañana"). El nombre de marca es `(TBD)` vía `brand.js`.

## Pantallas y estados

| Estado (`?view=`) | Qué muestra |
|---|---|
| `station` | Encabezado de `/brew/v60` con el disparador de receta (nuevo) junto al título; agua, cronograma y duración recalculados con la receta activa (`&recipe=v60-kasuya-4-6` → 300 ml, 5 × 60 g, 3:30, 92 °C) |
| `locked` | Temporizador en curso: disparador deshabilitado con aviso "Receta bloqueada" |
| `selector` | Hoja (mobile) / diálogo 720 px (desktop) con grupos Estándar · Autores y Clásicas · Mis Recetas, ficha con badges, `1:15 · 3:30 · 92 °C`, proceso (2 líneas + Ver más), "Destaca:", acciones Usar / Duplicar (+ Editar / Compartir / Eliminar en Mías) y pie fijo Importar JSON + Crear receta |
| `selector-empty` | `Mis Recetas` vacío con Crear e Importar |
| `editor-new`, `editor-dup` | Editor 940 px a dos columnas (datos | resumen en vivo + fases). Duplicado de 4:6 con títulos ya en español, ratio 15, 92 °C. Notas opcionales en un desplegable para que las fases queden arriba en mobile |
| `editor-error` | Banner de resumen + error inline en Nombre y en Fases (sin agua) |
| `share`, `share-blocked` | Compartir: JSON copiado / portapapeles bloqueado con texto seleccionable; Descargar .json |
| `import-error`, `import-other`, `import-dup` | Importar: JSON inválido con detalles técnicos colapsados; receta de otro método con enlace; id repetido con Reemplazar / Guardar como copia |
| `confirm` | Confirmación de eliminación de la receta activa |

La caja de demo (abajo a la izquierda) cambia estado y receta; `chrome=0` la oculta. Los botones del mockup navegan entre estados (Usar, Duplicar, Editar, Crear, Guardar con nombre vacío, Escape).

## Cómo verlo

Desde la raíz del repo (las fuentes salen de `node_modules/@fontsource`):

```
python -m http.server 8765 --bind 127.0.0.1
```

Abrí `http://127.0.0.1:8765/openspec/changes/c-14-recipe-selector-and-custom-editor-ui/mockups/recipe-selector-and-editor.html?view=selector`.

## Capturas (`previews/`)

Renderizadas con Playwright el 2026-11-20 a 1440×900 y 390×844 para cada estado: `c14-<estado>-desktop-1440x900.png` y `c14-<estado>-mobile-390x844.png`, más `c14-editor-dup-phases-mobile-390x844.png` (lista de fases desplazada). 0 errores de consola, 0 requests fallidos, sin scroll horizontal en mobile.
