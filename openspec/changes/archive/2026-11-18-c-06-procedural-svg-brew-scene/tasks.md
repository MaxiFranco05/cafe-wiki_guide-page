# Tasks

## 1. Primitivas de Geometría, Nivel de Líquido y Cama de Café (`VesselSilhouette`, `LiquidLevel`, `CoffeeBed`)

- [x] 1.1 **[TDD RED]** Crear `src/features/brewing/__tests__/procedural-brew-scene.test.tsx` con casos que fallen inicialmente verificando: (a) el renderizado y `<clipPath>` únicos (doble cámara `carafeClip` + `upperFilterClip` para `cone_v60`, `hourglass_chemex`, `wedge_melitta` y cámara única para `cylinder_aeropress`, `beaker_french_press`, `portafilter_espresso`) en `VesselSilhouette`, (b) la función `interpolateLiquidFill(start, end, p)`, el desplazamiento `translateY(...)`, las ondas superficiales y la capa de espuma crema Espresso en `LiquidLevel` para $p = 0, 0.5, 1$, y (c) los 4 estados de `CoffeeBed` (`calm`, `bubbling_bloom`, `active_slurry`, `settled`, incluyendo lecho superior acotado en goteo que drena en `settled`).
- [x] 1.2 **[TDD GREEN]** Implementar `src/features/brewing/components/svg-primitives/VesselSilhouette.tsx`, `src/features/brewing/components/svg-primitives/LiquidLevel.tsx` y `src/features/brewing/components/svg-primitives/CoffeeBed.tsx` usando tokens de `design-system/tokens.css` (Rev 4) hasta que pasen los tests del bloque 1.
- [x] 1.3 **[TDD TRIANGULATE & REFACTOR]** Agregar casos de borde en `src/features/brewing/__tests__/procedural-brew-scene.test.tsx` para valores de progreso fuera de rango ($p < 0$, $p > 1$, `NaN`) y múltiples instancias simultáneas sin colisión de `<clipPath id>`, refactorizando constantes de cámara y verificando `npx vitest run src/features/brewing/__tests__/procedural-brew-scene.test.tsx`.

## 2. Primitivas de Acción Mecánica y Fluido (`PourStream`, `Agitator`, `Plunger` y `PortafilterDrops`)

- [x] 2.1 **[TDD RED]** Ampliar `src/features/brewing/__tests__/procedural-brew-scene.test.tsx` con tests que fallen inicialmente para: (a) `PourStream` (`none | gentle | steady | spiral` con cuerpo continuo, brillo vertical, ondas concéntricas en superficie real y `--svg-coffee-crema` en `portafilter_espresso`), (b) `Agitator` (`none | spoon_stir` orbital con vórtice superficial `| vessel_swirl`), y (c) `Plunger` (`none | up | pressing | down` diferenciando émbolo cilíndrico telescópico de AeroPress frente a tapa fija + varilla/malla de Prensa Francesa, más caída doble `PortafilterDrops` en Espresso).
- [x] 2.2 **[TDD GREEN]** Implementar `src/features/brewing/components/svg-primitives/PourStream.tsx`, `src/features/brewing/components/svg-primitives/Agitator.tsx` y `src/features/brewing/components/svg-primitives/Plunger.tsx` hasta pasar todos los casos de activación condicional.
- [x] 2.3 **[TDD TRIANGULATE & REFACTOR]** Triangular combinaciones de directivas reales de los 6 métodos del catálogo (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`) y refactorizar tipos compartidos en `src/features/brewing/components/svg-primitives/index.ts` manteniendo la suite en verde (`npx vitest run src/features/brewing/__tests__/procedural-brew-scene.test.tsx`).

## 3. Contenedor `<ProceduralBrewScene />` y Accesibilidad `prefers-reduced-motion` (`US-006 CA-3`)

- [x] 3.1 **[TDD RED]** Escribir tests en `src/features/brewing/__tests__/procedural-brew-scene.test.tsx` que fallen inicialmente comprobando el ensamblaje completo de `<ProceduralBrewScene directive={svgDirective} progress={p} reducedMotion={boolean} />`, la propagación de `progress` ($0, 0.5, 1$) y la desactivación de animaciones de bucle continuo (`data-reduced-motion="true"`) cuando `reducedMotion={true}` o `window.matchMedia('(prefers-reduced-motion: reduce)')` coincide.
- [x] 3.2 **[TDD GREEN]** Implementar `src/features/brewing/components/ProceduralBrewScene.tsx` (envuelto en `React.memo`), actualizar `BrewPreviewVesselSvg.tsx` para delegar limpiamente hacia `ProceduralBrewScene` y añadir las animaciones CSS GPU-safe en `src/index.css` respetando `@media (prefers-reduced-motion: reduce)`.
- [x] 3.3 **[TDD TRIANGULATE & REFACTOR]** Triangular transiciones entre fases consecutivas con distintas directivas y verificar con `npx vitest run` que no existan regresiones en los tests previos de `C-05`.

## 4. Integración de Vista Previa Interactiva por Fase en `BrewStationView` e Internacionalización (`RN-I18N-01`)

- [x] 4.1 **[TDD RED]** Añadir tests de integración en `src/features/brewing/__tests__/brew-station-view.test.tsx` que fallen inicialmente verificando que `BrewStationView` renderiza `<ProceduralBrewScene />` en el panel derecho del reloj, actualiza las primitivas activas al seleccionar cualquier fase (fila de timeline, punto de fase o botones `<`/`>`) y permite inspeccionar el progreso de la fase en vista previa.
- [x] 4.2 **[TDD GREEN]** Actualizar `src/i18n/locales/es/ui.json` y `src/features/brewing/views/BrewStationView.tsx` para integrar `<ProceduralBrewScene />` sincronizado con la fase activa y su progreso de vista previa sin ningún string hardcodeado ni emojis.
- [x] 4.3 **[TDD TRIANGULATE & REFACTOR]** Ejecutar la suite completa (`npx vitest run`), typecheck (`npm run build`) y validar que los 6 métodos en `/brew/:methodSlug` rendericen sus escenas procedurales sin errores ni desbordes ni hex sueltos fuera de `tokens.css`.

## Workflow follow-up

- Archivar el change con `/opsx:archive c-06-procedural-svg-brew-scene` y marcar `[x]` en `CHANGES.md` una vez completada y verificada la implementación.
