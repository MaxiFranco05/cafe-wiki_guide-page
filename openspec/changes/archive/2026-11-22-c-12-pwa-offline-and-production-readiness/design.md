# Design — C-12 `pwa-offline-and-production-readiness`

## UI Mockups

- **Design system revision**: 5 (`design-system/README.md`, aprobado 2026-11-17; coincide con `visual_design.revision: 5` y `mode: system-and-mockups` en `.active-orchestrator-state.json`).
- **Decision**: yes (2026-11-20) — este change incorpora `PwaStatusToast` en `AppShell` (`AppLayout.tsx`).
- **Mockups**: `openspec/changes/c-12-pwa-offline-and-production-readiness/mockups/pwa-status.html` (interactivo para los 3 estados: `offline`, `offline-ready`, `update`) + `mockups/README.md`.
- **Approval**: approved (2026-11-20, by user — al iniciar `/openspec-apply-change c-12-pwa-offline-and-production-readiness`)
- **Criterio de aceptación**: `mockups/pwa-status.html` + `mockups/previews/c12-*.png` (`390×844` y `1440×900`, cero hex sueltos, cero emojis, íconos SVG inline, sin solapar la barra inferior móvil ni reiniciar el temporizador).
- **Preview**: rendered (2026-11-20, Playwright vía `http://127.0.0.1:8732`, 5 capturas inspeccionadas en `mockups/previews/`: `c12-offline-desktop-1440x900.png`, `c12-update-desktop-1440x900.png`, `c12-offline-mobile-390x844.png`, `c12-offline-ready-mobile-390x844.png`, `c12-update-mobile-390x844.png`; único error de consola: `favicon.ico` 404 del servidor estático Python).
- **Visual verify**: passed (2026-11-20 — app compilada en `vite preview` `http://127.0.0.1:4173` vs. mockup aprobado; capturas en `mockups/verify/`: `c12-verify-offline-ready-desktop-1440x900.png`, `c12-verify-offline-home-desktop-1440x900.png`, `c12-verify-offline-brew-mobile-390x844.png`; 0 errores de consola y 0 imágenes rotas en modo offline).
  - **Corregido durante verify (major)**: al pasar a offline inmediatamente tras la primera carga, las 5 fotos de `/` aparecían rotas porque el SW aún no controlaba la primera descarga y `images/coffee/**` estaba excluido del precaché. Dado que la optimización redujo las 12 fotos de `8.11 MB` a `0.93 MB`, se incluyó `jpg` en `globPatterns` (60 entradas totales, `2.00 MB` precacheados): tras el ajuste, recargar `/` y navegar a `/brew/v60`, `/wiki/origenes/kenya` y `/flavor-wheel` en modo offline carga con `brokenImgs: []` y 0 errores de consola.
  - Revisado `PwaStatusToast` en `1440×900` (estados `offline-ready` y `offline`) y `390×844` (estado `offline` sobre `BrewStationView` sin solapar `BottomTabBar`).

## Context

Ver `proposal.md` (Why). Estado observado en el repositorio al planificar:

- `vite.config.ts` usa Vite 6 (`tailwindcss()`, `react()`) con `__APP_VERSION__` y alias `@`, sin `vite-plugin-pwa` ni `manualChunks`.
- `npm run build` emite un único bundle `dist/assets/index-*.js` de **765.27 kB** (gzip 203.21 kB), disparando la advertencia de chunk > 500 kB, más 42 archivos de fuentes `@fontsource` (incluidos subconjuntos `cyrillic` y `vietnamese` que no se usan en español).
- `src/App.tsx` importa de forma estática `HomeView`, `BrewStationView`, `WikiHomeView`, `WikiSectionView`, `WikiEntryDetailView`, `FlavorWheelView` y `NotFoundView`.
- `index.html` tiene `<meta name="theme-color" content="#120E0C" />` (Rev 1–3, desfasado respecto a `--bg-canvas: #160D08` de `design-system/tokens.css` Rev 4/5) y carece de `<meta name="description">`, `apple-touch-icon` y enlace al manifiesto.
- `public/images/coffee/` contiene 12 fotografías `.jpg` de 622–790 kB cada una (~8.5 MB en total), referenciadas por ruta fija `/images/coffee/*.jpg` en `brew-station.helpers.ts`, `HomeMethodSelectorView.tsx`, `WikiHomeView.tsx`, `BrewerPhoto.tsx` y `method-card.mapper.test.ts`.
- `vercel.json` ya declara el rewrite SPA `/(.*) → /index.html`, pero sin cabeceras `Content-Security-Policy`, endurecimiento ni `Cache-Control`.
- `src/adapters/` encapsula todas las Web APIs (`wake-lock`, `web-audio`, `storage`), manteniendo `src/domain/` 100 % puro.

## Goals / Non-Goals

**Goals:**
- Instalar y operar la app 100 % sin conexión en todas sus rutas públicas (`/`, `/brew/:methodSlug`, `/wiki`, `/wiki/:section`, `/wiki/:section/:entrySlug`, `/flavor-wheel`) tras la primera visita (`US-008`).
- Garantizar que las actualizaciones del Service Worker nunca recarguen la página a mitad de un temporizador de cocina.
- Reducir el bundle inicial eliminando el chunk monolítico > 500 kB y recortar drásticamente el peso de las 12 fotos estáticas sin romper rutas ni tests existentes.
- Dejar `vercel.json` con CSP estricta (`default-src 'self'`), endurecimiento y caché diferenciada, validada junto con una suite de integración de los 4 flujos principales del MVP.

**Non-Goals:**
- Notificaciones Push, Background Sync o Share Target (no hay backend en v1.0).
- Banner intrusivo personalizado de `beforeinstallprompt` (el navegador móvil/desktop ya ofrece instalar al cumplir los 3 pilares PWA).
- Cambiar `design-system/tokens.css` (no requiere bump de revisión del Design System).
- Reemplazar las fotos por un pipeline externo/CDN: todo sigue servido localmente desde el mismo origen (`'self'`).

## Decisions

### D1. `vite-plugin-pwa` con Workbox `generateSW` y `registerType: 'prompt'`
- **Elección**: instalar `vite-plugin-pwa` (versión compatible con Vite 6, `^0.21.x` o `^1.x` con peer `vite >= 6`) en `vite.config.ts`, estrategia `generateSW`, `registerType: 'prompt'`, `manifestFilename: 'manifest.webmanifest'`.
- **Por qué `prompt` y no `autoUpdate`**: con `autoUpdate` y `skipWaiting()` + recarga automática, una nueva versión desplegada mientras el usuario vierte agua en V60 podría recargar la pestaña y destruir el temporizador activo y el `Wake Lock`. Con `prompt`, el nuevo SW espera hasta que el usuario toque **"Actualizar"** en `PwaStatusToast`.
- **Precaché selectivo (`globPatterns`)**: precachear `**/*.{js,css,html,svg,png,ico,webmanifest}` más fuentes `**/*-latin-*.woff2` (evitando precachear `cyrillic`/`vietnamese` ni los `.jpg` pesados de `/images/coffee/`). Configurar `navigateFallback: '/index.html'` y `navigateFallbackDenylist: [/^\/images\//, /^\/icons\//, /\.[a-z0-9]+$/i]` para que cualquier ruta SPA profunda funcione offline sin interceptar archivos estáticos inexistentes.
- **Runtime caching acotado**: ruta `CacheFirst` para `/images/coffee/.*\.(?:jpg|jpeg|webp)$` con `cacheName: 'coffee-photos-v1'`, `CacheableResponsePlugin({ statuses: [0, 200] })` y `ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 })`.
- *Alternativa descartada*: `injectManifest` manual — innecesario porque no hay Push ni Background Sync; `generateSW` mantiene el hash de precaché sincronizado automáticamente con cada build de Vite.

### D2. Manifiesto e íconos PNG generados en `public/icons/`
- **Elección**: declarar el manifiesto en `VitePWA({ manifest: { ... } })` para que el plugin genere `dist/manifest.webmanifest` e inyecte automáticamente `<link rel="manifest" href="/manifest.webmanifest">` en `dist/index.html`, con:
  - `name`: `"Atelier Brew — Cafetería Wiki & Guide"`, `short_name`: `"Atelier Brew"`, `lang`: `"es"`, `dir`: `"ltr"`, `start_url`: `"/"`, `scope`: `"/"`, `display`: `"standalone"`, `orientation`: `"portrait"`.
  - `background_color`: `"#160D08"`, `theme_color`: `"#160D08"` (sincronizado con `--bg-canvas` en `tokens.css` Rev 4/5 y `<meta name="theme-color" content="#160D08">` en `index.html`).
  - Íconos en `public/icons/`: `icon-192.png` (`192x192`, `purpose: "any"`), `icon-512.png` (`512x512`, `purpose: "any"`), `icon-512-maskable.png` (`512x512`, `purpose: "maskable"`, con el isotipo V60 centrado dentro de la zona segura del 80 % sobre `#160D08`) y `apple-touch-icon.png` (`180x180`, enlazado en `index.html`).
  - `public/robots.txt` básico (`User-agent: *` / `Allow: /`).
- *Alternativa descartada*: referenciar solo `logo.svg` en el manifiesto — Chrome Android e iOS exigen PNGs de `192x192`, `512x512` y `180x180` para el criterio de instalabilidad y splash screen.

### D3. Adaptador imperativo `src/adapters/pwa.adapter.ts` + hook `usePwaStatus`
- **Elección**: encapsular `navigator.onLine`, eventos `window.addEventListener('online' | 'offline')` y el registro de `virtual:pwa-register` en `src/adapters/pwa.adapter.ts` mediante una fábrica inyectable (`createPwaAdapter(deps?)`), siguiendo el mismo patrón de `storage.adapter.ts` y `wake-lock.adapter.ts`.
  - Si `'serviceWorker' in navigator` es falso o el registro falla (ej. navegación privada restrictiva o entorno jsdom en tests), degrada silenciosamente sin lanzar excepciones.
  - En `vitest.config.ts` (o alias de test), resolver `virtual:pwa-register` a un stub inerte si es importado, y permitir inyectar `registerSW` en los tests unitarios del adaptador.
- **Hook `src/shared/hooks/usePwaStatus.ts`**: expone `{ isOnline, offlineReady, needRefresh, dismissOfflineReady, dismissUpdate, applyUpdate }` consumido únicamente por `PwaStatusToast`.

### D4. `PwaStatusToast.tsx` en `AppLayout.tsx` (prioridad y accesibilidad)
- **Elección**: montar `<PwaStatusToast />` dentro de `AppLayout.tsx` (portal o contenedor fijo con `z-60`, `pointer-events-none` en el wrapper y `pointer-events-auto` en la tarjeta), ubicado en `bottom: calc(68px + 12px + env(safe-area-inset-bottom))` en mobile (`< 768px`) y `bottom: 24px; right: 24px` en desktop (`>= 768px`), sin superponer `BottomTabBar` (`z-50`, 68 px).
- **Prioridad de estado visible** (máximo 1 tarjeta a la vez para evitar ruido visual en mesada):
  1. `needRefresh` (si no fue pospuesto en esta sesión): "Nueva versión disponible" + botones **"Actualizar"** y **"Después"** (≥ 44 px de alto).
  2. `!isOnline`: "Sin conexión · Modo offline activo" (se oculta automáticamente al volver `online`).
  3. `offlineReady` (descartable con botón cerrar de 44×44 px): "Lista para usar sin conexión".
- **i18n y tokens**: todas las cadenas bajo `pwa.*` en `src/i18n/locales/es/ui.json`, cero emojis, íconos SVG inline, tokens exclusivos de `design-system/tokens.css`, transición solo en `transform` y `opacity` respetando `prefers-reduced-motion`.

### D5. Code-splitting por ruta y optimización de imágenes
- **Elección en `src/App.tsx`**: mantener `HomeView` en el chunk inicial (ruta `/` sin flash de carga) y cargar con `React.lazy` + `<Suspense fallback={<RouteLoadingFallback />}>`:
  - `BrewStationView`
  - `WikiHomeView`, `WikiSectionView`, `WikiEntryDetailView`
  - `FlavorWheelView`
  - `NotFoundView`
- **Elección en `vite.config.ts` (`build.rollupOptions.output.manualChunks`)**: separar dependencias base (`vendor-react`: `react`, `react-dom`, `react-router`; `vendor-zod`: `zod`) para que ningún chunk JS supere 500 kB sin comprimir y maximizar la reutilización de caché entre despliegues.
- **Optimización de fotos (`public/images/coffee/*.jpg`)**: recomprimir las 12 fotografías a JPEG progresivo optimizado (ancho máximo 1200 px, calidad ~78–82) manteniendo exactamente los mismos nombres de archivo `.jpg` para no romper `brew-station.helpers.ts`, `BrewerPhoto.tsx` ni `method-card.mapper.test.ts` (reduciendo ~8.5 MB a ~1–1.5 MB en total).
- *Alternativa descartada*: renombrar todas las referencias a `.webp` — obligaría a modificar `method-card.mapper.test.ts` y múltiples componentes de features ya cerrados por una ganancia marginal frente a JPEG progresivo optimizado + caché `CacheFirst`.

### D6. Seguridad (CSP) y caché de producción en `vercel.json`
- **Elección**: conservar el rewrite SPA `/(.*) → /index.html` y añadir `headers`:
  - Ruta `/(.*)`:
    - `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
    - `X-Content-Type-Options`: `nosniff`
    - `Referrer-Policy`: `strict-origin-when-cross-origin`
    - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`
  - Ruta `/sw.js` y `/manifest.webmanifest`: `Cache-Control: no-cache, must-revalidate` (evita que proxies/navegadores sirvan un SW viejo indefinidamente).
  - Ruta `/assets/(.*)`: `Cache-Control: public, max-age=31536000, immutable` (hashes de Vite).
- **Por qué `'unsafe-inline'` solo en `style-src`**: React aplica atributos `style={{ ... }}` en `ProceduralBrewScene`, `SunburstFlavorWheelSvg` (`color-mix` dinámico por nodo) y `SensoryWheel`. `script-src` permanece estrictamente en `'self'` (no hay scripts inline en `index.html`; `/brand.js` es archivo externo del mismo origen).

### D7. Suite integral de los 4 flujos principales y verificación de build
- **Elección**:
  1. `src/features/__tests__/production-flows.integration.test.tsx`: prueba los 4 flujos de `knowledge-base/07_flujos_principales.md` sobre `AppRoutes` con `MemoryRouter` (respetando `Suspense` con `findBy*`):
     - **Flujo 1**: `/` → click V60 → escalar café/agua bidireccionalmente → disparar y limpiar advertencia de rango físico.
     - **Flujo 2**: `/brew/v60` → Iniciar temporizador → avance de fases con reloj simulado → Pausar → Reanudar → Reiniciar.
     - **Flujo 3**: `/brew/espresso` → dosis `18 g` → Ristretto (`27 g`), Normale (`36 g`), Lungo (`54 g`) → seleccionar estilo.
     - **Flujo 4**: `/wiki` → Orígenes → Kenia → chip de sabor Mora → `/flavor-wheel?node=fruity.berry.blackberry&from=origenes/kenya` → "Volver a Kenia" → CTA "Preparar en..." hacia `/brew/...`.
  2. `src/shared/__tests__/pwa-build.verify.test.ts` (o test condicional tras `npm run build` + validación permanente de `vercel.json` e `index.html`): valida la estructura de `vercel.json` (CSP + rewrite SPA + `no-cache` en `/sw.js`), `index.html` (`theme-color`, `apple-touch-icon`, sin scripts inline) y, cuando `dist/` existe, la presencia y validez JSON de `dist/manifest.webmanifest`, `dist/sw.js`, íconos y tamaño de chunks JS < 500 kB.
  3. Verificación real con `vite preview` + `playwright-cli`: navegación en modo offline (`offline` real en navegador), 0 errores de consola/CSP y capturas de `PwaStatusToast` en `mockups/verify/`.

## Risks / Trade-offs

- [Las rutas `React.lazy` hacen que tests existentes de `AppLayout.test.tsx` que renderizan `/brew/v60`, `/wiki` o `/flavor-wheel` esperen el chunk asíncrono] → usar `findBy*` donde falte o precargar/resolver en `Suspense` y verificar que los 59 archivos de test actuales siguen 100 % en verde tras activar `React.lazy`.
- [`virtual:pwa-register` no existe en Vitest sin configuración] → declarar alias o mock seguro en `vitest.config.ts` / `pwa.adapter.ts` para que todos los tests unitarios corran sin depender de build PWA.
- [`vite-plugin-pwa` versión y compatibilidad con Vite 6] → verificar al instalar que la versión elegida soporta `vite@^6.0.0` sin conflictos de peer dependencies.
- [Fotos en `public/images/coffee/` no precacheadas en la primera visita si el usuario nunca abrió esas tarjetas antes de cortar internet] → las fotos ya visitadas se sirven desde `coffee-photos-v1` (`CacheFirst`), y las no visitadas degradan sin romper la app porque el texto, los SVG de cafeteras y todos los catálogos sí están 100 % precacheados.
- [CSP `style-src 'self' 'unsafe-inline'` es necesaria para estilos inline de React/SVG] → `script-src` y `default-src` siguen estrictamente en `'self'`, bloqueando cualquier ejecución de scripts de terceros o inline.

## Migration Plan

Cambio aditivo sobre el despliegue estático actual en Vercel (sin migración de datos de usuario; `localStorage` permanece intacto). Para revertir, quitar `VitePWA` de `vite.config.ts`, revertir `React.lazy` en `src/App.tsx`, quitar `<PwaStatusToast />` de `AppLayout.tsx` y volver `vercel.json` al rewrite simple. Si ya se hubiera registrado un Service Worker en clientes previos, un rollback en producción requiere servir un SW mínimo de auto-desregistro temporal.
