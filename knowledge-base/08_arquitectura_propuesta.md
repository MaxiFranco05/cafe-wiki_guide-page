# Arquitectura Propuesta

## Patrones aplicados

| Patrón | Dónde se usa | Por qué |
|---|---|---|
| **Functional Core, Imperative Shell** | `src/domain/**` (núcleo puro) vs. `src/features/**` y `src/adapters/**` (shell React/Web APIs) | Permite que el 100% de las reglas matemáticas (escalado, fases, Espresso, umbrales y cálculo de progreso temporal) sean funciones puras determinísticas fáciles de testear con Vitest sin mocks de DOM. |
| **Feature-Sliced Modular Structure** | `src/features/{brewing,wiki,flavor-wheel}` | Mantiene cohesión por dominio funcional, evitando carpetas gigantes de componentes mezclados. |
| **Schema-First Static Catalog** | `src/data/**` validado por `src/domain/schemas/**` (Zod) | Garantiza en tiempo de test y build que ningún cambio manual en el repositorio introduzca recetas con porcentajes que no sumen 100% o links rotos en la wiki. |
| **Adapter Pattern para Web APIs** | `src/adapters/{wake-lock,web-audio,storage}` | Encapsula APIs del navegador (`navigator.wakeLock`, `AudioContext`, `localStorage`) detrás de interfaces seguras con *graceful degradation* para SSR/tests y navegadores restrictivos como iOS Safari. |
| **Composable SVG Primitives** | `src/features/brewing/components/svg-primitives/**` | Descompone las 6 cafeteras en recipientes estáticos + 5 primitivas dinámicas parametrizadas (`LiquidLevel`, `PourStream`, `CoffeeBed`, `Agitator`, `Plunger`), reduciendo drásticamente el costo de desarrollo y el tamaño del bundle. |

## Estructura de directorios

```
cafeteria-wiki_guide-page/
├── discovery/                      # Investigación de mercado y fichas de competidores
├── knowledge-base/                 # Los 10 documentos canónicos de arquitectura y dominio
├── openspec/                       # Especificaciones y cambios guiados por OPSX
├── public/
│   ├── icons/                      # Íconos PWA (192x192, 512x512, maskable)
│   └── robots.txt
├── src/
│   ├── adapters/                   # Imperative shell para APIs del navegador
│   │   ├── wake-lock.adapter.ts    # Gestión y re-adquisición de Screen Wake Lock
│   │   ├── web-audio.adapter.ts    # Síntesis de alertas sonoras con AudioContext
│   │   └── storage.adapter.ts      # Wrapper seguro sobre localStorage
│   ├── data/                       # Catálogo estático (fuente de verdad de datos)
│   │   ├── methods/                # Definición de los 6 métodos, perfiles y fases
│   │   ├── wiki/                   # Fichas de orígenes, varietales y procesos
│   │   └── flavor-wheel/           # Árbol jerárquico de 3 niveles estilo SCA
│   ├── domain/                     # Functional Core (100% TypeScript puro, 0 deps de React)
│   │   ├── schemas/                # Esquemas Zod para recetas, umbrales, wiki y rueda SCA
│   │   ├── brewing/                # Escalado bidireccional, cálculo de fases, modo Espresso
│   │   ├── thresholds/             # Validación de límites físicos y tips de molienda
│   │   ├── timer/                  # Máquina de estados temporal y progreso de escena SVG
│   │   └── __tests__/              # Suite de tests unitarios (Vitest) del motor y catálogo
│   ├── features/
│   │   ├── brewing/                # Vistas, controles de ratio, timer y escena SVG procedural
│   │   │   ├── components/
│   │   │   │   ├── svg-primitives/ # Primitivas SVG reutilizables
│   │   │   │   ├── BrewControls.tsx
│   │   │   │   ├── BrewTimer.tsx
│   │   │   │   └── RangeWarningBanner.tsx
│   │   │   └── hooks/
│   │   ├── wiki/                   # Explorador y fichas de orígenes, varietales y procesos
│   │   └── flavor-wheel/           # Rueda de sabores interactiva SVG + panel de detalle
│   ├── i18n/                       # Diccionarios desacoplados (es/ en v1.0)
│   │   ├── locales/
│   │   │   └── es/
│   │   │       ├── ui.json
│   │   │       ├── methods.json
│   │   │       ├── wiki.json
│   │   │       └── flavor-wheel.json
│   │   └── index.ts
│   ├── shared/                     # Componentes UI base (Layout, Navbar móvil, Badges)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts                  # Configuración Vite + vite-plugin-pwa
```

## Seguridad y Resiliencia

- **Autenticación y Autorización**: No aplica en cliente en v1.0 (aplicación pública de lectura/ejecución local). La escritura del catálogo está protegida por permisos del repositorio Git privado.
- **Validación de Input en Cliente**:
  - Todo input numérico (gramos de café, ml de agua) pasa por sanitización y límites numéricos (`min="1"`, `max="2000"`, `step="0.1"`) evitando inyecciones, `Infinity` o `NaN`.
  - Los parámetros de URL (`?profile=light`, `:methodSlug`, `:entrySlug`) se validan contra listas blancas del catálogo; si no existen, redirigen limpiamente al estado por defecto o vista 404 amigable.
- **Content Security Policy (CSP)**: Como el proyecto no carga scripts externos ni audio externo, permite una política CSP estricta (`default-src 'self'`).
- **Secrets Management**: El MVP no utiliza claves secretas ni API keys de terceros.

## Variables de entorno

El MVP funciona con **cero variables de entorno obligatorias** para facilitar el clonado y despliegue instantáneo. Opcionalmente soporta variables públicas de build en Vite:

| Variable | Descripción | Ejemplo | Sensible (Y/N) |
|---|---|---|---|
| `VITE_APP_DEFAULT_LOCALE` | Idioma inicial por defecto de la aplicación | `"es"` | N |
| `VITE_APP_VERSION` | Versión semántica mostrada en el pie de página / acerca de | `"1.0.0"` | N |
