# Proposal

## Why

La estación de preparación (`/brew/:methodSlug`) necesita una escena visual interactiva que refleje con precisión qué acción ocurre en cada fase de la receta (vertido, nivel de líquido interpolado, cama de café en desgasificación o suspensión, agitación con cuchara o giro de recipiente, presión de émbolo y goteo en portafiltro) sin cargar videos ni archivos Lottie pesados (`DD-04`, `US-006`, `RN-UX-04`). El componente preliminar `BrewPreviewVesselSvg` introducido en `C-05` ofrece una silueta básica estática; este cambio construye el sistema definitivo de primitivas SVG modulares y el contenedor `<ProceduralBrewScene />` listo para previsualización por fase y sincronización con el reloj en vivo de `C-08`.

## What Changes

- Crear el sistema de primitivas SVG reutilizables en `src/features/brewing/components/svg-primitives/`:
  - `VesselSilhouette.tsx`: geometrías vectoriales editoriales de `160x168` (`viewBox="0 0 160 168"`) y máscaras `<clipPath>` con IDs únicos (`useId()`) para los 6 métodos del catálogo (`cone_v60`, `hourglass_chemex`, `wedge_melitta`, `cylinder_aeropress`, `beaker_french_press`, `portafilter_espresso`).
  - `LiquidLevel.tsx`: nivel de infusión interpolado linealmente entre `liquidFillStartRatio` y `liquidFillEndRatio` según el progreso normalizado de la fase $p \in [0, 1]$ ($L(p) = \text{start} + (\text{end} - \text{start}) \cdot \text{clamp}(p, 0, 1)$), renderizado mediante `transform: scaleY(...)` acelerado por GPU y coronado con menisco de crema (`--svg-coffee-crema`).
  - `PourStream.tsx`: chorro de vertido parametrizado (`none | gentle | steady | spiral`) con trazos vectoriales animados por `stroke-dashoffset` (`--svg-water-stream` en métodos de filtro/inmersión y `--svg-coffee-crema` en extracción de Espresso).
  - `CoffeeBed.tsx`: cama de café molido recortada dentro de la cámara del recipiente con 4 estados visuales (`calm | bubbling_bloom | active_slurry | settled`).
  - `Agitator.tsx`: indicadores vectoriales de agitación activa para `spoon_stir` (cuchara/paleta en movimiento orbital suave) y `vessel_swirl` (arcos direccionales de rotación tipo Rao spin).
  - `Plunger.tsx`: émbolo vertical con sello/malla parametrizado por `plungerState` (`none | up | pressing | down`) e interpolación de desplazamiento para `cylinder_aeropress` y `beaker_french_press`, más `PortafilterDrops` para la caída doble en `portafilter_espresso`.
- Implementar el componente contenedor `<ProceduralBrewScene directive={svgDirective} progress={p} reducedMotion={boolean} />` en `src/features/brewing/components/ProceduralBrewScene.tsx`, cumpliendo estrictamente `@media (prefers-reduced-motion: reduce)` y la prop `reducedMotion` (`US-006 CA-3`).
- Integrar `<ProceduralBrewScene />` en el panel derecho del reloj en `BrewStationView.tsx` (reemplazando al placeholder `BrewPreviewVesselSvg`), permitiendo previsualizar cualquier fase seleccionada desde la línea de tiempo, los puntos de fase o los controles `<`/`>`, junto con un selector/control interactivo de progreso de fase en modo vista previa.
- Agregar claves de diccionario en `src/i18n/locales/es/ui.json` para etiquetas de accesibilidad y telemetría visual de la escena procedural (`RN-I18N-01`).

## Capabilities

### New Capabilities
- `procedural-svg-brew-scene`: Sistema de primitivas SVG reutilizables (`VesselSilhouette`, `LiquidLevel`, `PourStream`, `CoffeeBed`, `Agitator`, `Plunger`), contenedor `<ProceduralBrewScene />` sincronizado con `SvgStageDirective` y progreso $p \in [0, 1]$, soporte de movimiento reducido (`prefers-reduced-motion`) e integración de vista previa interactiva por fase en `BrewStationView`.

### Modified Capabilities
<!-- No existing spec-level capabilities are modified; this introduces the procedural SVG scene capability that upgrades the C-05 preview placeholder. -->

## Impact

- **Código nuevo**:
  - `src/features/brewing/components/svg-primitives/VesselSilhouette.tsx`
  - `src/features/brewing/components/svg-primitives/LiquidLevel.tsx`
  - `src/features/brewing/components/svg-primitives/PourStream.tsx`
  - `src/features/brewing/components/svg-primitives/CoffeeBed.tsx`
  - `src/features/brewing/components/svg-primitives/Agitator.tsx`
  - `src/features/brewing/components/svg-primitives/Plunger.tsx`
  - `src/features/brewing/components/ProceduralBrewScene.tsx`
- **Código actualizado**:
  - `src/features/brewing/views/BrewStationView.tsx` (sustitución de `BrewPreviewVesselSvg` por `ProceduralBrewScene` e integración de vista previa por fase)
  - `src/features/brewing/components/BrewPreviewVesselSvg.tsx` (re-export o delegación limpia hacia `ProceduralBrewScene` para mantener compatibilidad con tests previos de `C-05`)
  - `src/i18n/locales/es/ui.json` y `src/index.css`
- **Tests**:
  - Suite unitaria y de integración en `src/features/brewing/__tests__/procedural-brew-scene.test.tsx` y actualización/verificación de `src/features/brewing/__tests__/brew-station-view.test.tsx`.
- **Dependencias externas**: Ninguna (`0 KB` de librerías de terceros; 100% React 19 + SVG nativo + CSS tokens Rev 4).
