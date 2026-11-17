# Actores y Roles

## Actores del sistema

En el MVP v1.0 no existe registro de usuarios ni autenticación en la aplicación web. La distinción de actores responde a los **tres perfiles funcionales de uso** en el cliente y al **rol de mantenimiento** en el repositorio:

| Actor | Descripción | Cómo interactúa |
|---|---|---|
| **Preparador diario** | Usuario que busca preparar su café cotidiano de forma rápida y consistente sin distracciones. | Accede desde su móvil en la cocina, selecciona su cafetera, elige intensidad (liviano/normal/fuerte), ajusta gramos de café o ml de agua y ejecuta el temporizador guiado con pantalla encendida. |
| **Entusiasta / Home Barista** | Usuario intermedio o avanzado que experimenta con recetas de referentes, ratios y Espresso. | Ajusta dosis específicas, consulta los 3 estilos de Espresso (Ristretto, Normale, Lungo), revisa los tips dinámicos de molienda y sigue las fases detalladas de vertido (bloom, pulsos, agitación, drawdown). |
| **Explorador de café de especialidad** | Usuario interesado en aprender sobre el grano, su trazabilidad y el análisis sensorial. | Navega la sección de Wiki (orígenes, varietales, procesos de beneficio) e interactúa con la rueda de sabores estilo SCA para identificar familias aromáticas y perfiles en taza. |
| **Autor / Mantenedor** | Responsable técnico y curador del contenido del proyecto. | Modifica o agrega recetas, umbrales físicos, fichas de la wiki y archivos de traducción (`i18n`) mediante commits en la rama `dev` y despliegue a `main` tras pasar la suite de validación (Vitest + Zod). |

## RBAC — Matriz de permisos

Dado que es una plataforma pública sin cuentas en v1.0, todos los visitantes comparten los mismos permisos de lectura y ejecución local, mientras que la escritura del catálogo reside en el repositorio Git:

| Rol | Recurso | Permisos | Alcance |
|---|---|---|---|
| **Visitante** *(Preparador / Home Barista / Explorador)* | Catálogo de los 6 métodos y recetas | `Read` | Público, disponible online y offline. |
| **Visitante** | Motor de cálculo, escalado y temporizador | `Execute` (local) | Cálculos efímeros en cliente; preferencias básicas guardadas en `localStorage` del propio dispositivo. |
| **Visitante** | Wiki (Orígenes, Varietales, Procesos) y Rueda de Sabores SCA | `Read` | Público, disponible online y offline. |
| **Autor / Mantenedor** | Archivos de datos (`src/data/**`, `src/i18n/**`) y código fuente | `Create`, `Read`, `Update`, `Delete` | Vía control de versiones Git (ramas `dev` y `main`). |

## Rutas públicas

Todas las rutas de la aplicación son **100% públicas** y accesibles sin autenticación ni pantallas de onboarding bloqueantes:

| Ruta | Vista / Pantalla | Propósito |
|---|---|---|
| `/` | **Home / Selector de Cafetera** | Grilla visual directa con los 6 métodos del MVP (Hario V60, Chemex, Melitta, AeroPress, Prensa Francesa, Espresso) y acceso rápido a la Wiki/Cata. |
| `/brew/:methodSlug` | **Estación de Preparación (Brew Station)** | Vista todo-en-uno del método elegido: selector de intensidad (o estilo de Espresso), inputs bidireccionales de café/agua, alertas de rango físico, tip dinámico de molienda, escena SVG procedural y temporizador paso a paso con controles de audio y Wake Lock. |
| `/wiki` | **Índice de la Wiki del Café** | Explorador organizado por pestañas o categorías: **Orígenes**, **Varietales** y **Procesos (Beneficios)**, con buscador y filtros rápidos por perfil sensorial. |
| `/wiki/:category/:entrySlug` | **Ficha Detallada de Wiki** | Detalle estructurado de un origen, varietal o proceso: altitud/región, notas sensoriales típicas, nivel de acidez/cuerpo/dulzor y métodos o intensidades recomendados para destacarlo (con link directo a `/brew/:methodSlug`). |
| `/flavor-wheel` | **Rueda de Sabores Interactiva (SCA)** | Visualización SVG interactiva por anillos jerárquicos (categoría general → subcategoría → descriptor específico) que al seleccionar una nota muestra su descripción sensorial y qué orígenes/procesos suelen presentarla. |
