# Discovery — Cafetería Wiki & Guide Page

**Fecha**: 2026-11-14
**Fuentes investigadas**: 7 competidores (ver `discovery/sources/`)

## 1. Problema que resuelve

Quienes preparan café de especialidad en casa sufren cuatro fricciones recurrentes: el "síndrome del blog de recetas" (páginas extensas de texto antes de llegar a los gramos y segundos), calculadoras web básicas que multiplican el agua total pero no recalculan cada vertido individual, apps nativas pesadas que requieren instalación para una consulta ocasional y teléfonos que apagan la pantalla en plena preparación con la pava en la mano. El proyecto resuelve esto con una aplicación web mobile-first rápida, sin instalación obligatoria, enfocada en preparar 6 métodos populares en la mesada con guía visual animada, escalado proporcional por fase y una wiki sensorial integrada.

## 2. Usuarios / roles

En el MVP no existen cuentas de usuario ni login; el contenido es curado y versionado directamente desde el repositorio por el autor. Se identifican tres perfiles de uso:

- **Preparador diario**: necesita calcular proporciones rápido y seguir tiempos de vertido claros en la mesada sin que se apague la pantalla.
- **Entusiasta / Home Barista**: replica recetas de referentes (James Hoffmann, Tetsu Kasuya 4:6, campeonatos) y ajusta intensidades y dosis según su gusto.
- **Explorador de café de especialidad**: consulta la wiki para aprender perfiles sensoriales por origen, varietal y proceso, usando la rueda de sabores para entrenar su cata.

## 3. Casos de uso

1. Como **preparador diario**, quiero elegir mi cafetera y una intensidad (liviano, normal o fuerte) e ingresar los gramos de café o mililitros de agua para ver al instante las cantidades exactas de cada vertido y seguir el temporizador sin que se bloquee la pantalla.
2. Como **home barista preparando espresso**, quiero ingresar únicamente los gramos de café seco para obtener sugerencias de extracción en 3 niveles (Ristretto, Normale y Lungo) con el peso objetivo de bebida y ventana de tiempo.
3. Como **preparador**, quiero recibir una advertencia clara si ingreso una dosis o volumen de agua fuera de lo normal para la cafetera elegida, evitando errores de extracción o desbordes.
4. Como **explorador de café de especialidad**, quiero navegar fichas de orígenes, varietales y procesos y usar una rueda de sabores interactiva (estilo SCA) para entender cómo preparar y disfrutar cada café.

## 4. Competidores / soluciones existentes

| Competidor | Problema que resuelve | Pricing | Diferenciadores |
|---|---|---|---|
| **Aeromatic** | Asistente paso a paso para AeroPress con conversión de molienda | Freemium | Calculadora de molienda por modelo de molino + video-guías |
| **AeroPrecipe** | Centraliza 300+ recetas de AeroPress (campeonatos) con timer | Free / USD 19 Lifetime | Nicho 100% AeroPress + formato unificado estándar/invertida |
| **Beanconqueror** | Tracking técnico exhaustivo de extracciones, granos y sensores | 100% Free & Open Source | Profundidad técnica (sensores/curvas) sin paywalls |
| **Brew Timer** | Temporizador preciso con alertas por etapa y clonación comunitaria | Free (ads en Android) / IAP | Pour rate tracker + clonación de recetas |
| **CoffeeRatio.app** | Cálculo instantáneo bidireccional café/agua sin texto | Gratuito (web) | Cero fricción y carga instantánea en navegador móvil |
| **Filtru Coffee** | Guías visuales, cálculo de ratios y conexión con balanzas Bluetooth | Free / PRO USD 3.49/mes (USD 79.99 lifetime) | Gráficos de vertido en tiempo real, guías AR y balanzas |
| **Timer.Coffee** | Guías multiplataforma con escalado dinámico y diario | 100% Free & Open Source | Código abierto, web + móvil, escalado dinámico sin login |

**Notas**: `Timer.Coffee` es el referente más cercano por su apertura y escalado dinámico, pero su versión web funciona principalmente como blog/directorio mientras la experiencia interactiva fuerte vive en la app nativa. Nuestro diferenciador es llevar la experiencia interactiva completa de mesada (SVG procedural en tiempo real, 3 intensidades, Wake Lock, Web Audio y wiki/rueda SCA) directo a una web/PWA rápida sin instalar nada.

## 5. Funcionalidades necesarias (MVP)

- **6 métodos iniciales**: Espresso, Melitta, Hario V60, Chemex, AeroPress y Prensa Francesa.
- **Motor de preparación**: escalado bidireccional dinámico (`café ↔ agua`) según 3 niveles de intensidad (liviano, normal, fuerte), recalculando proporcionalmente cada fase (bloom, vertidos parciales, reposos).
- **Modo específico de Espresso**: ingreso único de gramos de café seco con cálculo sugerido de Ristretto (`1:1.5`), Normale (`1:2`) y Lungo (`1:3`) mostrando bebida esperada (yield) y rango de tiempo.
- **Alertas de rango físico**: advertencia visual cuando la dosis de café o volumen de agua sale de los límites normales de la cafetera.
- **Animación procedural reutilizable**: ilustraciones SVG compuestas por piezas reutilizables (chorro/vertido, nivel de agua, cama de café, cuchara/paleta revolviendo, émbolo) controladas en tiempo real por el estado del temporizador y la dosis.
- **UX de cocina**: `Screen Wake Lock API`, alertas sonoras sintetizadas con `Web Audio API` y soporte offline vía PWA.
- **Wiki y Cata**: fichas estructuradas de orígenes, procesos y varietales + rueda de sabores interactiva (estilo SCA).

## 6. Funcionalidades opcionales (Post-MVP)

- **Bitácora personal (estilo Beanconqueror)**: persistencia local en `IndexedDB` para registrar bolsas de café, ajuste exacto de molino y puntuación de extracciones, con exportar/importar JSON.
- **Cuentas de usuario y comunidad**: perfiles, favoritos en la nube y recetas enviadas por la comunidad.
- **CMS headless**: panel externo para editar contenido sin hacer push al código.
- **Multi-idioma (i18n)**: traducción del contenido y la interfaz (asistida por IA o colaboradores).

## 7. Reglas de negocio

- **Escalado en métodos de filtro (Opción A)**: los hitos de tiempo (bloom, reposos, inmersión) permanecen estables por receta al variar la dosis; se escalan proporcionalmente las masas de agua de cada fase y se muestra un tip dinámico de ajuste de molienda (ej. más fino en dosis chicas, más grueso en dosis grandes).
- **Advertencias de rango físico**: si la dosis de café o el volumen de agua ingresado excede o queda por debajo del rango operativo normal del método, la interfaz debe advertir al usuario sin bloquear necesariamente la consulta.
- **Espresso basado en Yield**: el cálculo en Espresso siempre relaciona dosis seca con peso de bebida extraída (`1:1.5` en 20–25 s, `1:2` en 25–30 s, `1:3` en 30–35 s).
- **Contenido desacoplado**: recetas, fichas de wiki y textos de interfaz viven en archivos de datos estructurados separados de la lógica de componentes para habilitar un futuro i18n sin reescribir la app.

## 8. Integraciones

- **Ninguna integración externa obligatoria en el MVP**: aplicación 100% estática / client-side gestionada mediante push al repositorio.

## 9. Restricciones

- **Hosting gratuito en el MVP**: despliegue sin costo de infraestructura (ej. Vercel, Netlify, GitHub Pages o tier gratuito equivalente).
- **Repositorio único privado con ramas**: un único repositorio privado organizado por ramas (`dev` / `main`), manteniendo el contenido desacoplado de la lógica.
- **Web mobile-first sin instalación obligatoria**: debe cargar y operar íntegramente en el navegador del celular (con PWA opcional para uso offline).
- **Idioma inicial**: español.

## 10. Riesgos

- **Limitaciones de navegadores móviles (iOS Safari)**: `Web Audio API` requiere un gesto previo del usuario (ej. botón "Iniciar") para desbloquear el sonido, y `Screen Wake Lock` se libera al minimizar o cambiar de pestaña y debe re-adquisición al volver.
- **Consistencia de recetas y datos sensoriales**: sin validación de rangos y unidades en los archivos de recetas/wiki, podrían aparecer pasos inconsistentes o cálculos con redondeos confusos.
- **Alcance de animaciones SVG**: mantener las ilustraciones basadas en primitivas reutilizables es clave para no frenar el MVP con arte específico complejo por cada paso.
- **Supuesto sin probar**: que los usuarios de café de especialidad adopten una web/PWA como reemplazo real de sus apps nativas habituales en la mesada.

## 11. Preguntas abiertas

- Definir los umbrales exactos (mínimo y máximo en gramos/mililitros) que disparan advertencias en cada uno de los 6 métodos del MVP.
- Definir el stack tecnológico, framework PWA y formato de datos estructurados (a resolver en la fase de `kb-creator`).
