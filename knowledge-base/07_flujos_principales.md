# Flujos Principales

Cada flujo se documenta extremo a extremo mostrando la interacción entre el usuario, la interfaz React, el motor de dominio puro y las APIs del navegador.

---

## Flujo 1: Escalado Bidireccional y Validación de Rango en Filtro / Inmersión

**Disparador**: El usuario selecciona un método (ej. Hario V60), elige una intensidad o edita los gramos de café / ml de agua.  
**Actor**: Preparador diario / Home Barista.

**Pasos**:
1. El usuario entra a `/brew/v60`. La vista carga el método `v60` desde el catálogo validado y selecciona el perfil `"normal"` (`1:16.67`) con la dosis por defecto (`15 g` de café → `250 ml` de agua).
2. El usuario cambia el input de café de `15 g` a `22 g` (o cambia el agua a `367 ml`).
3. La UI invoca la función pura `calculateScaledRecipe(method, profileId, { coffeeGrams: 22 })` del motor de dominio.
4. El motor de dominio:
   - Calcula el agua total: $22 \times 16.67 = 367\text{ ml}$.
   - Evalúa `evaluateRangeThresholds(method.thresholds, 22, 367)` para comprobar si está dentro de `[10..36 g]` y `[150..600 ml]`.
   - Evalúa `resolveGrindTip(method.thresholds, 22)` para determinar el consejo de molienda correspondiente.
   - Recalcula los gramos parciales y acumulados de cada `BrewPhase` manteniendo fijos `startTimeSeconds` y `endTimeSeconds`.
5. La UI actualiza instantáneamente los inputs, la lista de pasos con los nuevos gramos y la vista previa de la escena SVG.

**Diagrama de secuencia**:
```
Usuario          BrewStationView (React)          BrewEngine (Pure TS)
  │                        │                               │
  ├── Edita café (22 g) ──▶│                               │
  │                        ├── calculateScaledRecipe() ───▶│
  │                        │                               ├── Calcula agua total (367 ml)
  │                        │                               ├── Recalcula fases (bloom 44g, ...)
  │                        │                               ├── Valida umbrales y tip molienda
  │                        │◀── ScaledRecipeResult ────────┤
  │◀── Renderiza fases ────┤                               │
```

**Casos de error / borde**:
- **Dosis fuera de rango normal (ej. `45 g` de café / `750 ml` en V60-02)**: `evaluateRangeThresholds` devuelve `status: "above_max"`; la UI muestra el banner amarillo de advertencia física pero permite continuar.
- **Entrada vacía o $\le 0$**: La UI muestra estado de validación en el input y deshabilita el botón **Iniciar** hasta que exista un valor $> 0$.

---

## Flujo 2: Ejecución del Temporizador Paso a Paso con Escena SVG, Wake Lock y Web Audio

**Disparador**: El usuario presiona el botón **Iniciar** en la estación de preparación.  
**Actor**: Preparador diario.

**Pasos**:
1. En el evento `onClick` de **Iniciar**, el controlador de la vista:
   - Llama a `audioAdapter.unlockAndPlayStart()` (crea/reanuda `AudioContext` dentro del gesto del usuario y reproduce el tono de inicio).
   - Llama a `wakeLockAdapter.requestWakeLock()` para mantener la pantalla encendida.
   - Inicia el reloj del motor registrando `startTimestamp = performance.now()`.
2. En cada ciclo de actualización (`requestAnimationFrame` / intervalo de alta frecuencia de 100 ms):
   - El motor calcula `elapsedSeconds = (performance.now() - startTimestamp) / 1000`.
   - Determina la `activePhase` actual y el progreso normalizado de la fase $p \in [0, 1]$.
   - Calcula el estado interpolado de la escena SVG (`currentLiquidLevel`, primitivas activas).
3. La UI actualiza el reloj principal, la barra de progreso de la fase y las propiedades reactivas del componente `<ProceduralBrewScene />`.
4. Cuando faltan `3`, `2`, `1` segundos para terminar una fase, `audioAdapter` emite un *beep* corto de pre-aviso; al cruzar al nuevo `phase.id`, emite el tono de transición de fase.
5. Al alcanzar `totalDurationSeconds`, el motor pasa a estado `completed`, `audioAdapter` reproduce el acorde de finalización y `wakeLockAdapter.releaseWakeLock()` libera la pantalla.

**Diagrama de secuencia**:
```
Usuario       BrewTimerHook        BrewTimerEngine      WakeLockAdapter     WebAudioAdapter
  │                 │                     │                    │                   │
  ├── Clic Iniciar ▶│                     │                    │                   │
  │                 ├── requestWakeLock()─┼───────────────────▶│                   │
  │                 ├── unlock() + beep ──┼────────────────────┼──────────────────▶│
  │                 ├── start(now) ──────▶│                    │                   │
  │                 │                     │                    │                   │
  │        [Loop cada 100ms / rAF]        │                    │                   │
  │                 ├── tick(now) ───────▶│                    │                   │
  │                 │◀── Phase + SVGState ┤                    │                   │
  │                 ├── (Si cambia fase) ─┼────────────────────┼──────────────────▶│ Tono fase
  │◀── UI + SVG ────┤                     │                    │                   │
```

**Casos de error / borde**:
- **El usuario cambia de app o bloquea/desbloquea el teléfono en medio de la preparación**:
  - Como el tiempo se calcula con timestamps monotónicos reales, al volver a la pestaña el reloj salta inmediatamente al segundo exacto real sin atrasarse.
  - El listener `document.addEventListener('visibilitychange')` detecta `visibilityState === 'visible'` y re-adquiere automáticamente el `Wake Lock`.
- **Navegador sin soporte de `navigator.wakeLock`**: `WakeLockAdapter` captura la ausencia de la API silenciosamente y reporta `wakeLockSupported: false` sin lanzar excepciones.

---

## Flujo 3: Preparación de Espresso por Dosis y Estilos de Yield

**Disparador**: El usuario entra a `/brew/espresso` e ingresa los gramos de café seco de su canasta.  
**Actor**: Entusiasta / Home Barista.

**Pasos**:
1. El usuario ingresa `18 g` de café seco.
2. El motor ejecuta `calculateEspressoStyles(18)` devolviendo las 3 configuraciones simultáneas:
   - **Ristretto (`1:1.5`)**: `27 g` de bebida en taza (`20–25 s`).
   - **Normale (`1:2.0`)**: `36 g` de bebida en taza (`25–30 s`).
   - **Lungo (`1:3.0`)**: `54 g` de bebida en taza (`30–35 s`).
3. El usuario selecciona el estilo deseado (ej. **Normale**) y presiona **Iniciar**.
4. La escena SVG muestra el portafiltro, la pre-infusión y la caída de líquido en taza hasta completar los `36 g` en la ventana de `25–30 s`.

**Casos de error / borde**:
- **Dosis fuera de rango de canasta doble estándar (`< 14 g` o `> 22 g`)**: Muestra advertencia no bloqueante indicando que esa dosis corresponde a una canasta simple (`7–11 g`) o triple (`22–25 g+`).

---

## Flujo 4: Exploración Sensorial (Rueda de Sabores SCA ↔ Wiki ↔ Preparación)

**Disparador**: El usuario abre `/flavor-wheel` o `/wiki`.  
**Actor**: Explorador de café de especialidad.

**Pasos**:
1. El usuario toca la familia **Frutal** → subfamilia **Frutos Rojos** → descriptor **Mora / Arándano** en la rueda de sabores SVG.
2. El panel lateral/inferior muestra la ficha sensorial del descriptor y lista las entradas de Wiki asociadas (ej. Origen: **Kenia** / **Etiopía**, Varietal: **SL28**, Proceso: **Natural**).
3. El usuario toca la ficha **Kenia** (`/wiki/origenes/kenya`), revisa su perfil de acidez brillante y cuerpo medio, y ve la recomendación: *"Ideal en Hario V60 — Perfil Liviano (1:17) para resaltar notas cítricas y de frutos rojos"*.
4. Con un toque en el botón **"Preparar en V60 (Liviano)"**, navega a `/brew/v60?profile=light` listo para preparar.
