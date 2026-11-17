# Design — C-05: Brew Station Calculator UI

## Context

`C-01` creó un marcador estructural en `src/features/brewing/BrewStationView.tsx` con datos estáticos desde `ui.json`, mientras que `C-02` incorporó el catálogo validado con Zod (`METHODS_CATALOG` y `getMethodBySlug` en `src/data/methods/index.ts`), `C-03` implementó los iconos vectoriales `MethodVesselIcon.tsx` y los formateadores puros en `src/features/brewing/utils/method-card.mapper.ts`, y `C-04` entregó el motor matemático puro en `src/domain/brewing/scaling.engine.ts` y `src/domain/thresholds/threshold.validator.ts`. Asimismo, la barra superior (`src/shared/components/TopNavbar.tsx`) ya integra el buscador global unificado `GlobalSearch.tsx`, permitiendo navegar directamente a cualquier método `/brew/:methodSlug` sin recargar la SPA.

Este change (`C-05`) reemplaza el marcador estático de `/brew/:methodSlug` por la estación interactiva de preparación conectada en vivo al catálogo y al motor de dominio (`US-001 CA-2`, `US-002`, `US-003`, `US-004`). Ver `proposal.md` para la motivación completa y `specs/brew-station-calculator-ui/spec.md` para el contrato de comportamiento observable.

## UI Mockups

- **Design system revision**: 4 (propuesta Contraste **3A** + Tipografía **`Outfit` + `IBM Plex Mono`** empaquetada offline vía `@fontsource`)
- **Decision**: yes (2026-11-17)
- **Mockups**: openspec/changes/c-05-brew-station-calculator-ui/mockups/brew-station-calculator.html
- **Approval**: pending (Layout C + Fuente Outfit/IBM Plex Mono aprobados; pendiente confirmación final de variante hover "Llenado de Café" en Navbar y librería de Tooltip)
- **Preview**: rendered (2026-11-17, openspec/changes/c-05-brew-station-calculator-ui/mockups/previews/c05-final-desktop-1440x900.png, openspec/changes/c-05-brew-station-calculator-ui/mockups/previews/c05-final-espresso-desktop.png, openspec/changes/c-05-brew-station-calculator-ui/mockups/previews/c05-final-mobile-390x844.png)

### Design Brief (Actualizado Rev 4 — Layout C + Motion Smooth)

- **Surface Mode (`impeccable`)**: *Operate* — estación de mesada de alta legibilidad a un brazo de distancia, jerarquía numérica tabular ampliada (`clamp(1.85rem, 4.5vw, 2.35rem)` sin spinners nativos en inputs, `clamp(3.5rem, 5.5vw, 4.65rem)` en reloj, mínimo `14px` en instrucciones), título limpio sin sufijo de IA (`{t(method.nameKey)}`) y metadata en encabezado ordenada como **`Autor • Temp °C`** para mantener fija la temperatura al borde derecho mientras el autor cambia de longitud sin huecos ni saltos.
- **Paleta Café, Chocolate y Blanco Beige (`design-system/tokens.css` Rev 4)**:
  - Canvas profundo espresso `--bg-canvas: #160D08`, paneles elevados chocolate amargo `--bg-surface: #281911` (borde avellana `--border-strong: #6B4935` + highlight superior `inset 0 1px 0 rgba(247, 241, 231, 0.09)`), pozos de entrada chocolate negro `--bg-elevated: #1B100A` (`#543828`).
  - Tipografía **Blanco Beige (`--text-primary: #F7F1E7`)**, beige latte (`--text-secondary: #D9C8B6`) y café con leche (`--text-muted: #A9937E`).
  - Anti-"AI Slop": cero cajas anidadas dentro del panel izquierdo; molienda y cronograma de fases viven en filas editoriales separadas por hairlines (`border-t` / `border-b`) con barra lateral blanco beige dorado en la fase seleccionada.
  - **Chocolate Tostado (`--accent-primary: #944E29` / hover `#A85B32`)**: CTA `Iniciar extracción` (`#FCF8F2` sobre chocolate, contraste ~5.8:1), pastilla activa del navbar y estilo de Espresso activo.
  - **Blanco Beige Crema (`--accent-gold: #E4C49B`)**: acumulados, timestamps, menisco SVG, ratio (ícono Dial **1B**), dot activo y acción secundaria `Reiniciar reloj`.
  - **Caudal de Agua (`--svg-water-stream: #87B9D4`)**: celeste pizarra suave armónico para el campo `Agua total`, deltas parciales, ícono Gota **1A** y chorro SVG.
- **Layout C (`Split Reloj`) y Navegación Libre entre Fases (`<` / `>`)**:
  - Panel derecho fotográfico moody con escenario SVG sin recuadro punteado, slider de puntos interactivo, reloj flanqueado por botones táctiles `[<]` / `[>]` (`44×44px`) que permiten inspeccionar y saltar fases adelante/atrás sin bloqueo, barra unificada de 3 métricas (`Café · Agua · Ratio`) con tooltips propios estilo HeroUI (`Tooltip.tsx`, apertura inferior `placement="bottom"`, hover/focus/tap) y acciones apiladas `Iniciar extracción` / `Reiniciar reloj`.
- **Especificación de Animaciones Smooth (GPU `transform` / `opacity`, 170–900 ms, `prefers-reduced-motion: reduce`)**:
  - **Transición de valores al cambiar Intensidad / Dosis**: interpolación numérica rápida (`~175ms`, curva *cubic-out* vía `requestAnimationFrame`) en agua recalculada, métricas y yields, evitando bloqueos si el usuario sigue escribiendo, más `softBlurSwap` (`190ms`, `opacity` + leve `blur(3px -> 0)`) en cambio de **Autor**, ratio y pesos por fase sin desplazar ningún elemento (`0 px` layout shift).
  - **Slider de dots y cambio de paso**: DOM persistente en los indicadores `.phase-dot` para deslizar suavemente el ancho activo (`7px ↔ 24px`, `280ms cubic-bezier(0.22, 1, 0.36, 1)`) + deslizamiento direccional `±14px` en título/instrucción/caption (`240ms`) + micro-pulso del reloj (`220ms`).
  - **Escena SVG persistente**: `<clipPath>` + escala vertical suave del nivel líquido (`scaleY`, `380ms cubic-bezier(0.16, 1, 0.3, 1)`) y crossfade entre chorro de vertido y goteo en drenaje final.
  - **Navbar Hover "Liquid Fill" (CSS `::before`/`::after` rotativos)**: ítems de navegación pill no activos suben y bajan lentamente (`900 ms cubic-bezier(0.22, 1, 0.36, 1)`) su bloque líquido café mientras dos pseudoelementos rotativos (`border-radius: 40%/45%`, `@keyframes liquidWaveRotate`) tallan olas ondulantes continuas — variante final (`1`–`4`) a confirmar por el usuario.
- **Arquitectura Visual Responsive (Mobile-First `390×844` → Desktop `1440×900`)**:
  - **Mobile-first (`< 920px`)**: columna única ordenada por prioridad de uso en barra: **1) Controles de intensidad y cantidades (`Café` / `Agua` / `Alertas`) → 2) Panel Timer principal (para iniciar extracción sin scrollear) → 3) Recomendación de molienda y cronograma extendido de fases al final**, con `BottomTabBar` y sin desbordamiento horizontal (`scrollWidth <= innerWidth`).
  - **Desktop (`>= 920px`)**: grilla asimétrica `1.06fr 0.94fr` donde controles + molienda + fases conforman la columna izquierda unificada y el panel Timer ocupa la columna derecha; alturas normalizadas (`min-height` en tip de molienda e instrucción de timer) garantizando `0.0 px` de salto vertical al alternar intensidades o fases.
  - Cero emojis y cero literales hexadecimales sueltos fuera de `design-system/tokens.css`.

## Goals / Non-Goals

**Goals:**
- Conectar `/brew/:methodSlug` a `getMethodBySlug(methodSlug)` y al motor puro de `C-04` (`calculateScaledRecipe`, `calculateEspressoStyles`, `estimateTablespoons`, `evaluateRangeThresholds`, `resolveGrindTip`).
- Separar explícitamente la UI de filtro/inmersión (`BrewControls.tsx`) de la UI especializada de Espresso (`EspressoYieldCards.tsx`) usando variantes explícitas sin proliferación de flags booleanos (`vercel-composition-patterns`).
- Derivar todos los cálculos, evaluaciones de umbral, consejos de molienda y cronograma de fases síncronamente durante el render a partir de un único estado mínimo de entrada sin `useEffect` redundantes (`vercel-react-best-practices`).
- Soportar navegación directa vía `?profile=light|normal|strong` o `?profile=ristretto|normale|lungo` validada contra lista blanca del método (`§Seguridad y Resiliencia`).
- Proveer compatibilidad total con `src/App.tsx` y `src/shared/__tests__/AppLayout.test.tsx`.

**Non-Goals:**
- No implementa aún la escena SVG animada multiprimitiva por fase (`C-06`, `<ProceduralBrewScene />`) ni el reloj monotónico en ejecución con `Screen Wake Lock` y `Web Audio API` (`C-07`). En `C-05`, el panel derecho muestra la vista previa calibrada del perfil activo (duración total en `MM:SS`, resumen de dosis/objetivo e instrucción de fase inicial) y permite validar la habilitación/deshabilitación de `Iniciar extracción` más el reinicio del estado de calculadora al presionar `Reiniciar reloj`.

## Decisions

### D-01: Estado mínimo como fuente única de verdad y derivación síncrona en render (`vercel-react-best-practices`)
- **Decisión**: Encapsular el estado interactivo dentro de un subcomponente con `key={`${method.id}:${initialProfileId}`}` (`BrewStationSession`), manteniendo únicamente:
  - `profileId: RecipeProfile['id']` (inicializado desde `?profile` validado o el default del método).
  - `inputState`: `{ activeField: 'coffee' | 'water' | 'dose'; rawText: string; numericCoffeeGrams: number; numericWaterMl?: number }`.
  En cada render:
  - Para `filter_water_ratio`, si `activeField === 'water'`, se llama `calculateScaledRecipe(method, profileId, { waterMl: numericWaterMl })`; de lo contrario, `{ coffeeGrams: numericCoffeeGrams }`.
  - Para `espresso_yield_ratio`, se llama `calculateEspressoStyles(method, numericCoffeeGrams)` y `calculateScaledRecipe(method, profileId, { coffeeGrams: numericCoffeeGrams })` para obtener `thresholdEvaluation`, `grindTip`, `tablespoons` y las fases del estilo seleccionado.
  - El input que el usuario está editando activamente muestra `inputState.rawText` (permitiendo escribir decimales parciales como `"15."` o vaciar temporalmente el campo para reescribir), mientras el input opuesto muestra el valor derivado del motor.
  - Al cambiar de perfil de intensidad (`Liviano`, `Normal`, `Fuerte`), se preserva `numericCoffeeGrams` y `activeField` pasa a `'coffee'` para recalcular el agua total según `US-002 CA-1`.
- **Alternativa descartada**: Sincronizar `coffeeGrams`, `waterMl`, `phases` y `warning` mediante múltiples `useState` y `useEffect`. Se descartó porque duplica estado, introduce ciclos extra de renderizado y puede desfasar los totales ante ediciones rápidas (`vercel-react-best-practices`).

### D-02: Sanitización de inputs numéricos y whitelist de `?profile=` (`§Seguridad y Resiliencia`)
- **Decisión**: Crear `src/features/brewing/utils/brew-station.helpers.ts` con funciones puras reutilizables:
  - `resolveInitialProfileId(method: BrewMethod, rawQueryProfile: string | null): RecipeProfile['id']`: valida `rawQueryProfile` contra los `id` presentes en `method.profiles`; si no coincide o es `null`, retorna `'normale'` (Espresso) o `'normal'` (resto).
  - `parseSanitizedBrewInput(rawValue: string): { isValid: boolean; value: number }`: limpia espacios, valida que no sea `NaN`, `Infinity`, vacío ni `<= 0`, y acota al rango seguro `[1, 2000]` con `roundToOneDecimal` (o rechazo explícito si es `<= 0` o `> 2000`? Decisión: si el usuario ingresa `<= 0`, vacío o no numérico, `isValid: false` y `value: 0` para disparar `invalid_input` y deshabilitar `Iniciar extracción`; si excede `2000`, se acota a `2000` respetando `max="2000"`).
  - Reutilizar `formatRatioNumber` y `formatMinutesSeconds` desde `src/features/brewing/utils/method-card.mapper.ts` (evitando duplicar lógica de formateo).
- **Alternativa descartada**: Pasar `parseFloat(e.target.value)` directo sin acotar ni validar `rawQueryProfile`. Se descartó por incumplir `§Seguridad y Resiliencia` y `RN-RG-02`.

### D-03: Variantes explícitas de controles y componentes desacoplados (`vercel-composition-patterns`)
- **Decisión**: Descomponer `src/features/brewing/views/BrewStationView.tsx` en 5 componentes cohesivos bajo `src/features/brewing/components/`:
  1. `BrewControls.tsx`: selector de 3 intensidades (`Liviano`, `Normal`, `Fuerte` con `aria-pressed`), inputs bidireccionales `Café seco (g)` y `Agua total (ml)` con `<label>` visible, `min="1" max="2000" step="0.1"`, badge `~X cdas` (`estimateTablespoons`) y badge de temperatura (`waterTempCelsius`).
  2. `EspressoYieldCards.tsx`: input único `Dosis en portafiltro (g)` + grilla de 3 tarjetas seleccionables (`Ristretto 1:1.5`, `Normale 1:2`, `Lungo 1:3`) mostrando `yieldGrams` y `targetWindowSeconds`.
  3. `RangeWarningBanner.tsx`: recibe `ThresholdEvaluationResult` y renderiza el banner amarillo no bloqueante (`role="status"`, tokens `--status-warning*`) cuando `status === 'below_min' | 'above_max'`, ocultándose en `ok`.
  4. `GrindRecommendationBadge.tsx`: recibe `GrindTipResult` (`adjustment`, `tipKey`, `baseGrindKey`) y renderiza la recomendación base + badge de ajuste (`Más fina` / `Estándar` / `Más gruesa`).
  5. `PhaseTimelinePreview.tsx`: recibe `readonly ScaledBrewPhase[]` y renderiza la lista ordenada `<ol>` con timestamps fijos `M:SS`, `+phaseWaterGrams g → targetCumulativeGrams g` e instrucción interpolada desde `es/methods.json`.
- **Alternativa descartada**: Renderizar toda la calculadora dentro de un único archivo `BrewStationView.tsx` de 500 líneas con condicionales anidados. Se descartó por mantenibilidad, claridad de testing unitario y preparación para `C-06`/`C-07`.

### D-04: Compatibilidad de ruta, `MethodVesselIcon` y pruebas existentes
- **Decisión**: Mover la vista completa a `src/features/brewing/views/BrewStationView.tsx` y actualizar `src/features/brewing/BrewStationView.tsx` como re-export (`export { BrewStationView } from './views/BrewStationView';`). Reutilizar `MethodVesselIcon` y el mapeo de imagen moody por `method.id` (compartido en `method-card.mapper.ts` o constante exportada `METHOD_VISUAL_ASSETS`). Conservar el patrón de encabezado `{t(method.nameKey)} — {t('brew.stationTitle')}` y los botones `Iniciar extracción` / `Reiniciar reloj` para mantener intactos los tests de `AppLayout.test.tsx`.
- **Alternativa descartada**: Modificar las rutas de `src/App.tsx` o renombrar los títulos esperados por `AppLayout.test.tsx`.

## Risks / Trade-offs

- **[Riesgo] Fricción al escribir decimales o borrar el campo numérico (`"15."`, `""`) mientras el cálculo ocurre en vivo** → **Mitigación**: Guardar `rawText` para el campo enfocado (`activeField`) y solo recalcular el campo opuesto cuando `parseSanitizedBrewInput(rawText).isValid` sea `true`; ante `""` o `"0"`, mantener el valor textual del usuario, marcar el borde de error y deshabilitar `Iniciar extracción` sin sobreescribir el input mientras escribe.
- **[Riesgo] Navegación directa entre métodos (`/brew/v60` → `/brew/espresso`) desde `GlobalSearch` sin desmontar `BrewStationView`** → **Mitigación**: Pasar `key={`${method.id}:${initialProfileId}`}` al subcomponente de sesión `BrewStationSession` para reiniciar dosis y perfil determinísticamente al cambiar de ruta o query param sin usar `useEffect`.
- **[Riesgo] Inconsistencia de claves en `es/methods.json` para `french-press` vs `frenchPress`** → **Mitigación**: `C-02` ya incluye ambos namespaces y los objetos `BrewMethod` exponen `nameKey`, `baseGrindKey`, `warningMessageKeys`, `labelKey`, `descriptionKey`, `titleKey` e `instructionKey` directamente; los componentes nunca deben construir claves manualmente por `method.id`, sino leer siempre las propiedades de clave del objeto `BrewMethod` / `ScaledRecipeResult`.
- **[Riesgo] Divergencia entre el layout del mockup y los tokens de `src/index.css`** → **Mitigación**: Usar exclusivamente tokens semánticos de `design-system/tokens.css` (`--bg-canvas`, `--bg-surface`, `--bg-elevated`, `--status-warning*`, `--accent-primary`, `--accent-gold`) y clases mapeadas en `src/index.css` (`@theme`), verificando en `brew-station-calculator.html` que no haya literales hexadecimales ni emojis.
