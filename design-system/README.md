# Design System — Cafetería Wiki & Guide Page

- **Mode:** `system-and-mockups`
- **Revision:** `3`
- **Approval:** `approved (2026-11-16, by user — Dark-Only Profesional Fotográfico Moody)`

## Propósito y Fuentes
Fundación visual portable del proyecto en **modo oscuro único (Dark-Only Moody Espresso)** para que toda la interfaz (`#120E0C` / `#1B1512`) se integre naturalmente con la fotografía oscura de baja exposición y saturación profunda (`design-system/assets/photos/*.jpg`), evitando el contraste brusco de fondos claros en cocina y garantizando lectura nítida con texto crema (`#F5ECE0`), cobre (`#DF6B3E`) y oro cálido (`#DF9E52`).

- **Fuentes de referencia**:
  - [discovery/discovery.md](../discovery/discovery.md)
  - [knowledge-base/01_vision_y_objetivos.md](../knowledge-base/01_vision_y_objetivos.md)
  - [knowledge-base/04_modelo_de_datos.md](../knowledge-base/04_modelo_de_datos.md)
  - [knowledge-base/05_reglas_de_negocio.md](../knowledge-base/05_reglas_de_negocio.md)
  - Mockup Dark-Only en `openspec/changes/c-01-foundation-and-ui-shell/mockups/02-profesional-barismo.html`

## Archivos del Sistema de Diseño
- `design-system/README.md`: Política visual (`system-and-mockups`), estado de aprobación y guía de reemplazo.
- `design-system/brand.md`: Reglas de identidad, tono visual (*Dark-Only Specialty Roastery & Moody Editorial*), fotografía generada y política cero emojis.
- `design-system/brand.js`: Constante única `BRAND_NAME` y binding automático para `[data-brand-name]`.
- `design-system/tokens.css`: Variables CSS Dark-Only (`#120E0C` canvas, `#1B1512` surface, `#281F1A` elevated, `#16110E` dark-card, acentos `#DF6B3E` / `#DF9E52`), paleta semántica de 9 anillos SCA, curvas `cubic-bezier` y `@media (prefers-reduced-motion: reduce)`.
- `design-system/assets/logo.svg`: Isotipo vectorial V60 con etiqueta explícita `PROVISIONAL`.
- `design-system/assets/photos/*.jpg`: 5 fotografías generadas localmente en la sesión (`pro-machine-moody.jpg`, `v60-moody.jpg`, `espresso-moody.jpg`, `immersion-moody.jpg`, `beans-moody.jpg`).

## Decisiones Abiertas `(TBD)` y Pasos Exactos de Reemplazo

1. **Nombre definitivo de la marca `(TBD)`**: Editar `BRAND_NAME` y `BRAND_SHORT` en `design-system/brand.js`.
2. **Logotipo definitivo `(TBD)`**: Reemplazar `design-system/assets/logo.svg` manteniendo el contenedor `#16110E` y contraste claro sobre oscuro.
3. **Ajustes de paleta o fotos**: Editar `:root` en `design-system/tokens.css` o reemplazar `design-system/assets/photos/*.jpg`, incrementar `Revision:` en este `README.md` y re-renderizar los mockups afectados.
