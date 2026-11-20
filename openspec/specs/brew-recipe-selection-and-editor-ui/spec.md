# brew-recipe-selection-and-editor-ui Specification

## Purpose

Permite elegir en la estación `/brew/:methodSlug` qué receta guiar (Estándar, de autor/clásica o personalizada), crear y editar recetas propias, compartirlas o importarlas en JSON y recordar la receta elegida por método, sin backend.

## Requirements

### Requirement: Receta activa visible en la estación
La estación SHALL mostrar en su encabezado un disparador compacto con el nombre de la receta activa, su ratio normal y su temperatura recomendada (el autor se muestra en la ficha del selector); al abrir un método sin preferencia guardada la receta activa SHALL ser la Estándar por defecto de ese método del catálogo de recetas, y el agua, fases, duración y temperatura de la estación SHALL coincidir con los que muestra la ficha de esa receta en el selector.

#### Scenario: Primera visita a un método
- **WHEN** el usuario abre `/brew/v60` sin preferencias guardadas
- **THEN** el disparador muestra "V60 Estándar (3 Vertidos)" y, con 15 g en intensidad normal, la estación muestra `240 ml`, 4 fases (Bloom, Vertido 1, Vertido 2, Drawdown) y `3:00`, igual que la ficha Estándar del selector

### Requirement: Cambio de cafetera desde el título
El nombre de la cafetera en el encabezado de la estación SHALL ser el control que abre un menú accesible con los 6 métodos (ícono, nombre, categoría y dosis por defecto, el actual marcado), navegable con flechas y cerrable con Escape; no SHALL haber otro control a la derecha del título cuya posición dependa del largo del nombre. Con una preparación en curso SHALL pedir confirmación antes de cambiar.

#### Scenario: Cambiar a Chemex
- **WHEN** el usuario toca "Hario V60" en `/brew/v60` y elige Chemex en el menú
- **THEN** la estación navega a `/brew/chemex` y el menú se cierra

#### Scenario: Cerrar sin cambiar
- **WHEN** el menú está abierto y el usuario pulsa Escape
- **THEN** el menú se cierra, la cafetera no cambia y el foco vuelve al nombre

#### Scenario: Preparación en curso
- **WHEN** el temporizador está corriendo y el usuario elige otra cafetera y cancela la confirmación
- **THEN** la estación permanece en la cafetera actual

### Requirement: Catálogo de recetas agrupado
Al activar el disparador, la estación SHALL abrir un selector accesible (diálogo modal con foco atrapado, cierre con Escape y botón, foco devuelto al disparador) que liste solo las recetas del método actual agrupadas en `Estándar (por defecto)`, `Autores y Clásicas` y `Mis Recetas`, marcando la receta activa.

#### Scenario: Grupos del selector en V60
- **WHEN** el usuario abre el selector en `/brew/v60`
- **THEN** ve la receta Estándar en el primer grupo, las recetas de autor/clásicas de V60 (entre ellas Método 4:6) en el segundo y sus recetas personalizadas de V60 en el tercero, sin recetas de otros métodos

#### Scenario: Grupo Mis Recetas vacío
- **WHEN** el usuario abre el selector en un método sin recetas personalizadas
- **THEN** el grupo `Mis Recetas` muestra un estado vacío con las acciones Crear receta e Importar

#### Scenario: Cierre con teclado
- **WHEN** el selector está abierto y el usuario pulsa Escape
- **THEN** el selector se cierra sin cambiar la receta activa y el foco vuelve al disparador

### Requirement: Ficha informativa de cada receta
Cada receta del selector SHALL mostrar título, autor, dificultad, ratio normal, duración total, temperatura recomendada, resumen del proceso y el sabor que destaca, resolviendo textos del catálogo por i18n y mostrando tal cual los textos del usuario en recetas personalizadas.

#### Scenario: Ficha de una receta de autor
- **WHEN** el usuario ve la receta Método 4:6 en el selector
- **THEN** la ficha muestra su autor, dificultad, ratio `1:15`, duración `3:30`, `92 °C`, el resumen de cinco vertidos y la nota de sabor, todo en español y sin emojis

#### Scenario: Receta personalizada sin notas
- **WHEN** una receta personalizada no tiene resumen de proceso ni nota de sabor
- **THEN** la ficha omite esas líneas sin mostrar claves crudas ni textos vacíos

### Requirement: Selección de receta recalcula la estación
Elegir una receta SHALL cerrar el selector y recalcular, conservando la dosis de café y la intensidad elegidas, el agua total, las fases con sus gramos, la duración total, la temperatura del encabezado y la vista previa del cronograma y del temporizador según la receta elegida.

#### Scenario: Elegir Método 4:6 con 20 g
- **WHEN** el usuario tiene 20 g de café en intensidad normal en V60 y elige Método 4:6
- **THEN** el agua pasa a `300 ml`, el cronograma muestra 5 vertidos de `60 g`, la duración total es `3:30` y el encabezado muestra `92 °C`

#### Scenario: Elegir receta en Espresso
- **WHEN** el usuario elige una receta de autor de Espresso
- **THEN** las tarjetas Ristretto/Normale/Lungo se recalculan con los ratios y la ventana de tiempo de esa receta

### Requirement: Selector bloqueado durante la preparación
Mientras el temporizador esté `running` o `paused`, el disparador del selector SHALL estar deshabilitado e indicar por qué; al reiniciar o completar, SHALL volver a estar disponible.

#### Scenario: Intento de cambio en curso
- **WHEN** el temporizador está corriendo y el usuario intenta abrir el selector
- **THEN** el selector no se abre y la receta activa no cambia

### Requirement: Recordar la receta elegida por método
La estación SHALL recordar la última receta elegida en cada método en el almacenamiento local y restaurarla en la siguiente visita; si la receta recordada ya no existe o no corresponde al método, SHALL usar la Estándar sin mostrar error. Un parámetro `?recipe=<id>` válido para el método SHALL tener prioridad sobre lo recordado.

#### Scenario: Restaurar tras recargar
- **WHEN** el usuario eligió Método 4:6 en V60 y recarga la página
- **THEN** la estación abre con Método 4:6 activa

#### Scenario: Receta recordada eliminada
- **WHEN** la receta recordada era una personalizada que luego se eliminó
- **THEN** la estación abre con la Estándar de ese método

#### Scenario: Enlace directo a una receta
- **WHEN** el usuario abre `/brew/v60?recipe=v60-kasuya-4-6`
- **THEN** la estación abre con Método 4:6 activa; con un id inexistente o de otro método abre la receta recordada o la Estándar

#### Scenario: Almacenamiento no disponible
- **WHEN** el almacenamiento local falla o está bloqueado
- **THEN** la selección funciona durante la sesión sin errores visibles

### Requirement: Crear una receta personalizada
El selector SHALL ofrecer crear una receta desde cero para el método actual en un editor con nombre obligatorio (máx. 80 caracteres), notas opcionales de proceso, sabor y molienda, ratio base, temperatura opcional y una lista de fases; al guardar una receta válida, SHALL persistirla, agregarla a `Mis Recetas` y activarla.

#### Scenario: Guardar receta nueva
- **WHEN** el usuario crea "Mi V60" con fases Bloom 45 s 50 ml, Vertido 60 s 120 ml, Vertido 45 s 80 ml y Drenaje 30 s 0 ml, y guarda
- **THEN** la receta aparece en `Mis Recetas`, queda activa, la duración total es `3:00` y el cronograma muestra los cuatro pasos con sus títulos propios

#### Scenario: Nombre vacío
- **WHEN** el usuario intenta guardar sin nombre
- **THEN** el editor no guarda y muestra un error inline en el campo nombre, anunciado a tecnologías de asistencia

### Requirement: Edición de fases en el editor
El editor SHALL permitir agregar, quitar y reordenar fases, y editar por fase el tipo (permitido para el método), título, duración en segundos enteros positivos y agua en ml no negativa, mostrando en vivo la duración y el agua totales; SHALL impedir guardar si ninguna fase aporta agua o si hay valores inválidos, señalando cada campo con error.

#### Scenario: Totales en vivo
- **WHEN** el usuario cambia la duración de una fase de 45 a 60 s
- **THEN** la duración total mostrada aumenta 15 s sin guardar

#### Scenario: Sin agua
- **WHEN** todas las fases tienen 0 ml y el usuario intenta guardar
- **THEN** el editor muestra un error indicando que al menos una fase debe aportar agua y no guarda

#### Scenario: Última fase
- **WHEN** la receta tiene una sola fase
- **THEN** la acción de quitar fase está deshabilitada

### Requirement: Duplicar una receta existente
Cada receta del selector SHALL ofrecer Duplicar, que abre el editor precargado con sus fases, duraciones, proporciones de agua, ratio y temperatura, títulos de fase ya resueltos en español y un nombre sugerido distinto; guardar SHALL crear una receta personalizada nueva sin modificar la original.

#### Scenario: Duplicar Método 4:6
- **WHEN** el usuario duplica Método 4:6
- **THEN** el editor muestra 5 vertidos con los títulos en español, ratio `1:15`, `92 °C` y un nombre sugerido como "Método 4:6 (copia)"; al guardar, la receta de catálogo sigue intacta

### Requirement: Editar y eliminar recetas personalizadas
Las recetas de `Mis Recetas` SHALL ofrecer Editar (guarda sobre la misma receta) y Eliminar con confirmación explícita; si se elimina la receta activa, la estación SHALL pasar a la Estándar. Las recetas del catálogo SHALL NOT ser editables ni eliminables.

#### Scenario: Eliminar la receta activa
- **WHEN** el usuario confirma eliminar la receta personalizada activa
- **THEN** desaparece de `Mis Recetas`, del almacenamiento, y la estación pasa a la Estándar

#### Scenario: Cancelar eliminación
- **WHEN** el usuario cancela la confirmación
- **THEN** la receta se conserva sin cambios

### Requirement: Compartir una receta personalizada
Cada receta personalizada SHALL ofrecer Compartir, que permite copiar su JSON versionado al portapapeles o descargarlo como archivo `.json`, confirmando la acción con un mensaje breve; si el portapapeles no está disponible, SHALL ofrecer el texto seleccionable.

#### Scenario: Copiar al portapapeles
- **WHEN** el usuario elige Copiar JSON en una receta personalizada
- **THEN** el portapapeles contiene el JSON exportado y la interfaz confirma la copia

#### Scenario: Portapapeles bloqueado
- **WHEN** la escritura en portapapeles falla
- **THEN** la interfaz muestra el JSON en un campo de solo lectura seleccionable

### Requirement: Importar una receta compartida
El selector SHALL permitir importar una receta pegando JSON o eligiendo un archivo; una importación válida para el método actual SHALL guardarse en `Mis Recetas` y activarse; JSON mal formado, versión no soportada o datos inválidos SHALL mostrar un error inline traducido sin romper la página. Si ya existe una receta con el mismo id, SHALL pedir reemplazar o guardar como copia.

#### Scenario: Round-trip de importación
- **WHEN** el usuario exporta una receta personalizada, la elimina y luego importa ese JSON
- **THEN** la receta reaparece en `Mis Recetas` con el mismo nombre, ratio y fases

#### Scenario: JSON corrupto
- **WHEN** el usuario pega texto que no es JSON válido
- **THEN** se muestra un error inline en español y no se guarda nada

#### Scenario: Receta de otro método
- **WHEN** el usuario importa en V60 una receta de AeroPress
- **THEN** la receta se guarda, la interfaz indica que pertenece a AeroPress y ofrece ir a `/brew/aeropress?recipe=<id>` sin activarla en V60

### Requirement: Textos de fases personalizadas en cronograma y temporizador
Para recetas personalizadas, el cronograma de pasos, la instrucción activa, la vista previa del siguiente paso, los anuncios de fase y los puntos de fase SHALL mostrar el título y la instrucción escritos por el usuario, interpolando los gramos del paso y el acumulado; para recetas del catálogo SHALL seguir resolviendo las claves i18n.

#### Scenario: Instrucción con gramos interpolados
- **WHEN** una fase personalizada tiene la instrucción por defecto de vertido y corresponde a 120 g de un acumulado de 170 g
- **THEN** el temporizador muestra "Verté 120 g hasta alcanzar 170 g." sin llaves ni nombres de clave visibles

### Requirement: Textos del selector y del editor localizados
Todos los textos fijos del selector, el editor, compartir e importar SHALL resolverse desde el diccionario en español, sin emojis, con iconos SVG y objetivos táctiles de al menos 44 × 44 px.

#### Scenario: Sin claves crudas
- **WHEN** se renderizan el selector y el editor en todos sus estados (vacío, error, confirmación)
- **THEN** ningún texto visible coincide con una ruta de clave i18n ni contiene emojis
