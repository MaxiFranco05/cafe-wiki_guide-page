# Spec Delta

## Purpose

Habilita el funcionamiento completo sin conexión e instalabilidad como Progressive Web App (PWA) mobile-first, asegura la actualización controlada sin interrumpir temporizadores activos, optimiza la carga por ruta y aplica cabeceras de seguridad CSP y fallback SPA para producción (`US-008`).

## ADDED Requirements

### Requirement: Manifiesto Web e íconos instalables
El build de producción SHALL emitir un archivo `manifest.webmanifest` válido con `display: "standalone"`, `orientation: "portrait"`, idioma `es`, `start_url: "/"`, colores `background_color` y `theme_color` sincronizados con el fondo oscuro del sistema de diseño (`#160D08`), e íconos PNG de `192x192`, `512x512` y `512x512` con `purpose: "maskable"`. El documento HTML SHALL enlazar el manifiesto, el ícono de pantalla de inicio de Apple y el mismo `theme-color`.

#### Scenario: Manifiesto válido en build de producción
- **WHEN** se genera el build de producción
- **THEN** existe `manifest.webmanifest` enlazado desde `index.html`, con `display: "standalone"`, `theme_color: "#160D08"`, `background_color: "#160D08"` e íconos `192x192`, `512x512` y `maskable` accesibles

### Requirement: Precaché offline y navegación profunda sin conexión
El build de producción SHALL generar un Service Worker que precachea el shell de la aplicación, los chunks de código, los estilos, los íconos, el manifiesto y los catálogos estáticos (métodos, recetas, wiki y rueda SCA), y resuelve las navegaciones a cualquier ruta pública mediante fallback al shell SPA.

#### Scenario: Rutas públicas operativas en modo avión
- **WHEN** el usuario visita la aplicación una vez, activa el modo sin conexión y navega o recarga `/`, `/brew/v60`, `/wiki/origenes/kenya` y `/flavor-wheel`
- **THEN** todas las vistas cargan desde caché sin errores de red y permiten calcular proporciones, ejecutar el temporizador y explorar la wiki y la rueda

#### Scenario: Caché acotada para fotografías de café
- **WHEN** el usuario visita tarjetas o fichas con fotografías en `/images/coffee/`
- **THEN** las imágenes se almacenan en una caché de runtime con límite de entradas y expiración sin obligar a descargarlas todas durante la instalación inicial del Service Worker

### Requirement: Actualización controlada sin interrumpir el temporizador
La aplicación SHALL usar actualización asistida por aviso en lugar de recargar automáticamente la pestaña cuando existe una nueva versión del Service Worker, y SHALL degradar silenciosamente si el navegador bloquea o no soporta Service Workers.

#### Scenario: Nueva versión disponible durante una preparación
- **WHEN** el navegador detecta una versión nueva del Service Worker
- **THEN** la aplicación no recarga la página por su cuenta, mantiene intacto cualquier temporizador o cálculo en curso y muestra un aviso con opción de actualizar ahora o posponer

#### Scenario: Navegador sin soporte de Service Worker
- **WHEN** la aplicación se abre en un entorno que no expone `navigator.serviceWorker` o rechaza el registro
- **THEN** la aplicación continúa funcionando normalmente en línea sin mostrar errores al usuario

### Requirement: Indicador discreto de estado offline y actualización
El `AppShell` SHALL mostrar un aviso accesible, discreto y localizado en español (sin emojis, con iconografía SVG y animaciones respetuosas de `prefers-reduced-motion`) cuando el dispositivo pierde conexión, cuando la aplicación queda lista para uso offline por primera vez o cuando existe una actualización pendiente.

#### Scenario: Pérdida y recuperación de conectividad
- **WHEN** el navegador pasa a estado sin conexión (`offline`)
- **THEN** aparece un aviso discreto indicando que la aplicación opera en modo sin conexión sin bloquear el contenido ni la barra inferior, y desaparece automáticamente al recuperar conexión (`online`)

#### Scenario: Descartar aviso de listo offline o posponer actualización
- **WHEN** el usuario presiona cerrar en el aviso de lista offline o posponer en el aviso de nueva versión
- **THEN** el aviso se oculta inmediatamente y la interfaz continúa operativa con objetivos táctiles de al menos 44 px

### Requirement: División de código por ruta y optimización de assets
La aplicación SHALL dividir el código por ruta cargando de forma diferida la estación de preparación, la wiki y la rueda de sabores, manteniendo el paquete inicial sin advertencias de chunks sobredimensionados (> 500 kB) y optimizando el peso de las fotografías estáticas sin romper sus rutas.

#### Scenario: Build dividido por ruta sin chunks monolíticos
- **WHEN** se ejecuta el build de producción
- **THEN** las vistas secundarias se emiten en chunks separados del punto de entrada y ningún chunk JavaScript supera 500 kB sin comprimir

### Requirement: Política de seguridad CSP y fallback SPA en hosting
La configuración de despliegue estático SHALL enrutar todas las rutas de aplicación a `/index.html`, aplicar una política `Content-Security-Policy` basada en `default-src 'self'` compatible con estilos dinámicos locales y recursos propios, y definir cabeceras de caché diferenciadas para el Service Worker y los assets inmutables.

#### Scenario: Cabeceras de seguridad y caché declaradas
- **WHEN** se valida la configuración de despliegue (`vercel.json`)
- **THEN** incluye rewrite SPA a `/index.html`, `Content-Security-Policy` con `default-src 'self'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Cache-Control: no-cache` para `/sw.js`

### Requirement: Integridad de los cuatro flujos principales del MVP
La suite de pruebas SHALL verificar extremo a extremo en cliente los cuatro flujos principales del MVP (selección y escalado en filtro con aviso de rango, ejecución completa del temporizador, modo Espresso por yield y navegación Wiki ↔ Rueda SCA ↔ Estación de preparación).

#### Scenario: Regresión integral de los flujos del MVP
- **WHEN** se ejecuta la suite de pruebas de integración del MVP
- **THEN** los cuatro flujos completos pasan sin errores de consola ni regresiones en las vistas y motores de dominio
