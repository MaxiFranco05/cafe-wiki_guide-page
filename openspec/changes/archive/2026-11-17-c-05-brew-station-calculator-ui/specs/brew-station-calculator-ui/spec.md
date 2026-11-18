# Spec Delta — brew-station-calculator-ui

## Purpose

Proveer en `/brew/:methodSlug` la estación interactiva de cálculo de recetas para los 6 métodos del catálogo (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`), integrando inicialización por query param `?profile=...`, escalado bidireccional Café ↔ Agua con 3 intensidades, modo especializado de Espresso por rendimiento (*yield*), alertas físicas no bloqueantes, recomendación dinámica de molienda, cronograma de fases en vivo y ergonomía Dark-Only de mesada.

## ADDED Requirements

### Requirement: Method Station Initialization and Optional Profile Query Parameter
La ruta `/brew/:methodSlug` SHALL cargar dinámicamente el método correspondiente desde el catálogo validado en menos de `100 ms`, aceptar el parámetro de consulta opcional `?profile=...` validado contra la lista blanca de perfiles del método y renderizar la vista de ruta no encontrada (`404`) ante un `:methodSlug` inexistente (`US-001 CA-2`, `§Seguridad y Resiliencia`).

#### Scenario: Default initialization without profile query param
- **WHEN** el usuario accede a `/brew/v60` o `/brew/espresso` sin parámetro `?profile`
- **THEN** la estación carga inmediatamente `Hario V60` con el perfil `normal` (`15 g` → `250 ml`) o `Espresso` con el perfil `normale` (`18 g` → `36 g` de rendimiento objetivo)

#### Scenario: Valid optional profile query param pre-selects intensity or espresso style
- **WHEN** el usuario navega a `/brew/v60?profile=light` desde una ficha recomendada o enlace directo, o a `/brew/espresso?profile=ristretto`
- **THEN** la estación pre-selecciona el perfil `Liviano` (`1:17`, `15 g` → `255 ml`) en V60 o `Ristretto` (`1:1.5`, `18 g` → `27 g`) en Espresso sin recargar la página

#### Scenario: Unrecognized profile query param falls back safely to default profile
- **WHEN** la URL contiene un valor no permitido en `?profile` (ej. `/brew/v60?profile=ristretto` o `/brew/v60?profile=invalid`)
- **THEN** el sistema ignora el valor fuera de lista blanca y selecciona el perfil por defecto del método (`normal` o `normale`)

#### Scenario: Invalid method slug renders friendly 404 fallback
- **WHEN** el usuario accede a `/brew/metodo-inexistente`
- **THEN** la estación renderiza la vista `404 — Ruta no encontrada` con el enlace para volver al inicio (`/`)

### Requirement: Bidirectional Coffee and Water Scaling with Intensity Selector
Para métodos con modo de escalado por relación agua/café (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`), la estación SHALL ofrecer 3 controles táctiles de intensidad (`Liviano`, `Normal`, `Fuerte`), dos entradas numéricas sincronizadas bidireccionalmente (`Café seco (g)` y `Agua total (ml)`), equivalencia orientativa en cucharadas (`SU-01`) y temperatura recomendada de agua (`US-002 CA-1..4`, `RN-BR-01`, `RN-BR-05`).

#### Scenario: Changing intensity tier recalculates water while preserving current dry coffee dose
- **WHEN** el usuario edita la dosis en `/brew/v60` a `20 g` y luego selecciona el perfil `Fuerte` (`1:15`)
- **THEN** el perfil activo cambia a `aria-pressed="true"`, la dosis se mantiene en `20 g`, el agua total se recalcula a `300 ml` y las fases actualizan sus pesos manteniendo fijos sus tiempos

#### Scenario: Editing coffee grams recalculates water volume, tablespoons, and phases
- **WHEN** el usuario cambia el input de café en `/brew/v60` (`normal`, `1:16.67`) de `15` a `22`
- **THEN** el input de agua se actualiza instantáneamente a `367 ml`, el badge orientativo muestra `~2.9 cdas` (`22 / 7.5`) y las fases redistribuyen los `367 g` totales

#### Scenario: Editing water volume recalculates dry coffee grams with 0.1 g precision
- **WHEN** el usuario cambia el input de agua en `/brew/chemex` (`normal`, `1:16`) a `250`
- **THEN** el input de café se recalcula instantáneamente a `15.6 g`, el badge orientativo muestra `~2.1 cdas` y todas las fases reflejan los `250 g` acumulados

#### Scenario: Input sanitization and temperature display
- **WHEN** se renderizan los controles numéricos de café y agua
- **THEN** ambos inputs declaran `type="number"`, `min="1"`, `max="2000"`, `step="0.1"`, etiquetas `<label>` visibles asociadas, rechazan valores no finitos o fuera de contrato seguro al evaluar el cálculo, y muestran el badge de temperatura recomendada del método (ej. `93 °C` con rango `90–96 °C` en V60)

### Requirement: Specialized Espresso Yield Calculator Mode
Para `/brew/espresso`, la estación SHALL presentar una interfaz dedicada de dosis seca única (`18 g` por defecto) y 3 tarjetas seleccionables de estilo de extracción (`Ristretto 1:1.5`, `Normale 1:2`, `Lungo 1:3`) calculadas simultáneamente por rendimiento en taza (*yield*) y ventana objetivo en segundos (`US-003 CA-1..3`, `RN-BR-06`).

#### Scenario: Espresso displays single dry dose input and three live yield cards
- **WHEN** el usuario accede a `/brew/espresso` con la dosis por defecto de `18 g`
- **THEN** se muestra un único input numérico de `Dosis en portafiltro (g)` (sin input de agua de vertido libre) y 3 tarjetas seleccionables mostrando `Ristretto 1:1.5` (`27 g` · `20–25 s`), `Normale 1:2` (`36 g` · `25–30 s`, activa por defecto) y `Lungo 1:3` (`54 g` · `30–35 s`)

#### Scenario: Updating dry dose updates all three espresso yields simultaneously
- **WHEN** el usuario modifica la dosis en portafiltro de `18` a `20`
- **THEN** las 3 tarjetas se actualizan simultáneamente a `30 g` (`Ristretto`), `40 g` (`Normale`) y `60 g` (`Lungo`) conservando sus ventanas objetivo de segundos

#### Scenario: Selecting an espresso yield style updates target shot configuration
- **WHEN** el usuario selecciona la tarjeta `Ristretto` o `Lungo`
- **THEN** dicha tarjeta adopta `aria-pressed="true"`, el cronograma muestra la fase `Extracción bajo 9 bar` con el rendimiento objetivo correspondiente y el reloj del panel derecho muestra la duración calibrada del estilo elegido (`00:22` para Ristretto, `00:28` para Normale, `00:34` para Lungo)

### Requirement: Non-Blocking Physical Range Warning Banner and Invalid Input Guard
La estación SHALL evaluar continuamente los valores ingresados contra los umbrales físicos `RangeThreshold` del método (`RN-RG-01`..`RN-RG-03`) mostrando una alerta visual no bloqueante ante valores `below_min` o `above_max`, ocultándola al regresar al rango operativo y deshabilitando el botón `Iniciar extracción` únicamente ante entradas inválidas (`<= 0`, vacías o no finitas) (`US-004 CA-1..3`).

#### Scenario: Out-of-range dose triggers non-blocking warning banner
- **WHEN** el usuario ingresa `8 g` (debajo de `10 g`) o `42 g` (encima de `36 g`) en `/brew/v60`, o `12 g` / `24 g` en `/brew/espresso`
- **THEN** se renderiza un banner de advertencia accesible (`role="status"` / `aria-live="polite"`) con tokens semánticos de advertencia (`--status-warning`, `--status-warning-bg`, `--status-warning-border`), ícono SVG vectorial y el mensaje localizado del riesgo físico, mientras la calculadora y el botón `Iniciar extracción` permanecen habilitados

#### Scenario: Returning within physical limits dismisses the warning banner immediately
- **WHEN** el usuario corrige la dosis fuera de rango hacia un valor válido dentro de `[minCoffeeGrams, maxCoffeeGrams]` y `[minWaterMl, maxWaterMl]` (ej. `15 g` en V60)
- **THEN** el banner de advertencia desaparece inmediatamente sin dejar mensajes residuales

#### Scenario: Zero, empty, or negative input disables Iniciar extracción
- **WHEN** el input numérico de café o agua queda vacío, en `0` o en un valor negativo (`<= 0` o no numérico)
- **THEN** se muestra un mensaje claro de validación junto al control y el botón `Iniciar extracción` queda deshabilitado (`disabled`) hasta ingresar un número positivo válido (`> 0`)

### Requirement: Dynamic Grind Recommendation and Fixed-Timestamp Phase Timeline Preview
La estación SHALL mostrar la recomendación dinámica de molienda según la altura hidráulica de la cama de café (`RN-BR-04`) junto con la línea de tiempo completa de fases del perfil activo, conservando marcas horarias fijas (`M:SS`) y actualizando en vivo los gramos parciales y acumulados de cada paso (`RN-BR-02`, `RN-BR-03`, `US-002 CA-4`).

#### Scenario: Dynamic grind badge adjusts between finer, standard, and coarser guidance
- **WHEN** el usuario ingresa una dosis en `/brew/v60` menor a `12 g` (ej. `10.5 g`), intermedia (`15 g`) o mayor a `30 g` (ej. `33 g`)
- **THEN** el badge de molienda muestra la referencia base (`Media-fina (sal de mesa)`) junto con la indicación de ajuste `Más fina` (`< 12 g`), `Estándar` (`12–30 g`) o `Más gruesa` (`> 30 g`) resuelta desde el diccionario i18n

#### Scenario: Phase timeline preserves timestamps and displays partial plus cumulative weights
- **WHEN** se escala `/brew/v60` (`normal`) a `22 g` (`367 ml`)
- **THEN** el cronograma lista todas las fases en orden (`0:00`, `0:45`, `2:00`, `2:45`), cada fase con vertido muestra `+{phaseWaterGrams} g` y `→ {targetCumulativeGrams} g` sumando exactamente `367 g` al finalizar, y la fase de drenaje (`drawdown`) muestra `0:00` relativo / `0 g` agregado manteniendo `367 g` acumulados

### Requirement: Dark-Only Revision 3 Visual Integrity and Benchtop Action Ergonomics
Todos los componentes de la estación de preparación MUST operar exclusivamente bajo el tema oscuro de Revisión 3 (`design-system/tokens.css`), emplear tipografía tabular monoespaciada para lecturas numéricas, presentar iconografía SVG limpia sin emojis ni literales hexadecimales sueltos, y mantener controles táctiles apilados de ancho completo (`>= 48px` de altura) para uso cómodo en mesada móvil y escritorio (`RN-I18N-01`).

#### Scenario: Stacked full-width timer actions and accessible touch targets
- **WHEN** el usuario visualiza la estación en viewport móvil (`390×844`) o desktop (`1440×900`)
- **THEN** las acciones del panel de preparación (`Iniciar extracción` y `Reiniciar reloj`) se apilan verticalmente al `100%` del ancho del contenedor con altura mínima `>= 48px`, todos los chips de intensidad/tarjetas alcanzan `>= 44px` de alto, todos los textos visibles se resuelven por claves `i18n` en español y no existe ningún carácter emoji ni desbordamiento horizontal
