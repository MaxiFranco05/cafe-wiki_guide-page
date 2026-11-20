# Tasks — C-08 `brew-timer-live-execution-ui`

> **Gate visual**: no iniciar el grupo 1 hasta que `design.md` → `## UI Mockups` registre `Approval: approved`. Criterio de aceptación visual: `mockups/brew-timer-live.html` y `mockups/previews/*.png`.
> Skills Agente C a cargar antes de codificar: `vercel-react-best-practices`, `vercel-composition-patterns`, `tailwind-design-system`, `emil-design-eng`, `impeccable`, `svg-animation`, `modern-web-guidance`. Strict TDD: cada test se escribe y se ve fallar antes de implementar.

## 1. i18n

- [x] 1.1 Agregar claves `brew.timer.*` (estados, cuenta regresiva, total, siguiente, último paso, pausar/reanudar/reiniciar/nueva preparación, preparación lista, anuncio `aria-live`), `brew.kitchen.*` (pantalla activa, aviso sin Wake Lock, silenciar/activar sonido), `brew.recipeLocked` y `brew.methodSwitcher.*` (label, confirmación) en `src/i18n/locales/es/ui.json`; verificar con `npx vitest run src/i18n` que el test de integridad de claves pasa

## 2. Preferencias compartidas y última cafetera

- [x] 2.1 Test + implementación de `src/shared/hooks/useLastBrewMethod.ts` sobre `createStorageAdapter` (lectura validada, fallback `v60`, valor inválido ignorado, `storage` inyectable); verificar con `npx vitest run src/shared`
- [x] 2.2 Actualizar `TopNavbar` y `BottomTabBar` para usar `/brew/<último>` y estado activo con `useMatch('/brew/*')` + `aria-current="page"`; extender `BottomTabBar.test.tsx` con los escenarios del delta `app-shell-and-foundation` (retorno a chemex, sin valor, activo en `/brew/aeropress`) y verificar que pasan

## 3. Hook del temporizador

- [x] 3.1 Test + implementación de `useKitchenAdapters` (creación lazy única, `wakeLockStatus`, `muted` inicial desde storage, `toggleMute` persistido, cleanup que libera Wake Lock y hace `dispose`); verificar con mocks de las factorías en `src/features/brewing/__tests__/use-kitchen-adapters.test.tsx`
- [x] 3.2 Test + implementación de `src/features/brewing/hooks/useBrewTimer.ts` con `now`/`raf` inyectables: start/pause/resume/reset/jump/complete, throttle ≤ 100 ms, publicación de snapshot solo ante cambios observables, `flashKey` en cambio de fase; verificar con `src/features/brewing/__tests__/use-brew-timer.test.tsx` incluyendo salto de reloj de 20 s (pestaña oculta)
- [x] 3.3 Cablear eventos y gesto: `start/resume` llaman `audio.unlock()` y `requestWakeLock()` sin `await` previo; `pause/reset/completed` liberan; eventos del tick → `audio.playEvent`; verificar en el mismo test que el orden de llamadas y la liberación al completar se cumplen

## 4. Componente BrewTimer

- [x] 4.1 Crear `BrewTimer.tsx` (+ subcomponentes `KitchenModeBar`, `PhaseCountdown`, `ActiveInstructionCard`, `TimerControls`) siguiendo el mockup aprobado: reloj total, cuenta regresiva de fase, barra `scaleX`, dots, tarjeta con gramos del paso / en balanza (variante Espresso), siguiente o último paso, controles ≥ 48 px por estado; verificar con `brew-timer.test.tsx` cubriendo los escenarios de "Reloj en vivo", "Instrucción activa", "Controles" y "Finalización"
- [x] 4.2 Destello de fase (`opacity` + `background-color`, solo color con `prefers-reduced-motion`) y región `aria-live="polite"`; verificar con test que el anuncio cambia al cruzar fase y que la clase reducida se aplica con `matchMedia` mockeado
- [x] 4.3 Badges de Kitchen Mode (Pantalla activa / aviso sin soporte) y botón Silenciar con `aria-pressed`; verificar con tests de los escenarios "Indicador de pantalla activa" y "Alertas sonoras silenciables y persistentes"
- [x] 4.4 Mobile: conservar el orden controles → temporizador → cronograma y fijar la fila Pausar/Reanudar + Reiniciar sobre `BottomTabBar` fuera de `idle`; verificar visualmente a 390×844
- [x] 4.5 Variante B aprobada: anillo de fase (oro) + total (cobre) junto a la escena ampliada, total debajo del anillo; verificar contra `mockups/previews/c08-B-final-*`
- [x] 4.7 Ajustes post-review: botones Pausar/Reanudar y Reiniciar a ancho completo (primario sólido / secundario tenue) y anillo con barrido por frame vía `sample()`; verificar con el test "sweeps the progress rings every frame" en `brew-timer.test.tsx`
- [x] 4.8 Quitar el deslizable de llenado (herramienta de desarrollo) y corregir colisiones de escena (émbolo AeroPress en llenado, vertido vs. cuchara, perilla de prensa francesa, chorros de espresso); verificar con "Scene collision guards" en `procedural-brew-scene.test.tsx`
- [x] 4.6 Catálogo pour-over: drenaje final sin vaciar la jarra (V60, Chemex, Melitta) con test de continuidad de niveles; verificar con `npx vitest run src/domain/__tests__/methods.catalog.test.ts`

## 5. Integración en BrewStationView

- [x] 5.1 Reemplazar el panel de vista previa por `<BrewTimer />`, conservando en `idle` la previsualización por fase + scrubber y pasando `activePhase.svgDirective` y `phaseProgress` (cuantizado a 0.01) a `<ProceduralBrewScene />` fuera de `idle`; congelar la receta al iniciar; verificar con `brew-station-view.test.tsx` (scrubber oculto en ejecución, nivel 0.4 a mitad de fase 0.2→0.6)
- [x] 5.2 Bloqueo de receta: prop `disabled` en `BrewControls` y `EspressoYieldCards` + aviso `brew.recipeLocked`; verificar con tests de los escenarios "Bloqueo de la receta durante la ejecución"
- [x] 5.3 `MethodSwitcher` (`<select>` nativo) en el encabezado, escritura de `lastSelectedMethodSlug` al montar, confirmación i18n si `running|paused`; verificar con tests de "Selector rápido de cafetera" (cambio en reposo, confirmar y cancelar en ejecución)
- [x] 5.4 Limpieza al desmontar/cambiar de método; verificar con test que al navegar a `/wiki` en ejecución se libera Wake Lock y no hay `playEvent` posteriores

## 6. Verificación integrada

- [x] 6.1 Flujo completo en `brew-station-view.test.tsx`: Iniciar → avance de fases → Pausar → Reanudar → Reiniciar, con gramos y escena por fase, toggle de Mute persistido y feedback de Wake Lock; verificar que pasa junto a `npx vitest run` completo
- [x] 6.2 `npx tsc --noEmit` y `npm run lint` sin errores; `grep` sin hex sueltos ni textos hardcodeados en los archivos nuevos
- [x] 6.3 Visual verify: levantar el dev server, capturar `/brew/v60` y `/brew/espresso` en `idle`, `running`, `paused`, `completed` a 390×844 y 1440×900 en `mockups/verify/`, revisar consola y red, comparar con el mockup aprobado, registrar `Visual verify:` en `design.md` y detener el server

## Workflow follow-up

- Archivar con `/opsx:archive c-08-brew-timer-live-execution-ui`, marcar `[x]` C-08 en `CHANGES.md` y sincronizar la spec `brew-timer-live-execution-ui` a `openspec/specs/`.
- Reconciliar `visual_design.revision` (3) en `.active-orchestrator-state.json` con `Revision: 4` de `design-system/README.md`.
- Incluir la tabla `Auditoría de Skills Utilizadas` y el bloque de próximo change/modelos al cerrar.
