# Proposal — C-14 `recipe-selector-and-custom-editor-ui`

## Why

C-13 dejó listo el dominio multi-receta (19 recetas verificadas, normalizador de recetas custom, Export/Import JSON y CRUD en `storage.adapter.ts`), pero la estación `/brew/:methodSlug` sigue escalando solo la receta Estándar implícita: el Entusiasta no puede elegir Kasuya 4:6 o Hoffmann, ni guardar y compartir su propia técnica (`US-00x` réplica de recetas de referentes). Este change expone esas capacidades en la UI y cierra la Fase 5.

## What Changes

- **Selector de receta en la estación**: un disparador junto al encabezado de `BrewStationView` abre `RecipeSelectorModal` (hoja inferior en mobile, diálogo centrado en desktop) con tres grupos: `Estándar (por defecto)`, `Autores y Clásicas` (autor, dificultad, resumen del proceso y sabor que destaca) y `Mis Recetas` (custom guardadas del método actual).
- **Estación dirigida por receta**: elegir una receta recalcula agua, fases, duración total y temperatura con `calculateScaledRecipe(method, profileId, input, recipe)`; el encabezado muestra el autor y la temperatura de la receta activa. El selector queda bloqueado mientras el timer está `running`/`paused`.
- **Persistencia de la elección**: `selectedRecipeId` por método vía `storageAdapter.setMethodConfig`; si la receta guardada ya no existe, se vuelve a la Estándar sin error. Soporte de `?recipe=<id>` como enlace directo.
- **Editor de recetas custom** (`CustomRecipeEditorModal`): crear desde cero o duplicar cualquier receta (`duplicateRecipeAsDraft`), editando nombre, notas, ratio base, temperatura opcional y fases (tipo, título, duración en s, agua en ml) con agregar / quitar / reordenar; vista previa del total y de la línea de tiempo; guardado mediante `buildCustomRecipe` + `saveCustomRecipe`, edición y borrado con confirmación.
- **Compartir e importar JSON**: copiar al portapapeles o descargar `.json` (`exportCustomRecipeJson`); importar pegando texto o eligiendo un archivo (`importCustomRecipeJson`) con errores de validación inline traducidos y sin excepciones no controladas.
- **Render de fases custom**: `PhaseTimelinePreview` y `BrewTimer` resuelven `customTitle` / `customInstruction` (con interpolación de `{{waterGrams}}` / `{{cumulativeWaterGrams}}`) cuando la receta es `source: 'custom'`, mediante un helper único.
- **i18n**: nuevas claves `brew.recipes.*` en `src/i18n/locales/es/ui.json`; cero textos hardcodeados y cero emojis.
- **UI Mockup obligatorio** antes de `apply` (`system-and-mockups`, Design System Revision 4, 390×844 y 1440×900).

Sin cambios **BREAKING**: sin receta seleccionada la estación se comporta exactamente como en C-05/C-08.

## Capabilities

### New Capabilities
- `brew-recipe-selection-and-editor-ui`: selección de receta del catálogo o custom en la estación de preparación, editor visual de recetas personalizadas, compartir/importar JSON y persistencia de la receta elegida por método.

### Modified Capabilities
- Ninguna a nivel de requisitos. El render de títulos/instrucciones custom en el cronograma y el timer se especifica dentro de la nueva capacidad; el comportamiento existente de `brew-timer-live-execution-ui` no cambia.

## Impact

- **Código nuevo**: `src/features/brewing/components/RecipeSelectorModal.tsx`, `RecipeSelectorTrigger.tsx`, `CustomRecipeEditorModal.tsx`, `RecipeShareImportPanel.tsx`, `src/features/brewing/hooks/useRecipeLibrary.ts`, `src/features/brewing/utils/recipe-display.helpers.ts`, tests en `src/features/brewing/__tests__/`.
- **Código modificado**: `views/BrewStationView.tsx`, `components/PhaseTimelinePreview.tsx`, `components/BrewTimer.tsx`, `utils/brew-station.helpers.ts`, `src/i18n/locales/es/ui.json`.
- **Sin cambios** en `src/domain/` ni en el esquema de `storage.adapter.ts` (se consume la API de C-13 tal cual).
- **Dependencias**: C-05, C-08, C-13 (completadas). Sin paquetes nuevos.
- **Governance**: MEDIO — implementar con checkpoints; persiste datos del usuario en `localStorage` mediante el adaptador existente.
