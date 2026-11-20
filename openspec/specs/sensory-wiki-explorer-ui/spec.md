# sensory-wiki-explorer-ui Specification

## Purpose

Define cómo se explora la Wiki del Café en la interfaz: una portada con una entrada por sección (Orígenes, Varietales, Procesos, Cafeteras y Bebidas), una página propia por sección con búsqueda y filtros que nunca mezclan temas distintos, y una ficha detallada con rueda sensorial, metadatos propios de su sección, notas enlazadas a la rueda SCA y preparación en un toque (`US-009`, Flujo 4).

## Requirements

### Requirement: Portada de la Wiki por secciones
La vista `/wiki` SHALL mostrar una tarjeta por cada sección de la Wiki — **Orígenes**, **Varietales**, **Procesos**, **Cafeteras** y **Bebidas** — con su nombre, una descripción breve y la cantidad de fichas que contiene, y cada tarjeta SHALL navegar a la página de su sección. La portada SHALL NOT listar fichas de distintas secciones mezcladas.

#### Scenario: Abrir la portada
- **WHEN** el usuario abre `/wiki`
- **THEN** ve las 5 tarjetas de sección con su cantidad de fichas y ninguna lista combinada de fichas

#### Scenario: Entrar a una sección
- **WHEN** el usuario toca la tarjeta **Varietales**
- **THEN** la aplicación navega a `/wiki/varietales` sin recargar la página

### Requirement: Página de sección
La vista `/wiki/:section`, con `section` ∈ `origenes | varietales | procesos | cafeteras | bebidas`, SHALL listar únicamente las fichas de esa sección, agrupadas por el subgrupo propio de la sección en el orden definido por el catálogo, e indicar la cantidad de resultados. Una sección desconocida SHALL mostrar la vista 404.

#### Scenario: Sección de orígenes
- **WHEN** el usuario abre `/wiki/origenes`
- **THEN** se muestran solo las 16 fichas de origen agrupadas por región, sin varietales ni procesos

#### Scenario: Sección inexistente
- **WHEN** el usuario abre `/wiki/granos`
- **THEN** se muestra la vista 404

### Requirement: Búsqueda dentro de la sección
La página de sección SHALL filtrar sus fichas a medida que el usuario escribe, sin distinguir mayúsculas ni acentos, comparando contra el título, los alias o nombres alternativos, el resumen y las notas de cata, y SHALL buscar solo dentro de la sección abierta.

#### Scenario: Búsqueda sin acentos
- **WHEN** el usuario escribe `etiopia` en `/wiki/origenes`
- **THEN** la ficha **Etiopía** aparece en los resultados

#### Scenario: La búsqueda no cruza secciones
- **WHEN** el usuario escribe `geisha` en `/wiki/origenes`
- **THEN** no aparece la ficha del varietal Geisha, porque pertenece a otra sección

#### Scenario: Sin resultados
- **WHEN** la búsqueda y los filtros no coinciden con ninguna ficha de la sección
- **THEN** se muestra un estado vacío explicativo con una acción que limpia búsqueda y filtros

### Requirement: Filtros propios de cada sección
La página de sección SHALL ofrecer filtros combinables pertinentes a esa sección: su subgrupo (región, grupo genético, familia de proceso, tipo de cafetera o tipo de bebida) y filtros de perfil en taza (**Acidez alta**: acidez ≥ 4; **Dulzor alto**: dulzor ≥ 4; **Cuerpo alto**: cuerpo ≥ 4; **Amargor bajo**: amargor ≤ 2).

#### Scenario: Filtro por subgrupo
- **WHEN** el usuario elige la región **África** en `/wiki/origenes`
- **THEN** solo se muestran los orígenes africanos

#### Scenario: Filtro de perfil
- **WHEN** el usuario activa **Acidez alta** en `/wiki/origenes`
- **THEN** solo se muestran orígenes con acidez 4 o 5

### Requirement: Filtro por familia de sabor
En las secciones cuyas fichas tienen notas de cata, la página SHALL ofrecer un filtro por familia de la rueda SCA; una ficha coincide si alguna de sus notas pertenece a esa familia o a sus descendientes.

#### Scenario: Filtro por familia de sabor
- **WHEN** el usuario elige la familia **Frutal** en `/wiki/varietales`
- **THEN** solo se muestran varietales con al menos una nota de cata dentro de la familia frutal

### Requirement: Estado de la sección en la URL
La búsqueda y los filtros activos de la página de sección SHALL reflejarse en la URL, de modo que recargar, compartir el enlace o volver atrás desde una ficha restaure los mismos resultados.

#### Scenario: Volver desde una ficha
- **WHEN** el usuario filtra **Acidez alta** en `/wiki/origenes`, abre una ficha y vuelve atrás
- **THEN** la sección muestra otra vez **Acidez alta** activo y los mismos resultados

### Requirement: Tarjeta de ficha
Cada resultado de una sección SHALL mostrar el título de la ficha, su subgrupo, un resumen visual de su perfil sensorial y hasta tres notas o rasgos destacados, y SHALL navegar a `/wiki/:section/:entrySlug` al activarse.

#### Scenario: Abrir una ficha
- **WHEN** el usuario toca la tarjeta de **Kenia** en `/wiki/origenes`
- **THEN** la aplicación navega a `/wiki/origenes/kenya` sin recargar la página

### Requirement: Rueda sensorial de la ficha
La ficha SHALL mostrar el perfil sensorial como una rueda radial de cuatro sectores — **Acidez**, **Dulzor**, **Cuerpo** y **Amargor** — con anillos concéntricos de 1 a 5, donde cada sector se rellena desde el centro hasta su valor, y SHALL exponer cada valor de forma accesible para lectores de pantalla.

#### Scenario: Rueda de Kenia
- **WHEN** el usuario abre `/wiki/origenes/kenya`
- **THEN** la rueda muestra los cuatro sectores rellenos hasta los valores del perfil de Kenia, cada uno anunciado como "Acidez 5 de 5" o equivalente

### Requirement: Encabezado y metadatos según la sección
La ficha SHALL mostrar título, sección, subgrupo, nombres alternativos y resumen, y SHALL mostrar los metadatos propios de su sección: altitud en m s. n. m., región y cosecha para orígenes; especie, linaje y región de descubrimiento para varietales; tipo de fermentación, remoción del mucílago y secado para procesos; origen e historia y recetas tradicionales para cafeteras; origen e historia y proporciones para bebidas. La ficha SHALL NOT mostrar campos de otra sección.

#### Scenario: Ficha de proceso
- **WHEN** el usuario abre una ficha de proceso
- **THEN** se muestran el tipo de fermentación, la remoción del mucílago y el método de secado, y no se muestran altitud ni historia de cafetera

#### Scenario: Ficha de cafetera
- **WHEN** el usuario abre la ficha de una cafetera
- **THEN** se muestran su origen e historia y sus recetas tradicionales

### Requirement: Notas de cata enlazadas a la rueda
Cuando una ficha tenga notas de cata, SHALL listarlas con su nombre localizado y cada nota SHALL enlazar a `/flavor-wheel?node=<id de la nota>&from=<sección>/<slug de la ficha>`, para que la rueda ofrezca volver a la ficha.

#### Scenario: Tocar una nota
- **WHEN** el usuario toca la nota **Mora** en la ficha `/wiki/origenes/kenya`
- **THEN** la aplicación navega a `/flavor-wheel?node=fruity.berry.blackberry&from=origenes/kenya`

### Requirement: Preparar en un toque desde la ficha
Cuando una ficha recomiende métodos o tenga una estación de preparación asociada, SHALL mostrar cada método con el perfil de intensidad sugerido y el motivo, y SHALL ofrecer un botón **"Preparar en {Método} ({Perfil})"** que con un solo toque navega a `/brew/:methodSlug?profile=:profileId`, donde la estación abre con ese perfil ya seleccionado.

#### Scenario: Kenia en V60 Liviano
- **WHEN** el usuario toca **"Preparar en Hario V60 (Liviano)"** en la ficha de Kenia
- **THEN** la aplicación navega a `/brew/v60?profile=light` y la estación muestra el perfil Liviano seleccionado

### Requirement: Relaciones entre orígenes y varietales
Las fichas de origen y de varietal SHALL enlazarse en ambas direcciones sin duplicar contenido: una ficha de origen SHALL listar los varietales que se cultivan habitualmente en ese origen y una ficha de varietal SHALL listar los orígenes donde se cultiva, cada elemento enlazando a su ficha. La relación SHALL definirse una sola vez en el catálogo y la dirección inversa SHALL derivarse de ella. Si una ficha no tiene relaciones, la sección SHALL omitirse.

#### Scenario: Origen con varietales
- **WHEN** el usuario abre la ficha de un origen que tiene varietales relacionados
- **THEN** ve una sección con esos varietales y al tocar uno navega a `/wiki/varietales/:slug`

#### Scenario: Varietal con orígenes
- **WHEN** el usuario abre la ficha de un varietal que se cultiva en varios orígenes
- **THEN** ve una sección con esos orígenes, coherente con lo que muestran las fichas de origen

### Requirement: Relaciones con las cafeteras
Cada método recomendado en una ficha de origen, varietal o proceso SHALL ofrecer además un enlace a la ficha de su cafetera en la Wiki, y la ficha de cada cafetera con estación de preparación SHALL listar las fichas de orígenes, varietales y procesos que la recomiendan, agrupadas por sección y con el perfil sugerido.

#### Scenario: De un origen a su cafetera
- **WHEN** el usuario toca "Conocer la Hario V60" en la ficha de Kenia
- **THEN** la aplicación navega a `/wiki/cafeteras/v60`

#### Scenario: Cafés que lucen en una cafetera
- **WHEN** el usuario abre `/wiki/cafeteras/chemex`
- **THEN** ve las fichas de orígenes, varietales y procesos que recomiendan la Chemex, cada una con su perfil sugerido y enlazada a su ficha

### Requirement: Ficha inexistente
La ruta de ficha SHALL mostrar la vista 404 cuando la sección no exista o cuando el slug no corresponda a una ficha de esa sección.

#### Scenario: Slug en otra sección
- **WHEN** el usuario abre `/wiki/procesos/kenya`
- **THEN** se muestra la vista 404

### Requirement: Fichas en el buscador global
El buscador global de la barra superior SHALL ofrecer como resultados las fichas reales de todas las secciones de la Wiki, indicando la sección de cada una, buscables por título y nombres alternativos sin distinguir acentos, y SHALL NOT ofrecer categorías o fichas que no existan en el catálogo.

#### Scenario: Buscar un varietal
- **WHEN** el usuario escribe `geisha` en el buscador global
- **THEN** aparece la ficha Geisha indicando la sección Varietales y al elegirla navega a `/wiki/varietales/geisha`

### Requirement: Accesibilidad y textos de la Wiki
Todos los textos visibles de la portada, las secciones y las fichas SHALL resolverse mediante claves de diccionario en español, sin emojis, con objetivos táctiles de al menos 44 px en tarjetas, filtros y botones de preparación, y con los filtros expuestos con su estado activo a tecnologías de asistencia.

#### Scenario: Estado de filtros accesible
- **WHEN** un lector de pantalla recorre los filtros de una sección con **Acidez alta** activo
- **THEN** ese filtro se anuncia como presionado
