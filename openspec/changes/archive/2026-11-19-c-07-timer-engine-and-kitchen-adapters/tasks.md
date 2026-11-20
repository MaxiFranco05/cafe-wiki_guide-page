# Tasks

## 1. Motor Puro de Temporizador Monotónico (`src/domain/timer/brew-timer.engine.ts`)

- [x] 1.1 **[TDD RED]** Crear `src/domain/__tests__/brew-timer.engine.test.ts` con tests que fallen inicialmente verificando: (a) cálculo de tiempo transcurrido mediante marcas monotónicas `nowMs` sin deriva tras saltos largos de reloj y ciclos `idle → running → paused → running → completed` (`RN-UX-01`), (b) resolución de `activePhase`, `nextPhase`, `phaseProgress` ($p \in [0, 1]$) e `interpolatedLiquidLevel` (`RN-UX-04`), (c) salto manual entre fases (`jumpToPhase`), y (d) detección diferencial sin duplicados de eventos `countdown_3`, `countdown_2`, `countdown_1`, `phase_transition` y `brew_completed` (`RN-UX-03`).
- [x] 1.2 **[TDD GREEN]** Implementar `src/domain/timer/brew-timer.engine.ts` y `src/domain/timer/index.ts` (100% TypeScript puro, cero imports de React/DOM/window/navigator) hasta que pasen todos los casos de `src/domain/__tests__/brew-timer.engine.test.ts`.
- [x] 1.3 **[TDD TRIANGULATE & REFACTOR]** Triangular en `src/domain/__tests__/brew-timer.engine.test.ts` casos de borde con recetas reales de `METHODS_CATALOG` (V60, Prensa Francesa, Espresso), ticks repetidos con el mismo `nowMs`, saltos que atraviesan múltiples fases de golpe y `nowMs` menores al inicio, ejecutando `npx vitest run src/domain/__tests__/brew-timer.engine.test.ts`.

## 2. Adaptador de Bloqueo de Pantalla (`src/adapters/wake-lock.adapter.ts`)

- [x] 2.1 **[TDD RED]** Crear `src/adapters/__tests__/wake-lock.adapter.test.ts` con tests que fallen inicialmente comprobando: (a) adquisición de `navigator.wakeLock.request('screen')` en `requestWakeLock()`, (b) liberación del sentinel en `releaseWakeLock()`, (c) re-adquisición automática en evento `visibilitychange` hacia `"visible"` mientras el bloqueo sigue requerido (`RN-UX-02`), y (d) degradación silenciosa (`isSupported: false` o `isActive: false`) cuando `navigator.wakeLock` no existe o rechaza con `NotAllowedError` (`SU-02`).
- [x] 2.2 **[TDD GREEN]** Implementar `src/adapters/wake-lock.adapter.ts` con inyección limpia de dependencias (`navigator`, `document`) y método `dispose()` hasta que pasen los tests del bloque 2.
- [x] 2.3 **[TDD TRIANGULATE & REFACTOR]** Triangular liberaciones externas del sentinel (`sentinel` emite evento `release`), llamadas concurrentes/repetidas a `requestWakeLock()` y limpieza de listeners en `dispose()`, verificando con `npx vitest run src/adapters/__tests__/wake-lock.adapter.test.ts`.

## 3. Adaptador de Síntesis Acústica (`src/adapters/web-audio.adapter.ts`)

- [x] 3.1 **[TDD RED]** Crear `src/adapters/__tests__/web-audio.adapter.test.ts` con tests que fallen inicialmente verificando: (a) creación y reanudación (`resume()`) de `AudioContext` dentro de `unlock()`, (b) síntesis diferenciada con `OscillatorNode` y `GainNode` para `countdown_3 | countdown_2 | countdown_1`, `phase_transition` y `brew_completed` (`RN-UX-03`), y (c) supresión total de osciladores cuando `muted = true` o cuando `AudioContext` no está soportado.
- [x] 3.2 **[TDD GREEN]** Implementar `src/adapters/web-audio.adapter.ts` usando osciladores nativos y envolventes de ganancia sin archivos externos hasta pasar los tests del bloque 3.
- [x] 3.3 **[TDD TRIANGULATE & REFACTOR]** Triangular fallos de `AudioContext.resume()` (rechazo por política de autoplay o interruptor físico de silencio en móvil `SU-02`) y cambios dinámicos de `setMuted(true/false)`, ejecutando `npx vitest run src/adapters/__tests__/web-audio.adapter.test.ts`.

## 4. Adaptador de Almacenamiento Local Validado y Barrel (`src/adapters/storage.adapter.ts`)

- [x] 4.1 **[TDD RED]** Crear `src/adapters/__tests__/storage.adapter.test.ts` con tests que fallen inicialmente verificando: (a) lectura y escritura de preferencias (`muted`, `theme`, `lastSelectedMethodSlug` y configuración de dosis/agua/perfil por método) validadas con Zod (`safeParse`), (b) retorno de preferencias por defecto ante JSON corrupto o esquema inválido en `localStorage`, y (c) fallback transparente en memoria (clonado con `structuredClone`) cuando `localStorage` no está disponible o lanza `QuotaExceededError` / `SecurityError`.
- [x] 4.2 **[TDD GREEN]** Implementar `src/adapters/storage.adapter.ts` y `src/adapters/index.ts` exportando los 3 adaptadores y sus contratos tipados hasta pasar los tests del bloque 4.
- [x] 4.3 **[TDD TRIANGULATE & REFACTOR]** Triangular aislamiento de mutaciones sobre objetos devueltos por `getPreferences()`, verificar que `src/domain/` mantenga cero imports de DOM/React/adapters, y ejecutar `npx vitest run` y `npm run build` confirmando 0 errores de tipos ni regresiones.

## Workflow follow-up

- Archivar el change con `/opsx:archive c-07-timer-engine-and-kitchen-adapters` una vez completadas y verificadas las 12 tareas.
- Marcar `[x] [C-07]` en `CHANGES.md` y presentar el bloque de pase hacia `C-08 (brew-timer-live-execution-ui)`.
