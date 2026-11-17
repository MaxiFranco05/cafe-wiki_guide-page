# Tasks

## 1. Project Scaffolding & Design System Integration

- [x] 1.1 Configurar higiene del repositorio asegurando que `.gitignore` incluya `.atl/`, `node_modules/` y `dist/`, y verificar estado con `git check-ignore .atl/`
- [x] 1.2 Inicializar `package.json`, `tsconfig.json`, `vite.config.ts` y dependencias base (`react`, `react-dom`, `react-router`, `tailwindcss`, `@tailwindcss/vite`, `zod`, `vitest`, `@testing-library/react`), verificando chequeo estricto de tipos con `npx tsc --noEmit`
- [x] 1.3 Configurar Tailwind CSS v4 (`@tailwindcss/vite`) mapeando las variables de `design-system/tokens.css` (Revisión 3 — Modo Oscuro Único: `#120E0C`, `#1B1512`, `--bg-dark-card`, `--accent-primary`, `--accent-gold`), copiar las fotografías moody aprobadas de `design-system/assets/photos/` a `public/images/coffee/`, e importar `tokens.css` y `brand.js` en `src/index.css` e `index.html` con `<html lang="es" data-theme="dark">`

## 2. i18n Infrastructure (Strict TDD)

- [x] 2.1 [TDD RED] Escribir test unitario en `src/i18n/__tests__/i18n.test.ts` que describa la resolución de claves de navegación y placeholders, verificando que falle antes de la implementación
- [x] 2.2 [TDD GREEN] Implementar diccionario `src/i18n/locales/es/ui.json` y función `t()` tipada en `src/i18n/index.ts` para que pase el test inicial
- [x] 2.3 [TDD TRIANGULATE & REFACTOR] Agregar casos de prueba para fallback de claves desconocidas y formateo de parámetros, asegurar paso en verde y refactorizar sin duplicación

## 3. Dark-Only Root Theme Initialization (Strict TDD)

- [x] 3.1 [TDD RED] Escribir test en `src/shared/__tests__/darkThemeInit.test.ts` que describa la inicialización obligatoria del atributo `data-theme="dark"` en `document.documentElement` y ausencia de selector claro/oscuro, verificando que falle
- [x] 3.2 [TDD GREEN] Implementar `initDarkTheme()` en `src/shared/theme/initDarkTheme.ts` y llamarla en el arranque (`src/main.tsx`) e `index.html` para pasar el test
- [x] 3.3 [TDD TRIANGULATE & REFACTOR] Agregar casos idempotentes y de limpieza de atributos previos, confirmar estilo CSS-first sin valores hexadecimales sueltos y verificar suite en verde

## 4. Navigation & AppShell Components (Strict TDD)

- [x] 4.1 [TDD RED] Escribir tests en `src/shared/__tests__/TopNavbar.test.tsx` y `src/shared/__tests__/BottomTabBar.test.tsx` verificando renderizado responsive, touch targets de al menos 44x44px, iconografía SVG pura e integración con `data-brand-name`
- [x] 4.2 [TDD GREEN] Implementar `TopNavbar.tsx` y `BottomTabBar.tsx` con 4 pestañas accesibles (`Métodos`, `Preparar`, `Wiki`, `Rueda SCA`) consumiendo claves `i18n` para pasar los tests
- [x] 4.3 [TDD TRIANGULATE & REFACTOR] Validar espaciado generoso móvil (no comprimido), feedback táctil `scale(0.97)`, clases de reducción de movimiento y confirmar suite en verde

## 5. Router & AppLayout Integration (Strict TDD)

- [x] 5.1 [TDD RED] Escribir tests de integración en `src/shared/__tests__/AppLayout.test.tsx` validando renderizado de las 5 rutas públicas (`/`, `/brew/:methodSlug`, `/wiki`, `/wiki/:category/:entrySlug`, `/flavor-wheel`) y ruta 404
- [x] 5.2 [TDD GREEN] Implementar `AppLayout.tsx`, vistas placeholder en `src/features/` y `src/shared/components/NotFoundView.tsx` conectadas con React Router para pasar los tests
- [x] 5.3 [TDD TRIANGULATE & REFACTOR] Agregar casos de navegación entre rutas manteniendo `data-theme="dark"` y enlaces de recuperación en 404, refactorizar manteniendo estricta separación de capas

## 6. System Verification & Visual Alignment

- [x] 6.1 Ejecutar suite completa de tests con Vitest (`npx vitest run`) y chequeo de tipos estricto (`npx tsc --noEmit`), verificando 100% de pruebas en verde y cero errores de TypeScript
- [x] 6.2 Verificar correspondencia visual y táctil del `AppShell` en modo oscuro único, tarjetas fotográficas moody y acciones apiladas `w-full` contra el UI Mockup aprobado en `openspec/changes/c-01-foundation-and-ui-shell/mockups/02-profesional-barismo.html`

## Workflow follow-up

- Mockup y Design System Revisión 3 (Dark-Only) aprobados; listo para implementar con `/openspec-apply-change c-01-foundation-and-ui-shell`.
- Sincronizar specs y archivar el cambio una vez completada y validada la implementación.
