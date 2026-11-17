# Design — C-03: Home Method Selector UI

## Context

`C-01` (`foundation-and-ui-shell`) estableció el `AppLayout` en modo oscuro único (`Revision: 3` de `design-system/tokens.css`, canvas `#120E0C`) junto con una vista inicial provisional (`src/features/brewing/HomeView.tsx`) que leía un arreglo local estático de tarjetas. `C-02` (`core-schemas-and-methods-catalog`) completó el catálogo tipado y validado con Zod (`METHODS_CATALOG` en `src/data/methods/index.ts`) para las 6 cafeteras del MVP (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`).

Este change (`C-03`) transforma la ruta `/` en el selector visual definitivo (`US-001`), conectándolo directamente a `METHODS_CATALOG`, sumando las siluetas vectoriales SVG de cada recipiente sobre las tarjetas fotográficas moody aprobadas, incorporando filtrado interactivo por categoría de extracción y exponiendo accesos directos tanto a `/wiki` como a `/flavor-wheel`. Ver `proposal.md` para la motivación completa y `specs/home-method-selector-ui/spec.md` para el contrato de comportamiento.

## UI Mockups

- **Design system revision**: 3 (from design-system/README.md — Modo Oscuro Único)
- **Decision**: yes (2026-11-16)
- **Mockups**: openspec/changes/c-03-home-method-selector-ui/mockups/home-method-selector.html
- **Approval**: approved (2026-11-16, by user)
- **Preview**: rendered (2026-11-16, openspec/changes/c-03-home-method-selector-ui/mockups/previews/desktop-1440x900.png, openspec/changes/c-03-home-method-selector-ui/mockups/previews/mobile-390x844.png)

### Design Brief

- **Surface Mode (`impeccable`)**: *Operate + Discover* — lectura instantánea en mesada a un brazo de distancia, jerarquía clara y cero fricción (`<= 2` toques hasta iniciar extracción).
- **Paleta y Atmósfera (`design-system/tokens.css` Rev 3)**:
  - Fondo principal `--bg-canvas: #120E0C`, contenedores `--bg-surface: #1B1512`, tarjetas fotográficas `--bg-dark-card: #16110E`.
  - Acento primario cobre `--accent-primary: #DF6B3E` para CTAs primarios y filtro activo; acento dorado `--accent-gold: #DF9E52` para etiquetas técnicas, detalles vectoriales SVG y métricas tabulares (`--font-mono`).
- **Composición de `MethodCard`**:
  - Conserva la fotografía moody de baja exposición (`/images/coffee/{v60,espresso,immersion,pro-machine}-moody.jpg`) con scrim oscuro (`linear-gradient(180deg, rgba(18,14,12,0.25) 0%, rgba(18,14,12,0.62) 45%, rgba(18,14,12,0.96) 100%)`) para garantizar contraste WCAG AA (`>= 4.5:1`).
  - Añade en la esquina superior derecha un contenedor translúcido (`44×44px`) con la silueta vectorial SVG identificatoria de la cafetera (`cone_v60`, `hourglass_chemex`, `wedge_melitta`, `cylinder_aeropress`, `beaker_french_press`, `portafilter_espresso`) usando `--svg-vessel-stroke: #F5ECE0` y detalles en `--accent-gold: #DF9E52`.
  - Muestra en el pie de tarjeta los 3 indicadores tabulares (`font-mono-tabular`) calculados directamente desde el perfil por defecto del catálogo (`normal` o `normale`): ratio/yield (`Ratio 1:16.7` / `Yield 1:2`), dosis (`15 g` / `18 g` / `20 g` / `30 g`) y duración (`3:30 min` / `25–30 s`).
- **Barra de Filtro por Categoría**:
  - Chips horizontales con altura mínima `44px` (`ui-ux-pro-max`), transición táctil `.pressable` (`scale(0.97)` en `150ms cubic-bezier(0.23, 1, 0.32, 1)` según `emil-design-eng`) y contador tabular por categoría: `Todos (6)`, `Filtro (3)`, `Inmersión (1)`, `Híbrido (1)`, `Presión (1)`.
- **Sección Dual de Descubrimiento (`/wiki` + `/flavor-wheel`)**:
  - Grilla inferior de 2 tarjetas en desktop (`1.1fr 0.9fr`) y 1 columna en móvil: a la izquierda el banner fotográfico para la **Wiki Sensorial** (`/wiki`) y a la derecha la tarjeta con emblema SVG multicapa para la **Rueda de Sabores SCA** (`/flavor-wheel`).

## Goals / Non-Goals

**Goals:**
- Conectar la vista `/` directamente a `METHODS_CATALOG` eliminando cualquier duplicación de ratios, dosis o duraciones en la capa de presentación.
- Proveer componentes desacoplados y testeables en `src/features/brewing/`:
  - `src/features/brewing/views/HomeMethodSelectorView.tsx`
  - `src/features/brewing/components/MethodCard.tsx`
  - `src/features/brewing/components/MethodVesselIcon.tsx`
- Derivar el estado de métodos filtrados durante el render (`useState<'all' | BrewMethod['category']>('all')`) sin `useEffect` redundantes (`vercel-react-best-practices`).
- Mantener compatibilidad limpia con `src/App.tsx` re-exportando `HomeMethodSelectorView` desde `src/features/brewing/HomeView.tsx`.

**Non-Goals:**
- No implementa la calculadora interactiva de escalado ni los controles de intensidad dentro de `/brew/:methodSlug` (eso corresponde a `C-04` y `C-05`).
- No implementa las primitivas SVG animadas en tiempo real del temporizador (`PourStream`, `LiquidLevel`, `CoffeeBed`, que corresponden a `C-06` y `C-07`).

## Decisions

### D-01: Derivación pura de métricas de tarjeta desde `BrewMethod`
- **Decisión**: Crear un helper puro de presentación (en `MethodCard.tsx` o `src/features/brewing/utils/method-card.mapper.ts`) que reciba un `BrewMethod` de `METHODS_CATALOG` y extraiga su perfil por defecto (`id === 'normal'` cuando `scalingMode === 'filter_water_ratio'`, o `id === 'normale'` cuando `scalingMode === 'espresso_yield_ratio'`).
  - **Ratio / Yield**: Si `scalingMode === 'espresso_yield_ratio'`, formatea con `t('methods.yieldLabel', { yield: formatRatio(profile.ratio) })`; de lo contrario, usa `t('methods.ratioLabel', { ratio: formatRatio(profile.ratio) })` (donde `16.67` se presenta como `16.7` y enteros como `16` o `15`).
  - **Dosis**: `t('methods.doseLabel', { dose: method.defaultDoseGrams })`.
  - **Tiempo estimado**: Para métodos de filtro/inmersión/híbrido, convierte `profile.totalDurationSeconds` a formato `M:SS` (`210 -> "3:30"`, `240 -> "4:00"`, `120 -> "2:00"`, `270 -> "4:30"`) interpolado en `t('methods.timeLabel', { time })`. Para Espresso (`normale`), muestra la ventana estándar `25–30 s` vía clave de diccionario.
- **Alternativa descartada**: Seguir leyendo `methods.v60.ratio`, `methods.v60.dose` y `methods.v60.time` como strings estáticos desde `ui.json`. Se descartó porque rompe la fuente única de verdad de `METHODS_CATALOG` exigida en `CHANGES.md` (`C-03`).

### D-02: Mapeo visual de fotografía moody y silueta SVG por `vesselType` / `method.id`
- **Decisión**: Construir `MethodVesselIcon.tsx` recibiendo `vesselType: SvgStageDirective['vesselType']` (obtenido de la primera fase del perfil por defecto de cada `BrewMethod`) para renderizar un `<svg>` inline con `viewBox="0 0 32 32"`, `aria-hidden="true"`, trazos en `currentColor` (`--svg-vessel-stroke`) y acentos en `var(--accent-gold)`. El mapeo de imagen de fondo y `objectPosition` se mantiene en un diccionario constante indexado por `BrewMethod['id']`.
- **Alternativa descartada**: Reemplazar las fotos moody por tarjetas planas solo con SVG. Se descartó porque el usuario aprobó explícitamente la Revisión 3 del Design System (*Modo Oscuro Único — Profesional Fotográfico Moody*), por lo que la combinación foto moody + badge de silueta SVG cumple simultáneamente con `US-001 CA-1` y el Design System aprobado.

### D-03: Filtrado síncrono en memoria con chips `aria-pressed`
- **Decisión**: Gestionar el filtro activo con `const [activeCategory, setActiveCategory] = useState<'all' | BrewMethod['category']>('all')` en `HomeMethodSelectorView.tsx` y calcular `filteredMethods` y los conteos por categoría directamente a partir de `METHODS_CATALOG`.
- **Alternativa descartada**: Almacenar la categoría en query params de URL en v1. Con solo 6 cafeteras en memoria, el estado local ofrece respuesta en `< 1 ms` sin ensuciar el historial de navegación al volver desde `/brew/:methodSlug`.

## Risks / Trade-offs

- **[Riesgo] Divergencia entre claves de `methods.json` (`frenchPress` vs `french-press`)** → **Mitigación**: `METHODS_CATALOG` define `id: 'french-press'` y `nameKey: 'methods.frenchPress.name'`. Los componentes deben usar siempre `method.nameKey` para el título y un mapa tipado `Record<BrewMethod['id'], ...>` para las claves de resumen visual y fotografía.
- **[Riesgo] Contraste insuficiente del ícono SVG o texto sobre las fotografías** → **Mitigación**: Mantener el scrim oscuro (`to-canvas/95`) y encerrar el `MethodVesselIcon` dentro de una cápsula oscura translúcida (`bg-canvas/80 border border-text-primary/20 backdrop-blur-sm`) con contraste verificado.
