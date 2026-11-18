# Spec Delta

## Purpose

Define el comportamiento del sistema de primitivas SVG reutilizables y del componente `<ProceduralBrewScene />` que representan en tiempo real la geometría del recipiente, el nivel de infusión interpolado, el vertido, la cama de café y las acciones mecánicas de cada fase en la estación de preparación (`US-006`, `RN-UX-04`).

## ADDED Requirements

### Requirement: Siluetas de recipientes y máscaras de recorte por método
El sistema SHALL renderizar la silueta vectorial del recipiente y máscaras `<clipPath>` únicas generadas con `useId()` para cada uno de los 6 valores de `vesselType` (`cone_v60`, `hourglass_chemex`, `wedge_melitta`, `cylinder_aeropress`, `beaker_french_press`, `portafilter_espresso`), empleando las variables de diseño `--svg-vessel-stroke` y `--svg-vessel-glass`. En los métodos de goteo de doble cámara (`cone_v60`, `hourglass_chemex`, `wedge_melitta`), la máscara de líquido principal SHALL recortar exclusivamente la jarra/servidor inferior (`carafeClip`) mientras una máscara superior dedicada (`upperFilterClip`) recorta la cama de café y su lecho húmedo superficial, evitando que el líquido infundido desborde hacia el borde superior del filtro de papel.

#### Scenario: Renderizado de los 6 tipos de recipiente
- **WHEN** `ProceduralBrewScene` recibe una directiva con cualquiera de los 6 valores válidos de `vesselType`
- **THEN** el SVG expone `data-vessel="<vesselType>"`, define `<clipPath>` únicos vinculados a la cámara del método sin colisión de IDs en el DOM y en métodos pour-over (`cone_v60`, `hourglass_chemex`, `wedge_melitta`) confina la subida de líquido a la jarra inferior

### Requirement: Interpolación lineal del nivel de líquido por progreso de fase
El sistema SHALL interpolar el nivel entre `liquidFillStartRatio` y `liquidFillEndRatio` ($L(p) = \text{start} + (\text{end} - \text{start}) \cdot \text{clamp}(p, 0, 1)$), aplicando desplazamiento vertical por `transform: translateY(...)`, doble onda senoidal continua en la superficie y capa de espuma crema en `portafilter_espresso`.

#### Scenario: Interpolación exacta en el inicio, mitad y final de la fase
- **WHEN** una fase declara `liquidFillStartRatio: 0.2` y `liquidFillEndRatio: 0.8` y se evalúa con `progress = 0`, `0.5` y `1`
- **THEN** la primitiva `LiquidLevel` calcula niveles normalizados de `0.20`, `0.50` y `0.80` respectivamente (saturando `progress < 0` en `0` y `progress > 1` en `1`) y desplaza el cuerpo líquido manteniendo intactas las ondas superficiales y la capa de espuma crema en `portafilter_espresso`

### Requirement: Primitiva de chorro de vertido parametrizada
El sistema SHALL mostrar la primitiva `PourStream` únicamente cuando `pourStream` sea distinto de `none` (`gentle`, `steady` o `spiral`), diferenciando cuerpo líquido continuo con brillo vertical animado (`svg-pour-shimmer`) y ondas concéntricas de impacto ancladas a la superficie activa frente a la espiral concéntrica (`spiral`) y aplicando `--svg-water-stream` en métodos de filtro/inmersión o `--svg-coffee-crema` en caída doble cuando `vesselType` sea `portafilter_espresso`.

#### Scenario: Omisión del chorro cuando pourStream es none
- **WHEN** `directive.pourStream` tiene el valor `none`
- **THEN** no se renderiza ningún trazo de vertido activo en la escena SVG

#### Scenario: Chorro espiral en método de filtro vs extracción en Espresso
- **WHEN** `directive.pourStream` es `spiral` en `cone_v60` o `steady` en `portafilter_espresso`
- **THEN** el sistema renderiza `data-pour-stream="spiral"` con oscileo espiral, ondas concéntricas en la superficie superior del filtro y trazo `--svg-water-stream` para V60, y `data-pour-stream="steady"` con flujo doble `--svg-coffee-crema` para Espresso

### Requirement: Estados visuales de la cama de café
El sistema SHALL renderizar la primitiva `CoffeeBed` dentro del `<clipPath>` correspondiente (`upperFilterClip` en goteo por gravedad con lecho superficial solo durante vertido/bloom/turbulencia y drenado en `settled`, o `vesselClip` en inmersión) reflejando los 4 estados de `coffeeBedTurbulence` (`calm`, `bubbling_bloom`, `active_slurry`, `settled`) mediante el color `--svg-coffee-bed`, burbujas de desgasificación en `bubbling_bloom` y partículas en suspensión durante `active_slurry`.

#### Scenario: Transición entre cama en bloom y cama asentada
- **WHEN** `coffeeBedTurbulence` cambia de `bubbling_bloom` a `settled`
- **THEN** la escena actualiza `data-turbulence` en la primitiva de cama de café, mostrando burbujas de $\text{CO}_2$ y suspensión húmeda superficial en el bloom y un lecho compacto horizontal al finalizar el drenaje

### Requirement: Activación condicional de agitador, émbolo y goteo de portafiltro
El sistema SHALL renderizar la primitiva `Agitator` solo cuando `agitator` sea `spoon_stir` (cuchara con pivote orbital y vórtice elíptico en la superficie líquida) o `vessel_swirl`, la primitiva `Plunger` cuando `plungerState` sea `up`, `pressing` o `down` (diferenciando la geometría de émbolo cilíndrico hueco telescópico con junta de goma para `cylinder_aeropress` frente a tapa fija en borde con varilla y malla móvil para `beaker_french_press`, e interpolando el recorrido vertical en `pressing` según `progress`), y las gotas de extracción doble (`PortafilterDrops`) en `portafilter_espresso` cuando exista flujo activo.

#### Scenario: Agitación y presión de émbolo según directiva
- **WHEN** una fase declara `agitator: "spoon_stir"` o `plungerState: "pressing"` con `progress = 0.5` en `cylinder_aeropress` o `beaker_french_press`
- **THEN** la escena activa `[data-agitator="spoon_stir"]` con cuchara orbital sobre la superficie o posiciona el émbolo específico de la cafetera (`[data-plunger-state="pressing"]`) a mitad de recorrido vertical dentro de la cámara sin atravesar la tapa ni desbordar el filtro

### Requirement: Accesibilidad de movimiento reducido e integración en BrewStationView
El sistema SHALL respetar `@media (prefers-reduced-motion: reduce)` y la prop `reducedMotion`, desactivando animaciones continuas de turbulencia, burbujeo o flujo mientras conserva el nivel interpolado `L(p)` y los indicadores estáticos de acción, e integrando `<ProceduralBrewScene />` en `BrewStationView` para previsualizar cualquier fase seleccionada.

#### Scenario: Previsualización por fase y modo prefers-reduced-motion activo
- **WHEN** el usuario selecciona una fase en `BrewStationView` (o activa el control de progreso de vista previa) con `reducedMotion={true}`
- **THEN** `ProceduralBrewScene` refleja la directiva de esa fase con `data-reduced-motion="true"`, suprime los bucles infinitos de animación y mantiene visibles las primitivas estáticas y la altura exacta de líquido
