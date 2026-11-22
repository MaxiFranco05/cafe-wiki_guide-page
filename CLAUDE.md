# Cafetería Wiki & Guide Page — Instrucciones para Agentes

> Este archivo (y su copia idéntica `CLAUDE.md`) es lo PRIMERO que todo agente lee al entrar al repositorio.
> Generado a partir de `knowledge-base/`, `design-system/`, `.atl/skill-registry.md` y `CHANGES.md`. No editar a mano sin mantener sincronizados `AGENTS.md` y `CLAUDE.md`.

---

## Stack Tecnológico

| Capa | Tecnologías | Versión mínima | Rol en el sistema |
|---|---|---|---|
| **Lenguaje** | TypeScript (strict mode) | `5.6+` | Tipado estático de extremo a extremo para el motor de preparación y el catálogo de datos. |
| **Framework UI** | React | `19.x` | Renderizado declarativo de las vistas, controles reactivos de dosis y escena SVG procedural. |
| **Build Tool / Bundler** | Vite | `6.x` | Desarrollo ultrarrápido y empaquetado optimizado con *code-splitting* por ruta. |
| **Estilos** | Tailwind CSS + Design System Tokens | `3.4+` / `4.x` | Diseño mobile-first utilitario Dark-Only consumiendo `design-system/tokens.css` (Revisión 3). |
| **Validación de Esquemas** | Zod | `3.23+` | Validación en tiempo de compilación/test e inicio de recetas, umbrales y fichas de la wiki. |
| **Enrutamiento** | React Router (SPA) | `7.x` (o `6.x`) | Navegación instantánea en cliente sin recargas entre métodos, preparación y wiki. |
| **Internacionalización** | Diccionarios tipados / `i18next` ligero | `23.x` | Desacoplamiento total de textos de UI y contenido (español en v1, extensible a otros idiomas). |
| **PWA / Offline** | `vite-plugin-pwa` (Workbox) | `0.21+` | Generación de Service Worker y precaché de activos estáticos, código y datos JSON. |
| **Testing** | Vitest + Testing Library | `2.x` | Tests unitarios del motor de dominio (TDD estricto) y pruebas de integración de componentes. |
| **Hosting y CI/CD** | Vercel / Netlify (Free Tier) | — | Despliegue estático gratuito con entornos de preview para la rama `dev` y producción en `main`. |

Detalle completo: [knowledge-base/02_descripcion_general.md](knowledge-base/02_descripcion_general.md)

---

## Base de Conocimiento y Design System

La fuente de verdad del dominio vive en `knowledge-base/` y la identidad visual aprobada en `design-system/`. **Leé el archivo relevante ANTES de implementar cualquier tarea.**

| Archivo | Cuándo leerlo |
|---|---|
| [knowledge-base/README.md](knowledge-base/README.md) | Índice general y resumen ejecutivo del sistema |
| [knowledge-base/01_vision_y_objetivos.md](knowledge-base/01_vision_y_objetivos.md) | Entender propósito, perfiles de usuario, alcance MVP v1.0 y métricas de éxito |
| [knowledge-base/02_descripcion_general.md](knowledge-base/02_descripcion_general.md) | Stack tecnológico, arquitectura 100% client-side y Web APIs |
| [knowledge-base/03_actores_y_roles.md](knowledge-base/03_actores_y_roles.md) | Perfiles de uso, permisos y mapa de rutas públicas (`/`, `/brew/:methodSlug`, `/wiki`, `/flavor-wheel`) |
| [knowledge-base/04_modelo_de_datos.md](knowledge-base/04_modelo_de_datos.md) | Entidades (`BrewMethod`, `RecipeProfile`, `BrewPhase`, `RangeThreshold`, `SvgStageDirective`, `WikiEntry`, `FlavorWheelNode`) y seed data |
| [knowledge-base/05_reglas_de_negocio.md](knowledge-base/05_reglas_de_negocio.md) | Reglas codificadas (`RN-BR-*`, `RN-RG-*`, `RN-UX-*`, `RN-I18N-*`) |
| [knowledge-base/06_funcionalidades.md](knowledge-base/06_funcionalidades.md) | Épicas e historias de usuario (`US-001` a `US-010`) con criterios de aceptación |
| [knowledge-base/07_flujos_principales.md](knowledge-base/07_flujos_principales.md) | Flujos extremo a extremo y manejo de casos de borde |
| [knowledge-base/08_arquitectura_propuesta.md](knowledge-base/08_arquitectura_propuesta.md) | Patrones (*Functional Core / Imperative Shell*), estructura de directorios y seguridad |
| [knowledge-base/09_decisiones_y_supuestos.md](knowledge-base/09_decisiones_y_supuestos.md) | Decisiones arquitectónicas (`DD-01` a `DD-05`) y supuestos (`SU-01`, `SU-02`) |
| [knowledge-base/10_preguntas_abiertas.md](knowledge-base/10_preguntas_abiertas.md) | Definiciones pendientes y resoluciones recomendadas |
| [design-system/README.md](design-system/README.md) | Política visual aprobada (`mode: system-and-mockups`, `Revision: 3` — Dark-Only Profesional Fotográfico Moody), `tokens.css`, `brand.js` y `assets/photos/` |

---

## Skills Disponibles

| Agente | Rol en el Proyecto | Skills que carga |
|---|---|---|
| **Domain Core (Agente A)** | Esquemas Zod, catálogo de 6 métodos, motor matemático de escalado/Espresso, reloj monotónico y adaptadores Web APIs (`Wake Lock`, `Web Audio`, `localStorage`) | `typescript-advanced-types`, `zod`, `vitest`, `modern-web-guidance` |
| **Domain & Sensory Aux (Agente B)** | Catálogo de Wiki Sensorial, árbol de Rueda SCA, redacción técnica sin relleno y primitivas SVG procedurales | `zod`, `svg-animation`, `no-ai-slop`, `vitest`, `typescript-advanced-types` |
| **Frontend & UI/PWA (Agente C)** | AppShell, vistas React 19, calculadora interactiva, temporizador en vivo, explorador de Wiki, rueda SCA interactiva y empaquetado PWA | `vercel-react-best-practices`, `vercel-composition-patterns`, `tailwind-design-system`, `impeccable`, `ui-ux-pro-max`, `design-taste-frontend-v1`, `emil-design-eng`, `modern-web-guidance`, `svg-animation`, `pwa-development`, `vite`, `playwright-cli` |
| **Orquestación (OPSX / SDD)** | Coordinación de changes, specs, diseño visual, registro de skills y mantenimiento de KB/roadmap | `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-sync-specs`, `openspec-update-change`, `design-system`, `active-orchestrator`, `kb-creator`, `roadmap-generator`, `agents-md-generator` |

Cargá las skills correspondientes al contexto ANTES de escribir código.

> Los compact rules de cada skill los resuelve el orquestador desde `.atl/skill-registry.md` (generado por `skill-registry`; no versionado — no está en el repo). Esta tabla solo mapea skill→rol.

---

## Roadmap de Changes

El plan de implementación completo está en [CHANGES.md](CHANGES.md). Resumen ejecutivo:

- **Total**: **12 changes (`C-01` a `C-12`)** organizados en **5 fases** bajo estrategia *front-first* de *vertical slices* visuales.
- **Camino crítico (6 changes)**: `C-01 → C-02 → C-04 → C-05 → C-08 → C-12`.
- **Primer change**: `C-01` (`foundation-and-ui-shell`) — levanta el esqueleto Vite 6 + React 19 + TypeScript + Tailwind + tokens del Design System aprobado (`design-system/tokens.css`) y el `AppShell` navegable.

**Antes de cualquier `/opsx:propose`**: leé [CHANGES.md](CHANGES.md), verificá que las dependencias del change estén completadas y leé los documentos listados en **"Leer antes"**.

---

## Reglas Duras (específicas del proyecto)

> Reglas globales ya definidas en `~/.claude/CLAUDE.md` y `~/.gemini/config/AGENTS.md` (orquestador OPSX, governance por dominio, Strict TDD, Engram y gate de UI Mockups): el proyecto las hereda. Acá viven solo las reglas **específicas de este proyecto** + las universales de Git/ramas confirmadas con el usuario.

Son contrato obligatorio; romper cualquiera de estas reglas es un defecto:

- **Ramas y Despliegue (`dev` vs. `main`)**: **NUNCA** pushear trabajo en progreso ni entorno de desarrollo sucio directamente a `main` → pushear **siempre** el desarrollo iterativo a la rama `dev`; la rama `main` recibe **únicamente** código y datos depurados, validados y listos para producción.
- **TypeScript Estricto y Catálogos Zod (`RN-I18N-02`)**: **NUNCA** usar `any`, `@ts-ignore` ni `as unknown as X` para silenciar errores de tipos → tipar en modo estricto y validar todos los catálogos estáticos (`methods`, `wiki`, `flavor-wheel`) e invariantes (`waterShare === 1.0`, contigüidad de tiempos, referencias cruzadas) mediante esquemas **Zod** (`z.infer`).
- **Núcleo Puro vs. Imperative Shell (`src/domain/`)**: **NUNCA** importar `react`, el DOM, `window` ni `navigator` dentro de `src/domain/` → mantener toda la matemática (escalado bidireccional Opción A, modo Espresso por *yield*, umbrales físicos `RN-RG-03` y reloj monotónico) como funciones puras 100% testeadas con Vitest, y encapsular `Screen Wake Lock`, `Web Audio API` y `localStorage` exclusivamente en `src/adapters/`.
- **Performance en Temporizador y Escena SVG (`RN-UX-01`, `RN-UX-04`)**: **NUNCA** usar `setInterval` acumulativo para contar segundos ni disparar re-renders del árbol completo en cada tick de 100 ms → calcular siempre el delta real con timestamps monotónicos (`performance.now()`), aislar el estado frecuente del timer y animar primitivas SVG/CSS únicamente mediante `transform` y `opacity` respetando `@media (prefers-reduced-motion: reduce)`.
- **Internacionalización (`RN-I18N-01`) y Cero Emojis**: **NUNCA** hardcodear textos visibles al usuario en componentes o en `src/domain/`, ni usar emojis en la interfaz, alertas o código → resolver todo texto mediante claves de diccionario en `src/i18n/locales/es/*.json` y utilizar exclusivamente iconografía e ilustraciones SVG vectoriales limpias.
- **Design System y Gate de Mockups (`system-and-mockups`)**: **NUNCA** usar valores hexadecimales sueltos fuera de `design-system/tokens.css` ni iniciar la fase `apply` de un change visual sin mockup aprobado → consumir las variables semánticas del Design System aprobado (`Revision: 3`) y presentar el mockup responsive (`390x844` y `1440x900`) para aprobación previa del usuario.
- **Uso y Auditoría Obligatoria de Skills por Change**: **NUNCA** iniciar `propose` o `apply` sin leer y aplicar las skills asignadas al rol correspondiente (incluyendo sus `SKILL.md` / `references/` y reglas de `.atl/skill-registry.md`) → al cerrar **cada change**, incluir obligatoriamente en la respuesta una tabla **`Auditoría de Skills Utilizadas`** (`| Skill | Fase / Archivo | Qué regla o patrón se aplicó concretamente |`) detallando el aporte real de cada skill cargada.
- **Higiene de Git y Commits**: **NUNCA** ejecutar `git commit` o `git push` sin confirmación explícita del usuario ni agregar trailers `Co-Authored-By` de IA → usar mensajes *Conventional Commits* limpios y asegurar que `.atl/` figure siempre en `.gitignore`.
- **Versionado y Releases (PR a `main`)**: **NUNCA** abrir un PR hacia `main` con un título distinto de `release: vX.Y.Z` (SemVer, ej. `release: v0.13.0`), ni crear tags manuales → la versión debe ser mayor a la de `main` y el título del PR es su única fuente; el mismo PR debe llevar `package.json` / `package-lock.json` con esa versión (el check lo valida): al mergear, `.github/workflows/release.yml` actualiza `package.json`, crea el tag `vX.Y.Z` y el GitHub Release y despliega a producción en Vercel (identificado por los secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`, nunca por nombre de proyecto), y el footer del front lee esa versión (`__APP_VERSION__`, inyectada por Vite). `.github/workflows/pr-title-check.yml` valida el título y debe ser check obligatorio en `main`. La v1.0.0 es el MVP (publicada); sin sufijos tipo `-beta`. `main` solo contiene archivos de producción (sin `AGENTS.md`, `CLAUDE.md`, `knowledge-base/`, `openspec/`, etc.): los PRs a `main` se arman desde una rama `release/vX.Y.Z` cortada de `main` con solo los archivos de producción de `dev`.

---

## Stack de Modelos (Plan PRO) y Recomendación por Tarea

> Balancea calidad y las **3 bolsas de cuota semanales independientes** de Antigravity Plan PRO (*Gemini Models*, *Claude & GPT* y *Gemini 4 Argon*).
> **Regla operativa (al archivar un change y antes de iniciar el siguiente):** el agente **DEBE incluir un bloque compacto** (sin gastar tokens extra en análisis) con:
> 1. **Próximo change y Stack** (`Backend / Dominio`, `Frontend / UI` o `Mixto` — para elegir familia Gemini vs. Claude Opus/Sonnet).
> 2. **Nivel de Governance** (`LOW`, `MEDIUM`, `HIGH` o `CRITICAL`, tomado de `CHANGES.md`).
> 3. **Modelos sugeridos (Principal / Secundario por cuota)** + `Effort` para `/opsx:propose` y `/opsx:apply`.
> El agente **no puede leer el `/usage` del usuario**; si la bolsa principal está baja, el usuario avisa y se usa el secundario.

| Fase / Tarea | Modelo principal | Effort | Bolsa de cuota | Fallback / Cuándo cambiar |
|---|---|---|---|---|
| **Planificación Frontend** *(UI, mockups, Design System, UX)* | **Claude Opus 5.5** *(UI compleja)* / **Claude Sonnet 5.5** *(estándar)* | `Medium` | Claude & GPT | **Gemini 4 Neon (`Medium`)** si se requiere contexto masivo o se agota Claude. |
| **Planificación Dominio / Backend** *(arquitectura, contratos, `design.md`, `tasks.md`)* | **Gemini 4 Argon** *(estándar, cuota aparte)* | `Medium` / `High` | Gemini 4 Argon | **Gemini 4 Neon (`High`)** en lógica crítica o concurrencia compleja (`Neon` es más capaz que `Argon`); **Neon (`Low`)** en CRUDs simples. |
| **Coding Frontend — Visual / UI nueva** *(layouts, Tailwind, SVG, responsive)* | **Claude Sonnet 5.5** *(día a día)* / **Claude Opus 5.5** *(pantallas clave)* | `Medium` | Claude & GPT | **Gemini 4 Neon (`Medium`)** si se agota la ventana de 5h de Claude. |
| **Coding Frontend — Lógica / Estado / Tests** | **Gemini 4 Neon** | `Low` / `Medium` | Gemini Models | **Orchestrator (Neon)** en changes multi-archivo grandes con loops de tests. |
| **Coding Dominio / Backend / TDD** | **Gemini 4 Neon** | `Low` *(simple)* / `Medium` *(TDD exigente)* | Gemini Models | **Orchestrator (Neon)** para 20+ pasos multi-archivo; **Hydrogen (`Low`)** solo en ediciones triviales. |
| **Exploración (`/opsx:explore`)** | **Hydrogen (`Low`)** o **Neon (`Low`)** | `Low` | Gemini Models | **Argon (`Medium`)** si es duda pura de arquitectura. |
| **Debugging — 1° intento** | **Gemini 4 Neon** | `Medium` | Gemini Models | Mejor balance velocidad/precisión (`55 pts`). |
| **Debugging — Bug bloqueado (2+ fallos)** | **Neon (`High`)** → si persiste: **Opus 5.5 (`Medium`/`High`)** | `High` | Gemini / Claude | Cambiar de familia destraba puntos ciegos. |
| **Code Review / Auditoría** | **Gemini 4 Argon** | `High` | Gemini 4 Argon | Aprovecha bolsa semanal independiente antes de mergear. |
| **Cierre (`/opsx:archive`), docs, renombres** | **Gemini 4 Hydrogen** | `Low` | Gemini Models | Máximo ahorro en tareas mecánicas. |

**Reglas anti-desperdicio (Plan PRO):**
1. No usar `Hydrogen (High)` ni `Hydrogen (xHigh)`: `Neon (Medium)` rinde más por igual o menor costo.
2. No fijar `Neon (xHigh)`: reservarlo solo para bloqueos extremos (`61` vs `60` en `High` a costo mucho mayor).
3. No dejar `Opus 5.5` en loops largos de tests o refactors mecánicos: agota la ventana de 5h de Claude; pasar a `Sonnet 5.5` o `Neon`.
4. Aprovechar las 3 bolsas semanales por separado (descargar UI en **Claude**, reviews/specs estándar en **Argon**, y ejecución pesada en **Neon**).

---

## Flujo de Trabajo

```
1. Leer la KB relevante (knowledge-base/) y design-system/README.md → entender el dominio y tokens
2. Identificar el change en CHANGES.md                              → respetar dependencias y "Leer antes"
3. /opsx:propose C-NN-nombre                                        → proposal + specs + design (+ mockup si hay UI) + tasks
4. Implementar las tasks con Strict TDD (cargando skills)           → respetando todas las Reglas Duras
5. /opsx:archive C-NN-nombre + marcar [x] en CHANGES.md             → cerrar el change y pushear a `dev`
```

Aplicar TODAS las reglas duras en cada paso. Ante cualquier conflicto entre la KB y este archivo, las **Reglas Duras** prevalecen.
