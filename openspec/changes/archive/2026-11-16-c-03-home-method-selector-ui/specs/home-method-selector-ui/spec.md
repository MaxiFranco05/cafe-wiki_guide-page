# Spec Delta — home-method-selector-ui

## Purpose

Proveer en la ruta pública `/` el selector visual interactivo de los 6 métodos de preparación del MVP conectado en tiempo real al catálogo validado (`METHODS_CATALOG`), combinando fotografía moody del Design System con siluetas vectoriales SVG por cafetera, métricas del perfil por defecto, filtrado rápido por categoría de extracción y accesos directos de 1 toque hacia `/brew/:methodSlug`, `/wiki` y `/flavor-wheel`.

## ADDED Requirements

### Requirement: Dynamic Catalog Rendering of the 6 MVP Brew Methods
The home selector view (`/`) SHALL render the brew method grid dynamically from the validated `METHODS_CATALOG` (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`, `espresso`) without duplicating method metadata in hardcoded view arrays.

#### Scenario: Initial render displays all 6 catalog methods
- **WHEN** the user navigates to `/`
- **THEN** the system renders 6 interactive method cards corresponding to `v60` (Hario V60), `chemex` (Chemex), `melitta` (Melitta), `aeropress` (AeroPress), `french-press` (Prensa Francesa), and `espresso` (Espresso) in catalog order or selected filter order

#### Scenario: Localized copy and zero emojis
- **WHEN** any text, badge, metric label, or filter chip is rendered on `/`
- **THEN** all user-visible strings are resolved via the `i18n` dictionary (`es`) with zero hardcoded UI strings and zero emoji characters (`RN-I18N-01`)

### Requirement: MethodCard Visual Identity, SVG Vessel Silhouette, and Default Profile Metrics
Each method card in the selector grid SHALL combine the approved Dark-Only moody photography (`/images/coffee/*.jpg`) with a distinct inline SVG silhouette of the brewing vessel, the extraction category badge (`Filtro`, `Inmersión`, `Híbrido`, `Presión`), and the base metrics computed from the method's default profile (`normal` for filter/immersion/hybrid methods, `normale` for Espresso).

#### Scenario: Filter, immersion, and hybrid card metrics from default "normal" profile
- **WHEN** a method with `scalingMode === "filter_water_ratio"` (`v60`, `chemex`, `melitta`, `aeropress`, `french-press`) is displayed
- **THEN** its card displays its inline SVG vessel silhouette (`cone_v60`, `hourglass_chemex`, `wedge_melitta`, `cylinder_aeropress`, or `beaker_french_press`), localized category badge, default ratio (`Ratio 1:16.7`, `Ratio 1:16`, or `Ratio 1:15` from the `normal` profile), default dose (`defaultDoseGrams` in grams, e.g., `15 g`, `20 g`, `30 g`), and formatted total duration (`3:30 min`, `4:00 min`, `2:00 min`, `4:30 min`)

#### Scenario: Espresso card metrics from default "normale" profile
- **WHEN** the `espresso` method (`scalingMode === "espresso_yield_ratio"`) is displayed
- **THEN** its card displays the `portafilter_espresso` inline SVG silhouette, the `Presión` category badge, the base yield (`Yield 1:2` from the `normale` profile), the default dry dose (`18 g`), and the target shot window (`25–30 s`)

### Requirement: Interactive Category Filter Bar with Keyboard Accessibility
The home selector view SHALL provide a filter bar of interactive category chips allowing the user to filter the method grid by extraction category (`all`, `pour_over`, `immersion`, `hybrid`, `pressure`) with accessible toggle state (`aria-pressed`) and item counts.

#### Scenario: Filtering methods by extraction category
- **WHEN** the user activates a category filter chip (e.g., `Filtro` for `pour_over`, `Inmersión` for `immersion`, `Híbrido` for `hybrid`, or `Presión` for `pressure`)
- **THEN** the filter chip updates to `aria-pressed="true"`, all other chips update to `aria-pressed="false"`, and the grid immediately displays only the methods matching that `category` (`3` for `Filtro`, `1` for `Inmersión`, `1` for `Híbrido`, `1` for `Presión`)

#### Scenario: Resetting filter to show all methods
- **WHEN** the user activates the `Todos` (`all`) filter chip
- **THEN** all 6 brew methods from `METHODS_CATALOG` are rendered in the grid and `Todos` has `aria-pressed="true"`

#### Scenario: Keyboard navigation and touch target compliance on filter chips
- **WHEN** the user navigates across filter chips using `Tab` and activates a chip with `Enter` or `Space`
- **THEN** focus rings (`--shadow-focus`) are visible, each chip meets the minimum touch target height (`>= 44px` on mobile), and the filtered grid updates without page reload

### Requirement: One-Tap Navigation to the Brew Station
Selecting any method card or the primary hero call-to-action SHALL navigate in a single tap/click to `/brew/:methodSlug` so the user reaches the method's brew station in under `100 ms` (`US-001 CA-2`).

#### Scenario: Clicking or pressing Enter on a MethodCard
- **WHEN** the user clicks or presses `Enter` on a `MethodCard` for `<methodSlug>`
- **THEN** the router navigates immediately to `/brew/<methodSlug>` where the default profile (`normal` or `normale`) and `defaultDoseGrams` are ready

### Requirement: Dual Direct Access to Sensory Wiki and SCA Flavor Wheel
The home selector view SHALL provide dedicated discovery banners/cards linking directly to both the Sensory Wiki (`/wiki`) and the Interactive SCA Flavor Wheel (`/flavor-wheel`).

#### Scenario: Navigating to Sensory Wiki from home discovery section
- **WHEN** the user activates the Sensory Wiki discovery CTA on `/`
- **THEN** the router navigates to `/wiki`

#### Scenario: Navigating to SCA Flavor Wheel from home discovery section
- **WHEN** the user activates the SCA Flavor Wheel discovery CTA on `/`
- **THEN** the router navigates to `/flavor-wheel`
