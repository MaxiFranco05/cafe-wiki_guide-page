# Visión y Objetivos

## Propósito del sistema

**Cafetería Wiki & Guide Page** es una aplicación web progresiva (PWA) mobile-first, 100% client-side y gratuita, diseñada para preparar los 6 métodos de café más populares directamente en la mesada con cálculo bidireccional de proporciones, guía interactiva paso a paso con animaciones SVG procedurales, pantalla siempre encendida y una wiki sensorial integrada con rueda de sabores estilo SCA.

El sistema nace para eliminar cuatro problemas recurrentes que frustran a los entusiastas del café de especialidad:
1. El **"síndrome del blog de recetas"** (tener que scrollear párrafos interminables de historia antes de ver los gramos y segundos).
2. Las **calculadoras estáticas** que multiplican el agua total pero no recalculan las fases individuales de vertido (bloom, pulsos, descansos) ni advierten cuando una dosis sale de los límites físicos de la cafetera.
3. La **barrera de instalar apps nativas pesadas** (50–80 MB) para consultar una preparación rápida.
4. La **fricción en la cocina** cuando el teléfono apaga la pantalla a mitad de un vertido con la pava cuello de cisne en la mano.

## Objetivos por actor

| Actor | Objetivo principal | Objetivos secundarios |
|---|---|---|
| **Preparador diario** | Calcular proporciones al instante y seguir el temporizador paso a paso sin que la pantalla se apague. | Elegir entre 3 niveles de intensidad (liviano, normal, fuerte); recibir avisos si ingresa una cantidad de café o agua fuera de rango normal; usar la guía sin conexión (offline). |
| **Entusiasta / Home Barista** | Replicar recetas calibradas de referentes (Hoffmann, Kasuya 4:6, campeonatos) y ajustar dosis o estilos de extracción. | Obtener recetas de Espresso por rendimiento en taza (*yield*: Ristretto, Normale, Lungo) a partir de los gramos de café seco; recibir recomendaciones dinámicas de ajuste de molienda según la dosis escalada. |
| **Explorador de café de especialidad** | Aprender perfiles sensoriales por origen, varietal y beneficio/proceso, y entrenar el paladar. | Explorar la rueda de sabores interactiva (estilo SCA) para identificar notas aromáticas y gustativas; vincular sabores con métodos y parámetros recomendados. |
| **Autor / Mantenedor** | Publicar y actualizar recetas, umbrales y fichas de la wiki desde el código con validación estricta. | Mantener los textos y contenidos desacoplados (`i18n`) para incorporar nuevos idiomas en el futuro sin reescribir componentes. |

## Alcance v1.0 (MVP)

- **6 métodos de preparación iniciales**:
  - **Filtro por gravedad (Pour-over)**: Hario V60, Chemex, Melitta.
  - **Inmersión / híbrido**: Prensa Francesa, AeroPress.
  - **Presión**: Espresso.
- **Motor de preparación bidireccional (`café ↔ agua`)**:
  - Selección de 3 perfiles de intensidad por método de filtro/inmersión: **Liviano**, **Normal**, **Fuerte**.
  - Recálculo proporcional automático de cada fase de la receta (bloom, vertidos parciales, agitación, reposos y drawdown) mantendo los hitos de tiempo estables (**Opción A**) y mostrando un tip dinámico de ajuste de molienda según la dosis.
- **Modo especializado de Espresso por rendimiento (*Yield*)**:
  - Ingreso único de gramos de café seco.
  - Cálculo simultáneo de los 3 estilos estándar de especialidad: **Ristretto (`1:1.5`, 20–25 s)**, **Normale (`1:2`, 25–30 s)** y **Lungo (`1:3`, 30–35 s)**.
- **Validación de límites físicos con advertencias no bloqueantes**:
  - Detección de dosis de café o volumen de agua por debajo del mínimo o por encima del máximo físico recomendado para cada método.
- **Animación procedural mediante primitivas SVG reutilizables**:
  - Escena SVG controlada en tiempo real por el estado del temporizador y la dosis: nivel de líquido, chorro de vertido, cama de café húmeda, cuchara/paleta revolviendo y émbolo/prensa.
- **UX de cocina (Kitchen Mode)**:
  - `Screen Wake Lock API` activa durante toda la preparación con re-adquisición automática al volver a la pestaña.
  - Alertas sonoras sintetizadas con `Web Audio API` (sin archivos MP3 pesados) al cambiar de fase y al finalizar.
  - Soporte offline completo vía PWA (`Service Worker` + `Web App Manifest`).
- **Wiki del Café y Rueda de Sabores Interactiva**:
  - Fichas estructuradas de **Orígenes**, **Varietales** y **Procesos/Beneficios** (lavado, natural, honey, fermentaciones).
  - Rueda de sabores interactiva (inspirada en el estándar SCA) navegable en móvil y escritorio.
- **Arquitectura preparada para internacionalización (`i18n`)**:
  - Idioma inicial español (`es`), con diccionarios de interfaz y contenido desacoplados para futura expansión multi-idioma.

## Fuera de alcance (Post-MVP)

- **Bitácora personal en `IndexedDB`** (registro de bolsas compradas, clics del molino, calificaciones e importación/exportación JSON).
- **Cuentas de usuario, autenticación y nube** (perfiles, sincronización entre dispositivos, favoritos remotos).
- **Funciones sociales y comunitarias** (envío de recetas por usuarios, comentarios, votos o feed en vivo).
- **CMS Headless o panel de administración web** (en v1 la edición se realiza mediante commits/push al repositorio).
- **Conexión Bluetooth (`Web Bluetooth API`)** con balanzas inteligentes o sensores de presión.
- **Pre-renderizado SSR/SSG orientado a SEO masivo** (en v1 se prioriza la experiencia SPA/PWA instantánea).

## Métricas de éxito

- **Performance Mobile-First**: puntaje **Lighthouse >= 95** en Performance, Accessibility y Best Practices en dispositivos móviles.
- **Time-to-Interactive (TTI)**: carga inicial menor a **1.5 segundos** en redes 4G y **< 200 ms** en visitas repetidas vía caché PWA.
- **Cero fricción hasta la receta**: máximo **2 toques** desde que se abre la web hasta iniciar el temporizador de un método con dosis personalizada.
- **Exactitud matemática del motor**: **100% de cobertura de tests unitarios** en las funciones puras de escalado, cálculo de fases, modo Espresso y detección de umbrales.
