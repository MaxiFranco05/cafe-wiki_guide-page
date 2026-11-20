# CHANGES — Secuencia de Implementación

> Índice canónico de todos los changes del proyecto **Cafetería Wiki & Guide Page**.
> Cada change es atómico: un agente puede implementarlo en una sesión (~4-6 horas).
> **Estrategia Front-First**: Los changes están ordenados como *vertical slices* visuales para que al finalizar cada etapa el resultado sea inmediatamente navegable y verificable en el navegador, integrando el Design System aprobado (`design-system/`, `mode: "system-and-mockups"`).
> **Leer este archivo antes de ejecutar cualquier `/opsx:propose`.**

---

## Cómo usar este documento

1. Identificar el change a implementar (verificar que sus dependencias están en `openspec/changes/archive/`).
2. Leer los docs de la knowledge-base indicados en "Leer antes" (y revisar `design-system/README.md` en changes con impacto visual).
3. Ejecutar `/opsx:propose <nombre-del-change>`.
4. Al terminar el change, archivarlo con `/opsx:archive <nombre-del-change>`.
5. Marcar el checkbox `[x]` en este archivo.

---

## Árbol de dependencias

```
C-01 foundation-and-ui-shell
  └── C-02 core-schemas-and-methods-catalog      ← desbloquea todo el dominio y vistas
        │
        ├── C-03 home-method-selector-ui         ← vista `/` navegable de inmediato
        │     ├── C-05 brew-station-calculator-ui ← + C-04 (vista `/brew/:methodSlug`)
        │     │     └── C-08 brew-timer-live-execution-ui ← + C-06 + C-07
        │     │           └── C-12 pwa-offline-and-production-readiness ← + C-10 + C-11
        │     ├── C-10 sensory-wiki-explorer-ui  ← + C-09 + C-15 (portada `/wiki`, secciones y fichas)
        │     └── C-11 interactive-sca-flavor-wheel-ui ← + C-09 (vista `/flavor-wheel`)
        │
        ├── C-04 brewing-scaling-and-espresso-engine ← paralelo con C-03, C-06, C-07, C-09
        │
        ├── C-06 procedural-svg-brew-scene       ← primitivas SVG animadas reutilizables
        │
        ├── C-07 timer-engine-and-kitchen-adapters ← reloj monotónico + Wake Lock + Web Audio
        │
        └── C-09 wiki-and-flavor-wheel-catalog   ← catálogo Zod de Wiki + Rueda SCA
              └── C-15 wiki-brewers-and-drinks-catalog ← fichas de Cafeteras y Bebidas para la Wiki (+ C-13 recetas)
```

### Paralelismo por fase

> Cada "gate" es un punto de sincronización. Los changes dentro de un grupo pueden ejecutarse en paralelo.

```
GATE 0: ninguna
  → C-01 foundation-and-ui-shell                  [Agente C] (solo)

GATE 1: C-01 ✓
  → C-02 core-schemas-and-methods-catalog         [Agente A] (solo)

GATE 2: C-02 ✓                                    ← PRIMER FORK (5 desbloqueados)
  → C-03 home-method-selector-ui                  [Agente C]
  → C-04 brewing-scaling-and-espresso-engine      [Agente A]
  → C-06 procedural-svg-brew-scene                [Agente B]
  → C-07 timer-engine-and-kitchen-adapters        [Agente A — paso siguiente]
  → C-09 wiki-and-flavor-wheel-catalog            [Agente B — paso siguiente]

GATE 3: C-03 + C-04 ✓
  → C-05 brew-station-calculator-ui               [Agente C]

GATE 4: C-03 + C-09 ✓                             ← SEGUNDO FORK (Wiki + Rueda en paralelo)
  → C-11 interactive-sca-flavor-wheel-ui          [Agente B]

GATE 4b: C-09 + C-13 (multi-recipe-catalog-and-custom-recipes-domain) ✓
  → C-15 wiki-brewers-and-drinks-catalog          [Agente B]

GATE 4c: C-03 + C-09 + C-15 ✓
  → C-10 sensory-wiki-explorer-ui                 [Agente C]

GATE 5: C-05 + C-06 + C-07 ✓
  → C-08 brew-timer-live-execution-ui             [Agente C]

GATE 6: C-08 + C-10 + C-11 ✓
  → C-12 pwa-offline-and-production-readiness     [Agente C] (solo)
```

### Camino crítico (6 changes — mínimo irreducible)

```
C-01 → C-02 → C-04 → C-05 → C-08 → C-12
```

### Plan óptimo con 3 agentes

```
Paso │ Agente A (Backend/Domain Core)          │ Agente B (Backend/Domain Aux)           │ Agente C (Frontend)
─────┼─────────────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────────────────────
  1  │                    —                    │                    —                    │ C-01 foundation-and-ui-shell
  2  │ C-02 core-schemas-and-methods-catalog   │                    —                    │                    —
  3  │ C-04 brewing-scaling-and-espresso-engine│ C-06 procedural-svg-brew-scene          │ C-03 home-method-selector-ui
  4  │ C-07 timer-engine-and-kitchen-adapters  │ C-09 wiki-and-flavor-wheel-catalog      │ C-05 brew-station-calculator-ui
  5  │ C-10 sensory-wiki-explorer-ui           │ C-11 interactive-sca-flavor-wheel-ui    │ C-08 brew-timer-live-execution-ui
  6  │                    —                    │                    —                    │ C-12 pwa-offline-and-production-readiness
```

---

## FASE 0 — Cimientos, Design System y Shell Visual

> Establece desde el primer change la aplicación corriendo en el navegador con el Design System aprobado y los esquemas base de los 6 métodos.

### [x] [C-01] `foundation-and-ui-shell`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-16-c-01-foundation-and-ui-shell/`)
- **Scope**: Scaffolding completo de la SPA + integración de tokens del Design System + AppShell navegable mobile-first
  - Inicialización de proyecto con `Vite 6`, `React 19`, `TypeScript 5.6+ (strict)`, `Tailwind CSS`, `React Router` y `Vitest + Testing Library`
  - Estructura de directorios base: `src/domain/`, `src/data/`, `src/adapters/`, `src/features/{brewing,wiki,flavor-wheel}/`, `src/i18n/locales/es/`, `src/shared/`
  - Integración de `design-system/tokens.css` (paleta pergamino `#FBF8F3` / espresso `#181310` / cobre `#C85A32`, tipografía monoespaciada tabular, curvas `cubic-bezier` y `@media (prefers-reduced-motion: reduce)`), `design-system/brand.js` y `design-system/assets/logo.svg`
  - Componentes `src/shared/`: `AppLayout`, `TopNavbar`, `BottomTabBar` (móvil), `ThemeToggle` (modo claro editorial / modo oscuro de cocina `[data-theme="dark"]`)
  - Enrutador SPA configurado con las 5 rutas públicas (`/`, `/brew/:methodSlug`, `/wiki`, `/wiki/:category/:entrySlug`, `/flavor-wheel`) y vista 404 amigable con validación de parámetros
  - Infraestructura `src/i18n/index.ts` y diccionario base `src/i18n/locales/es/ui.json` (cero strings hardcodeados según `RN-I18N-01`)
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 1 aprobado en `design-system/README.md`)
  - Tests: renderizado del `AppShell`, cambio de tema claro/oscuro, navegación entre rutas públicas y resolución de claves `i18n`
- **Dependencias**: ninguna
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Propósito del sistema y §Alcance v1.0
  - `knowledge-base/02_descripcion_general.md` §Stack tecnológico y §Arquitectura general
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios

---

### [x] [C-02] `core-schemas-and-methods-catalog`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-16-c-02-core-schemas-and-methods-catalog/`)
- **Scope**: Esquemas Zod del dominio de preparación + catálogo estático calibrado de los 6 métodos MVP + diccionarios `es`
  - Esquemas en `src/domain/schemas/brewing.schema.ts`: `BrewMethodSchema`, `RangeThresholdSchema`, `RecipeProfileSchema`, `BrewPhaseSchema`, `SvgStageDirectiveSchema`
  - Invariantes Zod de compilación/test (`RN-I18N-02`): `defaultDoseGrams` dentro de `[minCoffeeGrams, maxCoffeeGrams]`, suma de `waterShare` en fases de vertido = `1.0` (`100%`), contigüidad de `startTimeSeconds`/`endTimeSeconds` igual a `totalDurationSeconds`
  - Catálogo estático en `src/data/methods/`: los 6 métodos (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`), cada uno con sus 3 perfiles (`light`/`normal`/`strong` o `ristretto`/`normale`/`lungo` — 18 recetas calibradas en total) y umbrales `RangeThreshold` (`RN-RG-03`)
  - Diccionario completo `src/i18n/locales/es/methods.json` con nombres, descripciones de perfil, pasos con placeholders interpolables (`{{waterGrams}}`, `{{cumulativeWaterGrams}}`), advertencias físicas y referencias de molienda (`RN-I18N-01`)
  - Sin impacto visual directo (`Decision: no (no UI)` en `design.md`)
  - Tests: validación exhaustiva de los 6 métodos y 18 perfiles contra `BrewMethodSchema`, rechazo de recetas con suma de agua `!= 1.0` o tiempos descuadrados, y verificación de existencia de todas las claves en `es/methods.json`
- **Dependencias**: C-01
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Entidades (1 a 5) y §Seed data inicial
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Límites Físicos (`RN-RG-03`) y §Internacionalización (`RN-I18N-01`, `RN-I18N-02`)
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones aplicados (`Schema-First Static Catalog`)
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-05

---

## FASE 1 — Selector Visual de Cafeteras y Estación de Cálculo Interactiva

> Con C-02 completado, se construyen en paralelo la pantalla principal de selección de métodos (`/`) y el motor matemático puro para habilitar de inmediato la calculadora interactiva en `/brew/:methodSlug`.

### [x] [C-03] `home-method-selector-ui`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-16-c-03-home-method-selector-ui/`)
- **Scope**: Pantalla de inicio (`/`) con grilla interactiva de las 6 cafeteras e ilustraciones SVG (`US-001`)
  - Vista `src/features/brewing/views/HomeMethodSelectorView.tsx` conectada al catálogo validado de los 6 métodos
  - Tarjetas interactivas `MethodCard.tsx` con silueta SVG vectorial de cada cafetera (`Hario V60`, `Chemex`, `Melitta`, `AeroPress`, `Prensa Francesa`, `Espresso`), badge de categoría (`Filtro`, `Inmersión`, `Híbrido`, `Presión`), ratio base, dosis sugerida y tiempo estimado
  - Filtro rápido por tipo de extracción y acceso directo destacado a la Wiki Sensorial (`/wiki`) y Rueda de Sabores (`/flavor-wheel`)
  - Navegación en 1 toque a `/brew/:methodSlug` pre-cargando el perfil `"normal"` (o `"normale"` en Espresso) y `defaultDoseGrams` en `< 100 ms` (`US-001 CA-2`)
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 1)
  - Tests: renderizado de las 6 cafeteras desde el catálogo, filtrado por categoría, navegación a `/brew/:methodSlug` y accesibilidad por teclado
- **Dependencias**: C-02
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Métricas de éxito (Cero fricción hasta la receta)
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas (`/`)
  - `knowledge-base/06_funcionalidades.md` §US-001
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios (`src/features/brewing`)

---

### [x] [C-04] `brewing-scaling-and-espresso-engine`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-16-c-04-brewing-scaling-and-espresso-engine/`)
- **Scope**: Motor funcional puro de escalado bidireccional, modo Espresso por *yield*, validación de umbrales y tips de molienda
  - Funciones puras en `src/domain/brewing/scaling.engine.ts`:
    - `calculateScaledRecipe(method, profileId, input: { coffeeGrams?: number; waterMl?: number })`: escalado bidireccional `café ↔ agua` (`RN-BR-01`), cálculo de `phaseWaterGrams` y `targetCumulativeGrams` por fase ajustando redondeo de `±1 g` en el vertido final (`RN-BR-02`), y conservación de tiempos fijos (`RN-BR-03`)
    - `calculateEspressoStyles(method, doseGrams)`: cálculo simultáneo de los 3 estilos por *yield* (`Ristretto 1:1.5` en `20–25 s`, `Normale 1:2.0` en `25–30 s`, `Lungo 1:3.0` en `30–35 s`) (`RN-BR-06`)
    - `estimateTablespoons(coffeeGrams)`: equivalencia orientativa en cucharadas soperas (`SU-01`)
  - Funciones puras en `src/domain/thresholds/threshold.validator.ts`:
    - `evaluateRangeThresholds(thresholds, coffeeGrams, waterMl)`: retorna estado `"ok" | "below_min" | "above_max" | "invalid_input"` y claves de mensaje (`RN-RG-01`, `RN-RG-02`, `RN-RG-03`)
    - `resolveGrindTip(method, coffeeGrams)`: retorna tip dinámico de molienda más fina en dosis chicas y más gruesa en dosis grandes (`RN-BR-04`)
  - Sin impacto visual directo (`Decision: no (no UI)` en `design.md`)
  - Tests (TDD estricto, 100% cobertura en `src/domain/__tests__/`): escalado `café → agua` y `agua → café` en los 5 métodos sin presión, suma exacta de fases sin deriva por redondeo, cálculo de *yield* en Espresso, disparo de advertencias en bordes exactos de `RN-RG-03`, y rechazo de inputs `<= 0` o `NaN`
- **Dependencias**: C-02
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Entidades (`BrewMethod`, `RangeThreshold`, `RecipeProfile`, `BrewPhase`)
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Motor de Escalado (`RN-BR-01` a `RN-BR-06`) y §Límites Físicos (`RN-RG-01` a `RN-RG-03`)
  - `knowledge-base/07_flujos_principales.md` §Flujo 1 y §Flujo 3
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-02, §DD-03 y §SU-01

---

### [x] [C-05] `brew-station-calculator-ui`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-17-c-05-brew-station-calculator-ui/`)
- **Scope**: Vista interactiva de Estación de Preparación (`/brew/:methodSlug`) con calculadora bidireccional, modo Espresso, alertas de rango y cronograma de fases (`US-002`, `US-003`, `US-004`)
  - Vista `src/features/brewing/views/BrewStationView.tsx` con lectura de query param opcional `?profile=light|normal|strong`
  - Componente `BrewControls.tsx`: selector táctil de 3 intensidades (`Liviano`, `Normal`, `Fuerte`), inputs numéricos bidireccionales `Café (g)` y `Agua (ml)` con sanitización (`min="1"`, `max="2000"`, `step="0.1"`), subtítulo de equivalencia en cucharadas (`~X cdas`, `SU-01`) y badge de temperatura recomendada
  - Componente `EspressoYieldCards.tsx`: vista especializada para `/brew/espresso` con input único de dosis seca (por defecto `18 g`) y 3 tarjetas seleccionables (`Ristretto 1:1.5`, `Normale 1:2`, `Lungo 1:3`) con *yield* en gramos y ventana de segundos (`US-003`)
  - Componente `RangeWarningBanner.tsx`: alerta visual contextual no bloqueante cuando la dosis o el agua sale de `RangeThreshold`, desapareciendo al volver al rango normal (`US-004`)
  - Componente `GrindRecommendationBadge.tsx` + `PhaseTimelinePreview.tsx`: muestra el tip dinámico de molienda (`RN-BR-04`) y la lista de pasos con tiempos fijos y gramos parciales/acumulados recalculados en vivo
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 1)
  - Tests: edición bidireccional de gramos/ml en UI, cambio de intensidad, selección de estilo en Espresso, aparición/desaparición del banner de advertencia y bloqueo del botón Iniciar ante valores `<= 0`
- **Dependencias**: C-03, C-04
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-BR-01 a §RN-RG-03
  - `knowledge-base/06_funcionalidades.md` §US-002, §US-003 y §US-004
  - `knowledge-base/07_flujos_principales.md` §Flujo 1 y §Flujo 3
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad y Resiliencia (Validación de Input en Cliente)

---

## FASE 2 — Escena SVG Procedural, Temporizador y UX de Cocina

> Construye las primitivas SVG animadas y los adaptadores de cocina (`Wake Lock` + `Web Audio` + reloj monotónico) para integrarlos en la ejecución en vivo del temporizador en `/brew/:methodSlug`.

### [x] [C-06] `procedural-svg-brew-scene`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-18-c-06-procedural-svg-brew-scene/`)
- **Scope**: Sistema de primitivas SVG reutilizables y componente `<ProceduralBrewScene />` sincronizado por fase y dosis (`US-006`, `RN-UX-04`)
  - Primitivas modulares en `src/features/brewing/components/svg-primitives/`:
    - `VesselSilhouette.tsx`: geometrías y máscaras `clipPath` para `cone_v60`, `hourglass_chemex`, `wedge_melitta`, `cylinder_aeropress`, `beaker_french_press` y `portafilter_espresso`
    - `LiquidLevel.tsx`: nivel de infusión interpolado suavemente entre `liquidFillStartRatio` y `liquidFillEndRatio` según progreso $p \in [0, 1]$
    - `PourStream.tsx`: chorro de vertido parametrizado (`none | gentle | steady | spiral`)
    - `CoffeeBed.tsx`: cama de café con estados `calm | bubbling_bloom | active_slurry | settled`
    - `Agitator.tsx` y `Plunger.tsx`: animación de cuchara/swirl (`spoon_stir | vessel_swirl`), émbolo (`up | pressing | down`) y caída de extracción en portafiltro (`PortafilterDrops`)
  - Componente contenedor `<ProceduralBrewScene directive={svgDirective} progress={p} reducedMotion={boolean} />` con soporte estricto de `@media (prefers-reduced-motion: reduce)` (`US-006 CA-3`)
  - Integración de vista previa interactiva por fase en `BrewStationView` (permite previsualizar la animación de cualquier paso al seleccionarlo)
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 1)
  - Tests: renderizado de los 6 `vesselType`, interpolación de altura de líquido para $p = 0, 0.5, 1$, activación condicional de primitivas según `SvgStageDirective` y desactivación de turbulencia continua bajo `prefers-reduced-motion`
- **Dependencias**: C-02
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md` §Justificación de decisiones (Primitivas SVG reutilizables)
  - `knowledge-base/04_modelo_de_datos.md` §Entidades (`5. SvgStageDirective`)
  - `knowledge-base/05_reglas_de_negocio.md` §RN-UX-04
  - `knowledge-base/06_funcionalidades.md` §US-006
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-04

---

### [x] [C-07] `timer-engine-and-kitchen-adapters`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-19-c-07-timer-engine-and-kitchen-adapters/`)
- **Scope**: Máquina de estados del temporizador monotónico + adaptadores imperativos para `Screen Wake Lock`, `Web Audio API` y `localStorage`
  - Motor puro en `src/domain/timer/brew-timer.engine.ts`:
    - Cálculo de tiempo transcurrido sin deriva mediante deltas de `performance.now()` (`RN-UX-01`)
    - Transiciones `idle → running → paused → completed`, resolución de `activePhase`, `nextPhase`, progreso normalizado de fase $p \in [0, 1]$, nivel de líquido interpolado y detección de hitos sonoros (`3`, `2`, `1` s previos y cambio de fase)
  - Adaptadores en `src/adapters/`:
    - `wake-lock.adapter.ts`: `requestWakeLock()`, `releaseWakeLock()`, re-adquisición automática en `document.visibilitychange === "visible"` cuando el timer está activo, y fallback silencioso si el navegador no soporta la API (`RN-UX-02`)
    - `web-audio.adapter.ts`: desbloqueo de `AudioContext` en el gesto `click`/`pointerdown` del usuario, síntesis por osciladores nativos (pulsos cortos 3-2-1, tono de nueva fase y acorde de finalización) y control de `mute` (`RN-UX-03`)
    - `storage.adapter.ts`: persistencia segura en `localStorage` para preferencias de usuario (`mute`, tema visual, última dosis e intensidad por método) con fallback en memoria
  - Sin impacto visual directo (`Decision: no (no UI)` en `design.md`)
  - Tests: precisión del motor temporal ante saltos simulados de reloj (pestaña en segundo plano), disparo exacto de eventos de pre-aviso (3-2-1) y transición de fase, ciclo de vida de `WakeLockAdapter` con mocks de `navigator.wakeLock` y `visibilitychange`, y resiliencia de `StorageAdapter` cuando `localStorage` lanza `QuotaExceededError`
- **Dependencias**: C-02
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md` §Integraciones externas (Tabla de Web APIs y fallbacks)
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Temporizador, Audio y UX de Cocina (`RN-UX-01`, `RN-UX-02`, `RN-UX-03`)
  - `knowledge-base/07_flujos_principales.md` §Flujo 2
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones aplicados (`Adapter Pattern para Web APIs`)
  - `knowledge-base/09_decisiones_y_supuestos.md` §SU-02

---

### [x] [C-08] `brew-timer-live-execution-ui`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-19-c-08-brew-timer-live-execution-ui/`)
- **Scope**: Integración del temporizador interactivo paso a paso, escena SVG en tiempo real y controles de Modo Cocina en `/brew/:methodSlug` (`US-005`, `US-007`)
  - Hook `src/features/brewing/hooks/useBrewTimer.ts` que conecta `brew-timer.engine`, `wakeLockAdapter`, `webAudioAdapter` y `storageAdapter` mediante `requestAnimationFrame` / loop de 100 ms
  - Componente `src/features/brewing/components/BrewTimer.tsx`:
    - Reloj principal tabular de alto contraste (tiempo total transcurrido y cuenta regresiva de la fase activa)
    - Tarjeta de instrucción activa con gramos del paso (`phaseWaterGrams`), objetivo acumulado en balanza (`targetCumulativeGrams`), destello visual suave al cambiar de fase (`SU-02`) y vista previa del siguiente paso (`US-005 CA-1`)
    - Controles táctiles de mesada: **Iniciar**, **Pausar / Reanudar**, **Reiniciar (`00:00`)** y salto manual entre fases (`US-005 CA-3`)
    - Barra de estado Kitchen Mode: badge `"Pantalla activa"` (o aviso discreto si Wake Lock no está soportado) y botón accesible `Silenciar / Activar sonido` persistido en `localStorage` (`US-007 CA-1..3`)
  - Sincronización en vivo de `<ProceduralBrewScene />` con el progreso real del temporizador en los 6 métodos
  - **UX / Navegación (resuelto en C-08)**:
    - Recordar la última cafetera seleccionada en la sesión (`sessionStorage`/`localStorage`, fallback `v60`) para que **"Estación de Preparación"** / **"Preparar"** en `TopNavbar` y `BottomTabBar` redirija a `/brew/<ultimo-metodo>` y marque el ítem como activo en cualquier `/brew/*`
    - Agregar selector rápido de cafetera dentro de `BrewStationView` para cambiar entre los 6 métodos sin volver a `/`
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 1)
  - Tests: flujo completo Iniciar → avance de fases → Pausar → Reanudar → Reiniciar en `BrewStationView`, actualización de gramos y escena SVG por fase, toggle de Mute persistido y feedback visual de Wake Lock
- **Dependencias**: C-05, C-06, C-07
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-UX-01 a §RN-UX-04
  - `knowledge-base/06_funcionalidades.md` §US-005, §US-006 y §US-007
  - `knowledge-base/07_flujos_principales.md` §Flujo 2 y §Flujo 3
  - `knowledge-base/09_decisiones_y_supuestos.md` §SU-02

---

## FASE 3 — Wiki Sensorial y Rueda de Sabores Interactiva (SCA)

> Modela el catálogo de conocimiento sensorial y construye en paralelo las vistas del explorador de Wiki (`/wiki`) y la rueda de sabores interactiva (`/flavor-wheel`), conectadas en 1 toque con la estación de preparación.

### [x] [C-09] `wiki-and-flavor-wheel-catalog`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-19-c-09-wiki-and-flavor-wheel-catalog/`)
- **Scope**: Esquemas Zod y catálogo estático completo de la Wiki del Café (38 fichas clasificadas en 2 niveles con prioridad Cono Sur + alias comerciales) y del árbol jerárquico de la Rueda de Sabores SCA (`RN-I18N-01`, `RN-I18N-02`)
  - Esquemas en `src/domain/schemas/wiki.schema.ts` y `flavor-wheel.schema.ts`: `WikiEntrySchema` (con `regionalRelevance`, `commercialAliasesKey`, `metadata` discriminado por `origin | varietal | process` incluyendo subgrupo taxonómico `macroRegion | geneticGroup | processFamily`, perfil sensorial `1..5` y `recommendedMethods`) y `FlavorWheelNodeSchema` (jerarquía recursiva de 3 niveles `tier: 1 | 2 | 3` con `colorHex`)
  - Catálogo estático en `src/data/wiki/` (38 fichas):
    - **Orígenes (16)**: *Sudamérica* (`brazil`, `colombia`, `peru`, `bolivia`, `ecuador`), *Centro/Norteamérica* (`guatemala`, `costa-rica`, `el-salvador`, `honduras`, `nicaragua`, `panama`, `mexico`), *África* (`ethiopia`, `kenya`, `rwanda`), *Asia-Pacífico* (`sumatra`)
    - **Varietales (16)**: *Grupo Bourbon/Typica* (`bourbon`, `mundo-novo`, `catuai`, `caturra`, `typica`, `maragogype`, `pacas`, `pacamara`, `villa-sarchi`), *Heirloom/Etiopía* (`geisha`, `sl28-sl34`, `java`, `sidra`), *Híbridos introgresados* (`castillo`, `catimor`), *Canephora* (`robusta-canephora`)
    - **Procesos (6)**: *Lavados limpios* (`washed`), *Mucílago/Honey* (`pulped-natural`, `honey`), *Naturales/Experimentales* (`natural`, `anaerobic`), *Descafeinados* (`decaf`)
  - Catálogo estático en `src/data/flavor-wheel/`: árbol de 3 anillos concéntricos con las 9 grandes familias de nivel 1 (Frutal, Floral, Dulce, Nueces/Cacao, Especiado, Tostado, Vegetal/Herbal, Ácido/Fermentado, Otros), subfamilias de nivel 2 y descriptores de nivel 3
  - Diccionarios `src/i18n/locales/es/wiki.json` y `src/i18n/locales/es/flavor-wheel.json` + selectores puros de búsqueda (incluyendo alias comerciales como Santos, Sul de Minas, Huila, Cajamarca), agrupación (`groupWikiEntriesBySubGroup`) y cruce bidireccional (`WikiEntry ↔ FlavorWheelNode ↔ BrewMethod`)
  - Sin impacto visual directo (`Decision: no (no UI)` en `design.md`)
  - Tests: validación de integridad referencial (`RN-I18N-02`) verificando que cada `flavorNodeId` y `methodId`/`profileId` citado en `WikiEntry` exista en el catálogo, y que el 100% de las claves de traducción estén definidas en `es`
- **Dependencias**: C-02
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §ERD, §Entidades (`6. WikiEntry`, `7. FlavorWheelNode`) y §Seed data inicial
  - `knowledge-base/05_reglas_de_negocio.md` §RN-I18N-01 y §RN-I18N-02
  - `knowledge-base/07_flujos_principales.md` §Flujo 4
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones aplicados (`Schema-First Static Catalog`)

---

### [x] [C-15] `wiki-brewers-and-drinks-catalog`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-20-c-15-wiki-brewers-and-drinks-catalog/`)
- **Origen**: pedido del usuario al revisar el mockup de C-10 (2026-11-19): la Wiki debe separar claramente cada tema y sumar **Cafeteras** y **Bebidas** como secciones propias.
- **Scope**: Esquemas Zod, catálogo estático y diccionarios `es` para dos nuevas secciones de la Wiki, sin UI
  - **Cafeteras**: una ficha por cafetera con origen e historia (inventor/región/época), cómo funciona y sus recetas destacadas y tradicionales enlazadas por `recipeId` al catálogo de recetas de `C-13` (`src/data/recipes/`), sin duplicarlas; las 6 del MVP enlazadas a su `BrewMethod` (`/brew/:methodSlug`) y posibilidad de cafeteras solo enciclopédicas (p. ej. moka, sifón) sin estación de preparación
  - **Bebidas**: fichas de bebidas a base de café, incluidas las de barra con leche que `C-13` deja fuera del motor de extracción (p. ej. espresso, ristretto, lungo, americano, cortado, macchiato, cappuccino, flat white, latte, mocha, café con leche, cold brew) con origen e historia, proporciones (café / leche / agua / espuma), método base y variantes regionales (prioridad Cono Sur)
  - Perfil sensorial `1..5` (acidez, dulzor, cuerpo, amargor) en ambas para la rueda de la ficha, y referencias cruzadas validadas a métodos, perfiles y fichas de la Wiki (`RN-I18N-02`)
  - Selectores puros por sección (búsqueda, filtros, agrupación) con la misma convención que `src/data/wiki/`
  - Sin impacto visual directo (`Decision: no (no UI)` en `design.md`)
  - Tests: esquemas, integridad referencial y 100% de claves i18n definidas
- **Dependencias**: C-02, C-09, C-13 (`multi-recipe-catalog-and-custom-recipes-domain`)
- **Governance**: MEDIO
- **Leer antes**:
  - `openspec/changes/c-13-multi-recipe-catalog-and-custom-recipes-domain/` (o su spec archivada)
  - `knowledge-base/04_modelo_de_datos.md` §Entidades (`1. BrewMethod`, `6. WikiEntry`)
  - `knowledge-base/05_reglas_de_negocio.md` §RN-I18N-01 y §RN-I18N-02
  - `openspec/specs/wiki-and-flavor-wheel-catalog/spec.md`

---

### [x] [C-10] `sensory-wiki-explorer-ui`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-20-c-10-sensory-wiki-explorer-ui/`)
- **Scope**: Portada de la Wiki (`/wiki`) con una tarjeta por sección, página propia por sección (`/wiki/:section`) y ficha detallada (`/wiki/:section/:entrySlug`) con conexión directa a preparación (`US-009`). Reestructurado el 2026-11-19 a pedido del usuario: cada tema por separado, sin una lista que mezcle orígenes, varietales y procesos
  - Portada `/wiki`: tarjetas de **Orígenes**, **Varietales**, **Procesos**, **Cafeteras** y **Bebidas** con cantidad de fichas
  - Página de sección `/wiki/:section` (`origenes | varietales | procesos | cafeteras | bebidas`): buscador instantáneo y filtros propios de esa sección (perfil en taza, familia SCA, subgrupo), estado en la URL
  - Ficha `/wiki/:section/:entrySlug`:
    - **Rueda sensorial** radial de 4 sectores (Acidez, Dulzor, Cuerpo, Amargor) con escala `1..5`, estilo "rueda de rendimiento", en lugar de barras
    - Metadatos específicos según la sección (altitud y región; especie y linaje; fermentación; historia de la cafetera; proporciones de la bebida)
    - Chips de notas de cata vinculados a `/flavor-wheel?node=...`
    - Botón de 1 toque **"Preparar en {Método} ({Perfil})"** a `/brew/:methodSlug?profile=:profileId` (`US-009 CA-3`)
  - Buscador global indexando las fichas reales de todas las secciones
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 4)
  - Tests: portada con 5 secciones, búsqueda y filtros por sección, ficha con rueda sensorial accesible, navegación en 1 toque a `/brew/:methodSlug?profile=...` con el perfil preseleccionado y 404 para sección o ficha inexistente
- **Dependencias**: C-03, C-09, C-15
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas (`/wiki`, `/wiki/:category/:entrySlug`)
  - `knowledge-base/04_modelo_de_datos.md` §Entidades (`6. WikiEntry`)
  - `knowledge-base/06_funcionalidades.md` §US-009
  - `knowledge-base/07_flujos_principales.md` §Flujo 4

---

### [C-11] `interactive-sca-flavor-wheel-ui`
- **Estado**: `[ ]` pendiente
- **Scope**: Visualización interactiva de la Rueda de Sabores SCA en `/flavor-wheel` con vista SVG radial + acordeón móvil y panel de cata (`US-010`)
  - Vista `src/features/flavor-wheel/views/FlavorWheelView.tsx` (`/flavor-wheel`)
  - Componente `SunburstFlavorWheelSvg.tsx`: renderizado geométrico SVG de los 3 anillos concéntricos (`Familia → Subfamilia → Descriptor`) con colores semánticos (`colorHex`), zoom/resaltado al seleccionar un segmento y navegación por teclado/ARIA (`US-010 CA-1`)
  - Componente `MobileFlavorTreeAccordion.tsx`: vista alternativa táctil sincronizada para pantallas pequeñas que permite explorar las 9 familias sin perder legibilidad (`US-010 CA-1`)
  - Componente `FlavorDescriptorDrawer.tsx`: panel de detalle que al tocar un nodo muestra su descripción sensorial (`tastingNoteKey`), ruta jerárquica y enlaces directos a las fichas de Wiki (`Orígenes`, `Varietales`, `Procesos`) donde predomina ese descriptor (`US-010 CA-2`)
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 1)
  - Tests: selección de nodos de nivel 1, 2 y 3 tanto en el SVG como en el acordeón móvil, apertura del panel descriptivo con sus notas sensoriales, y navegación hacia las fichas de Wiki relacionadas
- **Dependencias**: C-03, C-09
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas (`/flavor-wheel`)
  - `knowledge-base/04_modelo_de_datos.md` §Entidades (`7. FlavorWheelNode`)
  - `knowledge-base/06_funcionalidades.md` §US-010
  - `knowledge-base/07_flujos_principales.md` §Flujo 4

---

## FASE 4 — PWA Offline, Resiliencia y Cierre de Producción

> Empaqueta la aplicación completa como Progressive Web App (PWA) 100% funcional sin conexión y valida las métricas de calidad mobile-first del MVP.

### [C-12] `pwa-offline-and-production-readiness`
- **Estado**: `[ ]` pendiente
- **Scope**: Configuración PWA Offline con `vite-plugin-pwa`, `manifest.webmanifest`, cabeceras CSP y verificación integral E2E (`US-008`)
  - Configuración de `vite-plugin-pwa` (Workbox `generateSW`) en `vite.config.ts` para precachear el shell HTML/JS/CSS, íconos, escenas SVG y todo el catálogo estático (6 métodos, Wiki y Rueda SCA) (`US-008 CA-2`)
  - Manifiesto `public/manifest.webmanifest` con modo `standalone`, orientación `portrait`, colores de tema sincronizados con `design-system/tokens.css` e íconos `192x192`, `512x512` y `maskable` en `public/icons/` (`US-008 CA-1`)
  - Componente discreto `OfflineReadyToast` / indicador de estado offline en el `AppShell` y configuración de Content Security Policy estricta (`default-src 'self'`) más reglas de fallback SPA (`vercel.json` / `_redirects`) para acceso directo a cualquier ruta profunda sin conexión (`US-008 CA-3`)
  - Optimización de code-splitting por ruta (`brewing`, `wiki`, `flavor-wheel`) para asegurar `TTI < 1.5 s` y puntaje `Lighthouse >= 95` en Performance, Accessibility y Best Practices
  - UI Mockup requerido antes de `apply` si modifica el `AppShell` con el indicador offline (`visual_design.mode = "system-and-mockups"`)
  - Tests: verificación de build de producción (`npm run build`), validación de generación de `sw.js` y `manifest.webmanifest`, y suite de integración de los 4 flujos principales (`Flujo 1` a `Flujo 4`)
- **Dependencias**: C-08, C-10, C-11
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Métricas de éxito
  - `knowledge-base/02_descripcion_general.md` §Stack tecnológico (`vite-plugin-pwa`) y §Integraciones externas (`Service Worker`)
  - `knowledge-base/06_funcionalidades.md` §US-008
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios y §Seguridad y Resiliencia (CSP)
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-01

---

## FASE 5 — Multi-Receta y Recetas Personalizadas

> Habilita múltiples técnicas verificadas por cafetera (1 Estándar universal + recetas de autor fieles) y creación/edición/compartición de recetas personalizadas en `/brew/:methodSlug`.

### [x] [C-13] `multi-recipe-catalog-and-custom-recipes-domain`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-19-c-13-multi-recipe-catalog-and-custom-recipes-domain/`)
- **Scope**: Esquemas Zod multi-receta, catálogo verificado de 19 recetas (6 Estándar + 13 Autor/Clásicas), motor de escalado retrocompatible, normalizador automático de recetas custom (`waterShare`, tiempos, `svgDirective`), Export/Import JSON y persistencia CRUD en `storage.adapter.ts`
- **Dependencias**: C-02, C-04, C-07
- **Governance**: MEDIO

---

### [x] [C-14] `recipe-selector-and-custom-editor-ui`
- **Estado**: `[x]` completado y archivado (`openspec/changes/archive/2026-11-20-c-14-recipe-selector-and-custom-editor-ui/`)
- **Scope**: Selector/modal de recetas en `/brew/:methodSlug` (Estándar universal + Recetas de Autor con descripción de proceso y perfil de sabor + Mis Recetas), editor visual de recetas custom, duplicado desde catálogo y compartir/importar JSON
  - Selector / modal `RecipeSelectorModal.tsx` en `BrewStationView.tsx`: lista agrupada por `Estándar (por defecto)`, `Autores y Clásicas` (mostrando autor, dificultad, resumen del proceso y notas/sabor que destaca) y `Mis Recetas` (custom guardadas en `storageAdapter`)
  - Editor `CustomRecipeEditorModal.tsx`: formulario para crear desde cero o duplicar (`duplicateRecipeAsDraft`) una receta existente, editando nombre, ratio base, temperatura opcional y fases (tipo, título, duración en segundos, agua en ml o peso relativo) usando `buildCustomRecipe`
  - Acciones de compartir e importar JSON (`exportCustomRecipeJson` / `importCustomRecipeJson`) con feedback de validación inline y persistencia mediante `saveCustomRecipe` / `deleteCustomRecipe` / `selectedRecipeId`
  - Integración en `BrewStationView.tsx`, `useBrewTimer.ts` y `PhaseTimelinePreview.tsx` para escalar, previsualizar y ejecutar en vivo cualquier receta elegida o creada por el usuario (resolviendo `customTitle` / `customInstruction` cuando `source === 'custom'`)
  - UI Mockup requerido antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 3, `390x844` y `1440x900`)
  - Tests: selección de receta de autor (ej. Kasuya 4:6) actualizando fases/ratio/temperatura en `BrewStationView`, creación y persistencia de receta custom, duplicación de receta de autor y round-trip de importación JSON
- **Dependencias**: C-05, C-08, C-13
- **Governance**: MEDIO
- **Leer antes**:
  - `openspec/specs/multi-recipe-and-custom-recipes-domain/spec.md`
  - `src/domain/schemas/recipe.schema.ts`
  - `src/domain/brewing/custom-recipe.engine.ts`
  - `src/data/recipes/index.ts`
  - `design-system/README.md` (`Revision: 3`)

---

## Resumen de Changes

| ID | Change | Fase | Dependencias | Governance | UI Mockup (`system-and-mockups`) |
|---|---|---|---|---|---|
| `C-01` | `foundation-and-ui-shell` | FASE 0 | ninguna | BAJO | Sí (AppShell + Design System Rev 1) |
| `C-02` | `core-schemas-and-methods-catalog` | FASE 0 | `C-01` | CRITICO | No (dominio y datos puros) |
| `C-03` | `home-method-selector-ui` | FASE 1 | `C-02` | BAJO | Sí (Home `/` con 6 cafeteras) |
| `C-04` | `brewing-scaling-and-espresso-engine` | FASE 1 | `C-02` | MEDIO | No (motor matemático puro) |
| `C-05` | `brew-station-calculator-ui` | FASE 1 | `C-03, C-04` | MEDIO | Sí (Calculadora `/brew/:methodSlug`) |
| `C-06` | `procedural-svg-brew-scene` | FASE 2 | `C-02` | MEDIO | Sí (Escena SVG y primitivas) |
| `C-07` | `timer-engine-and-kitchen-adapters` | FASE 2 | `C-02` | ALTO | No (motor timer + Web APIs) |
| `C-08` | `brew-timer-live-execution-ui` | FASE 2 | `C-05, C-06, C-07` | MEDIO | Sí (Timer en vivo + Kitchen Mode) |
| `C-09` | `wiki-and-flavor-wheel-catalog` | FASE 3 | `C-02` | MEDIO | No (catálogo Zod Wiki + Rueda SCA) |
| `C-15` | `wiki-brewers-and-drinks-catalog` | FASE 3 | `C-02, C-09, C-13` | MEDIO | No (catálogo Zod Cafeteras + Bebidas) |
| `C-10` | `sensory-wiki-explorer-ui` | FASE 3 | `C-03, C-09, C-15` | BAJO | Sí (Portada, secciones y fichas `/wiki`) |
| `C-11` | `interactive-sca-flavor-wheel-ui` | FASE 3 | `C-03, C-09` | MEDIO | Sí (Rueda interactiva `/flavor-wheel`) |
| `C-12` | `pwa-offline-and-production-readiness` | FASE 4 | `C-08, C-10, C-11` | MEDIO | Sí (Indicador Offline / PWA shell) |
| `C-13` | `multi-recipe-catalog-and-custom-recipes-domain` | FASE 5 | `C-02, C-04, C-07` | MEDIO | No (esquemas, 19 recetas, motor y storage) |
| `C-14` | `recipe-selector-and-custom-editor-ui` | FASE 5 | `C-05, C-08, C-13` | MEDIO | Sí (Selector/modal + Editor custom `/brew`) |

## Backlog futuro (sin change asignado)

> Ideas del usuario (2026-11-19) para convertir la Wiki en una "wikipedia" con foco absoluto en el café. Se convertirán en changes cuando se prioricen.

- **Tueste**: niveles (claro, medio, oscuro), qué cambia en taza y para qué método conviene cada uno.
- **Molienda**: tamaños con referencias visuales y para qué cafetera sirve cada uno.
- **Glosario**: términos de barismo y cata (bloom, crema, canalización, TDS, etc.).
- **Autores**: baristas y referentes cuyas recetas usa la app (Hoffmann, Kasuya, Rao, etc.).
- **Asociaciones**: SCA, World Coffee Research, Q Grader y entidades del café de especialidad.
- **Catálogo editorial (C-16, a definir)**: historia, simbología e hitos con fuentes para las 60 fichas de la Wiki (C-10 ya tiene el capítulo listo y oculto mientras no haya contenido), y fuentes para la tabla origen ↔ varietal (`src/data/wiki/origin-varietals.ts`).
- **Imágenes para la PWA (C-12)**: convertir las 12 fotos del design system (620–790 KB cada una) a WebP/AVIF con varios tamaños antes de incluirlas en la caché offline.

**Primer change recomendado**: `C-01` (`foundation-and-ui-shell`) — levanta desde el primer paso el esqueleto Vite + React + TypeScript con los tokens del Design System aprobado (`design-system/tokens.css`) y el layout navegable para ir viendo los resultados visuales en el navegador a medida que se avanza.

Para arrancar: `/opsx:propose C-01-foundation-and-ui-shell`
