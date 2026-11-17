# Spec Delta

## Purpose

Proporciona la estructura base de la aplicación (AppShell), enrutamiento SPA público, identidad visual en modo oscuro único (`[data-theme="dark"]`) y sistema de internacionalización desacoplado para mesada.

## ADDED Requirements

### Requirement: Responsive AppShell layout
The system SHALL render a responsive layout containing a persistent top navigation bar on desktop viewports, an accessible bottom navigation bar on mobile viewports (widths under 768px), and a main content container with minimum viewport height (`min-h-[100dvh]`).

#### Scenario: Desktop navigation rendering
- **WHEN** a user visits the application on a screen width of 768px or greater
- **THEN** the top navigation bar displays the brand logo, brand title, and primary desktop navigation links while the bottom tab bar is hidden

#### Scenario: Mobile navigation rendering
- **WHEN** a user visits the application on a screen width under 768px
- **THEN** the bottom tab bar is fixed at the viewport bottom with four accessible navigation items and touch targets of at least 44 by 44 pixels

### Requirement: Public SPA client-side routing
The system SHALL support client-side routing across the five canonical public routes (`/`, `/brew/:methodSlug`, `/wiki`, `/wiki/:category/:entrySlug`, `/flavor-wheel`) without page reloads, and provide a user-friendly 404 fallback view for unknown routes or invalid parameters.

#### Scenario: Navigating between primary routes
- **WHEN** a user selects a navigation link or tab for a valid route
- **THEN** the client router updates the view and URL without triggering a full page reload or authentication gate

#### Scenario: Handling invalid routes or parameters
- **WHEN** a user enters an unrecognized URL or invalid route parameter
- **THEN** the system renders a friendly 404 fallback view with an action button to return to the home route

### Requirement: Dark-only kitchen theme initialization
The system SHALL operate exclusively in dark kitchen mode following `design-system/tokens.css` (Revision 3), initializing the root document with `color-scheme: dark` and `[data-theme="dark"]` prior to first paint without a light-mode theme toggle.

#### Scenario: Default dark-only initialization
- **WHEN** a user opens the application on any device or viewport
- **THEN** the root document initializes with `data-theme="dark"`, semantic dark canvas tokens (`--bg-canvas: #120E0C`, `--bg-surface: #1B1512`), and renders zero light-mode switcher controls

#### Scenario: Consistent dark theme across navigation
- **WHEN** a user navigates between routes (`/`, `/brew/:methodSlug`, `/wiki`, `/flavor-wheel`, or 404 fallback)
- **THEN** `[data-theme="dark"]` remains active with zero white or beige flash of unstyled content

### Requirement: Decoupled i18n text resolution
The system SHALL resolve all visible user interface labels, titles, aria-labels, and button texts through typed internationalization dictionaries in Spanish (`src/i18n/locales/es/ui.json`), with zero hardcoded user-visible text in shared components.

#### Scenario: Resolving interface strings in Spanish
- **WHEN** the AppShell renders navigation bars, method spotlight placeholders, and route fallback actions
- **THEN** every visible text and accessibility label matches the corresponding key in the Spanish dictionary

#### Scenario: Graceful handling of missing translation key
- **WHEN** a component requests a translation key that is not present in the dictionary
- **THEN** the system renders the fallback key identifier without crashing or breaking the layout

### Requirement: Accessible and tactile touch targets
The system SHALL enforce touch target dimensions of at least 44 by 44 pixels for all primary navigation buttons, apply tactile active press feedback, and disable transform transitions when reduced motion is preferred.

#### Scenario: Activating mobile navigation items
- **WHEN** a user presses an item in the bottom navigation bar
- **THEN** the element provides immediate tactile feedback with a scale transform of 0.97 and minimum target bounding box of 44 by 44 pixels

#### Scenario: Respecting reduced motion user setting
- **WHEN** the user agent has `prefers-reduced-motion: reduce` enabled
- **THEN** interactive transitions and active transforms are suppressed across all shell components
