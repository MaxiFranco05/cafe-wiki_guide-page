# Preguntas Abiertas

## Inconsistencias detectadas

No se detectaron inconsistencias entre el relevamiento de Discovery (`discovery/discovery.md`) y las decisiones de arquitectura tomadas para la Knowledge Base. Ambos artefactos están alineados en alcance (6 métodos + Wiki + Rueda SCA), reglas de negocio (Opción A en filtro, Yield en Espresso, advertencias de rango físico) y restricciones (hosting gratuito, SPA/PWA client-side, idioma inicial español con estructura `i18n`).

## Preguntas abiertas (priorizadas)

| Prioridad | Pregunta / Definición pendiente | Bloquea | Decisor | Resolución recomendada |
|---|---|---|---|---|
| **Alta** | **Identidad visual y paleta del Design System**: ¿Qué estética visual tendrá la interfaz (ej. cálida editorial inspirada en cafeterías de especialidad con tonos crema/espresso/terracota vs. minimalista técnica de alto contraste)? | Fase `design-system` y maquetado UI | Usuario (en la siguiente fase `design-system`) | Definirlo inmediatamente en el paso `design-system` del flujo de fundación. |
| **Media** | **Recetas base exactas para cada uno de los 6 métodos**: ¿Qué receta específica de referente usamos como perfil "Normal" en cada método? (Ej. V60: Hoffmann 1 taza / Kasuya; AeroPress: Hoffmann / Estándar; Prensa Francesa: Hoffmann). | Carga final del catálogo `src/data/methods/` | Usuario / Autor | Arrancar con el estándar más reconocido de cada método (Hoffmann en V60, Prensa y AeroPress; estándar SCA ajustado en Melitta y Chemex) y dejar la estructura lista para editar desde JSON/TS. |
| **Media** | **Equivalencia orientativa sin balanza**: ¿Agregamos un tooltip o subtítulo con la equivalencia en cucharadas soperas junto a los gramos de café para usuarios principiantes? | Componente `BrewControls` | Usuario | Incluirlo como dato secundario no intrusivo (`~X cdas`) debajo de los gramos. |
| **Baja** | **Estrategia futura de publicación o exportación de traducciones**: Cuando se sumen más idiomas en post-MVP, ¿se generarán con IA dentro del repo privado o se abrirá un sub-paquete público de `locales/`? | Post-MVP (i18n comunitario) | Usuario | No bloquea el MVP; mantener `src/i18n/locales/es/*.json` limpio y aislado permite ambas opciones sin refactorizar. |
