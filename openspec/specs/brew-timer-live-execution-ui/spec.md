# brew-timer-live-execution-ui Specification

## Purpose

Define la ejecución en vivo de una receta en la estación de preparación `/brew/:methodSlug`: reloj sin deriva, instrucción activa con gramos, controles de ciclo de vida, escena SVG sincronizada, Modo Cocina (pantalla activa y alertas sonoras silenciables) y cambio rápido de cafetera (`US-005`, `US-006`, `US-007`).

## Requirements

### Requirement: Reloj en vivo y cuenta regresiva de fase
La estación SHALL mostrar en formato tabular `MM:SS` el tiempo total transcurrido de la preparación y el tiempo restante de la fase activa, ambos derivados del tiempo monotónico real y no de la acumulación de ticks, junto con un indicador visual del avance de la fase activa.

#### Scenario: Estado inicial antes de iniciar
- **WHEN** el usuario abre `/brew/v60` sin haber iniciado el temporizador
- **THEN** el reloj principal muestra `00:00`, la cuenta regresiva muestra la duración completa de la fase 1 y el avance de fase está en 0%

#### Scenario: Reloj durante la ejecución
- **WHEN** el temporizador lleva 37 segundos corriendo en una receta cuya fase 1 termina a los 45 s
- **THEN** el reloj principal muestra `00:37` y la cuenta regresiva de fase muestra `00:08`

#### Scenario: Pestaña en segundo plano
- **WHEN** el temporizador está corriendo y la pestaña queda oculta 20 segundos y luego vuelve a ser visible
- **THEN** el reloj muestra el tiempo real transcurrido incluyendo esos 20 segundos, sin pérdida ni duplicación

### Requirement: Orden de la estación en mobile
En pantallas menores a 1024 px la estación SHALL mantener el orden: controles de dosis, intensidad y molienda → temporizador visual → cronograma de pasos en texto, en todos los estados; fuera de `idle`, la acción principal y Reiniciar SHALL quedar fijas sobre la barra de pestañas mientras el temporizador esté visible.

#### Scenario: Ejecución en un teléfono
- **WHEN** el usuario inicia el temporizador en un viewport de 390 px
- **THEN** el orden de bloques no cambia y el botón Pausar permanece al alcance sobre la barra de pestañas

### Requirement: Instrucción activa y vista previa del siguiente paso
La estación SHALL mostrar la instrucción de la fase activa con los gramos de agua del paso y el objetivo acumulado en balanza, y SHALL mostrar el título y objetivo acumulado de la fase siguiente, o una indicación de último paso cuando no exista siguiente.

#### Scenario: Fase de vertido con siguiente paso
- **WHEN** la fase activa es un vertido de 150 g con objetivo acumulado 200 g y existe una fase siguiente
- **THEN** la tarjeta activa muestra `150 g` del paso y `200 g` en balanza, y la vista previa muestra el título de la fase siguiente con su objetivo acumulado

#### Scenario: Última fase
- **WHEN** la fase activa es la última de la receta
- **THEN** la vista previa del siguiente paso se reemplaza por la indicación de último paso

#### Scenario: Espresso
- **WHEN** el método activo es Espresso
- **THEN** la tarjeta activa expresa el objetivo como rendimiento en taza en gramos, sin gramos de vertido por paso

### Requirement: Señal visual de cambio de fase
Al cambiar la fase activa, la estación SHALL emitir un destello visual breve en la tarjeta de instrucción y anunciar la nueva fase a tecnologías de asistencia mediante una región viva cortés, de modo que la guía sea usable aun con el audio silenciado. Con movimiento reducido, el destello SHALL ser un cambio de color sin animación de escala ni desplazamiento.

#### Scenario: Transición automática
- **WHEN** el temporizador cruza el final de la fase 1 mientras corre
- **THEN** la tarjeta muestra la fase 2, se aplica el destello visual y la región viva anuncia el título de la fase 2

#### Scenario: Movimiento reducido
- **WHEN** `prefers-reduced-motion: reduce` está activo y ocurre un cambio de fase
- **THEN** el destello se resuelve solo con color y opacidad, sin transformaciones

### Requirement: Controles de ciclo de vida del temporizador
La estación SHALL ofrecer controles táctiles de al menos 48 × 48 px para Iniciar, Pausar, Reanudar y Reiniciar a `00:00`, mostrando en cada estado (`idle`, `running`, `paused`, `completed`) solo las acciones válidas, con etiquetas accesibles resueltas por i18n.

#### Scenario: Iniciar
- **WHEN** el usuario pulsa Iniciar con una dosis válida
- **THEN** el temporizador pasa a `running`, el reloj comienza a avanzar y el control principal cambia a Pausar

#### Scenario: Pausar y reanudar
- **WHEN** el usuario pausa a los `01:10` y reanuda 30 segundos de reloj después
- **THEN** mientras está pausado el reloj permanece en `01:10`, y al reanudar continúa desde `01:10`

#### Scenario: Reiniciar
- **WHEN** el usuario pulsa Reiniciar en cualquier estado distinto de `idle`
- **THEN** el temporizador vuelve a `idle`, el reloj muestra `00:00` y la fase activa es la fase 1

#### Scenario: Dosis inválida
- **WHEN** el campo de café está vacío o fuera de formato
- **THEN** Iniciar está deshabilitado y no se crea ninguna ejecución

### Requirement: Salto manual entre fases
La estación SHALL permitir saltar a la fase anterior o siguiente, y a cualquier fase desde el indicador de pasos, posicionando el tiempo al inicio de la fase destino y conservando el estado de ejecución (`running` sigue corriendo, `paused` sigue pausado).

#### Scenario: Saltar adelante mientras corre
- **WHEN** el temporizador corre en la fase 2 y el usuario pulsa siguiente fase
- **THEN** el reloj se posiciona en el `startTimeSeconds` de la fase 3 y continúa corriendo

#### Scenario: Límites
- **WHEN** la fase activa es la primera
- **THEN** el control de fase anterior está deshabilitado; y en la última fase, el de siguiente fase está deshabilitado

### Requirement: Finalización de la preparación
Al alcanzar la duración total, la estación SHALL detener el reloj en la duración total, mostrar un estado de preparación lista con la acción de reiniciar, liberar la pantalla activa y reproducir la señal de finalización si el sonido no está silenciado.

#### Scenario: Receta completa
- **WHEN** el temporizador alcanza el `totalDurationSeconds` de la receta
- **THEN** el estado es `completed`, el reloj queda fijo en la duración total, el badge de pantalla activa desaparece y se ofrece Reiniciar

### Requirement: Bloqueo de la receta durante la ejecución
Mientras el temporizador esté `running` o `paused`, la estación SHALL impedir modificar dosis de café, agua e intensidad o estilo, indicándolo visualmente; los controles SHALL volver a ser editables en `idle` o `completed`.

#### Scenario: Intento de edición en ejecución
- **WHEN** el temporizador está `running`
- **THEN** los campos de café, agua e intensidad están deshabilitados y muestran un aviso de receta bloqueada

#### Scenario: Desbloqueo al reiniciar
- **WHEN** el usuario pulsa Reiniciar
- **THEN** los campos vuelven a ser editables con los valores que tenían al iniciar

### Requirement: Escena SVG sincronizada con el temporizador
Mientras el temporizador no esté en `idle`, la escena procedural SHALL representar la directiva SVG de la fase activa con el progreso real de esa fase; en `idle` SHALL previsualizar la fase seleccionada en su estado final, sin control manual de progreso. Las primitivas de la escena SHALL NOT superponerse entre sí de forma físicamente imposible.

#### Scenario: Nivel de líquido en vivo
- **WHEN** el temporizador está a mitad de una fase con `liquidFillStartRatio` 0.2 y `liquidFillEndRatio` 0.6
- **THEN** la escena muestra el nivel de líquido en 0.4 y las primitivas declaradas en la directiva de esa fase

#### Scenario: Drenaje final de pour-over
- **WHEN** el temporizador avanza por la fase de drenaje final de V60, Chemex o Melitta
- **THEN** la jarra inferior conserva el café y termina llena; nunca se vacía al terminar la receta

#### Scenario: Sin control manual de progreso
- **WHEN** el usuario abre la estación en cualquier estado
- **THEN** no se muestra ningún deslizable de avance o nivel de llenado de la escena

#### Scenario: Escenas sin colisiones
- **WHEN** una fase vierte agua y revuelve con cuchara, o la AeroPress se está llenando
- **THEN** el vertido se muestra antes que la cuchara (nunca ambos a la vez) y el émbolo de la AeroPress no aparece durante el llenado
- **AND** al presionar, el sello de la AeroPress acompaña la superficie del líquido y la perilla de la prensa francesa queda visible y por encima de la tapa

### Requirement: Indicador de pantalla activa
Al iniciar o reanudar, la estación SHALL solicitar mantener la pantalla encendida y mostrar el indicador "Pantalla activa" mientras el bloqueo esté vigente; si el navegador no lo soporta o lo rechaza, SHALL mostrar un aviso discreto sin interrumpir el temporizador ni producir errores.

#### Scenario: Navegador compatible
- **WHEN** el usuario pulsa Iniciar en un navegador con Wake Lock
- **THEN** se muestra el badge "Pantalla activa" y desaparece al pausar, reiniciar o completar

#### Scenario: Navegador sin soporte
- **WHEN** el usuario pulsa Iniciar en un navegador sin Wake Lock
- **THEN** el temporizador corre normalmente y se muestra un aviso discreto de que la pantalla podría apagarse

### Requirement: Alertas sonoras silenciables y persistentes
La estación SHALL reproducir los pulsos de cuenta regresiva 3-2-1, el tono de nueva fase y la señal de finalización emitidos por el temporizador, desbloqueando el audio dentro del gesto de Iniciar, y SHALL ofrecer un botón accesible Silenciar / Activar sonido cuyo valor persiste entre visitas.

#### Scenario: Alerta de cambio de fase
- **WHEN** el sonido está activo y el temporizador cruza a una nueva fase
- **THEN** se reproduce el tono de nueva fase una sola vez

#### Scenario: Silenciar persistido
- **WHEN** el usuario pulsa Silenciar y recarga la página
- **THEN** el botón aparece en estado silenciado, `aria-pressed` refleja el estado y no se reproduce ningún sonido durante la ejecución

#### Scenario: Audio no disponible
- **WHEN** el navegador no soporta Web Audio
- **THEN** el temporizador y las señales visuales funcionan sin errores

### Requirement: Selector rápido de cafetera
La estación SHALL ofrecer en su encabezado un selector accesible con los 6 métodos que navega a `/brew/<slug>` del método elegido sin volver al inicio, y SHALL recordar el método visitado como última cafetera usada. Si el temporizador está en ejecución, el cambio SHALL requerir confirmación explícita.

#### Scenario: Cambio en reposo
- **WHEN** el temporizador está en `idle` y el usuario elige Chemex en el selector
- **THEN** la ruta cambia a `/brew/chemex` y la estación muestra la receta por defecto de Chemex

#### Scenario: Cambio durante la ejecución
- **WHEN** el temporizador está `running` y el usuario elige otro método
- **THEN** se pide confirmación; si confirma, la ejecución se descarta y se navega, y si cancela, el temporizador sigue sin cambios

### Requirement: Limpieza al abandonar la estación
Al salir de la estación o cambiar de método, el sistema SHALL detener el loop del temporizador y liberar la pantalla activa, sin dejar sonidos ni bloqueos pendientes.

#### Scenario: Navegar a la wiki en ejecución
- **WHEN** el temporizador está corriendo y el usuario navega a `/wiki`
- **THEN** el bloqueo de pantalla se libera y no se reproduce ninguna alerta posterior
