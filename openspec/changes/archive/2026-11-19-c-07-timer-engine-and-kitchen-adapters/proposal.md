# Proposal

## Why

La estación de preparación (`/brew/:methodSlug`) ya cuenta con el motor de escalado (`C-04`), la calculadora interactiva (`C-05`) y la escena SVG procedural (`C-06`), pero carece del núcleo temporal monotónico libre de deriva y de los adaptadores de plataforma para mantener la pantalla encendida, emitir alertas acústicas sintetizadas y persistir las preferencias del barista en cocina (`RN-UX-01` a `RN-UX-03`). Construir ahora este núcleo funcional puro junto con sus adaptadores imperativos desacoplados permite verificar con TDD estricto todas las transiciones temporales y los fallbacks de Web APIs antes de conectar la vista en vivo en `C-08`.

## What Changes

- **Motor puro de temporizador monotónico (`src/domain/timer/brew-timer.engine.ts` y `src/domain/timer/index.ts`)**:
  - Máquina de estados inmutable y determinística (`idle` → `running` ↔ `paused` → `completed`) que opera exclusivamente mediante marcas de tiempo monotónicas inyectadas (`nowMs: number`, provenientes de `performance.now()` en la capa imperativa) sin importar `react`, `window`, `document` ni `navigator` (`RN-UX-01`).
  - Funciones puras para iniciar (`startTimer`), pausar (`pauseTimer`), reanudar (`resumeTimer`), reiniciar (`resetTimer`), saltar manualmente de fase (`jumpToPhase`) y evaluar cada pulso (`tickTimer`), calculando:
    - Tiempo total transcurrido (`elapsedSeconds`, `elapsedMs`) y restante (`remainingTotalSeconds`) sin deriva ante suspensiones del hilo o pestañas en segundo plano.
    - Fase activa (`activePhase`, `activePhaseIndex`), siguiente fase (`nextPhase`), tiempo restante de la fase activa (`remainingPhaseSeconds`) y progreso normalizado de fase $p \in [0, 1]$.
    - Nivel de líquido interpolado (`interpolatedLiquidLevel`) entre `liquidFillStartRatio` y `liquidFillEndRatio` de la `svgDirective` activa (`RN-UX-04`).
    - Detección diferencial y sin duplicados de eventos acústicos/visuales entre dos ticks consecutivos: pre-avisos de cuenta regresiva (`countdown_3`, `countdown_2`, `countdown_1` en los últimos `3`, `2` y `1` segundos de cada fase), transición a nueva fase (`phase_transition`) y finalización de extracción (`brew_completed`).
- **Adaptador de bloqueo de pantalla (`src/adapters/wake-lock.adapter.ts`)**:
  - Encapsula `navigator.wakeLock.request('screen')` con gestión de `WakeLockSentinel`, liberación automática al pausar/reiniciar/completar (`releaseWakeLock()`) y re-adquisición automática cuando `document.visibilityState === 'visible'` mientras la sesión continúa activa (`RN-UX-02`).
  - Degradación silenciosa (`isSupported: false`, `isActive: false`, sin excepciones no controladas) en navegadores o entornos SSR/test sin soporte de `Screen Wake Lock API` o cuando el sistema operativo rechaza el bloqueo por ahorro de batería (`SU-02`).
- **Adaptador de audio sintetizado (`src/adapters/web-audio.adapter.ts`)**:
  - Síntesis 100% procedural mediante osciladores nativos (`AudioContext` + `OscillatorNode` + `GainNode`), sin archivos `.mp3`/`.wav` externos (`RN-UX-03`):
    - Desbloqueo y reanudación (`unlock()`) dentro del gesto directo del usuario (`click`/`pointerdown`).
    - Tonos diferenciados: pulso corto de pre-aviso (`3`, `2`, `1` s), tono doble de cambio de fase y acorde ascendente de extracción completada.
    - Control de silencio (`setMuted`, `isMuted`) y degradación limpia si `AudioContext` no está disponible o está bloqueado.
- **Adaptador de almacenamiento local resiliente (`src/adapters/storage.adapter.ts` y `src/adapters/index.ts`)**:
  - Persistencia tipada y validada con **Zod** (`safeParse`) sobre `localStorage` para preferencias del usuario: estado `muted`, `theme`, `lastSelectedMethodSlug` (habilitando recordar la última cafetera activa en la navegación de `C-08`) y diccionario de última configuración por método (`coffeeGrams`, `waterMl`, `profileId`).
  - Fallback transparente en memoria clonado con `structuredClone()` cuando `localStorage` no existe, está bloqueado por privacidad o lanza `QuotaExceededError` / `SecurityError`.

## Capabilities

### New Capabilities
- `timer-engine-and-kitchen-adapters`: Máquina de estados pura de temporizador monotónico (`RN-UX-01`), cálculo de progreso de fase y detección de hitos sonoros, junto con los adaptadores imperativos resilientes para `Screen Wake Lock API` (`RN-UX-02`), síntesis `Web Audio API` (`RN-UX-03`) y persistencia validada en `localStorage`.

### Modified Capabilities
<!-- Ninguna capacidad existente cambia sus requisitos de especificación. -->

## Impact

- **Código nuevo**:
  - `src/domain/timer/brew-timer.engine.ts` y `src/domain/timer/index.ts` (núcleo puro de dominio, exportado también desde `src/domain/index.ts` si aplica).
  - `src/adapters/wake-lock.adapter.ts`, `src/adapters/web-audio.adapter.ts`, `src/adapters/storage.adapter.ts` y `src/adapters/index.ts`.
- **Tests unitarios (Strict TDD)**:
  - `src/domain/__tests__/brew-timer.engine.test.ts` (entorno `node` / Vitest puro sin DOM).
  - `src/adapters/__tests__/wake-lock.adapter.test.ts`, `src/adapters/__tests__/web-audio.adapter.test.ts` y `src/adapters/__tests__/storage.adapter.test.ts`.
- **Dependencias y Bundle**: Cero librerías externas nuevas; utiliza exclusivamente Web APIs estándar y `zod` ya presente en el proyecto.
- **UI / Diseño Visual**: Sin cambios visuales directos (`Decision: no (no UI)`); desbloquea `C-08 (brew-timer-live-execution-ui)`.
