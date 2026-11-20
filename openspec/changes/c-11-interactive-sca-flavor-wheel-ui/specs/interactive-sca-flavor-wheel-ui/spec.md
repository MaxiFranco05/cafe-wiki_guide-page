# interactive-sca-flavor-wheel-ui

## Purpose

Define cómo se explora la Rueda de Sabores SCA en `/flavor-wheel`: una rueda radial de 3 anillos con zoom por rama y navegación por teclado, un acordeón táctil para pantallas angostas que comparte la misma selección, un panel con la ruta, la nota de cata, la presencia en la Wiki y las fichas relacionadas de cada nodo, una guía inicial para quien recién empieza a catar, y la selección por enlace profundo `?node=` con regreso a la ficha de origen `?from=` (`US-010`, Flujo 4).

## ADDED Requirements

### Requirement: Rueda radial de tres anillos
En pantallas de 768 px de ancho o más, la vista `/flavor-wheel` SHALL mostrar una rueda radial con 3 anillos concéntricos: familias (anillo interior), subfamilias (anillo medio) y descriptores (anillo exterior). Cada segmento SHALL ocupar un ángulo proporcional a la cantidad de descriptores que contiene, SHALL usar el color semántico del nodo en el catálogo y SHALL mostrar su nombre localizado cuando el segmento tenga espacio suficiente para leerlo; el nombre de todo segmento SHALL estar disponible como nombre accesible aunque no se dibuje.

#### Scenario: Rueda completa al abrir
- **WHEN** el usuario abre `/flavor-wheel` sin parámetros en una pantalla de 1440 px
- **THEN** la rueda muestra las 9 familias, las 20 subfamilias y los 59 descriptores del catálogo, sin ningún nodo seleccionado

#### Scenario: Proporción de los segmentos
- **WHEN** se dibuja la rueda completa
- **THEN** el ángulo de cada familia y subfamilia es proporcional a la cantidad de descriptores que contiene, y la suma de los ángulos de cada anillo es 360°

### Requirement: Zoom por rama
Seleccionar cualquier nodo SHALL ampliar la rama de su familia para que ocupe la rueda completa: la familia en el centro, sus subfamilias en el anillo medio y sus descriptores en el anillo exterior. El centro SHALL ofrecer volver a la rueda completa. Dentro de la rama ampliada, el nodo seleccionado, sus ancestros y sus descendientes SHALL quedar resaltados y el resto de los segmentos visibles SHALL atenuarse. Las transiciones SHALL omitirse cuando el usuario prefiera movimiento reducido.

#### Scenario: Zoom en una familia
- **WHEN** el usuario toca la familia **Frutal**
- **THEN** la rueda muestra solo la rama Frutal en 360° con sus 4 subfamilias y 14 descriptores, el centro indica **Frutal** y ofrece volver a la rueda completa, y el panel muestra el detalle de **Frutal**

#### Scenario: Seleccionar una subfamilia
- **WHEN** con la rama Frutal ampliada, el usuario toca **Frutos rojos**
- **THEN** Frutos rojos y sus 4 descriptores quedan resaltados, las demás subfamilias de Frutal y sus descriptores se atenúan, y el panel muestra el detalle de **Frutos rojos**

#### Scenario: Seleccionar un descriptor
- **WHEN** el usuario toca el descriptor **Mora**
- **THEN** Mora y Frutos rojos quedan resaltados dentro de la rama Frutal, los demás segmentos visibles se atenúan, y el panel muestra el detalle de **Mora**

#### Scenario: Volver a la rueda completa
- **WHEN** con la rama Frutal ampliada, el usuario toca el centro
- **THEN** la rueda vuelve a mostrar las 9 familias y no queda ningún nodo seleccionado

#### Scenario: Movimiento reducido
- **WHEN** el sistema operativo indica preferencia por movimiento reducido y el usuario amplía una rama
- **THEN** la rueda pasa al nuevo estado sin animación

### Requirement: Navegación por teclado y accesibilidad de la rueda
La rueda SHALL ser operable sin puntero con un único punto de tabulación: las flechas izquierda y derecha SHALL mover el foco al segmento anterior o siguiente del mismo nivel (cíclico), la flecha abajo SHALL bajar al primer hijo, la flecha arriba SHALL subir al padre, Inicio y Fin SHALL ir al primer y último segmento del nivel, Enter o Espacio SHALL seleccionar el segmento enfocado, y Escape SHALL volver a la rueda completa. Mover el foco a un segmento que no está visible en el zoom actual (por ejemplo, a otra familia) SHALL ampliar la rama que lo contiene. Cada segmento SHALL exponer su nombre, nivel, posición entre sus hermanos y si está seleccionado o desplegado, y el segmento enfocado SHALL mostrar un indicador de foco visible.

#### Scenario: Recorrer familias con flechas
- **WHEN** el foco está en **Frutal** y el usuario presiona flecha derecha
- **THEN** el foco pasa a la siguiente familia en sentido horario y su nombre se anuncia

#### Scenario: Bajar y seleccionar con teclado
- **WHEN** el foco está en **Frutal**, el usuario presiona flecha abajo y luego Enter
- **THEN** el foco pasa a la primera subfamilia de Frutal y esa subfamilia queda seleccionada con el panel abierto

#### Scenario: Escape vuelve a la rueda completa
- **WHEN** la rama Frutal está ampliada y el foco está en un segmento, y el usuario presiona Escape
- **THEN** la rueda vuelve a mostrar las 9 familias y el foco queda en **Frutal**

### Requirement: Acordeón táctil en pantallas angostas
En pantallas de menos de 768 px, la vista SHALL mostrar como exploración principal un acordeón con las 9 familias; cada familia SHALL desplegar sus subfamilias y cada subfamilia sus descriptores, con su color semántico y nombre localizado, y con objetivos táctiles de al menos 44 px de alto. El acordeón y la rueda SHALL compartir la misma selección: seleccionar un nodo en uno SHALL reflejarse en el otro al cambiar el ancho de pantalla, y al abrir la vista con un nodo seleccionado el acordeón SHALL mostrar desplegada su ruta.

#### Scenario: Acordeón en mobile
- **WHEN** el usuario abre `/flavor-wheel` en una pantalla de 390 px
- **THEN** se muestra el acordeón con las 9 familias plegadas, cada una con su color y su cantidad de descriptores

#### Scenario: Seleccionar los tres niveles en el acordeón
- **WHEN** el usuario toca **Frutal**, luego **Frutos rojos** y luego **Mora**
- **THEN** Frutal y Frutos rojos quedan desplegados, Mora queda seleccionado y el panel muestra el detalle de **Mora**

#### Scenario: Selección compartida
- **WHEN** el usuario selecciona **Mora** en el acordeón y luego la pantalla pasa a 1440 px
- **THEN** la rueda muestra Mora seleccionado dentro de la rama Frutal ampliada

### Requirement: Panel de detalle del nodo
Al seleccionar cualquier nodo, la vista SHALL mostrar un panel (lateral en pantallas de 768 px o más, hoja inferior en pantallas angostas) con: la ruta jerárquica del nodo, en la que cada nivel superior se puede tocar para seleccionarlo; su nombre y color; su nota de cata localizada; los nodos hijos cuando es familia o subfamilia, cada uno seleccionable; y las fichas de Wiki en las que aparece ese nodo o alguno de sus descendientes, agrupadas en **Orígenes**, **Varietales** y **Procesos**, omitiendo los grupos vacíos. Si ninguna ficha lo menciona, el panel SHALL indicarlo. El panel SHALL poder cerrarse, lo que quita la selección, y en mobile SHALL cerrarse también con Escape y devolver el foco al nodo que lo abrió.

#### Scenario: Detalle de un descriptor con fichas
- **WHEN** el usuario selecciona **Mora**
- **THEN** el panel muestra la ruta **Frutal › Frutos rojos › Mora**, la nota de cata de Mora y las fichas de Wiki que incluyen Mora agrupadas por categoría

#### Scenario: Detalle de una familia
- **WHEN** el usuario selecciona **Frutal**
- **THEN** el panel muestra la nota de cata de Frutal, sus 4 subfamilias como opciones seleccionables, y las fichas que incluyen cualquier sabor de la familia

#### Scenario: Ruta navegable
- **WHEN** el panel muestra **Mora** y el usuario toca **Frutos rojos** en la ruta
- **THEN** Frutos rojos queda seleccionado y el panel muestra su detalle

#### Scenario: Nodo sin fichas relacionadas
- **WHEN** el usuario selecciona un nodo que ninguna ficha de la Wiki menciona
- **THEN** el panel muestra su nota de cata y un mensaje que indica que todavía no hay fichas con ese sabor

#### Scenario: Cerrar el panel
- **WHEN** el usuario cierra el panel
- **THEN** no queda ningún nodo seleccionado y la URL ya no incluye `node`

### Requirement: Navegación a fichas de Wiki relacionadas
Cada ficha listada en el panel SHALL mostrar su título localizado y SHALL navegar con un toque a la página de esa ficha en su sección de la Wiki (`/wiki/origenes/:entrySlug`, `/wiki/varietales/:entrySlug` o `/wiki/procesos/:entrySlug`), sin recargar la página.

#### Scenario: Ir a una ficha desde el panel
- **WHEN** el panel muestra **Mora** y el usuario toca la ficha **Kenia** en **Orígenes**
- **THEN** la aplicación navega a `/wiki/origenes/kenya`

### Requirement: Presencia del sabor en la Wiki
Al mostrar un nodo, el panel SHALL indicar en una línea cuántas fichas de la Wiki lo incluyen (a él o a sus descendientes) y cuántas son de cada sección, por ejemplo "Aparece en 9 fichas: 5 orígenes, 2 varietales, 2 procesos", omitiendo las secciones sin fichas. Si no aparece en ninguna, SHALL mostrarse solo el mensaje de que todavía no hay fichas con ese sabor.

#### Scenario: Familia con fichas en varias secciones
- **WHEN** el usuario selecciona **Frutal**
- **THEN** el panel muestra la cantidad total de fichas que incluyen algún sabor frutal y su reparto por sección, y la cantidad coincide con las fichas listadas debajo

#### Scenario: Descriptor en una sola ficha por sección
- **WHEN** el usuario selecciona **Mora**
- **THEN** el panel indica "Aparece en 2 fichas: 1 origen, 1 varietal"

### Requirement: Regreso a la ficha de origen
Cuando la vista se abre con el parámetro `from=<sección>/<slug>` y corresponde a una ficha existente de la Wiki, la vista SHALL mostrar en el encabezado un enlace **"Volver a {título de la ficha}"** que navega a esa ficha. El enlace SHALL mantenerse mientras el usuario cambia o quita la selección, y el parámetro `from` SHALL conservarse en la URL al actualizar `node`. Si `from` no corresponde a ninguna ficha, SHALL ignorarse sin error.

#### Scenario: Llegar desde una ficha
- **WHEN** el usuario abre `/flavor-wheel?node=fruity.berry.blackberry&from=origenes/kenya`
- **THEN** el encabezado muestra **"Volver a Kenia"**, y tocarlo navega a `/wiki/origenes/kenya`

#### Scenario: El regreso sobrevive a otras selecciones
- **WHEN** con `from=origenes/kenya`, el usuario selecciona **Cítricos** y luego cierra el panel
- **THEN** el enlace **"Volver a Kenia"** sigue visible y la URL conserva `from=origenes/kenya`

#### Scenario: Origen inválido
- **WHEN** el usuario abre `/flavor-wheel?from=origenes/no-existe`
- **THEN** no se muestra ningún enlace de regreso y la vista funciona normalmente

### Requirement: Guía inicial orientada a la cata
Sin ningún nodo seleccionado, la vista SHALL mostrar una guía breve, sin jerga técnica, que parta de una pregunta sobre lo que el usuario siente en la taza y lo invite a empezar por la familia más general antes de bajar al descriptor. En pantallas angostas la guía SHALL aparecer sobre el acordeón y SHALL poder ocultarse; una vez ocultada, SHALL permanecer oculta en ese dispositivo.

#### Scenario: Guía al abrir sin selección
- **WHEN** el usuario abre `/flavor-wheel` sin parámetros
- **THEN** ve la guía que pregunta qué siente en la taza y sugiere empezar por una familia como Frutal, Dulce o Tostado

#### Scenario: Ocultar la guía en mobile
- **WHEN** en una pantalla de 390 px el usuario oculta la guía y vuelve a abrir `/flavor-wheel` más tarde
- **THEN** la guía no aparece y el acordeón queda arriba

### Requirement: Selección por enlace profundo
La vista SHALL leer el parámetro `node` de la URL al abrirse: si corresponde a un nodo del catálogo, SHALL seleccionarlo, mostrar su panel y ampliar la rama de su familia. Si no corresponde a ningún nodo, SHALL ignorarlo y mostrar la rueda completa sin selección. Cada cambio de selección SHALL actualizar el parámetro `node` reemplazando la entrada actual del historial, sin agregar entradas nuevas y conservando los demás parámetros.

#### Scenario: Enlace desde una ficha de Wiki
- **WHEN** el usuario abre `/flavor-wheel?node=fruity.berry.blackberry`
- **THEN** la rueda muestra ampliada la rama Frutal con **Mora** seleccionado y el panel abierto en **Mora**

#### Scenario: Nodo inexistente
- **WHEN** el usuario abre `/flavor-wheel?node=no-existe`
- **THEN** la rueda se muestra completa, sin selección ni panel, y sin error

#### Scenario: La selección actualiza la URL
- **WHEN** el usuario selecciona **Cítricos** y luego **Limón**
- **THEN** la URL termina en `?node=fruity.citrus.lemon` y volver atrás en el navegador sale de `/flavor-wheel` en lugar de pasar por cada selección

### Requirement: Textos localizados y sin emojis
Todo texto visible o accesible de la vista (encabezado, instrucciones, controles de volver y cerrar, títulos de grupos, mensajes vacíos y nombres accesibles) SHALL resolverse desde los diccionarios en español, y la vista SHALL usar solo iconografía SVG, sin emojis.

#### Scenario: Claves de la vista resueltas
- **WHEN** se renderiza `/flavor-wheel` con un nodo seleccionado
- **THEN** ningún texto visible es una clave de diccionario sin resolver y no aparece ningún emoji
