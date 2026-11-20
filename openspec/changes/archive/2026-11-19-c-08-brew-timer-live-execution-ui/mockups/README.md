# Mockups — C-08 `brew-timer-live-execution-ui` (v2 interactivo)

- **Design system revision**: 4
- **Approval**: approved (2026-11-19, by user) — variante **B** con ajustes (cafetera más grande, drenaje sin vaciar la jarra, orden mobile original). Capturas finales: `previews/c08-B-final-*`.

## Qué cambió respecto de v1

v1 era una maqueta estática simplificada (capturas en `previews/v1/`). Tras la revisión del usuario (2026-11-19: "más detallado y parecido al diseño actual, ver el ciclo, más jerarquía y contraste, se ve plano con todo marrón"), v2:

- Usa el **markup y CSS reales de la app**: `assets/c08-app-snapshot.css` (Tailwind compilado de `src/index.css`) y `assets/c08-app-snapshot.js` (SSR de `BrewStationView` + `ProceduralBrewScene` y recetas escaladas reales de V60 y Espresso). Solo el panel derecho es nuevo.
- Tiene el **ciclo funcionando**: Iniciar → fases → Pausar → Reanudar → saltar fase → Completar → Nueva preparación → Reiniciar, con reloj por delta de `performance.now()` (tope 100 ms), escena SVG real con nivel interpolado, pulsos 3-2-1 y tono de fase reales (Web Audio), Wake Lock real si el navegador lo soporta, mute persistido, receta bloqueada y fila activa del cronograma sincronizada.
- Ofrece **3 variantes** de jerarquía y contraste.

## Variantes

| | Idea | Jerarquía | Contraste fuera del marrón |
|---|---|---|---|
| **A — Continuidad** | El panel actual, reorganizado | Cuenta regresiva de fase grande, total secundario, barra cobre→oro, tarjeta elevada con filete dorado | Franja de estado (verde en curso / ámbar pausado / oro lista), gramos de agua en azul, badge verde "Pantalla activa" |
| **B — Anillo de fase** | El reloj es un anillo | Anillo interior = fase (oro), exterior = total (cobre); la escena al lado; saltos como botones anchos | Anillo oro sobre fondo oscuro; pasa a ámbar en pausa |
| **C — Tarjeta crema** | La instrucción es lo más brillante | Tarjeta invertida crema con texto espresso y gramos de 34 px, lectura a un brazo de distancia | Máximo contraste (crema sobre oscuro); destello de fase a oro |

Comunes a las tres: barra Kitchen Mode, botón principal que cambia de cobre (Iniciar/Reanudar) a neutro elevado (Pausar) para distinguir estados, `Reiniciar` al lado del principal, selector "Cambiar cafetera" junto al título y, en mobile, el temporizador sube primero al iniciar y la fila de acciones queda fija sobre la barra de pestañas.

## Cómo verlo

Desde la raíz del repo (necesita `node_modules` para las fuentes locales):

```
python -m http.server 8765 --bind 127.0.0.1
```

Abrí `http://127.0.0.1:8765/openspec/changes/c-08-brew-timer-live-execution-ui/mockups/brew-timer-live.html`. La caja de demo (abajo a la izquierda) cambia variante, velocidad (1×/4×/10×) y simula "sin Wake Lock" o movimiento reducido. Parámetros de URL: `variant=a|b|c`, `method=v60|espresso`, `state=running|paused|completed`, `at=<seg>`, `speed`, `muted=1`, `wake=0`, `chrome=0`.

## Capturas (`previews/`)

- Desktop 1440×900: `c08-A-idle`, `c08-A-running` (con destello de fase), `c08-B-running`, `c08-B-paused-…-scrolled`, `c08-C-running`, `c08-C-espresso-running-…-scrolled`
- Mobile 390×844: `c08-A-running`, `c08-B-running`, `c08-C-running-nowake-muted`
- En desktop el panel es sticky (`top-24`): las capturas "scrolled" muestran el panel completo tras desplazar 150 px.

## Regenerar el snapshot

Si cambia `BrewStationView`, `ProceduralBrewScene` o el catálogo: crear temporalmente `src/__ssr_snapshot_entry.tsx` que exporte `renderPage(url)` (`renderToStaticMarkup` de `<MemoryRouter><AppRoutes/></MemoryRouter>`) y `recipeData(slug)` (`calculateScaledRecipe` + `ProceduralBrewScene` a progreso 0 y 1 por fase), cargarlo con `vite.createServer({ server: { middlewareMode: true } }).ssrLoadModule(...)`, escribir `assets/c08-app-snapshot.js`, copiar `/src/index.css?direct` del dev server a `assets/c08-app-snapshot.css` y borrar el archivo temporal.
