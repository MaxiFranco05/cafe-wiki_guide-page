# Funcionalidades

Organizadas por **épica** y luego por **historia de usuario** (`US-NNN`).

---

## Épica 1: Catálogo de Métodos y Escalado Dinámico de Recetas

### US-001 — Selección rápida de método de preparación
**Como** preparador diario  
**Quiero** elegir cualquiera de las 6 cafeteras del MVP desde una pantalla principal directa  
**Para** acceder de inmediato a su estación de preparación sin leer artículos introductorios largos.

**Criterios de aceptación**:
- [ ] CA-1: La pantalla de inicio muestra los 6 métodos (Hario V60, Chemex, Melitta, AeroPress, Prensa Francesa, Espresso) con ilustración SVG, tiempo estimado y ratio base.
- [ ] CA-2: Al seleccionar un método, carga su vista de preparación en menos de 100 ms con el perfil "Normal" (o "Normale" en Espresso) y la dosis por defecto pre-cargada.

**Reglas relacionadas**: `RN-BR-05`, `RN-BR-06`, `RN-I18N-01`

---

### US-002 — Escalado bidireccional Café ↔ Agua con 3 niveles de intensidad
**Como** preparador diario o home barista  
**Quiero** elegir entre 3 intensidades (Liviano, Normal, Fuerte) y modificar los gramos de café o los mililitros de agua  
**Para** que el sistema recalcule automáticamente la variable opuesta y los gramos exactos de cada fase de vertido.

**Criterios de aceptación**:
- [ ] CA-1: Cambiar de intensidad actualiza el ratio activo y recalcula el agua total manteniendo la dosis de café actual.
- [ ] CA-2: Editar los gramos de café recalcula instantáneamente el agua total y las masas parciales (`phaseWaterGrams` y `targetCumulativeGrams`) de todas las fases de la receta.
- [ ] CA-3: Editar los mililitros de agua recalcula instantáneamente los gramos de café necesarios (con precisión de `0.1 g`) y todas las fases de vertido.
- [ ] CA-4: Los tiempos de cada fase permanecen fijos al escalar y se actualiza el tip dinámico de molienda si la dosis es pequeña o grande.

**Reglas relacionadas**: `RN-BR-01`, `RN-BR-02`, `RN-BR-03`, `RN-BR-04`, `RN-BR-05`

---

### US-003 — Calculadora y guía de Espresso por rendimiento (Yield)
**Como** home barista preparando Espresso  
**Quiero** ingresar únicamente los gramos de café seco en mi portafiltro  
**Para** ver las 3 opciones estándar de extracción (Ristretto `1:1.5`, Normale `1:2` y Lungo `1:3`) con el peso de bebida objetivo en taza y su ventana de segundos.

**Criterios de aceptación**:
- [ ] CA-1: En la vista de Espresso solo se solicita como entrada la dosis de café seco en gramos (por defecto `18 g`).
- [ ] CA-2: Se presentan las 3 tarjetas/perfiles (`Ristretto`, `Normale`, `Lungo`) mostrando el *yield* exacto en gramos (ej. `27 g`, `36 g`, `54 g` para `18 g`) y el tiempo objetivo (`20–25 s`, `25–30 s`, `30–35 s`).
- [ ] CA-3: Al elegir uno de los 3 estilos, el temporizador y la animación SVG se configuran con la duración y caudal correspondientes.

**Reglas relacionadas**: `RN-BR-06`, `RN-RG-03`

---

### US-004 — Advertencias por dosis o volumen fuera del rango físico
**Como** preparador  
**Quiero** recibir un aviso claro si ingreso una cantidad de café o agua inusual para mi cafetera  
**Para** evitar que el filtro rebalse o que la extracción falle por una cama de café demasiado fina o excesiva.

**Criterios de aceptación**:
- [ ] CA-1: Si los gramos de café o ml de agua están por debajo del mínimo o por encima del máximo configurado en `RangeThreshold`, se muestra un banner de advertencia contextual explicando el motivo físico.
- [ ] CA-2: La advertencia no bloquea el uso de la calculadora ni del temporizador (salvo valores inválidos $\le 0$).
- [ ] CA-3: Si el usuario vuelve a ingresar un valor dentro del rango normal, la advertencia desaparece inmediatamente.

**Reglas relacionadas**: `RN-RG-01`, `RN-RG-02`, `RN-RG-03`

---

## Épica 2: Temporizador Paso a Paso, Escena SVG Procedural y UX de Cocina

### US-005 — Temporizador interactivo paso a paso sin deriva
**Como** preparador en la mesada  
**Quiero** iniciar, pausar, reiniciar o avanzar entre las fases de la receta con un reloj preciso  
**Para** ejecutar cada vertido, agitación o espera en el segundo exacto.

**Criterios de aceptación**:
- [ ] CA-1: Muestra el tiempo total transcurrido, el tiempo restante de la fase actual, la instrucción clara del paso activo (con gramos del paso y gramos acumulados en balanza) y la vista previa del siguiente paso.
- [ ] CA-2: El cálculo del tiempo usa timestamps monotónicos (`performance.now()`), manteniendo exactitud aunque el dispositivo tenga carga de CPU o cambie brevemente de foco.
- [ ] CA-3: Permite pausar, reanudar y reiniciar a `00:00`.

**Reglas relacionadas**: `RN-UX-01`, `RN-BR-02`

---

### US-006 — Animación SVG procedural sincronizada con la preparación
**Como** usuario preparando café  
**Quiero** ver una ilustración animada que refleje en tiempo real la acción de la fase actual (vertido, nivel de agua, agitación con cuchara, presión de émbolo)  
**Para** comprender visualmente qué hacer en cada momento sin tener que leer párrafos largos.

**Criterios de aceptación**:
- [ ] CA-1: La escena SVG renderiza el recipiente del método activo y reutiliza primitivas modulares (`PourStream`, `LiquidLevel`, `CoffeeBed`, `StirringSpoon`, `Plunger`, `PortafilterDrops`).
- [ ] CA-2: El nivel de líquido interpola suavemente entre `liquidFillStartRatio` y `liquidFillEndRatio` según el porcentaje de avance de la fase activa.
- [ ] CA-3: Respeta `prefers-reduced-motion` reduciendo animaciones continuas de partículas/turbulencia a estados estáticos claros cuando el sistema operativo lo solicita.

**Reglas relacionadas**: `RN-UX-04`

---

### US-007 — Modo Cocina: Pantalla siempre activa (`Wake Lock`) y alertas sonoras (`Web Audio`)
**Como** preparador con las manos ocupadas sosteniendo la pava  
**Quiero** que la pantalla del móvil no se apague sola y que suene un aviso al cambiar de fase  
**Para** no tener que tocar el teléfono con las manos ocupadas o mojadas durante la extracción.

**Criterios de aceptación**:
- [ ] CA-1: Al iniciar el temporizador se activa `Screen Wake Lock API` y se muestra un indicador de estado ("Pantalla activa").
- [ ] CA-2: Si el navegador no soporta Wake Lock, la aplicación continúa funcionando sin errores y muestra un aviso discreto.
- [ ] CA-3: Al cambiar de fase (y en la cuenta regresiva 3-2-1 previa) suena una alerta sintetizada mediante `Web Audio API`, con botón accesible de Silenciar/Activar sonido (`Mute/Unmute`) persistido en `localStorage`.

**Reglas relacionadas**: `RN-UX-02`, `RN-UX-03`

---

### US-008 — Funcionamiento Offline como PWA
**Como** usuario en una cocina con mala señal o sin datos móviles  
**Quiero** abrir la web o el acceso directo instalado y usar todas las calculadoras, timers y fichas de la wiki sin conexión  
**Para** no depender de internet al preparar café.

**Criterios de aceptación**:
- [ ] CA-1: Incluye `manifest.webmanifest` válido con íconos y configuración `standalone` mobile-first.
- [ ] CA-2: El Service Worker precachea el shell de la aplicación, las ilustraciones SVG y todo el catálogo de datos (recetas, wiki y rueda SCA).
- [ ] CA-3: En modo avión tras la primera carga, todas las rutas (`/`, `/brew/*`, `/wiki/*`, `/flavor-wheel`) funcionan sin errores de red.

**Reglas relacionadas**: `RN-I18N-02`

---

## Épica 3: Wiki Sensorial y Rueda de Sabores Interactiva (SCA)

### US-009 — Explorador de Wiki de Orígenes, Varietales y Procesos
**Como** explorador de café de especialidad  
**Quiero** consultar fichas claras y estructuradas sobre orígenes, varietales y procesos de beneficio  
**Para** conocer qué aromas, acidez, cuerpo y dulzor esperar de mi bolsa de café y con qué método prepararla mejor.

**Criterios de aceptación**:
- [ ] CA-1: Permite filtrar y buscar entradas por categoría (`Orígenes`, `Varietales`, `Procesos`) o por nota sensorial.
- [ ] CA-2: Cada ficha muestra barras/indicadores visuales de Acidez, Dulzor, Cuerpo y Amargor (`1..5`), características clave (altitud, genética o fermentación), notas de cata vinculadas a la rueda SCA y métodos/intensidades recomendados.
- [ ] CA-3: Desde los métodos recomendados en una ficha se puede navegar con 1 toque a `/brew/:methodSlug` con la intensidad sugerida pre-seleccionada.

**Reglas relacionadas**: `RN-I18N-01`, `RN-I18N-02`

---

### US-010 — Rueda de Sabores Interactiva estilo SCA
**Como** entusiasta o explorador realizando una cata  
**Quiero** interactuar con una rueda de sabores jerárquica de 3 niveles (Familia → Subfamilia → Descriptor)  
**Para** identificar qué estoy percibiendo en mi taza y descubrir qué orígenes o procesos suelen tener ese perfil.

**Criterios de aceptación**:
- [ ] CA-1: Renderiza una rueda SVG interactiva (y vista alternativa de árbol/acordeón táctil para pantallas muy pequeñas) con las 9 familias sensoriales principales y sus subdivisiones.
- [ ] CA-2: Al tocar o hacer clic en un segmento o descriptor, hace zoom/selección y despliega un panel con la descripción sensorial de esa nota y enlaces a las fichas de Wiki (`Orígenes`, `Varietales`, `Procesos`) donde predomina.

**Reglas relacionadas**: `RN-I18N-01`, `RN-I18N-02`
