# Proposal — C-03: Home Method Selector UI

## Why

La vista inicial actual (`src/features/brewing/HomeView.tsx`, creada en `C-01`) usa un arreglo local estático de tarjetas sin conexión al catálogo validado (`METHODS_CATALOG` de `C-02`), carece de las siluetas vectoriales SVG identificatorias por cafetera (`US-001 CA-1`), no ofrece filtrado rápido por categoría de extracción (`Filtro`, `Inmersión`, `Híbrido`, `Presión`) y solo enlaza a la Wiki omitiendo un acceso directo dedicado a la Rueda de Sabores SCA (`/flavor-wheel`). Conectar la pantalla de inicio (`/`) directamente al catálogo tipado de los 6 métodos cumple el objetivo de cero fricción hasta la receta (`< 100 ms`, máximo 2 toques desde la apertura) y prepara la transición inmediata hacia la estación de preparación interactiva (`C-05`).

## What Changes

- Crear la vista `src/features/brewing/views/HomeMethodSelectorView.tsx` (y mantener el re-export o integración limpia desde `src/features/brewing/HomeView.tsx` / `src/App.tsx`) consumiendo directamente `METHODS_CATALOG` (`src/data/methods/index.ts`) como única fuente de verdad para las 6 cafeteras del MVP (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`).
- Construir el componente modular `src/features/brewing/components/MethodCard.tsx` que combina la estética aprobada del Design System (`Revision: 3` — Modo Oscuro Único con fotografía moody de baja exposición) con:
  - Silueta vectorial SVG limpia de la cafetera (`cone_v60`, `hourglass_chemex`, `wedge_melitta`, `cylinder_aeropress`, `beaker_french_press`, `portafilter_espresso`) mediante un componente `MethodVesselIcon.tsx`.
  - Badge de categoría de extracción (`Filtro`, `Inmersión`, `Híbrido`, `Presión`) derivado de `method.category`.
  - Métricas base derivadas dinámicamente del perfil por defecto (`normal` para métodos de filtro/inmersión/híbrido; `normale` para Espresso): ratio (`1:16.7`, `1:16`, `1:15`) o yield (`Yield 1:2`), dosis sugerida (`defaultDoseGrams` en gramos) y tiempo estimado formateado a partir de `totalDurationSeconds` (o ventana `25–30 s` en Espresso).
- Incorporar barra de chips interactivos de filtro por tipo de extracción (`Todos (6)`, `Filtro (3)`, `Inmersión (1)`, `Híbrido (1)`, `Presión (1)`) con soporte completo de teclado, estado `aria-pressed` y contador de métodos visibles.
- Reemplazar el banner inferior único por una sección dual de descubrimiento rápido con acceso directo tanto a la **Wiki Sensorial** (`/wiki`) como a la **Rueda de Sabores SCA** (`/flavor-wheel`).
- Garantizar navegación en 1 toque hacia `/brew/:methodSlug` pre-seleccionando implícitamente el perfil por defecto (`normal` / `normale`) y `defaultDoseGrams` en menos de `100 ms` (`US-001 CA-2`).
- Ampliar los diccionarios `src/i18n/locales/es/ui.json` y `src/i18n/locales/es/methods.json` con las claves de categorías de filtro, etiquetas de descubrimiento y descripciones cortas de tarjeta vinculadas a cada método del catálogo, manteniendo cero cadenas hardcodeadas (`RN-I18N-01`) y cero emojis.

## Capabilities

### New Capabilities
- `home-method-selector-ui`: Selector visual de cafeteras en la ruta pública `/` conectado a `METHODS_CATALOG`, con tarjetas interactivas `MethodCard` (fotografía moody + silueta SVG vectorial + métricas del perfil por defecto), filtrado instantáneo por categoría de extracción, accesos directos a `/wiki` y `/flavor-wheel`, y navegación en 1 toque a `/brew/:methodSlug`.

### Modified Capabilities
<!-- Ninguna capacidad existente modifica sus requisitos de especificación. -->

## Impact

- **Código afectado**:
  - `src/features/brewing/views/HomeMethodSelectorView.tsx` (nuevo)
  - `src/features/brewing/components/MethodCard.tsx` (nuevo)
  - `src/features/brewing/components/MethodVesselIcon.tsx` (nuevo)
  - `src/features/brewing/HomeView.tsx` (actualizado para delegar/exportar `HomeMethodSelectorView`)
  - `src/i18n/locales/es/ui.json` y `src/i18n/locales/es/methods.json` (nuevas claves de categorías de filtro y tarjetas de acceso directo)
  - `src/features/brewing/__tests__/home-method-selector.test.tsx` (nueva suite de tests de integración en Vitest + Testing Library)
- **APIs / Datos**: Consume `METHODS_CATALOG` y los tipos `BrewMethod`, `RecipeProfile` desde `src/data/methods` y `src/domain/schemas`. No introduce dependencias externas nuevas en `package.json`.
- **Design System**: Respeta estrictamente `design-system/tokens.css` (`Revision: 3`, Dark-Only `#120E0C`) y requiere aprobación previa del mockup HTML interactivo (`openspec/changes/c-03-home-method-selector-ui/mockups/home-method-selector.html`) bajo la política `system-and-mockups`.
