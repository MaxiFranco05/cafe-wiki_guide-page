# Proposal

## Why

El proyecto Cafetería Wiki & Guide Page requiere una base técnica sólida y un armazón visual interactivo que permita validar desde el primer día la experiencia de usuario en cocina y mesada. Actualmente no existe el andamiaje del proyecto en `src/`, lo que bloquea el desarrollo de los catálogos de métodos, el motor matemático de escalado y las vistas de preparación.

Implementar este cambio ahora establece la infraestructura de frontend con Vite 6, React 19, TypeScript estricto y Tailwind CSS v4 integrado con los tokens semánticos aprobados del Design System (`Revision: 3`, Modo Oscuro Único), además del enrutamiento SPA público, la inicialización consistente en modo oscuro de cocina (`[data-theme="dark"]`), la infraestructura `i18n` desacoplada y la suite de pruebas unitarias/componentes con Vitest.

## What Changes

- **Scaffolding de proyecto**: Configuración de `package.json`, `tsconfig.json`, `vite.config.ts` (con `@tailwindcss/vite`), integración CSS-first `@theme` en `src/index.css` y configuración de Vitest con Testing Library bajo TypeScript 5.6+ en modo estricto.
- **Estructura canónica de carpetas**: Creación de la arquitectura por capas según `knowledge-base/08_arquitectura_propuesta.md` (`src/domain/`, `src/data/`, `src/adapters/`, `src/features/{brewing,wiki,flavor-wheel}/`, `src/i18n/locales/es/`, `src/shared/`).
- **Integración de tokens del Design System (Revisión 3 — Modo Oscuro Único)**: Incorporación de `design-system/tokens.css`, `design-system/brand.js`, `design-system/assets/logo.svg` y las fotografías moody generadas localmente (`design-system/assets/photos/*.jpg` → `public/images/coffee/`) al flujo de compilación y estilos de Tailwind (`--bg-canvas: #120E0C`, `--bg-surface: #1B1512`, `--bg-dark-card: #16110E`, crema cálido `#F5ECE0`, acento cobre `#DF6B3E` y dorado `#DF9E52`, tipografía monoespaciada tabular, curvas táctiles y `@media (prefers-reduced-motion: reduce)`).
- **Componentes compartidos de AppShell (`src/shared/`)**:
  - `AppLayout`: Contenedor principal responsive en modo oscuro único con `min-h-[100dvh]` y soporte para safe areas móviles.
  - `TopNavbar`: Barra superior persistente con isotipo provisional SVG, nombre de marca dinámico vía binding `[data-brand-name="short"]` y navegación principal de escritorio (sin selector de modo claro).
  - `BottomTabBar`: Barra inferior fija para dispositivos móviles (`< 768px`) con objetivos táctiles mínimos de 44x44px, espacio generoso (no comprimido), 4 pestañas accesibles (`Métodos`, `Preparar`, `Wiki`, `Rueda SCA`) e iconografía SVG limpia sin emojis.
- **Enrutamiento SPA público**: Configuración de React Router con las 5 rutas canónicas públicas (`/`, `/brew/:methodSlug`, `/wiki`, `/wiki/:category/:entrySlug`, `/flavor-wheel`) y vista 404 de respaldo amigable ante rutas desconocidas o parámetros inválidos.
- **Infraestructura de Internacionalización (`i18n`)**: Módulo `src/i18n/index.ts` con diccionario tipado en español `src/i18n/locales/es/ui.json`, garantizando cero cadenas de texto visibles hardcodeadas en componentes (`RN-I18N-01`).
- **Configuración de Higiene y Testing**: Adición de `.atl/` a `.gitignore` y suite de tests en Vitest para renderizado del AppShell, inicialización en modo oscuro único, navegación entre rutas y resolución de cadenas de traducción.

## Capabilities

### New Capabilities
- `app-shell-and-foundation`: Establece el contenedor responsive de la aplicación (AppShell) en modo oscuro único de cocina, la navegación por rutas públicas (`/`, `/brew/:methodSlug`, `/wiki`, `/wiki/:category/:entrySlug`, `/flavor-wheel`), la resolución de cadenas `i18n` y la página de error 404 amigable.

### Modified Capabilities
<!-- No modified capabilities - this is the first change in the system -->

## Impact

- **Código fuente**: Crea el esqueleto base en `src/` y archivos de configuración en la raíz del proyecto (`package.json`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`).
- **Dependencias**: Incorpora `react`, `react-dom`, `react-router`, `tailwindcss`, `zod` y como dependencias de desarrollo `vite`, `vitest`, `@testing-library/react`, `typescript`, `@types/react`.
- **Rutas y APIs**: Establece las 5 rutas cliente públicas descritas en `knowledge-base/03_actores_y_roles.md`.
- **Identidad visual**: Aplica formalmente `design-system/tokens.css` y `design-system/assets/logo.svg` respetando la política `system-and-mockups`.
