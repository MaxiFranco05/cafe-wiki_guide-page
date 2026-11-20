# Spec Delta

## ADDED Requirements

### Requirement: Brew station navigation remembers the last method
The desktop "Estación de Preparación" link and the mobile "Preparar" tab SHALL navigate to `/brew/<slug>` of the last brew method the user visited, persisted across visits, falling back to `/brew/v60` when none is stored or the stored value is invalid. Both items SHALL appear active on any `/brew/*` route.

#### Scenario: Returning to the last method
- **WHEN** the user visited `/brew/chemex`, navigated to `/wiki`, and then selects "Preparar" in the bottom tab bar
- **THEN** the router navigates to `/brew/chemex` without a page reload

#### Scenario: No stored method
- **WHEN** the user has never visited a brew station or storage is unavailable
- **THEN** the brew station navigation items point to `/brew/v60`

#### Scenario: Active state on any brew route
- **WHEN** the current route is `/brew/aeropress` while the stored last method is `v60`
- **THEN** the brew station navigation item is rendered in its active state with `aria-current="page"`

#### Scenario: Invalid stored value
- **WHEN** the persisted last method is not one of the 6 catalog slugs
- **THEN** the system ignores it and uses `/brew/v60` without throwing
