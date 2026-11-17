# Decisiones y Supuestos

## Decisiones documentadas

### DD-01 — Arquitectura SPA/PWA con Vite + React + TypeScript en lugar de SSR
- **Decisión**: Construir el MVP como una Single Page Application (SPA) y Progressive Web App (PWA) estática usando Vite, React y TypeScript con `vite-plugin-pwa`.
- **Contexto**: Se necesita una herramienta que abra al instante en el navegador móvil en la cocina, mantenga vivo el estado del temporizador, el `AudioContext` y el `Screen Wake Lock` sin interrupciones, funcione 100% offline y se aloje gratis en Vercel/Netlify.
- **Alternativas consideradas**:
  1. *Vite + React SPA/PWA* (elegida).
  2. *Astro con Islas React/Preact* (mejor SEO estático inicial, pero mayor complejidad para mantener estado continuo de audio/timer entre transiciones).
  3. *Next.js Full-Stack* (sobre-ingeniería para una app sin backend en v1).
- **Justificación**: Maximiza la fluidez interactiva en mesada, el soporte offline completo y la velocidad de desarrollo manteniendo un bundle pequeño.
- **Trade-offs aceptados**: El SEO orgánico por ruta individual queda en segundo plano para el MVP; si en post-MVP se requiere indexación profunda de cada ficha de la wiki, se podrá activar pre-renderizado estático (SSG) de rutas puntuales.

---

### DD-02 — Opción A para escalado en métodos de filtro (tiempos fijos + tip dinámico de molienda)
- **Decisión**: Al escalar los gramos de café o ml de agua en métodos de filtro e inmersión, se recalculan proporcionalmente los pesos de agua de cada fase pero **se mantienen fijos los tiempos del reloj**, acompañados de una recomendación dinámica de molienda cuando la dosis es chica o grande.
- **Contexto**: En la física de percolación (Ley de Darcy), el tiempo de bloom (desgasificación) y la difusión no escalan linealmente con el peso, mientras que cambiar la altura de la cama de café altera el caudal.
- **Alternativas consideradas**:
  1. *Escalar linealmente tanto el agua como los segundos de cada fase* (físicamente incorrecto: un bloom de 90 s para 30 g no tiene sentido).
  2. *Mantener los hitos de tiempo estables, escalar las masas de agua por fase y guiar al usuario con ajuste de molienda y advertencias de rango* (elegida).
- **Justificación**: Es el enfoque más predecible y fiel a las recetas de referentes como James Hoffmann y Tetsu Kasuya, evitando complicar el motor con curvas hidráulicas especulativas.
- **Trade-offs aceptados**: En dosis extremas fuera del rango habitual del cono, el tiempo real de drenaje (*drawdown*) puede variar unos segundos respecto al reloj teórico, lo cual se mitiga con el banner de advertencia de rango físico (`RN-RG-01`).

---

### DD-03 — Modo Espresso basado en rendimiento en taza (*Yield*) con 3 estilos estándar
- **Decisión**: Modelar Espresso con un flujo específico donde el usuario solo ingresa los gramos de café seco y recibe los 3 estilos clásicos por peso de bebida extraída: **Ristretto (`1:1.5`, 20–25 s)**, **Normale (`1:2`, 25–30 s)** y **Lungo (`1:3`, 30–35 s)**.
- **Contexto**: A diferencia del café filtrado (donde se mide el agua vertida), en Espresso la máquina inyecta agua a presión desde un tanque/caldera y el barista controla la extracción pesando la bebida que cae en la taza.
- **Alternativas consideradas**:
  1. *Usar la misma calculadora de agua de entrada que en V60* (incorrecto para cómo se prepara Espresso en la realidad).
  2. *Calculadora por dosis seca → Yield en 3 estilos* (elegida).
- **Justificación**: Respeta el estándar real de cafetería de especialidad y ofrece el equivalente exacto a los 3 niveles (fuerte/normal/liviano) del resto de la plataforma.
- **Trade-offs aceptados**: El motor tiene dos modos de cálculo (`filter_water_ratio` y `espresso_yield_ratio`), ambos cubiertos por tests unitarios.

---

### DD-04 — Animación SVG procedural basada en primitivas reutilizables
- **Decisión**: Construir las animaciones del temporizador combinando siluetas de recipientes con un conjunto acotado de primitivas SVG reutilizables (nivel de agua, chorro de vertido, cama de café, cuchara/paleta revolviendo, émbolo) controladas por el estado de la fase.
- **Contexto**: Diseñar animaciones cuadro a cuadro o complejas específicas para cada paso de 6 cafeteras demoraría meses y aumentaría el peso de la web.
- **Alternativas consideradas**:
  1. *Videos o archivos Lottie por cada método y paso* (pesados, difíciles de mantener y no se adaptan dinámicamente al porcentaje de agua).
  2. *Primitivas SVG parametrizadas por código* (elegida).
- **Justificación**: Peso mínimo (< 15 KB para todas las escenas), 60 fps en móviles y escalabilidad inmediata si en el futuro se agregan más cafeteras (ej. Moka, Clever, Kalita).
- **Trade-offs aceptados**: Estilo visual limpio y esquemático/ilustrativo en lugar de hiperrealista.

---

### DD-05 — Contenido estático validado con Zod e `i18n` desacoplado en un único repositorio privado
- **Decisión**: Gestionar todo el proyecto en un único repositorio privado con ramas (`dev` / `main`), almacenando recetas, fichas de wiki y textos de interfaz en archivos estructurados validados con Zod y desacoplados para internacionalización (`i18n`).
- **Contexto**: El autor editará el contenido desde el código en el MVP, pero planea abrir o traducir el contenido a otros idiomas en el futuro (con IA o colaboradores).
- **Alternativas consideradas**:
  1. *Mantener dos repositorios separados (`dev` y `main`)* (descartado por fricción de sincronización).
  2. *Integrar un CMS headless externo desde el día 1* (descartado para mantener costo $0 y cero dependencias externas en el MVP).
  3. *Un solo repo con ramas + datos estáticos tipados e i18n desde v1* (elegida).
- **Justificación**: Permite flujo Git limpio, despliegues de preview automáticos en Vercel/Netlify y traducción futura directa sin tocar componentes React.
- **Trade-offs aceptados**: Cualquier cambio de texto o receta en v1 requiere un commit/push.

---

## Supuestos inferidos

### SU-01 — Uso de balanza digital en gramos por parte del usuario
- **Supuesto**: Quien utiliza la guía interactiva dispone (en la mayoría de los casos) de una balanza de cocina en gramos (`g` / `ml`, asumiendo densidad del agua $1\text{ ml} \approx 1\text{ g}$).
- **Origen**: Enfoque en café de especialidad, recetas por peso y referentes como Hoffmann/Kasuya.
- **Riesgo si es falso**: Usuarios principiantes sin balanza podrían no saber cuántos gramos representa una cuchara.
- **Cómo validar / mitigar**: Incluir en la UI una pequeña equivalencia orientativa opcional (ej. *"1 cucharada sopera colmada ≈ 7–8 g de café"*).

### SU-02 — Permisos de audio y pantalla en navegadores móviles modernos
- **Supuesto**: El usuario inicia el temporizador mediante un toque directo en el botón **Iniciar**, lo cual es suficiente para desbloquear `Web Audio API` y `Screen Wake Lock API` en iOS Safari (16.4+) y Chrome Android.
- **Origen**: Especificaciones W3C/WebKit de autoplay y Wake Lock.
- **Riesgo si es falso**: Si el teléfono tiene el interruptor físico de silencio activado (iPhone) o está en modo "Ahorro de batería extremo", el sonido o el Wake Lock pueden ser ignorados por el sistema operativo.
- **Cómo validar / mitigar**: Acompañar siempre las alertas sonoras con feedback visual claro (destello suave de cambio de fase) para que la guía sea 100% usable incluso en silencio.
