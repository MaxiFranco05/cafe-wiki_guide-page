# Tasks — C-12 `pwa-offline-and-production-readiness`

> **Gate visual**: no iniciar la fase `apply` hasta que `design.md` → `## UI Mockups` registre `Approval: approved` para `mockups/pwa-status.html` y `mockups/previews/c12-*.png`.
> **Skills a cargar antes de codificar (Agente C)**: `pwa-development`, `vite`, `vercel-react-best-practices`, `tailwind-design-system`, `emil-design-eng`, `modern-web-guidance`, `vitest`, `playwright-cli`. Strict TDD: cada test unitario/integración se escribe y se ve fallar antes de implementar. Governance MEDIO.

## 1. Dependencia PWA, íconos, metadatos y optimización de assets

- [x] 1.1 Instalar `vite-plugin-pwa` compatible con Vite 6 como `devDependency` en `package.json`, agregar la declaración de tipos de `vite-plugin-pwa/client` en `src/vite-env.d.ts` y verificar que `npx tsc --noEmit` pasa sin errores
- [x] 1.2 Generar los íconos PNG reales en `public/icons/` (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png` con zona segura 80 % sobre `#160D08`, y `apple-touch-icon.png` de `180x180`) a partir del isotipo V60 del Design System, agregar `public/robots.txt` y actualizar `index.html` (`theme-color: #160D08`, `<meta name="description">`, `<link rel="apple-touch-icon">`); verificar que los archivos existen con las dimensiones esperadas
- [x] 1.3 Optimizar las 12 fotografías de `public/images/coffee/*.jpg` a JPEG progresivo (ancho máximo 1200 px, manteniendo exactamente sus nombres de archivo) para reducir su peso total de ~8.5 MB a < 2 MB; verificar que ninguna ruta cambia y `npx vitest run src/features/brewing/__tests__/method-card.mapper.test.ts` sigue pasando

## 2. Configuración `VitePWA` (Workbox), code-splitting por ruta y CSP en `vercel.json`

- [x] 2.1 Configurar `VitePWA` (`registerType: 'prompt'`, `manifestFilename: 'manifest.webmanifest'`, manifiesto `standalone`/`portrait`/`#160D08`, `globPatterns` con shell + fuentes `latin`/`latin-ext` `.woff2`, `navigateFallback: '/index.html'` con `navigateFallbackDenylist` y `runtimeCaching` `CacheFirst` acotado para `/images/coffee/`) y `build.rollupOptions.output.manualChunks` en `vite.config.ts`; verificar con `npm run build` que se emiten `dist/sw.js` y `dist/manifest.webmanifest`
- [x] 2.2 Aplicar carga diferida (`React.lazy` + `<Suspense>`) en `src/App.tsx` para `BrewStationView`, `WikiHomeView`, `WikiSectionView`, `WikiEntryDetailView`, `FlavorWheelView` y `NotFoundView` (dejando `HomeView` inmediata), manteniendo un fallback accesible sin saltos de layout; verificar con `npm run build` que ningún chunk JS supera 500 kB sin comprimir y que `npx vitest run src/shared/__tests__/AppLayout.test.tsx` pasa
- [x] 2.3 Agregar cabeceras de seguridad (`Content-Security-Policy` con `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) y `Cache-Control` (`no-cache` en `/sw.js` y `/manifest.webmanifest`; `immutable` en `/assets/*`) en `vercel.json` conservando el rewrite SPA; verificar con un test en `src/shared/__tests__/pwa-build.verify.test.ts` que valida `vercel.json`, `index.html` y los artefactos emitidos en `dist/` (`sw.js`, `manifest.webmanifest`, íconos y límite de chunks < 500 kB)

## 3. Adaptador PWA (`src/adapters/pwa.adapter.ts`) e i18n

- [x] 3.1 Agregar las claves `pwa.*` en `src/i18n/locales/es/ui.json` (estado sin conexión, lista offline, nueva versión disponible, botones "Actualizar" / "Después" / "Cerrar aviso", aria-labels) sin emojis; verificar con `npx vitest run src/i18n` que la integridad del diccionario pasa
- [x] 3.2 **[TDD RED → GREEN → TRIANGULATE]** Crear `src/adapters/__tests__/pwa.adapter.test.ts` y luego implementar `src/adapters/pwa.adapter.ts` (`createPwaAdapter` con `registerSW` inyectable, escucha de eventos `online`/`offline`, `onOfflineReady`, `onNeedRefresh`, `applyUpdate` y degradación silenciosa cuando `navigator.serviceWorker` no existe o falla) más el stub de `virtual:pwa-register` para `vitest.config.ts`; verificar que todos los escenarios del adaptador pasan con `npx vitest run src/adapters/__tests__/pwa.adapter.test.ts`

## 4. Indicador discreto en `AppShell` (`usePwaStatus` y `PwaStatusToast`)

- [x] 4.1 **[TDD RED → GREEN → TRIANGULATE]** Crear `src/shared/__tests__/PwaStatusToast.test.tsx`, implementar `src/shared/hooks/usePwaStatus.ts` y `src/shared/components/PwaStatusToast.tsx` siguiendo el mockup aprobado (3 estados con prioridad `needRefresh > offline > offlineReady`, objetivos táctiles ≥ 44 px, íconos SVG inline, tokens de `tokens.css`, cero hex sueltos, cero emojis, `prefers-reduced-motion`) y montarlo en `src/shared/components/AppLayout.tsx`; verificar con `npx vitest run src/shared/__tests__/PwaStatusToast.test.tsx src/shared/__tests__/AppLayout.test.tsx`

## 5. Integración de los 4 flujos del MVP y verificación real offline

- [x] 5.1 Crear `src/features/__tests__/production-flows.integration.test.tsx` cubriendo extremo a extremo los 4 flujos principales (`Flujo 1`: Home → V60 → escalado bidireccional + advertencia de rango; `Flujo 2`: timer Iniciar → avance de fases → Pausar → Reanudar → Reiniciar; `Flujo 3`: Espresso → 18 g → Ristretto/Normale/Lungo; `Flujo 4`: Wiki → Kenia → Rueda SCA `?node=...&from=...` → Volver a Kenia → Preparar en 1 toque); verificar que `npx vitest run` y `npm run build` pasan con 0 errores
- [x] 5.2 Levantar `npm run preview`, verificar en navegador real (`playwright-cli`) que el Service Worker se registra y precachea, activar modo offline y navegar/recargar `/`, `/brew/v60`, `/wiki/origenes/kenya` y `/flavor-wheel` sin errores de red ni de consola, y capturar `PwaStatusToast` a `390×844` y `1440×900` en `openspec/changes/c-12-pwa-offline-and-production-readiness/mockups/verify/` registrando `Visual verify` en `design.md`

## Workflow follow-up

- Archivar con `/opsx:archive c-12-pwa-offline-and-production-readiness` y marcar `[x] [C-12]` en `CHANGES.md`.
- Incluir la tabla `Auditoría de Skills Utilizadas` y confirmar cierre de FASE 4 / MVP v1.0.
- Commit con Conventional Commits y push a `dev` solo con confirmación explícita del usuario.
