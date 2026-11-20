# Mockups — C-11 `interactive-sca-flavor-wheel-ui`

- **Design system revision**: 4
- **Approval**: pending

## Archivos

- `flavor-wheel.html`: mockup interactivo único (desktop y mobile por media query a 768 px). Importa `design-system/tokens.css` y `design-system/brand.js`.
- `assets/wheel-data.js`: árbol real exportado de `FLAVOR_WHEEL_TREE` con nombres y notas en español y las fichas de `getWikiEntriesByFlavorNode` por nodo. Generado una vez con `vite-node`; no es fuente de verdad.
- `previews/`: capturas inspeccionadas.

## Pantallas y estados

| Estado | URL | Captura |
|---|---|---|
| Rueda completa + guía de cata (desktop) | `flavor-wheel.html` | `previews/c11-full-desktop-1440x900.png` |
| Descriptor con fichas, presencia y "Volver a Kenia" | `?node=fruity.berry.blackberry&from=origenes/kenya` | `previews/c11-descriptor-desktop-1440x900.png` |
| Subfamilia sin fichas (Ahumado y tueste intenso) | `?node=roasted.burnt` | `previews/c11-subfamily-empty-desktop-1440x900.png` |
| Guía ocultable + acordeón (mobile) | `flavor-wheel.html` a 390 px | `previews/c11-accordion-mobile-390x844.png` |
| Hoja inferior con descriptor y regreso (mobile) | `?node=fruity.berry.blackberry&from=origenes/kenya` a 390 px | `previews/c11-sheet-mobile-390x844.png` |

"Ocultar guía" se guarda en `localStorage` (`flavorWheel.guideDismissed`); para volver a verla, borrar esa clave.

Interacciones disponibles en el mockup: clic en segmentos, centro para volver, ruta del panel, chips de hijos, cerrar, teclado (flechas, Inicio/Fin, Enter, Escape) en la rueda.

## Cómo abrirlo

Los navegadores bloquean `file://` para rutas relativas al Design System, así que hay que servir la raíz del repo:

```powershell
python -m http.server 8731 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8731/openspec/changes/c-11-interactive-sca-flavor-wheel-ui/mockups/flavor-wheel.html`.

## Placeholders `(TBD)`

- Nombre de marca y logo: provisionales de `brand.js` / `assets/logo.svg`.
- La navbar y la barra inferior son simplificadas; la app usa su `AppLayout` real.
