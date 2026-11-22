# Mockups — C-12 `pwa-offline-and-production-readiness`

- **Design system revision**: 5
- **Approval**: approved (2026-11-20, by user)

## Archivos

- `pwa-status.html`: mockup interactivo del componente `PwaStatusToast` integrado sobre `AppShell` (desktop y mobile con breakpoint 768 px). Consume `design-system/tokens.css` y `design-system/brand.js`.
- `previews/`: capturas renderizadas en `390×844` y `1440×900`.

## Pantallas y estados

| Estado | URL | Captura |
|---|---|---|
| Sin conexión (desktop) | `pwa-status.html?state=offline` | `previews/c12-offline-desktop-1440x900.png` |
| Nueva versión disponible (desktop) | `pwa-status.html?state=update` | `previews/c12-update-desktop-1440x900.png` |
| Sin conexión sobre barra móvil (mobile) | `pwa-status.html?state=offline` a 390 px | `previews/c12-offline-mobile-390x844.png` |
| Lista para usar sin conexión (mobile) | `pwa-status.html?state=offline-ready` a 390 px | `previews/c12-offline-ready-mobile-390x844.png` |
| Nueva versión disponible (mobile) | `pwa-status.html?state=update` a 390 px | `previews/c12-update-mobile-390x844.png` |

## Cómo abrirlo

```powershell
python -m http.server 8732 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8732/openspec/changes/c-12-pwa-offline-and-production-readiness/mockups/pwa-status.html`.

## Placeholders `(TBD)`

- Nombre de marca y logo provisionales de `design-system/brand.js` y `design-system/assets/logo.svg`.
- La barra superior, la estación simulada y la barra inferior son de contexto; la implementación real se monta dentro de `AppLayout.tsx`.
