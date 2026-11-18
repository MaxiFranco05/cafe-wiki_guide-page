# Proposal — C-05: Brew Station Calculator UI

## Why

La vista actual `src/features/brewing/BrewStationView.tsx` (creada en `C-01` como marcador estructural) presenta valores estáticos desde `ui.json`, no está conectada a `METHODS_CATALOG` (`C-02`) ni al motor de dominio puro (`calculateScaledRecipe`, `calculateEspressoStyles`, `evaluateRangeThresholds`, `resolveGrindTip` de `C-04`), carece de inputs numéricos editables bidireccionalmente, no soporta el modo especializado por rendimiento en taza (*yield*) para Espresso ni muestra advertencias físicas de rango o tips dinámicos de molienda. Reemplazar este marcador con la estación interactiva completa conecta el núcleo matemático verificado con la experiencia de mesada exigida por `US-001 CA-2`, `US-002`, `US-003` y `US-004`.

## What Changes

- Crear la vista interactiva definitiva `src/features/brewing/views/BrewStationView.tsx` (re-exportada desde `src/features/brewing/BrewStationView.tsx` para mantener compatibilidad con `src/App.tsx` y la suite de enrutamiento) conectada a `getMethodBySlug(methodSlug)` de `METHODS_CATALOG`, con validación de slug y renderizado de `NotFoundView` ante métodos inexistentes.
- Incorporar lectura y validación por lista blanca del query param opcional `?profile=light|normal|strong` (en métodos de filtro/inmersión/híbrido) o `?profile=ristretto|normale|lungo` (en Espresso), cayendo limpiamente al perfil por defecto (`normal` o `normale`) ante valores desconocidos o ausentes (`US-001 CA-2`, `§Seguridad y Resiliencia`).
- Construir `src/features/brewing/components/BrewControls.tsx` para métodos `filter_water_ratio` (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`):
  - Selector táctil de 3 intensidades (`Liviano`, `Normal`, `Fuerte`) mostrando el ratio del catálogo y actualizando el agua total al cambiar intensidad (`US-002 CA-1`).
  - Inputs numéricos bidireccionales `Café (g)` y `Agua (ml)` con sanitización y límites (`min="1"`, `max="2000"`, `step="0.1"`, bloqueo de `NaN`/`Infinity`/valores no positivos), subtítulo orientativo en cucharadas (`~X cdas` usando `estimateTablespoons`, `SU-01`) y badge de temperatura recomendada (`recommended` y rango `min–max °C`).
- Construir `src/features/brewing/components/EspressoYieldCards.tsx` para `/brew/espresso` (`scalingMode === "espresso_yield_ratio"`):
  - Input único de dosis seca en portafiltro (`18 g` por defecto, `min="1"`, `max="2000"`, `step="0.1"`).
  - Tres tarjetas seleccionables (`Ristretto 1:1.5`, `Normale 1:2`, `Lungo 1:3`) calculadas con `calculateEspressoStyles()`, mostrando el *yield* exacto en gramos, la ventana objetivo en segundos (`20–25 s`, `25–30 s`, `30–35 s`) y configurando el reloj y las fases al estilo seleccionado (`US-003 CA-1..3`).
- Construir `src/features/brewing/components/RangeWarningBanner.tsx`: banner visual contextual no bloqueante con tokens de advertencia (`--status-warning`, `--status-warning-bg`, `--status-warning-border`) e ícono SVG vectorial cuando `evaluateRangeThresholds` retorna `below_min` o `above_max` (`US-004 CA-1..3`), desapareciendo al regresar al rango operativo; deshabilita `Iniciar extracción` únicamente ante entradas inválidas (`<= 0`, vacías o no finitas, `RN-RG-02`).
- Construir `src/features/brewing/components/GrindRecommendationBadge.tsx` (`RN-BR-04`: tip dinámico más fino/estándar/más grueso) y `src/features/brewing/components/PhaseTimelinePreview.tsx` (lista ordenada de pasos con timestamps fijos `M:SS`, gramos parciales `+{phaseWaterGrams} g`, acumulados `→ {targetCumulativeGrams} g` e instrucciones interpoladas `RN-BR-02`, `RN-BR-03`).
- Conservar en el panel derecho la estética fotográfica moody Dark-Only (`Revision: 3`), mostrando duración objetivo/fase inicial del perfil seleccionado y los botones apilados de ancho completo (`Iniciar extracción` y `Reiniciar reloj`, altura `>= 48px`, cero hex sueltos, cero emojis).
- Ampliar `src/i18n/locales/es/ui.json` con todas las claves localizadas de controles, validación, espresso *yield*, molienda, temperatura, cucharadas y línea de tiempo (`RN-I18N-01`).

## Capabilities

### New Capabilities
- `brew-station-calculator-ui`: Estación interactiva de preparación en `/brew/:methodSlug` con inicialización por query param `?profile=...`, calculadora bidireccional Café ↔ Agua para filtro/inmersión/híbrido, tarjetas de *yield* para Espresso, alertas físicas no bloqueantes, badge dinámico de molienda y cronograma de fases en vivo bajo Design System Rev 3 (Dark-Only).

### Modified Capabilities
<!-- Ninguna capacidad existente modifica sus requisitos de especificación. -->

## Impact

- **Código afectado**:
  - `src/features/brewing/views/BrewStationView.tsx` (nuevo)
  - `src/features/brewing/BrewStationView.tsx` (actualizado para re-exportar la vista desde `./views/BrewStationView`)
  - `src/features/brewing/components/BrewControls.tsx` (nuevo)
  - `src/features/brewing/components/EspressoYieldCards.tsx` (nuevo)
  - `src/features/brewing/components/RangeWarningBanner.tsx` (nuevo)
  - `src/features/brewing/components/GrindRecommendationBadge.tsx` (nuevo)
  - `src/features/brewing/components/PhaseTimelinePreview.tsx` (nuevo)
  - `src/features/brewing/utils/brew-station.helpers.ts` (nuevo — helpers puros de sanitización de inputs, whitelist de `?profile=` y formateo `M:SS`)
  - `src/i18n/locales/es/ui.json` (nuevas claves de UI bajo `brew.*`)
  - `src/features/brewing/__tests__/brew-station-calculator.test.tsx` y `brew-station.helpers.test.ts` (nuevas suites de pruebas en Vitest + Testing Library)
- **APIs / Datos**: Consume `getMethodBySlug` (`src/data/methods/index.ts`) y `calculateScaledRecipe`, `calculateEspressoStyles`, `estimateTablespoons`, `evaluateRangeThresholds`, `resolveGrindTip` (`src/domain/brewing` y `src/domain/thresholds`). Sin nuevas dependencias externas en `package.json`.
- **Design System**: Respeta estrictamente `design-system/tokens.css` (`Revision: 3`, Dark-Only `#120E0C`) y requiere mockup HTML interactivo (`openspec/changes/c-05-brew-station-calculator-ui/mockups/brew-station-calculator.html`) con capturas en `1440x900` y `390x844` previo a `apply`.
