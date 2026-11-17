# Design

## Context

Véase `proposal.md` para la motivación general del cambio.
El proyecto arranca sin código fuente previo en `src/`, pero cuenta con una base de conocimiento completa (`knowledge-base/`) y un sistema de diseño aprobado (`design-system/README.md`, `Revision: 3`, `Mode: system-and-mockups`, Modo Oscuro Único).
El objetivo de este diseño técnico es definir cómo se estructura la aplicación base, cómo se integran los tokens de diseño, el sistema de enrutamiento SPA, la infraestructura `i18n` y los componentes compartidos del `AppShell`.

## Goals / Non-Goals

**Goals:**
- Configurar el entorno de compilación, empaquetado y tests con Vite 6, React 19, TypeScript estricto, Tailwind CSS v4 (`@tailwindcss/vite`) y Vitest.
- Implementar la arquitectura de capas canónica según `knowledge-base/08_arquitectura_propuesta.md`.
- Construir el contenedor `AppShell` (`AppLayout`, `TopNavbar`, `BottomTabBar`, `NotFoundView`) operando en modo oscuro único de cocina.
- Integrar `design-system/tokens.css` (Revisión 3) y las variables semánticas en Tailwind (`@theme`) sin valores hexadecimales sueltos en componentes.
- Garantizar accesibilidad táctil con objetivos mínimos de 44x44px (y botones apilados `w-full >= 48px`), feedback háptico/visual (`scale(0.97)`) y respeto a `@media (prefers-reduced-motion: reduce)`.
- Proporcionar infraestructura tipada para traducción en `src/i18n/` consumiendo `src/i18n/locales/es/ui.json`.

**Non-Goals:**
- Implementar los esquemas y lógica de recetas de los 6 métodos (reservado para `C-02`).
- Implementar la calculadora bidireccional y temporizador en vivo (reservado para `C-03`, `C-04`, `C-05`).
- Implementar la base de datos de la Wiki sensorial o la Rueda SCA interactiva (reservado para `C-08`, `C-09`).
- Configurar el Service Worker o manifiesto PWA final (reservado para `C-12`).

## Decisions

### 1. Enrutamiento SPA declarativo con Layout Routes
- **Decisión**: Utilizar `react-router` estructurado con una ruta raíz que renderiza `AppLayout` con `<Outlet />` para las vistas hijas.
- **Rutas configuradas**:
  - `/` → `HomeView` (Placeholder del selector de cafeteras)
  - `/brew/:methodSlug` → `BrewStationView` (Placeholder de la estación de preparación con validación básica de parámetro)
  - `/wiki` → `WikiIndexView` (Placeholder del catálogo de orígenes, varietales y procesos)
  - `/wiki/:category/:entrySlug` → `WikiEntryView` (Placeholder de ficha detallada)
  - `/flavor-wheel` → `FlavorWheelView` (Placeholder de la rueda SCA)
  - `*` → `NotFoundView` (Página 404 amigable con botón de retorno a `/`)
- **Alternativas consideradas**: Navegación basada en estado interno (`useState` o hash router). Se descartó porque `react-router` en modo SPA estándar permite URLs profundas requeridas para compartir recetas y fichas de wiki.

### 2. Integración de Tailwind CSS v4 con Design System Tokens (Revisión 3)
- **Decisión**: Utilizar `@tailwindcss/vite` (Tailwind v4 CSS-first) importando `design-system/tokens.css` en `src/index.css` y mapeando sus variables semánticas mediante `@theme`:
  - `colors`: `--color-canvas: var(--bg-canvas)` (`#120E0C` espresso profundo), `--color-surface: var(--bg-surface)` (`#1B1512`), `--color-elevated: var(--bg-elevated)` (`#281F1A`), `--color-dark-card: var(--bg-dark-card)` (`#16110E`), `--color-ink: var(--text-primary)` (`#F5ECE0`), `--color-ink-secondary: var(--text-secondary)` (`#C5B5A2`), `--color-accent: var(--accent-primary)` (`#DF6B3E`), `--color-gold: var(--accent-gold)` (`#DF9E52`), etc.
  - `assets`: Copiar las fotografías moody aprobadas (generadas localmente en `design-system/assets/photos/`) a `public/images/coffee/` para servirlas con ruta estable (`/images/coffee/*.jpg`) y dejarlas listas para precaché PWA en `C-12`.
  - `fontFamily`: `--font-sans` y `--font-mono`.
  - `transitionTimingFunction`: `--ease-out`.
- **Alternativas consideradas**: Replicar los colores hexadecimales en JavaScript con Tailwind v3 (`tailwind.config.js`). Se eligió CSS-first `@theme` de Tailwind v4 para consumir directamente `design-system/tokens.css` sin duplicación y evitar desfase de configuración.

### 3. Kitchen Mode Oscuro Único (Dark-Only)
- **Decisión**: Establecer el modo oscuro espresso profundo como tema único del sistema (`<html lang="es" data-theme="dark">`, `color-scheme: dark` en `tokens.css` Revisión 3), eliminando el modo claro beige y el control `ThemeToggle`. Para garantizar consistencia ante pruebas unitarias y consumidores de tokens, el arranque inicial asegura `document.documentElement.setAttribute('data-theme', 'dark')`.
- **Alternativas consideradas**: Mantener tema claro beige con toggle opcional. Se descartó explícitamente con el usuario porque la fotografía moody de baja exposición y alto contraste se integra de forma armónica únicamente sobre lienzo oscuro `#120E0C`.

### 4. Sistema de Internacionalización (`i18n`) Liviano y Tipado
- **Decisión**: Crear un módulo propio `src/i18n/index.ts` que carga `src/i18n/locales/es/ui.json` con una función `t(key, params)` tipada contra las claves del JSON.
- **Alternativas consideradas**: Instalar dependencias pesadas como `i18next` completo con plugins. Para el MVP v1.0 en español, un módulo tipado ligero de ~40 líneas elimina dependencias innecesarias, es determinístico en tests y cumple con creces `RN-I18N-01`.

### 5. Navegación Mobile-First y Touch Ergonomics
- **Decisión**:
  - En pantallas `< 768px`, la navegación principal reside en `BottomTabBar` fija al pie del viewport (`fixed bottom-0 left-0 right-0`), con 4 accesos directos: `Métodos` (`/`), `Preparar` (`/brew/v60`), `Wiki` (`/wiki`), `Rueda SCA` (`/flavor-wheel`).
  - Cada botón tiene un área táctil mínima de 44x44px, espacio generoso entre elementos, etiqueta legible y micro-interacción `.pressable` (`scale(0.97)`).
  - En tarjetas de acción y estación de preparación (especialmente en móvil), los botones primarios y secundarios (`Iniciar` / `Reiniciar`) se apilan verticalmente a ancho completo (`w-full`, mínimo `48px` de alto): acción principal sólida arriba (`--accent-primary`) y acción secundaria tintada suave abajo (`--accent-primary-soft` o dorado translúcido).
  - El layout móvil no se comprime: mantiene paddings de 16-24px y altura mínima de viewport de `100dvh` para evitar problemas con la barra de navegación del navegador en iOS y Android.
  - Cero emojis: iconografía vectorial SVG limpia con `stroke-width="1.75"` y `fill="none"`.

## UI Mockups

- **Design system revision**: 3 (from `design-system/README.md` — Modo Oscuro Único)
- **Decision**: yes (2026-11-16)
- **Mockups**: `openspec/changes/c-01-foundation-and-ui-shell/mockups/02-profesional-barismo.html`
- **Approval**: approved (2026-11-16, by user — Propuesta 2 Dark-Only: Profesional Fotográfico Moody)
- **Preview**: rendered (2026-11-16, `openspec/changes/c-01-foundation-and-ui-shell/mockups/previews/world2-dark-desktop-home.png`, `openspec/changes/c-01-foundation-and-ui-shell/mockups/previews/world2-dark-desktop-brew.png`, `openspec/changes/c-01-foundation-and-ui-shell/mockups/previews/world2-dark-mobile-home.png`, `openspec/changes/c-01-foundation-and-ui-shell/mockups/previews/world2-dark-mobile-brew.png`)

### Design Brief
- **Audience & Context**: Entusiastas del café y home baristas preparando café en la mesada de la cocina con el móvil en mano o consultando fichas en el escritorio.
- **Task**: Navegar fluidamente entre el catálogo visual de cafeteras, la estación de preparación, la wiki sensorial y la rueda de sabores dentro de una estética oscura cohesiva de baja fatiga visual y alto contraste.
- **Affected Screens & States**:
  - `TopNavbar` persistente (badge oscuro con isotipo provisional dorado de alto contraste, marca dinámica y links de navegación desktop).
  - `BottomTabBar` móvil (`< 768px`) con 4 ítems de navegación accesibles (`>= 44px`).
  - Vistas dentro del shell (`/` Home con hero de máquina comercial y tarjetas fotográficas moody, `/brew/:methodSlug` con estación dual calculadora + panel oscuro inmersivo y botones apilados `w-full`, `/wiki` con banner de granos moody, `/flavor-wheel` y fallback 404).
  - Estado único oscuro (`[data-theme="dark"]`, `--bg-canvas: #120E0C`, `--bg-surface: #1B1512`).
- **Responsive Viewports**:
  - Móvil: `390x844` con tarjetas en columna única, botones primarios/secundarios apilados `w-full` y respiración visual holgada.
  - Escritorio: `1440x900` con hero asimétrico, grilla de 3 columnas en `/` y panel dual en `/brew/:methodSlug`.
- **Tokens & Assets Used**:
  - `design-system/tokens.css` Revisión 3 (`--bg-canvas`, `--bg-surface`, `--bg-elevated`, `--bg-dark-card`, `--text-primary`, `--text-on-photo`, `--accent-primary`, `--accent-gold`).
  - `design-system/brand.js` (`data-brand-name="short"`).
  - `design-system/assets/logo.svg` y `design-system/assets/photos/{pro-machine,v60,espresso,immersion,beans}-moody.jpg`.

## Risks / Trade-offs

- **[Riesgo] Safe areas en móviles (iOS notch / home indicator)** → **Mitigación**: Añadir clases utilitarias de soporte para `env(safe-area-inset-bottom)` y `env(safe-area-inset-top)` en `AppLayout` y `BottomTabBar`.
- **[Riesgo] Destello blanco inicial antes de hidratar React** → **Mitigación**: Fijar `<html lang="es" data-theme="dark">` y `color-scheme: dark` directamente en `index.html` y en `:root` de `design-system/tokens.css`.
- **[Riesgo] Desfase en Safe-typing de parámetros en rutas dinámicas** → **Mitigación**: Validar los slugs contra una lista blanca o retornar la vista `NotFoundView` ante cualquier valor no reconocido.
