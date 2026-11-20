# Spec Delta

## Purpose

Define el contrato de comportamiento del motor de temporizador monotónico puro (`RN-UX-01`), la interpolación de progreso y nivel de líquido por fase (`RN-UX-04`), la detección diferencial de hitos sonoros y los adaptadores imperativos resilientes para `Screen Wake Lock API` (`RN-UX-02`), síntesis `Web Audio API` (`RN-UX-03`) y persistencia validada en `localStorage`.

## ADDED Requirements

### Requirement: Cálculo de tiempo transcurrido mediante marcas monotónicas sin deriva
El motor de temporizador SHALL calcular el tiempo transcurrido exclusivamente por diferencia de marcas de tiempo monotónicas (`nowMs - startedAtMs + accumulatedElapsedMs`) sin depender de incrementos fijos por tick ni importar APIs del DOM o React (`RN-UX-01`).

#### Scenario: Recuperación exacta tras suspensión o pestaña en segundo plano
- **WHEN** el temporizador se inicia en `nowMs = 1000` sobre una receta de `180 s` y el siguiente pulso se evalúa en `nowMs = 46000` tras un retraso del hilo principal
- **THEN** el motor reporta exactamente `elapsedSeconds = 45`, `remainingTotalSeconds = 135` y resuelve la fase correspondiente al segundo `45` sin deriva acumulada

#### Scenario: Preservación de tiempo acumulado entre pausas y reanudaciones
- **WHEN** el temporizador corre desde `nowMs = 0` hasta `nowMs = 15500`, pasa a estado `paused`, permanece inactivo hasta `nowMs = 60000`, se reanuda en `nowMs = 60000` y recibe un tick en `nowMs = 70000`
- **THEN** el motor reporta `status = "running"` y exactamente `25.5 s` (`25500 ms`) de tiempo efectivo transcurrido

### Requirement: Máquina de estados temporal y navegación manual entre fases
El motor SHALL gestionar las transiciones inmutables `idle`, `running`, `paused` y `completed`, permitiendo saltar manualmente a cualquier fase válida (`jumpToPhase`) fijando el tiempo acumulado al `startTimeSeconds` de la fase destino (`US-005 CA-3`).

#### Scenario: Salto manual a una fase posterior o anterior
- **WHEN** el usuario solicita saltar a la fase de índice `2` (`startTimeSeconds = 90`, `endTimeSeconds = 135`) mientras el temporizador está en `running` o `paused`
- **THEN** el motor posiciona el tiempo transcurrido exactamente en `90 s`, actualiza `activePhaseIndex = 2`, fija el progreso de fase en `0` y conserva el estado `running` o `paused`

#### Scenario: Transición automática al estado completed al alcanzar la duración total
- **WHEN** el tiempo transcurrido alcanza o supera `totalDurationSeconds` de la receta activa
- **THEN** el motor transiciona a `status = "completed"`, satura `elapsedSeconds` en `totalDurationSeconds`, fija `remainingTotalSeconds = 0` y asigna `phaseProgress = 1` en la última fase

### Requirement: Resolución de progreso de fase e interpolación de escena SVG
En cada evaluación, el motor SHALL resolver `activePhase`, `nextPhase` (o `null` en la última fase), `phaseProgress` normalizado en $[0, 1]$ y `interpolatedLiquidLevel` entre `liquidFillStartRatio` y `liquidFillEndRatio` de la fase activa (`RN-UX-04`).

#### Scenario: Interpolación a mitad de una fase de vertido
- **WHEN** la fase activa abarca de `30 s` a `90 s` con `liquidFillStartRatio = 0.20` y `liquidFillEndRatio = 0.80` y el tiempo transcurrido es `60 s`
- **THEN** el motor devuelve `phaseProgress = 0.5`, `remainingPhaseSeconds = 30` e `interpolatedLiquidLevel = 0.50`

### Requirement: Detección diferencial y sin duplicados de hitos sonoros
El motor SHALL emitir en cada tick únicamente los eventos cruzados desde el tick anterior: pre-avisos `countdown_3`, `countdown_2` y `countdown_1` al entrar en los últimos `3`, `2` y `1` segundos de la fase activa, `phase_transition` al cambiar de fase y `brew_completed` al finalizar la receta (`RN-UX-03`).

#### Scenario: Emisión única de pre-aviso en ticks de alta frecuencia
- **WHEN** una fase termina en `45 s` y el motor recibe ticks consecutivos en `41.9 s`, `42.05 s`, `42.15 s` y `42.85 s`
- **THEN** el evento `countdown_3` se emite únicamente en el tick que cruza el umbral (`42.05 s`) y no vuelve a repetirse en `42.15 s` ni en `42.85 s`

#### Scenario: Cruce de límite de fase y finalización
- **WHEN** un tick cruza simultáneamente el fin de una fase intermedia (`45 s`) o el fin de la última fase (`180 s`)
- **THEN** el motor emite `phase_transition` al entrar en la nueva fase intermedia o `brew_completed` al alcanzar el final de la preparación

### Requirement: Ciclo de vida y re-adquisición automática de Screen Wake Lock
El adaptador de pantalla SHALL solicitar `navigator.wakeLock.request("screen")` al iniciar o reanudar el temporizador, liberarlo al pausar, reiniciar o completar, y re-adquirirlo automáticamente cuando el documento vuelve a `visibilityState === "visible"` mientras el temporizador sigue activo (`RN-UX-02`).

#### Scenario: Re-adquisición automática al volver a primer plano
- **WHEN** el temporizador está activo con bloqueo adquirido, la pestaña pasa a segundo plano liberando el sentinel y luego dispara `visibilitychange` con `document.visibilityState === "visible"`
- **THEN** el adaptador invoca nuevamente `navigator.wakeLock.request("screen")` y restaura `isActive = true`

#### Scenario: Degradación silenciosa sin soporte o por rechazo de batería
- **WHEN** `navigator.wakeLock` no existe en el navegador o `request("screen")` rechaza la promesa con `NotAllowedError`
- **THEN** el adaptador captura el error sin lanzar excepciones, expone `isSupported = false` o `isActive = false` y permite que el temporizador continúe normalmente (`SU-02`)

### Requirement: Síntesis procedural de audio y control de silencio con Web Audio API
El adaptador de audio SHALL desbloquear o reanudar `AudioContext` dentro del gesto del usuario y sintetizar mediante osciladores nativos los tonos de pre-aviso, cambio de fase y finalización sin cargar archivos externos, respetando el estado `muted` (`RN-UX-03`).

#### Scenario: Desbloqueo en gesto de usuario y reproducción de alertas
- **WHEN** se invoca `unlock()` en el evento de inicio con `muted = false` y luego se dispara `playEvent("phase_transition")` o `playEvent("brew_completed")`
- **THEN** el adaptador reanuda el `AudioContext` si estaba en `"suspended"` y programa los nodos `OscillatorNode` y `GainNode` correspondientes al evento

#### Scenario: Supresión total de síntesis cuando está silenciado o sin soporte
- **WHEN** el adaptador tiene `muted = true` o `window.AudioContext` no está disponible en el entorno
- **THEN** las llamadas a `playEvent(...)` retornan sin crear osciladores ni arrojar errores

### Requirement: Persistencia validada de preferencias en localStorage con fallback en memoria
El adaptador de almacenamiento SHALL leer y guardar preferencias del usuario (`muted`, `theme`, `lastSelectedMethodSlug` y configuración de dosis/perfil por método) validando los datos con Zod (`safeParse`) y operando sobre una copia en memoria si `localStorage` falla o lanza `QuotaExceededError`.

#### Scenario: Recuperación segura ante JSON corrupto o esquema inválido
- **WHEN** `localStorage` contiene un JSON malformado o valores fuera del esquema Zod bajo la clave de preferencias
- **THEN** el adaptador descarta el payload inválido sin lanzar excepciones y devuelve las preferencias por defecto tipadas

#### Scenario: Fallback en memoria cuando localStorage lanza QuotaExceededError o SecurityError
- **WHEN** `localStorage.setItem` lanza `QuotaExceededError` o `localStorage` está deshabilitado por privacidad
- **THEN** el adaptador conserva y devuelve las preferencias actualizadas desde su almacén en memoria durante la sesión activa
