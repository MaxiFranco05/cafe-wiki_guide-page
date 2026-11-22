# Proposal

## Why

La aplicación ya cuenta con los 6 métodos, la calculadora bidireccional, el temporizador paso a paso con escena SVG y Modo Cocina, la Wiki de 5 secciones y la Rueda de Sabores SCA, pero hoy no funciona sin conexión, no es instalable como PWA, empaqueta todo el JavaScript en un único chunk de ~765 kB (por encima del umbral de 500 kB de Vite), sirve fotos de 620–790 kB sin compresión web y carece de cabeceras CSP/caché en producción. Este change cierra el MVP v1.0 (`US-008`) empaquetando la app como PWA offline-first y dejándola lista para producción móvil.

## What Changes

- **Service Worker y precaché offline (`vite-plugin-pwa` / Workbox `generateSW`)**: generación de `sw.js` con precaché del shell SPA, rutas diferidas, íconos, SVG, diccionarios y fuentes latinas `.woff2`, más caché en runtime acotada (`CacheFirst` con expiración) para las fotos de `/images/coffee/*` y fallback de navegación SPA (`/index.html`) para rutas profundas sin conexión.
- **Manifiesto e íconos PWA (`manifest.webmanifest`)**: metadatos `standalone`, `orientation: portrait`, `lang: es`, colores sincronizados con `--bg-canvas` (`#160D08`) de `design-system/tokens.css` Rev 4/5 (corrigiendo también el `<meta name="theme-color">` en `index.html`), íconos `192x192`, `512x512`, `512x512` `maskable` y `apple-touch-icon` (`180x180`) en `public/icons/`, además de `public/robots.txt`.
- **Adaptador PWA y aviso discreto en `AppShell` (`src/adapters/pwa.adapter.ts` + `PwaStatusToast.tsx`)**: estrategia de actualización `registerType: 'prompt'` para no interrumpir nunca un temporizador de cocina activo; aviso accesible en español para estado sin conexión (`offline`), primera disponibilidad offline (`offlineReady`) y nueva versión disponible (`needRefresh` con acción manual "Actualizar").
- **Code-splitting por ruta y optimización de assets**: carga diferida (`React.lazy` + `Suspense`) de las vistas secundarias en `src/App.tsx`, particionado `manualChunks` en `vite.config.ts` para eliminar el chunk monolítico de 765 kB, y optimización de peso de las 12 fotografías de `public/images/coffee/` conservando sus rutas.
- **Cabeceras de seguridad (CSP) y caché en `vercel.json`**: política `Content-Security-Policy` estricta basada en `default-src 'self'` (permitiendo únicamente `'unsafe-inline'` en `style-src` para los estilos dinámicos de React/SVG), cabeceras de endurecimiento (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) y políticas `Cache-Control` diferenciadas para `sw.js`, `manifest.webmanifest` y `/assets/*`.
- **Verificación integral de producción**: tests unitarios del adaptador y toast PWA, suite de integración de los 4 flujos principales (`Flujo 1` a `Flujo 4`), validación automatizada de artefactos de build (`dist/sw.js`, `dist/manifest.webmanifest`, límites de tamaño) y prueba real de navegación offline en `vite preview`.

## Capabilities

### New Capabilities
- `pwa-offline-and-production-readiness`: empaquetado PWA instalable y offline-first (Service Worker, manifiesto, íconos, aviso discreto de estado/actualización sin interrumpir timers), code-splitting por ruta, cabeceras de seguridad CSP/caché en hosting estático y verificación integral de los 4 flujos del MVP.

### Modified Capabilities
<!-- Ninguna: las capacidades funcionales existentes (brewing, wiki, rueda SCA, AppShell base) conservan todos sus requisitos y contratos actuales. -->

## Impact

- **Dependencias nuevas**: `vite-plugin-pwa` (devDependency compatible con Vite 6).
- **Código nuevo**: `src/adapters/pwa.adapter.ts`, `src/shared/hooks/usePwaStatus.ts`, `src/shared/components/PwaStatusToast.tsx`, `public/icons/*`, `public/robots.txt`, tests en `src/adapters/__tests__/pwa.adapter.test.ts`, `src/shared/__tests__/PwaStatusToast.test.tsx`, `src/features/__tests__/production-flows.integration.test.tsx` y `src/shared/__tests__/pwa-build.verify.test.ts`.
- **Código y configuración modificados**: `package.json`, `vite.config.ts`, `index.html`, `vercel.json`, `src/App.tsx`, `src/shared/components/AppLayout.tsx`, `src/i18n/locales/es/ui.json`, `src/vite-env.d.ts`, `public/images/coffee/*.jpg`.
- **Impacto visual**: agrega un toast/indicador discreto en `AppShell` → requiere mockup responsive (`390×844` y `1440×900`) aprobado antes de `apply` (`visual_design.mode = "system-and-mockups"`, Design System Rev 5).
- **Governance**: MEDIO.
