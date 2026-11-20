# Proposal — C-08 `brew-timer-live-execution-ui`

## Why

La estación `/brew/:methodSlug` ya calcula la receta (C-05), dibuja la escena SVG (C-06) y existe un motor de temporizador monotónico con adaptadores de Wake Lock, Web Audio y `localStorage` (C-07), pero nada los conecta: el botón **Iniciar** no hace nada, el reloj muestra solo la duración total y la escena se mueve únicamente con el scrubber manual. Sin esta integración no se cumplen `US-005` (temporizador paso a paso) ni `US-007` (Modo Cocina), y es el último eslabón del camino crítico antes de `C-12`.

## What Changes

- Nuevo hook `useBrewTimer` en `src/features/brewing/hooks/` que orquesta `brew-timer.engine` con un loop `requestAnimationFrame` (a ~100 ms con `performance.now()`), aísla el estado de alta frecuencia del resto de la vista y despacha eventos del motor a `webAudioAdapter`, ciclo de vida a `wakeLockAdapter` y preferencias a `storageAdapter`.
- Nuevo componente `BrewTimer` que reemplaza el panel de vista previa estático de `BrewStationView`:
  - Reloj tabular principal (transcurrido total) + cuenta regresiva de la fase activa y barra de progreso de fase.
  - Tarjeta de instrucción activa con gramos del paso y objetivo acumulado en balanza, destello suave al cambiar de fase (`SU-02`) y vista previa del siguiente paso.
  - Controles táctiles: **Iniciar**, **Pausar / Reanudar**, **Reiniciar (`00:00`)**, fase anterior / siguiente (salto manual).
  - Barra Kitchen Mode: badge "Pantalla activa" (o aviso discreto si Wake Lock no está soportado) y botón **Silenciar / Activar sonido** persistido.
  - Estado final "Preparación lista" al completar.
- `<ProceduralBrewScene />` pasa a recibir `activePhase.svgDirective` y `phaseProgress` reales del temporizador mientras corre; el scrubber de previsualización solo existe en `idle`.
- Los inputs de dosis/intensidad quedan bloqueados mientras el temporizador está `running` o `paused` (se desbloquean al reiniciar o completar), para que la receta no cambie a mitad de extracción.
- Selector rápido de cafetera en el encabezado de `BrewStationView` para cambiar entre los 6 métodos sin volver a `/`.
- Navegación: "Estación de Preparación" (`TopNavbar`) y "Preparar" (`BottomTabBar`) apuntan a `/brew/<último-método>` (persistido vía `lastSelectedMethodSlug`, fallback `v60`) y se marcan activos en cualquier `/brew/*`.
- Nuevas claves i18n en `src/i18n/locales/es/ui.json` (`brew.timer.*`, `brew.kitchen.*`, `brew.methodSwitcher.*`).

## Capabilities

### New Capabilities
- `brew-timer-live-execution-ui`: ejecución en vivo de la receta en la estación de preparación — reloj y cuenta regresiva de fase, instrucción activa y siguiente paso, controles de ciclo de vida, sincronización de la escena SVG, Modo Cocina (Wake Lock + audio + mute) y cambio rápido de cafetera.

### Modified Capabilities
- `app-shell-and-foundation`: los accesos de navegación a la estación de preparación resuelven la última cafetera usada y quedan activos en cualquier ruta `/brew/*`.

## Impact

- **Código nuevo**: `src/features/brewing/hooks/useBrewTimer.ts`, `src/features/brewing/hooks/useKitchenPreferences.ts`, `src/features/brewing/components/BrewTimer.tsx` (+ subcomponentes), `src/features/brewing/components/MethodSwitcher.tsx`, `src/shared/hooks/useLastBrewMethod.ts`.
- **Código modificado**: `src/features/brewing/views/BrewStationView.tsx`, `src/shared/components/TopNavbar.tsx`, `src/shared/components/BottomTabBar.tsx`, `src/i18n/locales/es/ui.json`.
- **Sin cambios** en `src/domain/` ni en `src/adapters/` (se consumen sus APIs públicas de C-07 tal cual).
- **Dependencias**: ninguna nueva.
- **Tests**: nuevos tests de hook y de integración en `src/features/brewing/__tests__/`; ajustes en `BottomTabBar.test.tsx` y `brew-station-view.test.tsx`.
- **Fuera de alcance**: PWA/offline (C-12), historial de preparaciones, vibración háptica, timer en segundo plano con notificaciones del sistema.
