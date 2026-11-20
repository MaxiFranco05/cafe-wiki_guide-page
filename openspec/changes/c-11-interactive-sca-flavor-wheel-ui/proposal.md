# Proposal — C-11 `interactive-sca-flavor-wheel-ui`

## Why

C-09 dejó validado el árbol de la Rueda de Sabores SCA (9 familias, 20 subfamilias, 59 descriptores con nota de cata y color semántico) y el selector `getWikiEntriesByFlavorNode`, pero `/flavor-wheel` sigue mostrando un placeholder de círculos animados. Sin esta change no se cumple `US-010` ni el primer tramo del Flujo 4 (Rueda → Wiki), y los chips de notas que C-10 enlaza a `/flavor-wheel?node=<id>` no llevan a ningún lado.

## What Changes

- **Vista `/flavor-wheel`** (reemplaza el placeholder de `FlavorWheelView`): encabezado, rueda y panel de detalle.
- **Rueda radial SVG** (`SunburstFlavorWheelSvg`): 3 anillos concéntricos Familia → Subfamilia → Descriptor, coloreados desde `colorHex` del catálogo suavizado sobre el canvas oscuro.
  - Tocar cualquier nodo hace zoom a la rama de su familia (familia al centro, subfamilias y descriptores alrededor) y el centro ofrece volver a la rueda completa.
  - Dentro de la rama, el nodo elegido y su ruta quedan resaltados; el resto se atenúa.
  - Navegación por teclado con un solo punto de tabulación (flechas entre hermanos, entrar/salir de nivel, Enter/Espacio para seleccionar) y roles ARIA de árbol.
- **Acordeón táctil** (`MobileFlavorTreeAccordion`): vista principal en pantallas angostas (< 768 px) con las 9 familias desplegables hasta el descriptor, sincronizada con la misma selección que la rueda.
- **Panel de descriptor** (`FlavorDescriptorDrawer`): lateral en desktop, hoja inferior en mobile. Muestra la ruta jerárquica navegable, la nota de cata (`tastingNoteKey`), los hijos del nodo cuando es familia o subfamilia, y las fichas de Wiki donde aparece ese sabor agrupadas en **Orígenes**, **Varietales** y **Procesos**, cada una enlazada a `/wiki/<sección>/<slug>`. Si no hay fichas, lo dice.
- **Acompañamiento para principiantes**:
  - Guía inicial que pregunta qué se siente en la taza y sugiere empezar por la familia general; en mobile se puede ocultar y queda oculta.
  - Línea de presencia en el panel: "Aparece en N fichas: X orígenes, Y varietales, Z procesos".
  - Regreso a la ficha: al llegar desde una nota de cata de la Wiki (`?from=<sección>/<slug>`), el encabezado ofrece "Volver a {ficha}".
- **Enlace profundo `?node=<id>`**: abrir `/flavor-wheel?node=fruity.berry.blackberry` selecciona y enfoca ese nodo; cada selección actualiza la URL (sin agregar historial). Un id inexistente se ignora y la rueda arranca sin selección.
- Claves i18n nuevas `wheel.*` en `ui.json` y eliminación de `wheel.placeholderDesc`.

## Capabilities

### New Capabilities
- `interactive-sca-flavor-wheel-ui`: exploración de la Rueda de Sabores SCA en la interfaz — rueda radial con zoom y teclado, acordeón táctil sincronizado, panel de descriptor con ruta, nota de cata, presencia y fichas de Wiki relacionadas, guía inicial para principiantes, y selección por enlace profundo `?node=` con regreso `?from=`.

### Modified Capabilities
<!-- Ninguna: se consumen tal cual el árbol y los selectores de wiki-and-flavor-wheel-catalog; la ruta /flavor-wheel ya existe en app-shell-and-foundation. -->

## Impact

- **Código nuevo**: `src/features/flavor-wheel/views/FlavorWheelView.tsx`, `src/features/flavor-wheel/components/` (`SunburstFlavorWheelSvg`, `MobileFlavorTreeAccordion`, `FlavorDescriptorDrawer`), `src/features/flavor-wheel/hooks/useFlavorSelection.ts` (estado ↔ `?node=`), `src/features/flavor-wheel/utils/` (geometría de arcos y contraste de etiqueta, funciones puras).
- **Código modificado**: `src/App.tsx` (vista nueva en la ruta existente), `src/i18n/locales/es/ui.json`.
- **Código eliminado**: `src/features/flavor-wheel/FlavorWheelView.tsx` placeholder.
- **Sin cambios** en `src/domain/` ni en `src/data/` (se usan `FLAVOR_WHEEL_TREE`, `getFlavorNodeById`, `getFlavorNodeLineage`, `getWikiEntriesByFlavorNode`).
- **Dependencias**: ninguna nueva (geometría SVG propia, sin d3).
- **Tests**: selección de nodos de nivel 1, 2 y 3 en la rueda y en el acordeón; zoom y vuelta atrás; teclado; panel con nota y fichas relacionadas; navegación a la ficha de Wiki; enlace profundo válido e inválido.
- **Coordinación con C-10**: el panel enlaza a `/wiki/<sección>/<slug>` (`origenes`, `varietales`, `procesos`) usando el registro `WIKI_SECTIONS` de C-10, así que C-11 se aplica después de C-10. C-10 suma `&from=<sección>/<slug>` a los enlaces de sus chips de notas (actualizado en su spec, diseño y tareas).
- **Fuera de alcance**: buscador dentro de la rueda, indexar descriptores en el buscador global, registro o historial de catas, enlace a `/wiki` filtrado por familia, otros idiomas.
