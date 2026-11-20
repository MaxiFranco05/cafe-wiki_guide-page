# app-shell-and-foundation (delta C-10)

## MODIFIED Requirements

### Requirement: Public SPA client-side routing
The system SHALL support client-side routing across the canonical public routes (`/`, `/brew/:methodSlug`, `/wiki`, `/wiki/:section`, `/wiki/:section/:entrySlug`, `/flavor-wheel`) without page reloads, and provide a user-friendly 404 fallback view for unknown routes or invalid parameters.

#### Scenario: Navigating between primary routes
- **WHEN** a user selects a navigation link or tab for a valid route
- **THEN** the client router updates the view and URL without triggering a full page reload or authentication gate

#### Scenario: Handling invalid routes or parameters
- **WHEN** a user enters an unrecognized URL or invalid route parameter
- **THEN** the system renders a friendly 404 fallback view with an action button to return to the home route

#### Scenario: Wiki section and entry routes
- **WHEN** a user opens `/wiki/origenes` and then `/wiki/origenes/kenya`
- **THEN** the router renders the Orígenes section page and then the Kenia entry without a full page reload
