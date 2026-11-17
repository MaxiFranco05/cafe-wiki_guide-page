# Descripción General

## Stack tecnológico

| Capa | Tecnologías | Versión mínima | Rol en el sistema |
|---|---|---|---|
| **Lenguaje** | TypeScript (strict mode) | `5.6+` | Tipado estático de extremo a extremo para el motor de preparación y el catálogo de datos. |
| **Framework UI** | React | `19.x` | Renderizado declarativo de las vistas, controles reactivos de dosis y escena SVG procedural. |
| **Build Tool / Bundler** | Vite | `6.x` | Desarrollo ultrarrápido y empaquetado optimizado con *code-splitting* por ruta. |
| **Estilos** | Tailwind CSS | `3.4+` / `4.x` | Diseño mobile-first utilitario, alto contraste para lectura en mesada y soporte de tema claro/oscuro. |
| **Validación de Esquemas** | Zod | `3.23+` | Validación en tiempo de compilación/test e inicio de recetas, umbrales y fichas de la wiki. |
| **Enrutamiento** | React Router (SPA) | `7.x` (o `6.x`) | Navegación instantánea en cliente sin recargas entre métodos, preparación y wiki. |
| **Internacionalización** | Diccionarios tipados / `i18next` ligero | `23.x` | Desacoplamiento total de textos de UI y contenido (español en v1, extensible a otros idiomas). |
| **PWA / Offline** | `vite-plugin-pwa` (Workbox) | `0.21+` | Generación de Service Worker y precaché de activos estáticos, código y datos JSON. |
| **Testing** | Vitest + Testing Library | `2.x` | Tests unitarios del motor de dominio (TDD estricto) y pruebas de integración de componentes. |
| **Hosting y CI/CD** | Vercel / Netlify (Free Tier) | — | Despliegue estático gratuito con entornos de preview para la rama `dev` y producción en `main`. |

## Arquitectura general

El sistema sigue una **arquitectura 100% Client-Side SPA/PWA con núcleo de dominio funcional puro**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Navegador Móvil / Escritorio                      │
│                                                                         │
│  ┌──────────────────────┐   ┌───────────────────────┐   ┌────────────┐  │
│  │  Vistas React (UI)   │   │ Escena SVG Procedural │   │ Rueda SCA  │  │
│  │ (Métodos, Timer,     │   │ (Primitivas animadas  │   │ Interactiva│  │
│  │  Wiki, Calculadora)  │   │  según fase y dosis)  │   │   (SVG)    │  │
│  └──────────┬───────────┘   └───────────▲───────────┘   └─────▲──────┘  │
│             │                           │                     │         │
│             ▼                           │                     │         │
│  ┌──────────────────────────────────────┴─────────────────────┴──────┐  │
│  │                Motor de Dominio Puro (TypeScript)                 │  │
│  │  • Escalador Bidireccional (Café ↔ Agua, 3 intensidades)          │  │
│  │  • Calculador Espresso (Dosis → Ristretto / Normale / Lungo)      │  │
│  │  • Validador de Umbrales Físicos y Tips Dinámicos de Molienda     │  │
│  │  • Máquina de Estados del Temporizador (basada en performance.now)│  │
│  └──────────┬───────────────────────────────────────────┬────────────┘  │
│             │                                           │               │
│             ▼                                           ▼               │
│  ┌─────────────────────────────────┐     ┌───────────────────────────┐  │
│  │ Catálogo Estático Tipado (Zod)  │     │ Adaptadores Web APIs      │  │
│  │ • Recetas de los 6 métodos      │     │ • Screen Wake Lock API    │  │
│  │ • Fichas de Orígenes/Varietales │     │ • Web Audio API (Synth)   │  │
│  │ • Árbol de Rueda de Sabores SCA │     │ • Service Worker (Offline)│  │
│  │ • Diccionarios i18n (es)        │     │ • localStorage (Prefs)    │  │
│  └─────────────────────────────────┘     └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Justificación de decisiones de alto nivel

1. **Núcleo de dominio puro separado de React**: Toda la matemática de proporciones, escalado por fases, cálculo de yield en Espresso, detección de excesos/defectos de dosis y cálculo de progreso temporal vive en funciones puras de TypeScript sin importar React ni el DOM. Esto permite aplicar **TDD estricto** con ejecución en milisegundos.
2. **Temporizador basado en reloj monotónico (`performance.now()` / `Date.now()`)**: En lugar de incrementar un contador con `setInterval(..., 1000)` (que deriva cuando el navegador móvil ralentiza el hilo principal), el temporizador calcula el delta real respecto al instante de inicio, garantizando precisión exacta al segundo.
3. **Audio sintetizado con `Web Audio API`**: No se descargan archivos `.mp3` ni `.wav`. Los tonos de pre-aviso, cambio de fase y finalización se generan mediante osciladores nativos (`AudioContext`), ahorrando peso de bundle y asegurando disponibilidad offline inmediata.
4. **Primitivas SVG reutilizables**: En lugar de producir 6 videos o animaciones pesadas de Lottie para cada método, se compone una escena ligera a partir de piezas parametrizadas (`LiquidLevel`, `PourStream`, `CoffeeBed`, `StirringSpoon`, `Plunger`, `PortafilterDrops`) interpoladas por el estado actual de la receta.

## Integraciones externas

En la versión **v1.0 (MVP)** el sistema **no depende de servicios externos, bases de datos remotas ni APIs de terceros** en tiempo de ejecución (`needs_infra: false`).

| Servicio / API Nativa | Propósito | Tipo | Comportamiento de Fallback |
|---|---|---|---|
| **Screen Wake Lock API** (`navigator.wakeLock`) | Impedir que la pantalla del dispositivo se bloquee mientras corre el temporizador. | Web API nativa | Si el navegador no lo soporta o falla por ahorro de batería, muestra un indicador visual discreto sin interrumpir el timer. |
| **Web Audio API** (`window.AudioContext`) | Emitir alertas sonoras suaves al cambiar de fase de vertido o finalizar la extracción. | Web API nativa | Se desbloquea en el evento `click`/`pointerdown` del botón "Iniciar". Incluye opción de silenciar (mute). |
| **Service Worker / Cache Storage** | Permitir que toda la aplicación y la wiki funcionen 100% offline tras la primera visita. | Web API nativa (Workbox) | Si el navegador bloquea Service Workers (ej. navegación privada restrictiva), la app opera normalmente online. |
| **Web Storage (`localStorage`)** | Recordar preferencias ligeras de sesión (última dosis usada por método, sonido activo/mute, tema visual). | Web API nativa | Si está deshabilitado, utiliza valores por defecto en memoria. |

## API REST

No aplica en v1.0. Todos los datos provienen del catálogo estático versionado en el repositorio, validado con esquemas **Zod** durante el build y los tests.
