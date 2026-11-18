# Design

## Context

Ver `proposal.md` para la motivación funcional. En `C-05` se introdujo `BrewPreviewVesselSvg.tsx` (`88x92`) como marcador de posición inicial en el panel derecho del reloj (`BrewStationView.tsx`). Para cumplir `US-006`, `RN-UX-04` y `DD-04`, `C-06` descompone la escena en primitivas SVG declarativas dentro de `src/features/brewing/components/svg-primitives/` y eleva la ilustración central a un lienzo editorial de `160x168` (`viewBox="0 0 160 168"`) gobernado por `<ProceduralBrewScene directive={svgDirective} progress={p} reducedMotion={boolean} />`.

Restricciones técnicas aplicables:
- **Regla Dura de Performance SVG (`RN-UX-04`)**: Prohibido animar filtros costosos (`feDisplacementMap`, `feGaussianBlur`) o atributos de geometría en bucle JS; usar exclusivamente `transform`, `opacity` y `stroke-dashoffset`.
- **Design System Rev 4 (`tokens.css`)**: Consumir únicamente las variables semánticas (`--svg-vessel-stroke`, `--svg-vessel-glass`, `--svg-water-stream`, `--svg-coffee-liquid`, `--svg-coffee-crema`, `--svg-coffee-bed`, `--accent-gold`, `--accent-primary`) sobre el panel `.timer-panel-surface` y el **Fondo 2 (`Ondas & Granos`)** sin imágenes de fondo (`id: 452`).
- **Aislamiento de renderizado (`vercel-react-best-practices`)**: Memoizar `<ProceduralBrewScene />` con `React.memo` para que en `C-08` las actualizaciones frecuentes de `progress` solo re-rendericen el subárbol SVG sin impactar la columna izquierda de controles.

## Goals / Non-Goals

**Goals:**
- Construir 6 primitivas SVG desacopladas, tipadas y testeadas (`VesselSilhouette`, `LiquidLevel`, `PourStream`, `CoffeeBed`, `Agitator`, `Plunger`) que consuman `SvgStageDirective` y `progress` ($p \in [0, 1]$).
- Garantizar interpolación matemática exacta del nivel de líquido:
  $$L(p) = \text{liquidFillStartRatio} + (\text{liquidFillEndRatio} - \text{liquidFillStartRatio}) \cdot \text{clamp}(p, 0, 1)$$
- Asegurar que múltiples instancias de `<ProceduralBrewScene />` en la misma vista no colisionen en sus `<clipPath>` mediante `useId()`.
- Soportar previsualización interactiva de cualquier fase en `BrewStationView` (incluyendo control opcional de progreso de fase en vista previa) antes de conectar el reloj en vivo en `C-08`.

**Non-Goals:**
- Implementar el motor de reloj monotónico (`performance.now()`), `Screen Wake Lock` o `Web Audio API` (corresponde a `C-07` y `C-08`).
- Modificar los esquemas Zod ni el catálogo de 6 métodos de `C-02`.

## Decisions

### D-01: Sistema de coordenadas unificado (`viewBox="0 0 160 168"`) y doble cámara en pour-overs
- **Decisión**: Estandarizar todas las primitivas sobre un `viewBox="0 0 160 168"` compartido, donde `VesselSilhouette` provee tanto el contorno visible como un registro de máscaras `<clipPath>` por instancia (`useId()`) discriminando dos cámaras en métodos de goteo (`cone_v60`, `hourglass_chemex`, `wedge_melitta`): una máscara inferior (`carafeClip`) donde sube `LiquidLevel` (con margen superior visible en la jarra) y una máscara superior (`upperFilterClip`) para `CoffeeBed` y un lecho líquido superficial acotado solo durante vertido/bloom/turbulencia (que drena en `settled`, sin llenar jamás hasta el borde superior del filtro). En inmersión y espresso (`cylinder_aeropress`, `beaker_french_press`, `portafilter_espresso`) se utiliza un único `<clipPath>` calibrado a su cilindro o taza.
- **Alternativas consideradas**:
  1. *Un `viewBox` distinto por cafetera*: obligaría a recalcular coordenadas de `LiquidLevel`, `PourStream` y `CoffeeBed` para cada método.
  2. *Un `<clipPath>` único fusionando filtro superior y jarra inferior*: provocaba desborde visual del líquido hasta el borde del papel de filtro cuando `L(p)` tendía a `1.0`.
  3. *Lienzo normalizado `160x168` con geometría dual (`carafeClip` + `upperFilterClip`) registrada por `vesselType`* (elegida).
- **Justificación**: Respeta la física real de filtrado y permite que `LiquidLevel`, `CoffeeBed`, `PourStream` (anclado a la superficie real), `Agitator` y `Plunger` operen con coordenadas consistentes sobre los 6 métodos y futuros métodos extensibles.

### D-02: Interpolación de `LiquidLevel` vía `transform: translateY`, olas continuas y mecánicas diferenciadas de émbolo
- **Decisión**: Calcular la función pura `interpolateLiquidFill(startRatio, endRatio, progress)` exportada desde `LiquidLevel.tsx` y aplicarla mediante `transform: translateY(...)` calibrado a la cámara inferior de cada `vesselType`, incluyendo una doble onda horizontal continua (`translateX` con periodo `80px` dentro del `<clipPath>`) y capa de espuma crema visible en `portafilter_espresso`. Para `PourStream`, renderizar cuerpo continuo + brillo vertical `svg-pour-shimmer` + ondas concéntricas de impacto en la superficie real; para `Agitator` (`spoon_stir`), pivote orbital superior + vórtice elíptico en superficie. Para `Plunger`, diferenciar explícitamente `beaker_french_press` (tapa fija en el borde de jarra + varilla/malla deslizando) de `cylinder_aeropress` (émbolo cilíndrico hueco telescópico con brida superior y junta de goma descendente sobre taza receptora).
- **Alternativas consideradas**:
  1. *Escalar con `transform: scaleY(level)`*: a niveles bajos ($L < 0.30$) aplasta la amplitud de las olas y comprime la capa de crema.
  2. *Reutilizar una varilla en T idéntica para AeroPress y Prensa*: resulta irreal para el pistón cilíndrico del AeroPress.
  3. *Desplazar verticalmente con `transform: translateY(surfaceY - 40)` + doble onda `translateX` + geometrías mecánicas propias por recipiente* (elegida).
- **Justificación**: Corre íntegramente en el compositor GPU (`RN-UX-04`), mantiene las olas y la crema proporcionales en todo el rango $L \in [0, 1]$ y evita colisiones mecánicas en Prensa Francesa y AeroPress.

### D-03: Composición de primitivas sin proliferación de props booleanas
- **Decisión**: Cada primitiva (`PourStream`, `CoffeeBed`, `Agitator`, `Plunger`) recibe directamente su variante discriminada del contrato `SvgStageDirective` (`pourStream`, `coffeeBedTurbulence`, `agitator`, `plungerState`, `vesselType`) más `progress` y `reducedMotion`, exponiendo atributos `data-*` semánticos (`data-vessel`, `data-pour-stream`, `data-turbulence`, `data-agitator`, `data-plunger-state`, `data-liquid-level`, `data-reduced-motion`) para verificación determinista en Vitest.
- **Alternativas consideradas**:
  1. *Pasar decenas de banderas booleanas (`isSpiral`, `isBubbling`, `isSpoon`, `isEspresso`)*: viola `vercel-composition-patterns` (`architecture-avoid-boolean-props`).
  2. *Pasar los unions tipados de `SvgStageDirective`* (elegida).
- **Justificación**: Mantiene trazabilidad 1:1 con el esquema Zod de dominio (`SvgStageDirectiveSchema`) y simplifica los tests unitarios.

### D-04: Respeto dual de `prefers-reduced-motion` (CSS media query + prop `reducedMotion`)
- **Decisión**: Detectar la preferencia del sistema mediante un hook ligero `usePrefersReducedMotion()` (con fallback seguro en SSR/test) combinable con la prop explícita `reducedMotion?: boolean` en `<ProceduralBrewScene />`. Cuando está activo, se desactivan las clases de animación infinita (`svg-pour-stream`, burbujeo de bloom, oscilación de cuchara/swirl) pero se conserva intacta la posición estática de cada primitiva y la altura `L(p)` del líquido.
- **Alternativas consideradas**:
  1. *Depender únicamente de CSS `@media (prefers-reduced-motion: reduce)`*: dificulta testear el estado estático en Vitest/jsdom y previsualizarlo desde la UI.
  2. *Soportar tanto `@media (prefers-reduced-motion: reduce)` en CSS como la prop `reducedMotion` en el componente* (elegida).
- **Justificación**: Cumple `US-006 CA-3` y permite verificar en tests unitarios que las animaciones continuas se desactivan explícitamente bajo movimiento reducido.

## Risks / Trade-offs

- **[Risk] Colisión de IDs de `<clipPath>` si se renderizan dos escenas SVG en simultáneo** → **Mitigation**: Generar el ID con `useId()` de React 19 en cada instancia de `<ProceduralBrewScene />` y sanear dos puntos (`:`) si fuera necesario para selectores URL (`url(#clip-...)`).
- **[Risk] Salto visual al cambiar de fase manualmente en `BrewStationView`** → **Mitigation**: Aplicar `transition: transform 320ms var(--ease-out)` al nivel de líquido cuando cambia de fase en modo vista previa y permitir inspeccionar el progreso $p \in [0, 1]$ de la fase seleccionada.

## UI Mockups

- **Decision**: `yes`
- **Design system**: `design-system/ (Revision: 4)`
- **Approval**: `approved (2026-11-18, by user)`
- **Mockup**: `openspec/changes/c-06-procedural-svg-brew-scene/mockups/procedural-svg-brew-scene.html`
- **Previews**:
  - `openspec/changes/c-06-procedural-svg-brew-scene/mockups/previews/desktop-1440x900.png`
  - `openspec/changes/c-06-procedural-svg-brew-scene/mockups/previews/mobile-390x844.png`
