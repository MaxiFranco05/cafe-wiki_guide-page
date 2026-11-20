# Tasks — C-14 `recipe-selector-and-custom-editor-ui`

> **Gate**: mockup aprobado el 2026-11-20 (`design.md › UI Mockups › Approval: approved`). Criterio visual de aceptación: `mockups/recipe-selector-and-editor.html` y `mockups/previews/c14-*-{desktop-1440x900,mobile-390x844}.png`.
> Skills del rol Frontend (Agente C) a cargar antes de `apply`: `vercel-react-best-practices`, `vercel-composition-patterns`, `tailwind-design-system`, `impeccable`, `emil-design-eng`, `modern-web-guidance`, `vite`, `playwright-cli`. Strict TDD: cada tarea escribe primero su test (rojo) y luego el código.

## 1. Helpers puros e i18n

- [x] 1.1 Exportar `interpolate(template, params)` desde `src/i18n/index.ts` y hacer que `t()` lo use internamente sin cambiar su comportamiento. Verificar: test nuevo en `src/i18n/__tests__/i18n.test.ts` (`{{x}}` y `{x}`) y la suite i18n existente en verde.
- [x] 1.2 Crear `src/features/brewing/utils/recipe-display.helpers.ts` con `resolvePhaseTitle`, `resolvePhaseInstruction` (custom vs. clave i18n con interpolación), `formatRecipeRatio`, `groupRecipesForSelector(catalog, custom)` y `ALLOWED_PHASE_TYPES` por método (Decisión 8). Verificar: `recipe-display.helpers.test.ts` cubre fase de catálogo, fase custom con `{{waterGrams}}`/`{{cumulativeWaterGrams}}` y los tres grupos de V60.
- [x] 1.3 Agregar `resolveInitialRecipe(method, { queryRecipeId, storedRecipeId, customRecipes })` con prioridad query → recordada → Estándar, ignorando ids inexistentes o de otro método. Verificar: tests de los 4 escenarios del requisito "Recordar la receta elegida por método".
- [x] 1.4 Agregar `catalogDraftForEditing(recipe, method)` que envuelve `duplicateRecipeAsDraft`, resuelve títulos/instrucciones con `t()`, propone `brew.recipes.editor.copyName` y convierte `waterShare` a ml de la dosis de referencia (Decisión 5 y 6), más `validateEditorDraft(form)` que devuelve errores por campo con claves i18n (Decisión 7). Verificar: duplicar Kasuya 4:6 a 20 g da 5 fases de 60 ml con títulos en español; nombre vacío y "sin agua" producen los errores esperados.
- [x] 1.5 Agregar todas las claves `brew.recipes.*` (disparador, grupos, ficha, editor, compartir, importar, errores por `errorCode`, confirmación) en `src/i18n/locales/es/ui.json`. Verificar: test que recorre las claves nuevas y comprueba texto no vacío, distinto de la ruta y sin emojis.

## 2. Hook de biblioteca de recetas

- [x] 2.0 Agregar `getSharedStorageAdapter()` (instancia única perezosa) y `resetSharedStorageAdapter()` en `src/adapters/storage.adapter.ts`, usarla por defecto en `useLastBrewMethod`, `useKitchenAdapters` y `useRecipeLibrary`, y reiniciarla antes de cada test en `src/test/setup.ts` (Decisión 13). Verificar: test que guarda una receta custom, cambia de cafetera (`rememberBrewMethod`) y silencia el audio, y comprueba que la receta y el mute siguen en `localStorage`.
- [x] 2.1 Crear `src/features/brewing/hooks/useRecipeLibrary.ts` con fábrica de storage inyectable: estado de custom del método, `activeRecipe`, `select`, `saveCustom`, `deleteCustom` (vuelve a la Estándar si era la activa), `importJson` (incluye conflicto de id y otro método) y persistencia de `selectedRecipeId` vía `setMethodConfig` completando `coffeeGrams`/`profileId`. Verificar: `use-recipe-library.test.tsx` con storage en memoria y storage que lanza (fallback sin errores).

## 3. Componentes de UI

- [x] 3.1 Crear `RecipeSheet` (armazón `<dialog>` con `showModal`, hoja inferior < 768 px / diálogo ≥ 768 px, devolución de foco, bloqueo de scroll, cierre con Escape y botón) y el stub de `showModal`/`close` en `src/test/setup.ts`. Verificar: test de apertura, cierre con Escape y foco devuelto al disparador.
- [x] 3.2 Crear `RecipeSelectorTrigger.tsx` (nombre, autor · ratio · temperatura, estado bloqueado con `aria-describedby` al aviso existente). Verificar: test de render y de que no abre estando `disabled`.
- [x] 3.3 Crear `RecipeSelectorModal.tsx` con los tres grupos, fichas (badges de tipo y "En uso", hechos en mono, proceso con "Ver más", "Destaca:"), estado vacío y acciones Usar / Duplicar / Editar / Compartir / Eliminar según tipo, igual al mockup. Verificar: test de grupos de V60, ficha de 4:6 (`1:15`, `3:30`, `92 °C`) y que las recetas de catálogo no tienen Editar/Eliminar.
- [x] 3.4 Crear `CustomRecipeEditorModal.tsx` (nombre, dosis de referencia, ratio, temperatura, notas en desplegable, lista de fases con subir/bajar/quitar/agregar, resumen en vivo de duración, agua y ratio real con barra, errores inline y banner) que guarda con `buildCustomRecipe`. Verificar: test de creación "Mi V60" (4 fases → `3:00`), totales en vivo, quitar deshabilitado con una fase, errores de nombre y sin agua.
- [x] 3.5 Crear `RecipeShareImportPanel.tsx` (pestañas Compartir/Importar; copiar con fallback a texto seleccionable, descargar `.json`, pegar o elegir archivo, errores traducidos con detalles técnicos colapsados, otro método con enlace, id repetido con Reemplazar/Guardar como copia) y la confirmación de eliminación como `alertdialog`. Verificar: tests de copia OK, portapapeles rechazado, JSON corrupto, receta de AeroPress importada en V60 y cancelar/confirmar eliminación.

## 4. Integración en la estación

- [x] 4.1 Integrar en `views/BrewStationView.tsx`: receta activa desde `useRecipeLibrary` + `?recipe`, pasar `recipe` a `calculateScaledRecipe` y `calculateEspressoStyles` en todos los recálculos, conservar dosis/intensidad al cambiar receta, autor y temperatura del encabezado desde la receta, disparador bloqueado con `isRecipeLocked`. Verificar: test en `brew-station-view.test.tsx` — elegir 4:6 con 20 g da `300 ml`, 5 × `60 g`, `3:30`, `92 °C`; recarga restaura la elección; sin preferencias el resultado es idéntico al actual.
- [x] 4.2 Usar los helpers de texto en `PhaseTimelinePreview.tsx` y `BrewTimer.tsx` (instrucción, siguiente, anuncio aria-live, puntos de fase). Verificar: test con receta custom muestra "Verté 120 g hasta alcanzar 170 g." y ninguna clave cruda `custom`; tests existentes de timer y cronograma en verde.
- [x] 4.3 Prueba de integración de flujo completo: crear receta custom → queda activa → duplicar una de autor → exportar → eliminar → importar el JSON → reaparece con mismo nombre, ratio y fases. Verificar: `recipe-selector-flow.test.tsx` en verde.

## 5. Calidad y verificación visual

- [x] 5.1 `npm run build` (incluye `tsc --noEmit`) y `npm test` sin errores; sin `any`, `@ts-ignore`, hex sueltos fuera de `tokens.css` ni emojis (grep sobre los archivos tocados).
- [x] 5.2 Verificación visual contra el mockup aprobado: dev server, `/brew/v60` en reposo, selector, editor (nuevo y con errores), compartir/importar y estado bloqueado a 1440×900 y 390×844; capturas en `mockups/verify/`, 0 errores de consola y 0 requests fallidos; diferencias reportadas por prioridad y `Visual verify` registrado en `design.md`.

## Workflow follow-up

- `/opsx:archive c-14-recipe-selector-and-custom-editor-ui`, marcar `[x]` C-14 en `CHANGES.md` y pushear a `dev` (con confirmación del usuario).
- Incluir la tabla `Auditoría de Skills Utilizadas` al cerrar.
- Regenerar `CLAUDE.md`/`AGENTS.md` para que citen Design System `Revision: 4`.
