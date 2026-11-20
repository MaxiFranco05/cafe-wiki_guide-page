# Design

## Context

Los cambios `C-02` y `C-04` establecieron los esquemas Zod (`BrewMethod`, `RecipeProfile`, `BrewPhase`, `SvgStageDirective`) y el motor puro de escalado (`calculateScaledRecipe`, que entrega `ScaledBrewPhase[]` y `totalDurationSeconds`). El cambio `C-06` incorporó `<ProceduralBrewScene directive={svgDirective} progress={p} />`. Para habilitar la ejecución en tiempo real en `C-08` sin violar la regla dura **Núcleo Puro vs. Imperative Shell (`src/domain/`)**, toda la aritmética temporal, la resolución de fase activa, la interpolación del nivel de líquido y la detección de hitos sonoros deben residir en `src/domain/timer/` como funciones puras determinísticas, mientras que los efectos secundarios de plataforma (`navigator.wakeLock`, `AudioContext`, `localStorage`) deben encapsularse detrás de adaptadores con *graceful degradation* en `src/adapters/`. Ver `proposal.md` para la motivación funcional.

## Goals / Non-Goals

**Goals:**
- Diseñar un motor de temporizador funcional puro (`src/domain/timer/brew-timer.engine.ts`) que reciba timestamps monotónicos (`nowMs: number`) por parámetro y produzca snapshots inmutables (`BrewTimerSnapshot`) más eventos diferenciales por pulso (`BrewTimerEvent[]`).
- Garantizar cero duplicación y cero omisión de eventos sonoros (`countdown_3`, `countdown_2`, `countdown_1`, `phase_transition`, `brew_completed`) independientemente de la frecuencia de muestreo (`100 ms`, `requestAnimationFrame` o saltos por pestaña en segundo plano).
- Encapsular `Screen Wake Lock API`, `Web Audio API` y `localStorage` en adaptadores con inyección opcional de dependencias globales (`navigator`, `document`, `AudioContext`, `Storage`) para permitir tests unitarios determinísticos en Vitest sin efectos globales residuales.
- Validar con **Zod** (`safeParse`) toda lectura desde `localStorage` y ofrecer un almacén en memoria clonado con `structuredClone()` como fallback inmediato ante `QuotaExceededError` o bloqueo de almacenamiento.

**Non-Goals:**
- No se implementan componentes React, hooks (`useBrewTimer`) ni cambios de interfaz en `BrewStationView.tsx` (pertenecen a `C-08`).
- No se utilizan archivos de audio externos (`.mp3`, `.wav`, `.ogg`) ni librerías de terceros para síntesis o almacenamiento.

## Decisions

### D-01 — Máquina de estados funcional pura con inyección explícita de `nowMs` (`Functional Core`)
- **Decisión**: Modelar el estado del reloj como un registro inmutable `BrewTimerState` operado por funciones puras (`createInitialTimerState`, `startTimer`, `pauseTimer`, `resumeTimer`, `resetTimer`, `jumpToPhase`, `tickTimer`) que reciben `nowMs: number` como argumento explícito en lugar de llamar internamente a `performance.now()`.
- **Alternativas consideradas**:
  1. *Clase con `setInterval` y `performance.now()` interno*: Acopla el motor al reloj global del entorno y obliga a usar timers simulados complejos para probar saltos de tiempo.
  2. *Funciones puras parametrizadas con `nowMs: number`* (elegida).
- **Justificación**: Cumple estrictamente la regla dura de `src/domain/` (cero referencias a `window`/`performance`), permite simular en milisegundos cualquier escenario de deriva o suspensión de pestaña pasando números (`nowMs = 46000`), y separa la cadencia de refresco visual (que vivirá en el hook de `C-08`) de la lógica matemática.

### D-02 — Detección diferencial de eventos por cruce de umbrales (`previousElapsedMs` → `currentElapsedMs`)
- **Decisión**: Cada transición o `tickTimer(state, nowMs)` compara el intervalo `(previousElapsedSeconds, currentElapsedSeconds]` contra los hitos de la fase activa:
  - Umbrales de pre-aviso de fin de fase en $T_{\text{end}} - 3$, $T_{\text{end}} - 2$ y $T_{\text{end}} - 1$ segundos (`countdown_3`, `countdown_2`, `countdown_1`), emitidos solo cuando `previousElapsedSeconds < threshold && currentElapsedSeconds >= threshold` (y solo si la duración de la fase es $> 3\text{ s}$ y el salto en un solo tick no superó ya el final de la fase).
  - Si un salto temporal grande (ej. pestaña suspendida varios segundos) cruza múltiples segundos de cuenta regresiva dentro de la misma fase, solo se emite el último hito vigente o la transición de fase resultante, evitando ráfagas de beeps atrasados.
  - Al cruzar `phase.endTimeSeconds` hacia una fase siguiente se emite `phase_transition`; al cruzar `totalDurationSeconds` se emite `brew_completed`.
- **Alternativas consideradas**:
  1. *Comparar `Math.floor(remainingPhaseSeconds) === 3`* en cada tick: Dispara múltiples veces el mismo beep si el loop corre cada `100 ms` y requiere un `Set` mutable externo de eventos ya disparados.
  2. *Evaluación diferencial pura sobre el intervalo `(prevElapsed, nextElapsed]`* (elegida).
- **Justificación**: Es 100% pura, determinística, idempotente ante ticks repetidos con el mismo timestamp y se resetea naturalmente al ejecutar `jumpToPhase` o `resetTimer`.

### D-03 — Adaptador `WakeLockAdapter` con escucha de `visibilitychange` y estado reactivo seguro
- **Decisión**: Implementar `createWakeLockAdapter(deps?)` en `src/adapters/wake-lock.adapter.ts` manteniendo internamente el `WakeLockSentinel | null` y una bandera `shouldHoldLock: boolean`:
  - `requestWakeLock()` marca `shouldHoldLock = true` e invoca `navigator.wakeLock.request('screen')` dentro de un bloque `try / catch`.
  - `releaseWakeLock()` marca `shouldHoldLock = false`, remueve/inactiva el sentinel actual y llama a `sentinel.release()`.
  - Un listener sobre `document.addEventListener('visibilitychange', ...)` verifica `if (shouldHoldLock && document.visibilityState === 'visible')` para re-adquirir automáticamente el bloqueo tras volver de segundo plano (`RN-UX-02`), con método `dispose()` para limpiar el listener.
- **Alternativas consideradas**:
  1. *Delegar la re-adquisición a un `useEffect` en React*: Mezcla detalles de Web API en la capa de vista y dificulta su testeo aislado.
  2. *Encapsular el ciclo de vida completo y `visibilitychange` en el adaptador* (elegida).
- **Justificación**: Aísla las particularidades de `WakeLockSentinel` (eventos `release`, promesas rechazadas por batería baja o políticas de plataforma) y expone un contrato simple (`requestWakeLock`, `releaseWakeLock`, `getStatus`, `dispose`).

### D-04 — Síntesis procedural en `WebAudioAdapter` con envolventes exponenciales libres de clic
- **Decisión**: Implementar `createWebAudioAdapter(deps?)` en `src/adapters/web-audio.adapter.ts` creando perezosamente el `AudioContext` en `unlock()` y sintetizando cada evento con `OscillatorNode` (`type: 'sine' | 'triangle'`) y `GainNode` con rampa de ataque corta (`linearRampToValueAtTime`) y decaimiento exponencial (`exponentialRampToValueAtTime(..., 0.001)`):
  - `countdown_3 | countdown_2 | countdown_1`: pulso simple de `880 Hz` (`A5`, `90 ms`).
  - `phase_transition`: doble tono ascendente `587.33 Hz` → `880 Hz` (`D5` → `A5`, `220 ms`).
  - `brew_completed`: acorde arpegiado cálido `523.25 Hz` → `659.25 Hz` → `783.99 Hz` (`C5` → `E5` → `G5`, `420 ms`).
- **Alternativas consideradas**:
  1. *Cargar archivos `.mp3` estáticos*: Incrementa el bundle, requiere precaché adicional y puede fallar offline si no se descargó antes.
  2. *Síntesis Web Audio con osciladores nativos* (elegida, conforme a `RN-UX-03`).
- **Justificación**: Cero bytes de activos de audio, latencia nula y funcionamiento 100% offline garantizado.

### D-05 — Persistencia validada con Zod en `StorageAdapter` y copia profunda en memoria con `structuredClone`
- **Decisión**: Definir `UserPreferencesSchema` con Zod en `src/adapters/storage.adapter.ts` bajo la clave versionada `"cafeteria-wiki:preferences:v1"`:
  - Campos validados: `muted: z.boolean()`, `theme: z.enum(['dark'])`, `lastSelectedMethodSlug: BrewMethodIdSchema.optional()`, y `methodConfigs: z.record(z.string(), MethodPreferenceConfigSchema)` (guardando última `coffeeGrams`, `waterMl` y `profileId` por método).
  - En lectura (`getPreferences`), se parsea el JSON con `try / catch` y se valida con `UserPreferencesSchema.safeParse(...)`; si falla o no existe, se retorna un clon de las preferencias por defecto (`structuredClone(DEFAULT_PREFERENCES)`).
  - En escritura (`savePreferences` / `updatePreferences`), se actualiza siempre el espejo en memoria (clonado con `structuredClone`) y se intenta `storage.setItem(...)` dentro de `try / catch` para tolerar `QuotaExceededError` o `SecurityError` en navegación privada.
- **Justificación**: Cumple las reglas de `zod` (`safeParse` en fronteras, nunca confiar en `JSON.parse`) y `modern-web-guidance` (`structuredClone` para copias profundas de estado estructurado en memoria sin mutaciones compartidas), además de dejar listo `lastSelectedMethodSlug` para el selector y navegación de `C-08`.

## UI Mockups

Decision: no (no UI)

Este change abarca exclusivamente el motor de dominio puro (`src/domain/timer/`) y los adaptadores imperativos de Web APIs (`src/adapters/`), sin introducir ni modificar pantallas o componentes visuales.

## Risks / Trade-offs

- **[Risk] Pestaña en segundo plano durante varios minutos salta múltiples fases de golpe** → **Mitigation**: `tickTimer` resuelve la fase activa directamente por búsqueda sobre `startTimeSeconds <= elapsedSeconds < endTimeSeconds` (o estado `completed` si `elapsedSeconds >= totalDurationSeconds`) y emite solo la transición hacia la fase actual real, sin reproducir beeps viejos de fases ya superadas.
- **[Risk] `AudioContext` bloqueado por interruptor físico de silencio en iOS o falta de gesto previo** → **Mitigation**: `unlock()` y `playEvent()` envuelven `resume()` y la creación de nodos en `try / catch` seguro (`SU-02`), garantizando que ninguna falla acústica interrumpa el reloj.
- **[Risk] Mutación accidental del estado en memoria en `StorageAdapter`** → **Mitigation**: Todas las lecturas y escrituras del fallback en memoria devuelven copias aisladas con `structuredClone()`.
