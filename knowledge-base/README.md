# Cafetería Wiki & Guide Page — Base de Conocimiento

Base de conocimiento canónica del proyecto, generada en conjunto a partir de la investigación de mercado (`discovery/`) y las definiciones de arquitectura de producto y software.

## Índice de Archivos

| Archivo | Contenido |
|---|---|
| [01_vision_y_objetivos.md](01_vision_y_objetivos.md) | Propósito del sistema, objetivos de los 3 perfiles de usuario, alcance MVP v1.0, fuera de alcance y métricas de éxito. |
| [02_descripcion_general.md](02_descripcion_general.md) | Stack tecnológico (Vite + React + TS + Tailwind + Zod + PWA), arquitectura client-side y adaptadores de Web APIs. |
| [03_actores_y_roles.md](03_actores_y_roles.md) | Perfiles de uso (Preparador diario, Home Barista, Explorador), rol Mantenedor, permisos y mapa de rutas públicas. |
| [04_modelo_de_datos.md](04_modelo_de_datos.md) | Dominios, diagrama ERD y especificación de entidades (`BrewMethod`, `RecipeProfile`, `BrewPhase`, `RangeThreshold`, `SvgStageDirective`, `WikiEntry`, `FlavorWheelNode`) y seed data. |
| [05_reglas_de_negocio.md](05_reglas_de_negocio.md) | Reglas codificadas de escalado (`RN-BR`), límites físicos por cafetera (`RN-RG`), temporizador/Wake Lock/Web Audio/SVG (`RN-UX`) e internacionalización (`RN-I18N`). |
| [06_funcionalidades.md](06_funcionalidades.md) | Épicas e historias de usuario (`US-001` a `US-010`) con criterios de aceptación verificables. |
| [07_flujos_principales.md](07_flujos_principales.md) | Flujos extremo a extremo con diagramas de secuencia y manejo de casos de borde. |
| [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md) | Patrones (*Functional Core / Imperative Shell*, primitivas SVG reutilizables), estructura de directorios y seguridad. |
| [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md) | Decisiones de arquitectura (`DD-01` a `DD-05`) con trade-offs y supuestos (`SU-01`, `SU-02`). |
| [10_preguntas_abiertas.md](10_preguntas_abiertas.md) | Estado de consistencia y tabla priorizada de definiciones pendientes. |

## Quick Start para Desarrolladores y Agentes

1. **Entender el propósito y usuarios** → [01_vision_y_objetivos.md](01_vision_y_objetivos.md), [03_actores_y_roles.md](03_actores_y_roles.md)
2. **Entender las estructuras de datos** → [04_modelo_de_datos.md](04_modelo_de_datos.md)
3. **Entender las fórmulas y reglas del motor** → [05_reglas_de_negocio.md](05_reglas_de_negocio.md)
4. **Entender la arquitectura y estructura de carpetas** → [02_descripcion_general.md](02_descripcion_general.md), [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md)
5. **Implementar features con TDD** → [06_funcionalidades.md](06_funcionalidades.md), [07_flujos_principales.md](07_flujos_principales.md)
6. **Revisar decisiones y puntos abiertos antes de codificar** → [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md), [10_preguntas_abiertas.md](10_preguntas_abiertas.md)

## Resumen Ejecutivo

**Cafetería Wiki & Guide Page** es una aplicación web/PWA mobile-first construida con **Vite, React, TypeScript y Tailwind CSS** que permite preparar 6 métodos de café en la mesada sin instalar aplicaciones nativas ni scrollear blogs extensos. Combina un motor matemático determinístico (escalado bidireccional por fases en filtro y cálculo por *yield* en Espresso, con alertas de límites físicos y tips de molienda), una escena de animación SVG procedural sincronizada con el temporizador (`Screen Wake Lock` + `Web Audio API`) y una enciclopedia sensorial con rueda de sabores interactiva estilo SCA.
