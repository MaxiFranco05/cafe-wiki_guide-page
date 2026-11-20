# Design — C-08 `brew-timer-live-execution-ui`

## UI Mockups

- **Design system revision**: 4 (`design-system/README.md`, aprobado 2026-11-17). Nota: `.active-orchestrator-state.json` aún registra `visual_design.revision: 3`; el modo coincide (`system-and-mockups`), la revisión del README es la vigente y la desalineación queda para reconciliar en el próximo cierre.
- **Decision**: yes (2026-11-19)
- **Mockups**: `openspec/changes/c-08-brew-timer-live-execution-ui/mockups/brew-timer-live.html` v2 interactivo (+ `mockups/README.md`). v1 estático rechazado por el usuario (2026-11-19: pidió más detalle fiel al diseño actual, ver el ciclo y más jerarquía/contraste); capturas v1 en `mockups/previews/v1/`.
- **Variantes**: A Continuidad · B Anillo de fase · C Tarjeta crema invertida (ver `mockups/README.md`).
- **Approval**: approved (2026-11-19, by user — variante **B Anillo de fase** con ajustes: cafetera más grande junto al anillo, drenaje final de pour-over sin vaciar la jarra, y en mobile orden original controles → temporizador visual → paso a paso en texto)
- **Preview**: rendered (2026-11-19, Playwright vía `http://127.0.0.1`, capturas en `mockups/previews/c08-{A,B,C}-*-{1440x900,390x844}.png`)
- **Visual verify**: passed (2026-11-19 — app real en `localhost:5173` vs. mockup B: `/brew/v60` idle y en curso a 1440×900, en curso a 390×844; capturas en `mockups/verify/`; 0 errores de consola, 0 requests fallidos. Diferencias menores: la etiqueta del anillo ocupa 2 líneas en desktop, y en mobile la barra fija tapa el borde inferior de los gramos hasta hacer scroll, igual que en el mockup aprobado. No verificado en navegador: Espresso en vivo y el final del drenaje (cubiertos por tests))
- **Criterio de aceptación**: `mockups/brew-timer-live.html?variant=b` + `mockups/previews/c08-B-final-drawdown-desktop-1440x900.png` y `c08-B-final-running-mobile-390-fullpage.png`. El total se ubica debajo del anillo (no dentro) para no tocar el borde.

### Revisión v2 (2026-11-19)

- **Base real**: el mockup monta el HTML de `BrewStationView` renderizado por SSR y el CSS compilado de la app; solo el panel derecho es nuevo, así el resultado aprobado se parece a lo que se implementa.
- **Contraste sin salir de Rev 4**: se suman acentos ya existentes en tokens fuera del marrón: `--status-optimal` (en curso, Pantalla activa), `--status-warning` (pausado), `--accent-gold` (fase, lista, destello), `--svg-water-stream` (gramos de agua) y `--text-primary` como superficie en la variante C. Las superficies elevadas `--c08-raised*` salen de `color-mix` sobre tokens; si se adopta la variante elegida, se propone llevarlas a `tokens.css` como Rev 5 (con re-render de mockups afectados).
- **Botón principal por estado**: cobre en Iniciar/Reanudar/Nueva preparación, neutro elevado en Pausar, para que el estado se lea sin texto.
- **Variante B**: el progreso del anillo se actualiza con `stroke-dashoffset`, excepción acotada a la regla de animar solo `transform`/`opacity`.

### Ajustes post-review (2026-11-19, pedidos por el usuario)

- **Acciones a ancho completo**: Pausar/Reanudar (primaria, cobre sólido en todos los estados) y Reiniciar a 00:00 (secundaria, cobre tenue `--accent-primary-soft` con texto `--accent-gold`) se apilan ocupando todo el ancho de la tarjeta, como objetivo táctil fácil; en mobile la barra fija muestra ambas a 48 px con etiqueta.
- **Sin deslizable de llenado**: el scrubber "Avance de fase" de C-05/C-06 era una herramienta de desarrollo para probar niveles; se elimina (prop, estado, CSS y claves i18n `brew.timer.scene.{progressLabel,progressValue,fillReadout,resetPreview}`). En reposo la escena muestra cada fase en su estado final.
- **Escenas sin colisiones** (auditoría de las 6 cafeteras a progreso 0/0.5/1):
  - AeroPress: sin émbolo durante el llenado (`plungerState: 'none'` en la fase de infusión de los 3 perfiles); el sello del émbolo acompaña la superficie del líquido al presionar en vez de cortarlo.
  - Fase con vertido + cuchara: se secuencian (vertido hasta 60% de la fase, luego cuchara), así la cuchara no cruza el chorro (`POUR_THEN_STIR_SPLIT`).
  - Prensa francesa: varilla rígida de longitud fija; la perilla queda dentro del cuadro arriba y por encima de la tapa al final.
  - Espresso: los chorros terminan en la superficie de la taza y las gotas caen por encima del líquido.
  - Pour-overs (V60, Chemex, Melitta): sin colisiones detectadas.
- **Anillo suave**: el anillo avanzaba a saltos (solo se repintaba al publicar snapshot, ~1 s). Ahora `useBrewTimer.sample()` lee el motor puro en el instante actual sin publicar estado, y `BrewTimer` pinta `stroke-dashoffset` de forma imperativa en cada frame mientras corre (sin re-render de React). En pausa/reposo/fin, y con `prefers-reduced-motion`, se pinta desde el snapshot publicado.

### Design Brief

- **Audiencia y tarea**: preparador en mesada, a un brazo de distancia, con manos ocupadas. Superficie *Operate*: el reloj y la instrucción activa son lo único que debe leerse de un vistazo; todo lo demás es secundario.
- **Pantalla afectada**: `/brew/:methodSlug` — panel derecho (desktop, sticky) / bloque 2 (mobile). Se conserva el layout C de C-05 (grid `1.08fr / 0.92fr`), la paleta Rev 4 y la tipografía `Outfit` + `IBM Plex Mono`.
- **Estados a mostrar**: `idle` (previsualización actual + Iniciar), `running` (bloom V60 con Pantalla activa y sonido on), `paused`, `completed`, variante Wake Lock no soportado + silenciado, y Espresso en `running`. Además: selector rápido de cafetera en el encabezado y receta bloqueada en el panel izquierdo.
- **Jerarquía en `running`**: barra Kitchen Mode (badges + mute) → escena SVG → fase `N de M` + cuenta regresiva de fase grande en cobre + barra de progreso de fase → reloj total secundario → tarjeta de instrucción (gramos del paso / en balanza) → "Siguiente" en fila hairline → controles (`Pausar` primario, `Reiniciar` secundario, ‹ › salto).
- **Tokens**: solo variables de `design-system/tokens.css` (`--accent-primary`, `--accent-gold`, `--status-optimal` para Pantalla activa, `--status-warning` para aviso Wake Lock, `--svg-water-stream` para gramos de agua). Cero hex sueltos en componentes.
- **Mobile**: se mantiene el orden actual de la estación (controles de dosis/intensidad → temporizador visual → cronograma en texto); fuera de `idle` la fila Pausar/Reanudar + Reiniciar es `position: sticky` sobre la barra de pestañas.
- **Motion**: destello de fase = `opacity` + `background-color` 600 ms `var(--ease-out)`; barra de progreso por `transform: scaleX()`; con `prefers-reduced-motion` solo color.
- **Restricciones**: cero emojis, iconografía SVG inline, targets ≥ 48 px en controles de mesada, textos vía i18n.

## Context

`BrewStationView` (561 líneas) ya renderiza un panel "Benchtop Live Timer Preview" con reloj fijo en la duración total, dots de fase, escena con scrubber manual y botones Iniciar (sin handler) y Reiniciar (resetea inputs). C-07 dejó listos `brew-timer.engine` (puro, genérico sobre `ScaledBrewPhase`, con `startTimer/tickTimer/pauseTimer/resumeTimer/resetTimer/jumpToPhase`) y los adaptadores `createWakeLockAdapter`, `createWebAudioAdapter` (`unlock`, `playEvent`, `setMuted`) y `createStorageAdapter` (ya incluye `muted` y `lastSelectedMethodSlug`). Ninguno está consumido por la UI todavía. La navegación (`TopNavbar`, `BottomTabBar`) apunta en duro a `/brew/v60`.

## Goals / Non-Goals

**Goals:**
- Conectar motor + adaptadores a la vista sin tocar `src/domain/` ni `src/adapters/`.
- Re-render de alta frecuencia acotado al subárbol del temporizador (`RN-UX-01`, `RN-UX-04`).
- Hacer testeable el hook con reloj y adaptadores inyectados.

**Non-Goals:**
- Persistir una ejecución en curso entre recargas.
- Notificaciones del sistema o ejecución en segundo plano real.
- Rediseñar el panel izquierdo de C-05 (solo se le añade el estado bloqueado).

## Decisions

### D1 — `useBrewTimer` con `useReducer` + rAF limitado a 100 ms
El hook guarda `BrewTimerState` en un `useRef` y publica un `snapshot` vía `useState` solo cuando cambia algo observable (segundo entero, fase, o progreso ≥ 1% para la escena). El loop es `requestAnimationFrame` que llama `tickTimer(state, now())` como máximo cada 100 ms; `now` y `raf` son inyectables (default `performance.now` / `window.requestAnimationFrame`).
- *Alternativa descartada*: `setInterval(100)` — prohibido por regla dura y se congela en pestañas ocultas; rAF también se pausa oculto, pero el motor calcula por delta, así que al volver el primer frame corrige el reloj.
- *Alternativa descartada*: store externo (`useSyncExternalStore`) — más ceremonia sin beneficio con un único consumidor.

### D2 — Aislamiento de renders
`BrewStationSession` deja de contener el panel; se extrae `<BrewTimer recipe method isEspresso onStatusChange />`. Solo `BrewTimer` se suscribe al snapshot. Hacia arriba sube únicamente `status` (cambia pocas veces) para bloquear inputs. La escena recibe `progress` cuantizado a 0.01 para no re-renderizar SVG en cada frame.

### D3 — Adaptadores creados una vez por sesión y desechados al desmontar
`useKitchenAdapters()` crea wake-lock, audio y storage en un `useRef` lazy, expone `wakeLockStatus` (`supported`, `active`) y `muted`, y en el cleanup llama `releaseWakeLock()`, `dispose()` de ambos y cancela el rAF. Factorías inyectables por props/context para tests.

### D4 — Gesto de usuario para audio y Wake Lock
`start()` y `resume()` llaman `audio.unlock()` y `wakeLock.requestWakeLock()` de forma síncrona dentro del handler de click (sin `await` previo), cumpliendo `SU-02`. `pause/reset/complete` liberan Wake Lock. Re-adquisición en `visibilitychange` ya la hace el adaptador.

### D5 — Eventos del motor → audio y destello
Cada tick devuelve `events`; el hook los pasa a `audio.playEvent(e)` (no-op si muted) y, ante `phase_transition`, incrementa un `flashKey` que dispara la clase de destello en la tarjeta y actualiza la región `aria-live="polite"`. Los saltos manuales (`jumpToPhase`) no emiten sonido (el motor devuelve `events: []`) pero sí destello.

### D6 — Bloqueo de receta
`BrewStationSession` recibe `status` y pasa `disabled` a `BrewControls` / `EspressoYieldCards` (nueva prop opcional) y muestra un aviso compacto "Receta bloqueada · Reiniciá para editar". La receta escalada se congela en un `useRef` al pulsar Iniciar, así el temporizador no se reconstruye por cambios de props.

### D6b — Drenaje de pour-over
En V60, Chemex y Melitta el nivel de líquido representa la jarra inferior. El drenaje final iba `1.0 → 0.0` y vaciaba la jarra (error detectado por el usuario). Se corrige el catálogo: último vertido termina en `0.85` y el drenaje va `0.85 → 1.0`; un test de catálogo exige continuidad de niveles y jarra llena al final. AeroPress (`1.0 → 0.0` al presionar) es correcto porque el nivel es la cámara.

### D7 — Escena: previsualización vs. en vivo
En `idle` se mantiene el comportamiento actual (fase seleccionada + scrubber). En otros estados la escena usa `snapshot.activePhase.svgDirective` y `snapshot.phaseProgress`; los dots/flechas pasan a llamar `jumpToPhase`.

### D8 — Última cafetera y selector rápido
`useLastBrewMethod()` en `src/shared/hooks/` lee/escribe `lastSelectedMethodSlug` con `createStorageAdapter` (valida con `BrewMethodSlugSchema`, fallback `v60`) y expone el slug como estado React para que la navegación se actualice sin recarga. `BrewStationView` lo escribe al montar con un `methodSlug` válido. `TopNavbar`/`BottomTabBar` usan `to={`/brew/${slug}`}` y calculan activo con `useMatch('/brew/*')`.
`MethodSwitcher` es un `<select>` nativo estilizado (accesible y táctil sin librería) en el encabezado; si `status` es `running|paused` usa `window.confirm` con texto i18n antes de navegar.
- *Alternativa descartada*: popover/menú custom — más código de foco/teclado para 6 opciones; el `select` nativo da la mejor UX en móvil.

### D9 — Salir de la estación
No se bloquea la navegación global (sin `useBlocker`); al desmontar se limpia todo (D3). Se confirma solo en el selector de cafetera, que es el caso de cambio accidental más probable dentro de la misma pantalla.

## Risks / Trade-offs

- [rAF pausado en pestaña oculta → no suenan las alertas mientras está oculta] → aceptado: el reloj se corrige al volver; el motor emite solo el último evento cruzado, evitando ráfagas.
- [iOS con interruptor de silencio ignora Web Audio] → destello visual + `aria-live` (`SU-02`).
- [`window.confirm` es bloqueante y poco estético] → se acepta en v1 por accesibilidad nativa; reemplazable por diálogo propio sin cambiar la spec.
- [`BrewStationView` grande] → la extracción de `BrewTimer` reduce el archivo; los tests existentes de vista se ajustan, no se reescriben.
- [Tests con rAF en jsdom] → reloj y rAF inyectables; `vi.useFakeTimers` no es necesario.

## Migration Plan

Cambio puramente de UI en cliente. Rollback = revertir el commit; preferencias guardadas por C-07 siguen siendo compatibles (no se cambia el esquema).
