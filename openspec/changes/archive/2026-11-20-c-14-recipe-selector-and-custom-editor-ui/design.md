# Design — C-14 `recipe-selector-and-custom-editor-ui`

## UI Mockups

- **Design system revision**: 4 (`design-system/README.md`, aprobado 2026-11-17; `.active-orchestrator-state.json` también registra `revision: 4`, modo `system-and-mockups` en ambos). Nota: `CLAUDE.md`/`AGENTS.md` todavía citan "Revisión 3"; queda para regenerarlos en un cierre.
- **Decision**: yes (2026-11-20)
- **Mockups**: `openspec/changes/c-14-recipe-selector-and-custom-editor-ui/mockups/recipe-selector-and-editor.html` (+ `mockups/README.md`)
- **Approval**: approved (2026-11-20, by user) para selector, editor, compartir/importar y confirmación; encabezado rev 2 aprobado en variante A (ver abajo). Aprobación original: mockup tal como se presentó; disparador junto al título en desktop y como fila propia bajo el título en mobile, igual que en las capturas)
- **Criterio de aceptación**: `mockups/recipe-selector-and-editor.html` + `mockups/previews/c14-*-{desktop-1440x900,mobile-390x844}.png`
- **Preview**: rendered (2026-11-20, Playwright, capturas en `mockups/previews/`)
- **Visual verify**: passed (2026-11-20 — app real en `localhost:5174` vs. mockup aprobado, Playwright a 1440×900 y 390×844: estación con 4:6, selector, Mis Recetas, editor con errores, duplicado de 4:6, compartir copiado, importar JSON inválido, confirmar eliminación y receta bloqueada en curso; capturas `mockups/verify/c14-app-*`; 0 errores de consola, 0 requests fallidos, 0 px de scroll horizontal). Diferencias: **menor** — el fondo del diálogo ya no usa `backdrop-filter: blur` (en Chromium headless tapaba el contenido del diálogo) y la entrada anima solo `transform` (si el reloj de animación se frena, el diálogo sigue visible); **menor** — "Ver más" aparece también en fichas cuyo resumen entra en 2 líneas (heurística por largo de texto); **menor** — el título del diálogo usa el peso del `h2` global, algo más liviano que en el mockup. Hallazgos corregidos durante la verificación: los chips de intensidad y la temperatura del pozo de agua mostraban valores del método (C-02) en vez de los de la receta activa. No verificado en navegador: Espresso con receta de autor y la importación desde archivo (cubiertos por tests).

### Revisión 2 del encabezado (2026-11-20, pedida por el usuario)

- **Pedido**: el disparador de receta se ve demasiado grande; quitar el desplegable "Cambiar cafetera" junto al título y abrir el cambio de cafetera al tocar el nombre (o con un control más discreto); al cambiar de cafetera el selector se corría por el largo del título.
- **Mockup**: `mockups/station-header-rev2.html` (`?variant=a|b&method=<slug>&state=idle|open|locked`). Capturas en `mockups/previews/c14-header-rev2-{a,b}-{v60,french-press}-{idle,open,locked}-{desktop-1440x900,mobile-390x844}.png`.
- **Variante A**: el nombre de la cafetera es el botón (chevrón al lado) y abre un menú desplegable con las 6 cafeteras; la receta pasa a una píldora compacta de 44 px (nombre · ratio · temperatura), a la derecha en desktop y bajo el subtítulo en mobile.
- **Variante B**: el nombre abre una hoja/diálogo con una grilla de las 6 cafeteras; la receta queda como una fila de texto "Receta [nombre ⌄] autor · ratio · temperatura" bajo el subtítulo.
- **Estabilidad medida**: entre "Hario V60" y "Prensa Francesa", el título y el cuerpo de la estación quedan en la misma posición en ambas variantes y tamaños; no hay nada a la derecha del título que se corra. Sin scroll horizontal en 390 px.
- **Se mantiene**: confirmación antes de cambiar de cafetera con una preparación en curso (comportamiento de `MethodSwitcher`) y receta bloqueada durante la preparación.
- **Approval (rev 2)**: approved (2026-11-20, by user — **variante A**: menú desplegable en el nombre de la cafetera + píldora compacta de receta) — el resto del mockup aprobado (selector, editor, compartir/importar, confirmación) no cambia.
- **Visual verify (rev 2)**: passed (2026-11-20 — app real en `localhost:5174` a 1440×900 y 390×844: `/brew/v60` y `/brew/french-press` en reposo, menú de cafeteras abierto y receta bloqueada en curso; capturas `mockups/verify/c14-app-header-rev2-*`; 0 errores de consola, 0 requests fallidos, 0 px de scroll horizontal). Medido: el título y el cuerpo de la estación quedan en la misma posición con V60 y Prensa Francesa en ambos tamaños. Implementación: `MethodSwitcher` pasa a ser el `h1` con botón + menú (`role=menu`, flechas/Home/End/Escape, clic afuera cierra, confirmación con preparación en curso); el `<select>` y su CSS se eliminaron; el disparador de receta es una píldora de 44 px sin autor (spec actualizada).

### Design Brief

- **Audiencia y tarea**: Entusiasta / Home Barista que quiere replicar una técnica de referencia o guardar la suya; Preparador diario que solo quiere su receta de siempre a un toque. Superficie *Choose* (selector) y *Author* (editor), ambas fuera del momento de preparación: densidad de información media, lectura cercana.
- **Pantallas y estados**: `/brew/v60` encabezado con disparador de receta (reposo y bloqueado en curso); selector abierto con los tres grupos y la receta activa marcada; ficha expandida de Método 4:6; `Mis Recetas` vacío; editor (nuevo y duplicado de 4:6) con error inline; panel Compartir (copiado / portapapeles bloqueado) e Importar (error JSON y receta de otro método); confirmación de eliminar.
- **Responsive**: 390×844 → selector y editor como hoja inferior a pantalla casi completa (`max-height: 92dvh`, asa, encabezado fijo y pie de acciones fijo); 1440×900 → diálogo centrado de 720 px (selector) y 880 px (editor, dos columnas: datos de receta | fases + resumen).
- **Tokens/activos**: solo `design-system/tokens.css` (superficies `--bg-surface`/`--bg-elevated`/`--bg-dark-card`, acento `--accent-primary` para la acción principal, `--accent-gold` para la receta activa y ratios, `--status-danger` para errores y eliminar, `--status-optimal` para confirmaciones, `--svg-water-stream` para ml de agua), `brand.js` y los íconos SVG inline de vasija existentes. Cero hex sueltos.
- **Jerarquía de la ficha**: título + badge de tipo (Estándar / Autor / Clásica / Mía) → autor · dificultad → fila tabular `1:15 · 3:30 · 92 °C` en mono → resumen de proceso (2 líneas, expandible) → "Destaca:" sabor → acciones (Usar, Duplicar; en Mías también Editar, Compartir, Eliminar).
- **Motion**: hoja entra con `transform: translateY` 240 ms `var(--ease-drawer)`, diálogo con `opacity` + `scale(0.97→1)`; con `prefers-reduced-motion` solo `opacity`.
- **Restricciones**: cero emojis, textos vía i18n, targets ≥ 44 px (≥ 48 px en el disparador y acciones principales), foco visible `--shadow-focus`.

## Context

- `views/BrewStationView.tsx` mantiene en `BrewStationSession` un estado `{ profileId, coffeeInput, waterInput, selectedPhaseIndex }` y llama `calculateScaledRecipe(method, profileId, input)` con 3 argumentos (receta Estándar implícita). El encabezado muestra `activeProfile.referenceAuthor` y la temperatura de `method.waterTempCelsius`.
- C-13 dejó, sin consumidor en UI: `getRecipesByMethod`, `getDefaultRecipeForMethod`, `getRecipeById` (`src/data/recipes`), `calculateScaledRecipe(..., recipe)` y `calculateEspressoStyles(method, dose, recipe)`, `buildCustomRecipe`, `duplicateRecipeAsDraft`, `exportCustomRecipeJson`, `importCustomRecipeJson` y en `StorageAdapter` `getCustomRecipes`, `saveCustomRecipe`, `deleteCustomRecipe` + `selectedRecipeId` en `MethodPreferenceConfig`.
- `PhaseTimelinePreview` y `BrewTimer` resuelven textos con `t(phase.titleKey)` / `t(phase.instructionKey, params)`. Las fases custom traen `titleKey: 'custom'` y el texto real en `customTitle` / `customInstruction`. `t()` devuelve la clave sin interpolar cuando no la encuentra, así que hoy una receta custom mostraría "custom".
- `duplicateRecipeAsDraft` (dominio puro, sin i18n) usa `phase.id` como título para recetas de catálogo y devuelve `waterAmount` como porcentaje (`share × 100`).
- `useKitchenAdapters` crea su `StorageAdapter` con fábrica inyectable; los tests ya usan ese patrón.

## Goals / Non-Goals

**Goals:**
- Hacer que la estación sea dirigida por una `BrewRecipe` explícita sin romper el comportamiento por defecto.
- Un único punto de resolución de texto de fase para catálogo y custom.
- Hooks y helpers testeables con almacenamiento inyectado.

**Non-Goals:**
- Cambiar `src/domain/` o el esquema de `storage.adapter.ts`.
- Compartir por URL codificada, QR o backend; sincronización entre dispositivos.
- Editar `intensityRatios` por separado (se derivan del ratio base); editar `svgDirective` a mano.
- Recetas custom en la portada `/` o en la wiki.

## Decisions

1. **Receta activa como estado de la sesión.** `BrewStationSession` suma `activeRecipe: BrewRecipe` y pasa `recipe` a `calculateScaledRecipe` / `calculateEspressoStyles` en todos los recálculos (cambio de intensidad, café, agua). Al cambiar receta se conserva `coffeeInput` y `profileId` y se recalcula `waterInput`; `selectedPhaseIndex` vuelve a 0. *Alternativa*: re-montar la sesión con `key` por receta (como con el método) — descartada porque perdería la dosis que el usuario ya ingresó.

2. **Hook `useRecipeLibrary(method, { createStorage? })`.** Encapsula lista de catálogo del método, recetas custom (estado React sincronizado con el adaptador), `selectedRecipeId`, y acciones `select`, `saveCustom`, `deleteCustom`, `importJson`. Persiste la elección con `setMethodConfig(slug, { ...configActual, selectedRecipeId })`, completando `coffeeGrams`/`profileId` con los valores actuales cuando no hay config previa (el esquema los exige). La fábrica es inyectable igual que en `useKitchenAdapters`. *Alternativa*: contexto global de recetas — innecesario mientras solo la estación las consume.

3. **Resolución pura de la receta inicial** en `utils/recipe-display.helpers.ts`: `resolveInitialRecipe(method, { queryRecipeId, storedRecipeId, customRecipes })` con prioridad `?recipe` válido para el método → recordado válido → Estándar. Ids inválidos o de otro método se ignoran en silencio. Testeable sin DOM.

4. **Texto de fase unificado.** `resolvePhaseTitle(phase)` y `resolvePhaseInstruction(phase, params)` usan `customTitle`/`customInstruction` cuando existen y `t(key)` en caso contrario. Para interpolar texto libre se exporta desde `src/i18n/index.ts` la función de reemplazo que hoy está dentro de `t()` (`interpolate(template, params)`), sin cambiar el comportamiento de `t()`. `PhaseTimelinePreview` y `BrewTimer` (instrucción, siguiente, anuncio aria-live, puntos) pasan a usar los helpers.

5. **Duplicado con textos resueltos en la UI.** Tras `duplicateRecipeAsDraft`, la UI reemplaza el título de cada fase de catálogo por `t(phase.titleKey)` y su instrucción por `t(phase.instructionKey)` (plantilla con `{{waterGrams}}`, que se conserva y se interpola al ejecutar), y propone el nombre `t('brew.recipes.editor.copyName', { title })`. Así el dominio sigue sin depender de i18n.

6. **El editor trabaja en ml de una dosis de referencia.** El formulario expone "Dosis de referencia (g)" (default `recipe.defaultDoseGrams ?? method.defaultDoseGrams`) y el agua de cada fase en ml para esa dosis; un duplicado convierte `share × dosis × ratioBase`. El total de agua en vivo se muestra junto al ratio implícito (`agua / dosis`); al guardar, el ratio base que se envía es el ingresado en el campo ratio (no el implícito) y las proporciones salen de los ml. *Alternativa*: editar porcentajes — más abstracto para el usuario de mesada.

7. **Validación de formulario en dos capas.** Primero una validación local de UI (nombre, duración entera > 0, agua ≥ 0, al menos una fase con agua, tipo permitido) que produce errores por campo en español vía i18n; luego `buildCustomRecipe`. Si este devuelve `ok: false` (caso no previsto) se muestra un error general traducido por `errorCode`; los `issues` de Zod (en inglés) solo van a un bloque "Detalles técnicos" colapsado.

8. **Tipos de fase por método** (constante en el helper): pour-over (`v60`, `chemex`, `melitta`) → `bloom, pour, swirl, stir, wait, drawdown`; `aeropress` → `bloom, pour, stir, swirl, wait, plunge`; `french-press` → `pour, stir, wait, plunge`; `espresso` → `bloom, wait, espresso_shot` (ajustado en `apply`: el catálogo usa `swirl` en AeroPress y `bloom` como preinfusión en Espresso; un test duplica las 19 recetas para garantizarlo). Se derivan de los tipos que ya usa el catálogo y del mapeo SVG de C-13.

9. **Modales con `<dialog>` nativo** (`showModal()`): foco atrapado, `Escape` y capa inerte sin dependencias. Un componente `RecipeSheet` comparte el armazón (hoja inferior < 768 px, diálogo centrado ≥ 768 px), devuelve el foco al disparador y bloquea el scroll del fondo. El editor y la confirmación de borrado se abren encima del selector (pila de 2 niveles como máximo). *Alternativa*: librería de diálogos — dependencia nueva innecesaria.

10. **Compartir**: `navigator.clipboard.writeText` con fallback a `<textarea readonly>` seleccionado; descarga con `Blob` + `URL.createObjectURL` y nombre `<id>.json`. **Importar**: `<textarea>` + `<input type="file" accept="application/json,.json">` leído con `File.text()`. Conflicto de id → elegir Reemplazar (mismo id) o Guardar como copia (id `<id>-copia[-n]` y título "(copia)", revalidado con `CustomBrewRecipeSchema`). Receta de otro método → se guarda y se muestra enlace a `/brew/<metodo>?recipe=<id>`. Estas APIs de navegador quedan en la capa de feature (imperative shell), nunca en `src/domain/`.

11. **Bloqueo durante la ejecución**: el disparador recibe `disabled={isRecipeLocked}` con `aria-describedby` apuntando al aviso existente `brew.recipeLocked`, igual que `MethodSwitcher`.

13. **Una sola instancia de almacenamiento** (agregada en `apply`, 2026-11-20). Hallazgo: `createStorageAdapter()` guarda una copia en memoria y reescribe el objeto completo en cada escritura; la app ya creaba dos instancias (`useLastBrewMethod` y `useKitchenAdapters`), así que una escritura con copia vieja borraba lo que había guardado la otra (pasaba con el mute y hubiera pasado con las recetas custom al cambiar de cafetera). Solución: `getSharedStorageAdapter()` perezosa en `src/adapters/storage.adapter.ts` (sin cambios de esquema) como valor por defecto de los tres consumidores; los tests siguen inyectando su propia instancia y `src/test/setup.ts` reinicia la compartida antes de cada test. *Alternativas*: releer `localStorage` antes de cada escritura (cambia el comportamiento de todos los llamadores y parsea en cada escritura) o dejarlo como riesgo conocido (pérdida de recetas). El usuario no expresó preferencia; se tomó la recomendada. Esto corrige la afirmación de *Non-Goals* de no tocar `src/adapters/`: se agrega una función, sin tocar el esquema.

14. **La Estándar sale del catálogo** (agregada en `apply`, 2026-11-20, elegida por el usuario). Hallazgo: `calculateScaledRecipe` con 3 argumentos escala con los perfiles del método de C-02, que difieren de la receta Estándar del catálogo de C-13 en los 6 métodos (V60 15 g: 250 ml / 3:30 / "Primer vertido" frente a 240 ml / 3:00 / "Vertido 1"; French Press 4:30 frente a 5:15; Espresso 1 frente a 2 fases). La estación pasa siempre la receta activa (también la Estándar), así lo que muestra el selector coincide con la estación. Cambia el resultado por defecto de la estación: se actualizan los tests de C-05/C-08 y el escenario "Primera visita a un método". *Alternativas descartadas*: mantener la ruta de 3 argumentos sin receta elegida (ficha y estación no coincidirían) o reescribir la Estándar del catálogo (datos de dominio de C-13, fuera de alcance).

12. **Encabezado**: autor y temperatura pasan a salir de la receta activa (`authorName`, `waterTempCelsius ?? method.waterTempCelsius`) en lugar de `activeProfile.referenceAuthor`.

## Risks / Trade-offs

- [jsdom 26 implementa `HTMLDialogElement` sin `showModal` completo] → stub mínimo de `showModal`/`close` en `src/test/setup.ts`; las pruebas de foco se hacen sobre el disparador y el contenido.
- [Un id de receta recordada que apunta a una custom inválida tras una versión futura del esquema] → el adaptador ya descarta preferencias inválidas; `resolveInitialRecipe` cae a la Estándar.
- [`setMethodConfig` exige `coffeeGrams` y `profileId`] → el hook completa con los valores actuales de la sesión; no se persiste dosis automáticamente en otros momentos (fuera de alcance).
- [Recetas custom con mucho texto rompen la ficha] → límites del esquema (80/300/200/120 caracteres) + `line-clamp` con "Ver más".
- [Errores de Zod en inglés] → nunca se muestran como mensaje principal (Decisión 7).
- [Re-render de toda la estación al cambiar receta] → evento de baja frecuencia; el estado por tick sigue aislado en `BrewTimer`.

## Migration Plan

Sin migración de datos: el adaptador de C-13 ya acepta preferencias v1 sin `customRecipes`/`selectedRecipeId`. Rollback = revertir el commit; las recetas custom guardadas quedan en `localStorage` y vuelven a aparecer al reintroducir la UI.

## Open Questions

- Ninguna. La ubicación del disparador quedó resuelta con la aprobación del mockup (2026-11-20).
