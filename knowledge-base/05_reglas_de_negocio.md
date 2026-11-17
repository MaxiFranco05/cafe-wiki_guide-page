# Reglas de Negocio

Cada regla tiene un código único `RN-{DOMINIO}-{NN}` para trazabilidad directa con las historias de usuario y los tests unitarios.

## Dominio: Motor de Escalado y Preparación (`RN-BR`)

- **RN-BR-01 (Escalado bidireccional en métodos de filtro e inmersión)**: En V60, Chemex, Melitta, AeroPress y Prensa Francesa, cuando el usuario modifica los gramos de café ($D$), el agua total ($W$) se recalcula como $W = \text{round}(D \times R)$, donde $R$ es el ratio del perfil seleccionado (Liviano, Normal o Fuerte). Si el usuario modifica el agua total ($W$), la dosis de café se recalcula como $D = \text{round}(W / R, 1)$.
- **RN-BR-02 (Conservación de proporciones por fase)**: Al escalar una receta de filtro/inmersión, el peso de agua de cada fase individual ($W_i$) se calcula multiplicando el agua total ($W$) por la fracción asignada a esa fase ($f_i = \text{waterShare}$), garantizando que la suma acumulada al final del último vertido sea exactamente igual a $W$ (ajustando cualquier diferencia de redondeo de $\pm 1\text{ g}$ en el vertido final).
- **RN-BR-03 (Estabilidad de tiempos — Opción A)**: Al variar la dosis de café o agua en métodos de filtro e inmersión, los tiempos de inicio y fin (`startTimeSeconds`, `endTimeSeconds`) de cada fase (bloom, vertidos, agitación, reposo) **permanecen fijos** según la receta base, evitando distorsionar los tiempos químicos de desgasificación e infusión.
- **RN-BR-04 (Recomendación dinámica de molienda según dosis)**: Dado que los tiempos permanecen fijos (**RN-BR-03**) y la altura de la cama de café cambia la resistencia hidráulica (Ley de Darcy):
  - Si $D < \text{smallDoseGrindTipThresholdGrams}$, el sistema muestra el tip dinámico: *"Dosis pequeña: moler ligeramente más fino de lo habitual para evitar una caída demasiado rápida y sub-extracción"*.
  - Si $D > \text{largeDoseGrindTipThresholdGrams}$, el sistema muestra el tip dinámico: *"Dosis grande: moler ligeramente más grueso para evitar atascos y sobre-extracción"*.
  - Si $D$ está dentro del rango medio, muestra la referencia de molienda estándar del método.
- **RN-BR-05 (Perfiles de intensidad en filtro/inmersión)**: Cada método sin presión ofrece 3 perfiles estándar claramente diferenciados:
  - **Liviano (Claridad / Floral)**: ratio más abierto (ej. `1:17` en Pour-Over, `1:16` en Prensa Francesa).
  - **Normal (Equilibrado / Golden Cup)**: ratio estándar de especialidad (ej. `1:16` o `1:16.7` en Pour-Over, `1:15` en Prensa Francesa).
  - **Fuerte (Cuerpo / Intenso)**: ratio más concentrado (ej. `1:14` o `1:15` en Pour-Over, `1:12`–`1:13` en Prensa/AeroPress).
- **RN-BR-06 (Modo Espresso por rendimiento en taza / Yield)**: En Espresso, el usuario ingresa únicamente la **dosis de café seco en gramos** ($D$), y el sistema calcula simultáneamente los 3 estilos basados en el peso de bebida extraída ($Y = D \times R_{\text{yield}}$):
  - **Fuerte — Ristretto (`1:1.5`)**: $Y = 1.5 \times D$ gramos de bebida en una ventana objetivo de **20 a 25 segundos**.
  - **Normal — Normale (`1:2.0`)**: $Y = 2.0 \times D$ gramos de bebida en una ventana objetivo de **25 a 30 segundos**.
  - **Liviano — Lungo (`1:3.0`)**: $Y = 3.0 \times D$ gramos de bebida en una ventana objetivo de **30 a 35 segundos**.

## Dominio: Límites Físicos y Advertencias (`RN-RG`)

- **RN-RG-01 (Advertencias no bloqueantes por rango físico)**: Si el usuario ingresa una cantidad de café ($D$) o de agua ($W$) fuera de `[minCoffeeGrams, maxCoffeeGrams]` o `[minWaterMl, maxWaterMl]` del método activo, el sistema **debe mostrar una alerta visual destacada** explicando el riesgo físico (ej. desborde del cono en un filtro tamaño 02, cama de café insuficiente que genera *channeling*, o canasta de portafiltro sobrecargada), pero **sin bloquear el cálculo** por si el usuario posee un accesorio de tamaño especial (ej. V60-03 o Chemex de 10 tazas).
- **RN-RG-02 (Restricción de valores inválidos)**: No se permiten valores negativos, cero, ni `NaN`. Cualquier entrada $\le 0$ o vacía se sanea o impide iniciar el temporizador hasta contar con un número positivo válido ($D \ge 1\text{ g}$).
- **RN-RG-03 (Umbrales de referencia iniciales por método)**:

| Método | Café Mín (g) | Café Máx (g) | Agua Mín (ml/g) | Agua Máx (ml/g) | Motivo físico del límite |
|---|---|---|---|---|---|
| **Hario V60 (estándar 02)** | 10 g | 36 g | 150 ml | 600 ml | Debajo de 10 g la cama es muy delgada; arriba de 600 ml requiere múltiples vertidos por capacidad del cono 02. |
| **Chemex (estándar 6 tazas)** | 20 g | 55 g | 300 ml | 900 ml | Debajo de 20 g el cono ancho drena de forma irregular; arriba de 900 ml excede el cuello de madera. |
| **Melitta (cono #2 / #4)** | 10 g | 35 g | 150 ml | 550 ml | Drenaje de 1 o 2 orificios; dosis mayores a 35 g se estancan y sobre-extraen. |
| **AeroPress (estándar)** | 11 g | 30 g | 150 ml | 260 ml (en cámara) | La cámara física de la AeroPress estándar admite ~250–260 ml máximos sin bypass (o requiere dilución posterior). |
| **Prensa Francesa (350–1000 ml)**| 12 g | 65 g | 180 ml | 1000 ml | Límites habituales de jarras domésticas de 3 a 8 tazas. |
| **Espresso (canasta doble)** | 14 g | 22 g | — *(Yield: 21 g)* | — *(Yield: 66 g)* | Canastas dobles estándar de 58 mm operan entre 14 g y 22 g sin tocar la ducha del grupo. |

## Dominio: Temporizador, Audio y UX de Cocina (`RN-UX`)

- **RN-UX-01 (Precisión temporal sin deriva)**: El temporizador debe calcular el tiempo transcurrido mediante diferencia de timestamps monotónicos (`performance.now()`) y no acumulando ticks de `setInterval`, garantizando que si el hilo se retrasa o la pestaña pierde foco un instante, el reloj refleje el segundo real exacto.
- **RN-UX-02 (Ciclo de vida de `Screen Wake Lock`)**:
  - Se solicita `navigator.wakeLock.request('screen')` al presionar **Iniciar** en el temporizador.
  - Se libera automáticamente al **Pausar**, **Reiniciar** o **Completar** la receta.
  - Si el documento emite `visibilitychange` hacia `visible` mientras el temporizador sigue en estado `running`, se vuelve a solicitar el bloqueo de pantalla automáticamente.
- **RN-UX-03 (Desbloqueo y síntesis de `Web Audio API`)**:
  - La instancia de `AudioContext` se inicializa o reanuda (`resume()`) dentro del manejador de evento de usuario del botón **Iniciar** (cumpliendo la política de autoplay de iOS Safari y Chrome Android).
  - Se emite un pulso sonoro corto en los últimos 3 segundos antes de cambiar de fase y un acorde distintivo al iniciar la nueva fase y al terminar la preparación.
- **RN-UX-04 (Sincronización de escena SVG procedural)**: En cada fotograma o actualización del temporizador, el progreso normalizado de la fase actual ($p \in [0, 1]$) interpola el nivel de líquido entre `liquidFillStartRatio` y `liquidFillEndRatio` y activa únicamente las primitivas declaradas en `svgDirective` (`pourStream`, `agitator`, `plungerState`).

## Dominio: Internacionalización e Integridad de Datos (`RN-I18N`)

- **RN-I18N-01 (Cero strings hardcodeados en componentes y motor)**: Todo texto visible al usuario (nombres de métodos, fases, advertencias de rango, tips de molienda, fichas de la wiki y descriptores de la rueda de sabores) debe resolverse a través de claves de diccionario (`es` en v1.0) para permitir agregar nuevos idiomas sin modificar componentes ni lógica de negocio.
- **RN-I18N-02 (Validación de catálogo en test/build)**: Ninguna receta ni ficha de la wiki puede incorporarse al bundle si no pasa la validación de esquemas Zod (suma de porcentajes de agua = 100%, tiempos contiguos sin huecos negativos, referencias válidas entre Wiki y nodos de la rueda SCA).
